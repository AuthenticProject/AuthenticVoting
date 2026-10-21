-- ====================================================================
-- PERBAIKAN HASIL REAL-TIME TIAP KANDIDAT & SINKRONISASI ADMIN
-- Jalankan skrip ini di: Supabase Dashboard -> SQL Editor -> Tekan "RUN"
-- ====================================================================

-- 1. Buka izin SELECT pada tabel votes agar perolehan suara terbaca real-time
DROP POLICY IF EXISTS "No public read access to votes" ON public.votes;
DROP POLICY IF EXISTS "Allow read votes for admin tally" ON public.votes;
CREATE POLICY "Allow read votes for admin tally"
    ON public.votes FOR SELECT
    TO anon, authenticated
    USING (true);

-- 2. Aktifkan Supabase Realtime pada tabel votes
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;

-- 3. Fungsi RPC get_live_results untuk mendapatkan perolehan suara real-time tiap kandidat
CREATE OR REPLACE FUNCTION public.get_live_results(p_election_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_total_votes BIGINT;
    v_max_votes BIGINT;
    v_candidates_json JSONB;
    v_winners_json JSONB;
    v_is_tie BOOLEAN := false;
BEGIN
    -- Hitung total suara masuk
    SELECT COUNT(*) INTO v_total_votes
    FROM public.votes
    WHERE election_id = p_election_id;

    -- Hitung suara per kandidat
    WITH candidate_tallies AS (
        SELECT
            c.id,
            c.candidate_number,
            c.name,
            c.title_or_role,
            c.vision,
            c.photo_url,
            COUNT(v.id) AS vote_count,
            CASE 
                WHEN v_total_votes > 0 THEN ROUND((COUNT(v.id)::NUMERIC / v_total_votes::NUMERIC) * 100, 2)
                ELSE 0.00
            END AS percentage
        FROM public.candidates c
        LEFT JOIN public.votes v ON v.candidate_id = c.id AND v.election_id = p_election_id
        WHERE c.election_id = p_election_id
        GROUP BY c.id, c.candidate_number, c.name, c.title_or_role, c.vision, c.photo_url
        ORDER BY vote_count DESC, c.candidate_number ASC
    )
    SELECT 
        COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', ct.id,
                'candidate_number', ct.candidate_number,
                'name', ct.name,
                'title_or_role', ct.title_or_role,
                'vision', ct.vision,
                'photo_url', ct.photo_url,
                'vote_count', ct.vote_count,
                'percentage', ct.percentage,
                'rank', ROW_NUMBER() OVER (ORDER BY ct.vote_count DESC, ct.candidate_number ASC)
            )
        ), '[]'::jsonb),
        COALESCE(MAX(ct.vote_count), 0)
    INTO v_candidates_json, v_max_votes
    FROM candidate_tallies ct;

    -- Tentukan kandidat yang memimpin / menang
    IF v_total_votes > 0 AND v_max_votes > 0 THEN
        SELECT 
            jsonb_agg(c.elem),
            COUNT(*) > 1
        INTO v_winners_json, v_is_tie
        FROM jsonb_array_elements(v_candidates_json) AS c(elem)
        WHERE (c.elem->>'vote_count')::BIGINT = v_max_votes;
    ELSE
        v_winners_json := '[]'::jsonb;
        v_is_tie := false;
    END IF;

    RETURN jsonb_build_object(
        'total_votes', v_total_votes,
        'candidates', v_candidates_json,
        'winners', COALESCE(v_winners_json, '[]'::jsonb),
        'is_tie', v_is_tie,
        'calculated_at', NOW()
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_live_results(UUID) TO anon, authenticated;

-- 4. Perbarui juga get_final_results agar mengembalikan data yang sama tanpa memblokir
CREATE OR REPLACE FUNCTION public.get_final_results(p_election_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN public.get_live_results(p_election_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_final_results(UUID) TO anon, authenticated;

-- 5. Fungsi reset suara saat admin mereset ke draft
CREATE OR REPLACE FUNCTION public.reset_to_draft(p_election_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    DELETE FROM public.votes WHERE election_id = p_election_id;
    UPDATE public.elections
    SET status = 'draft',
        started_at = NULL,
        closed_at = NULL,
        updated_at = NOW()
    WHERE id = p_election_id;
    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_to_draft(UUID) TO anon, authenticated;
