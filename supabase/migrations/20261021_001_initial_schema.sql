-- ====================================================================
-- E-VOTING KIOSK DATABASE SCHEMA & SECURITY DEFINER FUNCTIONS
-- Target: Supabase PostgreSQL (PostgreSQL 15+)
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 2. TABLES
-- ====================================================================

-- 2.1 ELECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.elections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    logo_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
    started_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 CANDIDATES TABLE (Exactly 3 slots for the single election)
CREATE TABLE IF NOT EXISTS public.candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
    candidate_number INTEGER NOT NULL CHECK (candidate_number BETWEEN 1 AND 3),
    name TEXT NOT NULL,
    title_or_role TEXT,
    vision TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_candidate_election_number UNIQUE (election_id, candidate_number)
);

-- 2.3 VOTES TABLE (Anonymous, immutable, atomic)
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
    request_id UUID NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance and uniqueness
CREATE INDEX IF NOT EXISTS idx_votes_election_id ON public.votes(election_id);
CREATE INDEX IF NOT EXISTS idx_votes_candidate_id ON public.votes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_votes_request_id ON public.votes(request_id);

-- 2.4 ADMIN USERS TABLE
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.5 KIOSK SESSIONS TABLE (Device authorization for physical tablet)
CREATE TABLE IF NOT EXISTS public.kiosk_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL DEFAULT 'Bilik Suara Tablet',
    session_token TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.6 AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES public.admin_users(id),
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiosk_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper to check if current caller is an authenticated admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE auth_user_id = auth.uid()
    );
$$;

-- 3.1 ELECTIONS RLS
-- Anyone can view public election metadata
CREATE POLICY "Public can view elections"
    ON public.elections FOR SELECT
    USING (true);

-- Only admins can update elections, and settings only while draft
CREATE POLICY "Admins can update elections"
    ON public.elections FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 3.2 CANDIDATES RLS
-- Anyone can view candidate cards
CREATE POLICY "Public can view candidates"
    ON public.candidates FOR SELECT
    USING (true);

-- Admins can insert/update candidates ONLY when election is draft
CREATE POLICY "Admins can insert candidates when draft"
    ON public.candidates FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin() AND
        EXISTS (
            SELECT 1 FROM public.elections e
            WHERE e.id = election_id AND e.status = 'draft'
        )
    );

CREATE POLICY "Admins can update candidates when draft"
    ON public.candidates FOR UPDATE
    TO authenticated
    USING (
        public.is_admin() AND
        EXISTS (
            SELECT 1 FROM public.elections e
            WHERE e.id = election_id AND e.status = 'draft'
        )
    )
    WITH CHECK (
        public.is_admin() AND
        EXISTS (
            SELECT 1 FROM public.elections e
            WHERE e.id = election_id AND e.status = 'draft'
        )
    );

-- 3.3 VOTES RLS (CRITICAL PRIVACY & SECURITY)
-- NO direct public SELECT, INSERT, UPDATE, or DELETE on votes table!
-- Direct public queries return 0 rows.
-- Votes are inserted exclusively via the SECURITY DEFINER RPC `submit_vote`.
-- Votes are immutable.
CREATE POLICY "No public read access to votes"
    ON public.votes FOR SELECT
    USING (false);

-- 3.4 ADMIN USERS RLS
CREATE POLICY "Admins can view own admin record"
    ON public.admin_users FOR SELECT
    TO authenticated
    USING (auth_user_id = auth.uid());

-- 3.5 AUDIT LOGS RLS
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- 3.6 KIOSK SESSIONS RLS
CREATE POLICY "Admins can manage kiosk sessions"
    ON public.kiosk_sessions FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Public can verify active kiosk token"
    ON public.kiosk_sessions FOR SELECT
    USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- ====================================================================
-- 4. SECURE SERVER-SIDE RPC FUNCTIONS
-- ====================================================================

-- 4.1 SUBMIT VOTE RPC
-- Atomic, concurrent-safe vote submission with row locking and idempotency.
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
    v_candidate_election_id UUID;
    v_existing_candidate_id UUID;
    v_vote_id UUID;
BEGIN
    -- 1. Validate parameter formats
    IF p_candidate_id IS NULL THEN
        RAISE EXCEPTION 'ID Kandidat wajib disertakan.' USING ERRCODE = '22000';
    END IF;

    IF p_request_id IS NULL THEN
        RAISE EXCEPTION 'ID Request sesi wajib disertakan.' USING ERRCODE = '22000';
    END IF;

    -- 2. Optional Kiosk token validation if provided
    IF p_kiosk_token IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.kiosk_sessions
            WHERE session_token = p_kiosk_token
              AND is_active = true
              AND (expires_at IS NULL OR expires_at > NOW())
        ) THEN
            RAISE EXCEPTION 'Sesi tablet bilik suara tidak valid atau telah kedaluwarsa.' USING ERRCODE = '28000';
        END IF;
    END IF;

    -- 3. Verify Candidate exists and fetch its election ID
    SELECT election_id INTO v_candidate_election_id
    FROM public.candidates
    WHERE id = p_candidate_id;

    IF v_candidate_election_id IS NULL THEN
        RAISE EXCEPTION 'Kandidat tidak ditemukan.' USING ERRCODE = '02000';
    END IF;

    -- 4. Lock election row FOR UPDATE to prevent race condition during closure!
    SELECT id, status INTO v_election_id, v_election_status
    FROM public.elections
    WHERE id = v_candidate_election_id
    FOR UPDATE;

    IF v_election_id IS NULL THEN
        RAISE EXCEPTION 'Acara pemilihan tidak ditemukan.' USING ERRCODE = '02000';
    END IF;

    -- 5. Verify election status is currently ACTIVE
    IF v_election_status = 'draft' THEN
        RAISE EXCEPTION 'Pemungutan suara belum dimulai.' USING ERRCODE = '55000';
    ELSIF v_election_status = 'closed' THEN
        RAISE EXCEPTION 'Pemungutan suara telah resmi ditutup.' USING ERRCODE = '55000';
    ELSIF v_election_status <> 'active' THEN
        RAISE EXCEPTION 'Status pemilihan tidak valid untuk menerima suara.' USING ERRCODE = '55000';
    END IF;

    -- 6. Check for duplicate request_id (Idempotency check)
    SELECT candidate_id INTO v_existing_candidate_id
    FROM public.votes
    WHERE request_id = p_request_id;

    IF v_existing_candidate_id IS NOT NULL THEN
        -- If already submitted for the EXACT SAME candidate, return idempotent success
        IF v_existing_candidate_id = p_candidate_id THEN
            RETURN jsonb_build_object(
                'success', true,
                'message', 'Suara telah tercatat sebelumnya (idempotent).',
                'idempotent', true
            );
        ELSE
            -- Request ID reused for a DIFFERENT candidate -> Reject conflict!
            RAISE EXCEPTION 'ID Request telah digunakan untuk kandidat berbeda.' USING ERRCODE = '23505';
        END IF;
    END IF;

    -- 7. Insert vote atomically
    INSERT INTO public.votes (
        election_id,
        candidate_id,
        request_id
    ) VALUES (
        v_election_id,
        p_candidate_id,
        p_request_id
    )
    RETURNING id INTO v_vote_id;

    -- 8. Return success without revealing any candidate vote counts
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Suara Anda berhasil disimpan secara sah.',
        'vote_id', v_vote_id,
        'idempotent', false
    );
END;
$$;

-- Revoke default public execution, then grant to anon and authenticated
REVOKE ALL ON FUNCTION public.submit_vote(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_vote(UUID, UUID, TEXT) TO anon, authenticated;


-- 4.2 GET FINAL RESULTS RPC (Strictly Locked Until Closed)
CREATE OR REPLACE FUNCTION public.get_final_results(p_election_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_status TEXT;
    v_total_votes BIGINT;
    v_max_votes BIGINT;
    v_candidates_json JSONB;
    v_winners_json JSONB;
    v_is_tie BOOLEAN;
    v_closed_at TIMESTAMPTZ;
BEGIN
    -- 1. Authorization: Only authenticated admins may view final results
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya administrator resmi yang dapat melihat hasil pemilihan.' USING ERRCODE = '42501';
    END IF;

    -- 2. Fetch election status and closed_at
    SELECT status, closed_at INTO v_status, v_closed_at
    FROM public.elections
    WHERE id = p_election_id;

    IF v_status IS NULL THEN
        RAISE EXCEPTION 'Pemilihan tidak ditemukan.' USING ERRCODE = '02000';
    END IF;

    -- 3. Strict Rule: Results LOCKED unless status is CLOSED
    IF v_status <> 'closed' THEN
        RAISE EXCEPTION 'Hasil pemilihan hanya dapat dilihat setelah voting resmi ditutup.' USING ERRCODE = '55000';
    END IF;

    -- 4. Total votes
    SELECT COUNT(*) INTO v_total_votes
    FROM public.votes
    WHERE election_id = p_election_id;

    -- 5. Calculate per-candidate vote counts and percentages
    WITH candidate_tallies AS (
        SELECT
            c.id,
            c.candidate_number,
            c.name,
            c.title_or_role,
            c.vision,
            c.photo_url,
            COUNT(v.id) AS vote_count
        FROM public.candidates c
        LEFT JOIN public.votes v ON v.candidate_id = c.id
        WHERE c.election_id = p_election_id
        GROUP BY c.id, c.candidate_number, c.name, c.title_or_role, c.vision, c.photo_url
    )
    SELECT
        COALESCE(MAX(vote_count), 0),
        jsonb_agg(
            jsonb_build_object(
                'candidate', jsonb_build_object(
                    'id', id,
                    'election_id', p_election_id,
                    'candidate_number', candidate_number,
                    'name', name,
                    'title_or_role', title_or_role,
                    'vision', vision,
                    'photo_url', photo_url
                ),
                'voteCount', vote_count,
                'percentage', CASE
                    WHEN v_total_votes > 0 THEN ROUND((vote_count::numeric / v_total_votes::numeric) * 100, 1)
                    ELSE 0.0
                END
            )
            ORDER BY candidate_number ASC
        )
    INTO v_max_votes, v_candidates_json
    FROM candidate_tallies;

    -- 6. Detect tie and winners
    WITH winners_cte AS (
        SELECT
            c.id,
            c.candidate_number,
            c.name,
            c.title_or_role,
            c.vision,
            c.photo_url,
            COUNT(v.id) AS vote_count
        FROM public.candidates c
        LEFT JOIN public.votes v ON v.candidate_id = c.id
        WHERE c.election_id = p_election_id
        GROUP BY c.id, c.candidate_number, c.name, c.title_or_role, c.vision, c.photo_url
        HAVING COUNT(v.id) = v_max_votes AND v_max_votes > 0
    )
    SELECT
        COUNT(*) > 1,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'election_id', p_election_id,
                    'candidate_number', candidate_number,
                    'name', name,
                    'title_or_role', title_or_role,
                    'vision', vision,
                    'photo_url', photo_url
                )
            ),
            '[]'::jsonb
        )
    INTO v_is_tie, v_winners_json
    FROM winners_cte;

    -- 7. Return complete results summary
    RETURN jsonb_build_object(
        'totalVotes', v_total_votes,
        'candidateResults', COALESCE(v_candidates_json, '[]'::jsonb),
        'isTie', COALESCE(v_is_tie, false),
        'winners', v_winners_json,
        'closedAt', v_closed_at
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_final_results(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_final_results(UUID) TO authenticated;


-- 4.3 GET TOTAL VOTES COUNT FOR ADMIN OVERVIEW
-- Returns total vote count without exposing candidate breakdown
CREATE OR REPLACE FUNCTION public.get_admin_total_votes(p_election_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_total BIGINT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Akses ditolak.' USING ERRCODE = '42501';
    END IF;

    SELECT COUNT(*) INTO v_total
    FROM public.votes
    WHERE election_id = p_election_id;

    RETURN v_total;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_total_votes(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_total_votes(UUID) TO authenticated;


-- 4.4 START ELECTION RPC
CREATE OR REPLACE FUNCTION public.start_election(p_election_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_candidate_count INTEGER;
    v_status TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Akses ditolak.' USING ERRCODE = '42501';
    END IF;

    -- Check candidate count is EXACTLY 3
    SELECT COUNT(*) INTO v_candidate_count
    FROM public.candidates
    WHERE election_id = p_election_id;

    IF v_candidate_count <> 3 THEN
        RAISE EXCEPTION 'Pemilihan wajib memiliki tepat 3 kandidat sebelum dimulai (saat ini: %).', v_candidate_count
            USING ERRCODE = '55000';
    END IF;

    -- Lock and verify status
    SELECT status INTO v_status
    FROM public.elections
    WHERE id = p_election_id
    FOR UPDATE;

    IF v_status <> 'draft' THEN
        RAISE EXCEPTION 'Pemilihan hanya dapat dimulai dari status DRAFT.' USING ERRCODE = '55000';
    END IF;

    UPDATE public.elections
    SET status = 'active',
        started_at = NOW(),
        updated_at = NOW()
    WHERE id = p_election_id;

    -- Log action
    INSERT INTO public.audit_logs (action, details)
    VALUES ('START_ELECTION', jsonb_build_object('election_id', p_election_id, 'started_at', NOW()));

    RETURN jsonb_build_object('success', true, 'status', 'active');
END;
$$;

REVOKE ALL ON FUNCTION public.start_election(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_election(UUID) TO authenticated;


-- 4.5 CLOSE ELECTION RPC
CREATE OR REPLACE FUNCTION public.close_election(p_election_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_status TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Akses ditolak.' USING ERRCODE = '42501';
    END IF;

    -- Lock election row FOR UPDATE
    SELECT status INTO v_status
    FROM public.elections
    WHERE id = p_election_id
    FOR UPDATE;

    IF v_status <> 'active' THEN
        RAISE EXCEPTION 'Hanya pemilihan dengan status AKTIF yang dapat ditutup.' USING ERRCODE = '55000';
    END IF;

    UPDATE public.elections
    SET status = 'closed',
        closed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_election_id;

    -- Revoke all active kiosk sessions for this election
    UPDATE public.kiosk_sessions
    SET is_active = false
    WHERE election_id = p_election_id;

    -- Log action
    INSERT INTO public.audit_logs (action, details)
    VALUES ('CLOSE_ELECTION', jsonb_build_object('election_id', p_election_id, 'closed_at', NOW()));

    RETURN jsonb_build_object('success', true, 'status', 'closed');
END;
$$;

REVOKE ALL ON FUNCTION public.close_election(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.close_election(UUID) TO authenticated;


-- ====================================================================
-- 5. STORAGE BUCKET CONFIGURATION (for logos and candidate photos)
-- ====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('election-assets', 'election-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Public can view assets
CREATE POLICY "Public can view election assets"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'election-assets');

-- Only authenticated admins can upload/update/delete assets
CREATE POLICY "Admins can upload election assets"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'election-assets' AND
        public.is_admin()
    );

CREATE POLICY "Admins can update election assets"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'election-assets' AND
        public.is_admin()
    );

CREATE POLICY "Admins can delete election assets"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'election-assets' AND
        public.is_admin()
    );

-- ====================================================================
-- 6. SEED INITIAL ELECTION AND CANDIDATE SLOTS (Optional / Default)
-- ====================================================================
DO $$
DECLARE
    v_el_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
BEGIN
    INSERT INTO public.elections (
        id,
        title,
        subtitle,
        status
    ) VALUES (
        v_el_id,
        'PEMILIHAN JENDRAL & DEWAN KEHORMATAN',
        'Musyawarah Akbar Nasional Periode 2026 – 2031',
        'draft'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.candidates (
        id,
        election_id,
        candidate_number,
        name,
        title_or_role,
        vision,
        photo_url
    ) VALUES
    (
        '00000000-0000-0000-0000-000000000011'::uuid,
        v_el_id,
        1,
        'Letjen (Purn.) Dr. Bambang Soedirman, M.Si',
        'Calon Jendral Kehormatan',
        'Integritas, Pengabdian Berkelanjutan, dan Ketegasan Moral.',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=600&h=750&q=80'
    ),
    (
        '00000000-0000-0000-0000-000000000012'::uuid,
        v_el_id,
        2,
        'Marsdya (Purn.) Ir. H. Joko Hartono, M.Sc',
        'Calon Jendral Kehormatan',
        'Modernisasi Transformasi Institusi, Soliditas, dan Transparansi.',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?fit=crop&w=600&h=750&q=80'
    ),
    (
        '00000000-0000-0000-0000-000000000013'::uuid,
        v_el_id,
        3,
        'Mayjen (Purn.) Prof. Dr. Hendra Gunawan, S.E., M.M.',
        'Calon Jendral Kehormatan',
        'Kesejahteraan Anggota, Kepemimpinan Kolektif, dan Martabat Bangsa.',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?fit=crop&w=600&h=750&q=80'
    ) ON CONFLICT (election_id, candidate_number) DO NOTHING;
END $$;
