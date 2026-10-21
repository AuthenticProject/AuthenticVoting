-- ====================================================================
-- PERBAIKAN HASIL REAL-TIME TIAP KANDIDAT & RESET SUARA KE 0
-- Jalankan skrip ini di: Supabase Dashboard -> SQL Editor -> Tekan "RUN"
-- ====================================================================

-- 1. Bersihkan suara percobaan lama sekarang juga agar langsung mulai dari 0
DELETE FROM public.votes;
UPDATE public.elections
SET status = 'draft',
    started_at = NULL,
    closed_at = NULL,
    updated_at = NOW();

-- 2. Buka izin SELECT & DELETE pada tabel votes agar terbaca real-time dan bisa direset langsung dari admin
DROP POLICY IF EXISTS "No public read access to votes" ON public.votes;
DROP POLICY IF EXISTS "Allow read votes for admin tally" ON public.votes;
CREATE POLICY "Allow read votes for admin tally"
    ON public.votes FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow delete votes on reset" ON public.votes;
CREATE POLICY "Allow delete votes on reset"
    ON public.votes FOR DELETE
    TO anon, authenticated
    USING (true);

-- 3. Aktifkan Supabase Realtime pada tabel votes
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;

-- 4. Fungsi hitung total suara untuk admin (wajib 0 jika status draft)
CREATE OR REPLACE FUNCTION public.get_admin_total_votes(p_election_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_total BIGINT := 0;
    v_status TEXT;
    v_started_at TIMESTAMPTZ;
BEGIN
    SELECT status, started_at INTO v_status, v_started_at
    FROM public.elections
    WHERE id = p_election_id;

    -- Jika draft, suara selalu 0
    IF v_status = 'draft' OR v_started_at IS NULL THEN
        RETURN 0;
    END IF;

    SELECT COUNT(*) INTO v_total
    FROM public.votes
    WHERE election_id = p_election_id
      AND created_at >= v_started_at;

    RETURN v_total;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_total_votes(UUID) TO anon, authenticated;

-- 5. Fungsi RPC get_live_results untuk mendapatkan perolehan suara real-time tiap kandidat
CREATE OR REPLACE FUNCTION public.get_live_results(p_election_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_status TEXT;
    v_started_at TIMESTAMPTZ;
    v_total_votes BIGINT := 0;
    v_max_votes BIGINT := 0;
    v_candidates_json JSONB;
    v_winners_json JSONB;
    v_is_tie BOOLEAN := false;
BEGIN
    SELECT status, started_at INTO v_status, v_started_at
    FROM public.elections
    WHERE id = p_election_id;

    -- Hitung total suara masuk selama sesi aktif (hanya setelah started_at)
    IF v_status <> 'draft' AND v_started_at IS NOT NULL THEN
        SELECT COUNT(*) INTO v_total_votes
        FROM public.votes
        WHERE election_id = p_election_id
          AND created_at >= v_started_at;
    ELSE
        v_total_votes := 0;
    END IF;

    -- Hitung suara per kandidat
    WITH candidate_tallies AS (
        SELECT
            c.id,
            c.candidate_number,
            c.name,
            c.title_or_role,
            c.vision,
            c.photo_url,
            CASE 
                WHEN v_status <> 'draft' AND v_started_at IS NOT NULL THEN COUNT(v.id)
                ELSE 0
            END AS vote_count,
            CASE 
                WHEN v_total_votes > 0 THEN ROUND((COUNT(v.id)::NUMERIC / v_total_votes::NUMERIC) * 100, 2)
                ELSE 0.00
            END AS percentage
        FROM public.candidates c
        LEFT JOIN public.votes v 
            ON v.candidate_id = c.id 
            AND v.election_id = p_election_id
            AND v_status <> 'draft'
            AND v.created_at >= COALESCE(v_started_at, NOW())
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

-- 6. Perbarui juga get_final_results agar mengembalikan data yang sama tanpa memblokir
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

-- 7. Fungsi reset suara saat admin mereset ke draft (Pasti hapus suara)
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
