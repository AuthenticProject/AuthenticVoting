-- ====================================================================
-- SISTEM MANAJEMEN ACARA PENGUMUMAN & ALOKASI KANDIDAT DINAMIS
-- Target: Supabase PostgreSQL (PostgreSQL 15+)
-- ====================================================================

-- 1. TABEL ANNOUNCEMENT_SESSIONS (Sesi Acara Pengumuman)
CREATE TABLE IF NOT EXISTS public.announcement_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 1,
    selection_method TEXT NOT NULL DEFAULT 'highest_votes' 
        CHECK (selection_method IN ('highest_votes', 'lowest_votes', 'next_ranking_group', 'manual')),
    candidate_limit INTEGER NOT NULL DEFAULT 3 CHECK (candidate_limit >= 1),
    exclusive_grouping BOOLEAN NOT NULL DEFAULT true,
    show_vote_counts BOOLEAN NOT NULL DEFAULT true,
    show_percentages BOOLEAN NOT NULL DEFAULT true,
    presentation_theme TEXT DEFAULT 'gold',
    announcement_status TEXT NOT NULL DEFAULT 'draft' 
        CHECK (announcement_status IN ('draft', 'ready', 'published')),
    tie_policy TEXT NOT NULL DEFAULT 'expand' 
        CHECK (tie_policy IN ('expand', 'manual', 'strict')),
    manual_candidate_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk performa pengurutan dan filter per pemilihan
CREATE INDEX IF NOT EXISTS idx_announcement_sessions_election 
    ON public.announcement_sessions(election_id, display_order);

-- 2. TABEL ANNOUNCEMENT_SESSION_CANDIDATES (Penetapan Kandidat ke Sesi)
CREATE TABLE IF NOT EXISTS public.announcement_session_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.announcement_sessions(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 1,
    assignment_type TEXT DEFAULT 'auto' CHECK (assignment_type IN ('auto', 'manual')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_session_candidate UNIQUE (session_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_session_candidates_session 
    ON public.announcement_session_candidates(session_id);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.announcement_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_session_candidates ENABLE ROW LEVEL SECURITY;

-- Buka hak akses kelola penuh ke anon & authenticated
-- (Sesuai arsitektur kiosk pairing yang telah digunakan pada migrasi 002 & 003)
DROP POLICY IF EXISTS "Allow all access to announcement_sessions" ON public.announcement_sessions;
CREATE POLICY "Allow all access to announcement_sessions"
    ON public.announcement_sessions FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to announcement_session_candidates" ON public.announcement_session_candidates;
CREATE POLICY "Allow all access to announcement_session_candidates"
    ON public.announcement_session_candidates FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 4. DAFTARKAN TABEL KE SUPABASE REALTIME
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.announcement_sessions;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END;
$$;

-- 5. INISIALISASI SESI DEFAULT JIKA BELUM ADA
DO $$
DECLARE
    v_election_id UUID;
BEGIN
    SELECT id INTO v_election_id FROM public.elections LIMIT 1;
    IF v_election_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.announcement_sessions WHERE election_id = v_election_id) THEN
            -- Acara 1: Pengumuman Jenderal (3 Peraih Suara Teratas)
            INSERT INTO public.announcement_sessions (
                election_id, name, description, display_order, 
                selection_method, candidate_limit, exclusive_grouping, 
                show_vote_counts, show_percentages, presentation_theme, 
                announcement_status, tie_policy
            ) VALUES (
                v_election_id,
                'Pengumuman Jenderal 5102',
                'Pengumuman peraih suara tertinggi Pemilihan Jenderal',
                1,
                'highest_votes',
                3,
                true,
                true,
                true,
                'gold',
                'draft',
                'expand'
            );

            -- Acara 2: Pengumuman Acara Kedua (Kelompok Peringkat Berikutnya)
            INSERT INTO public.announcement_sessions (
                election_id, name, description, display_order, 
                selection_method, candidate_limit, exclusive_grouping, 
                show_vote_counts, show_percentages, presentation_theme, 
                announcement_status, tie_policy
            ) VALUES (
                v_election_id,
                'Pengumuman Acara Kedua',
                'Pengumuman kandidat kelompok peringkat berikutnya',
                2,
                'next_ranking_group',
                3,
                true,
                true,
                true,
                'gold',
                'draft',
                'expand'
            );
        END IF;
    END IF;
END;
$$;
