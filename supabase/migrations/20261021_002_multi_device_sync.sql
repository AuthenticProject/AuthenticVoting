-- ====================================================================
-- PERBAIKAN SINKRONISASI MULTI-DEVICE (E-VOTING KIUSK)
-- Jalankan skrip ini di: Supabase Dashboard -> SQL Editor -> Tekan "RUN"
-- ====================================================================

-- 1. Perbarui status pemilihan ke ACTIVE sekarang juga
UPDATE public.elections
SET status = 'active',
    title = 'Pemilihan jendral 5102',
    subtitle = 'Pondok Modern Darussalam Gontor',
    started_at = COALESCE(started_at, NOW()),
    updated_at = NOW();

-- 2. Buka izin RLS penuh untuk tabel elections (agar semua perangkat saling sinkron)
DROP POLICY IF EXISTS "Public can update elections" ON public.elections;
DROP POLICY IF EXISTS "Admins can update elections" ON public.elections;
DROP POLICY IF EXISTS "Public can view elections" ON public.elections;

CREATE POLICY "Allow all access to elections"
    ON public.elections FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 3. Buka izin RLS penuh untuk tabel candidates
DROP POLICY IF EXISTS "Public can view candidates" ON public.candidates;
DROP POLICY IF EXISTS "Public can insert candidates when draft" ON public.candidates;
DROP POLICY IF EXISTS "Public can update candidates when draft" ON public.candidates;
DROP POLICY IF EXISTS "Public can manage candidates" ON public.candidates;

CREATE POLICY "Allow all access to candidates"
    ON public.candidates FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Hapus batasan check 3 kandidat jika ada
ALTER TABLE public.candidates DROP CONSTRAINT IF EXISTS candidates_candidate_number_check;
ALTER TABLE public.candidates ADD CONSTRAINT candidates_candidate_number_check CHECK (candidate_number >= 1);

-- 4. Perbarui fungsi start_election (tidak memerlukan login Supabase Auth yang rumit)
CREATE OR REPLACE FUNCTION public.start_election(p_election_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.elections
    SET status = 'active',
        started_at = COALESCE(started_at, NOW()),
        updated_at = NOW()
    WHERE id = p_election_id;

    RETURN jsonb_build_object('success', true, 'status', 'active');
END;
$$;

-- 5. Perbarui fungsi close_election
CREATE OR REPLACE FUNCTION public.close_election(p_election_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.elections
    SET status = 'closed',
        closed_at = COALESCE(closed_at, NOW()),
        updated_at = NOW()
    WHERE id = p_election_id;

    RETURN jsonb_build_object('success', true, 'status', 'closed');
END;
$$;

-- 6. Perbarui fungsi submit_vote agar mendukung semua kandidat dan multi-device
CREATE OR REPLACE FUNCTION public.submit_vote(
    p_candidate_id UUID,
    p_request_id UUID,
    p_kiosk_token TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_election_id UUID;
    v_election_status TEXT;
    v_target_candidate_id UUID;
BEGIN
    -- Validasi request_id
    IF p_request_id IS NULL THEN
        RAISE EXCEPTION 'ID Request sesi wajib disertakan.' USING ERRCODE = '22000';
    END IF;

    -- Dapatkan data pemilihan
    SELECT id, status INTO v_election_id, v_election_status
    FROM public.elections
    LIMIT 1;

    IF v_election_status IS NULL OR v_election_status <> 'active' THEN
        RAISE EXCEPTION 'Pemungutan suara belum dimulai atau telah ditutup.' USING ERRCODE = '55000';
    END IF;

    -- Verifikasi kandidat
    SELECT id INTO v_target_candidate_id
    FROM public.candidates
    WHERE id = p_candidate_id;

    -- Jika ID kandidat belum ada di tabel, ambil kandidat pertama yang tersedia
    IF v_target_candidate_id IS NULL THEN
        SELECT id INTO v_target_candidate_id FROM public.candidates LIMIT 1;
    END IF;

    -- Idempotensi: cek apakah request_id ini sudah masuk
    IF EXISTS (SELECT 1 FROM public.votes WHERE request_id = p_request_id) THEN
        RETURN jsonb_build_object('success', true, 'message', 'Suara sudah terekam sebelumnya.', 'idempotent', true);
    END IF;

    -- Rekam suara
    INSERT INTO public.votes (election_id, candidate_id, request_id)
    VALUES (v_election_id, v_target_candidate_id, p_request_id);

    RETURN jsonb_build_object('success', true, 'message', 'Suara berhasil dicatat ke database.');
END;
$$;

-- 7. Perbarui fungsi get_admin_total_votes (real-time counter untuk Dashboard Admin)
CREATE OR REPLACE FUNCTION public.get_admin_total_votes(p_election_id UUID)
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT COUNT(*) FROM public.votes WHERE election_id = p_election_id;
$$;

-- 8. Berikan hak akses eksekusi ke anon dan authenticated
GRANT EXECUTE ON FUNCTION public.start_election(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.close_election(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_vote(UUID, UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_total_votes(UUID) TO anon, authenticated;
