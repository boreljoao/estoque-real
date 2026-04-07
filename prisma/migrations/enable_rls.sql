-- ─────────────────────────────────────────────────────────────────────────────
-- Enable Row Level Security on every public table.
--
-- Run with:
--   psql $DATABASE_URL -f prisma/migrations/enable_rls.sql
--
-- This is a safety-net migration. Even though the StockPro backend exclusively
-- uses the Prisma client (which connects via the service-role credentials and
-- therefore bypasses RLS), enabling RLS on all tables ensures that:
--
--   1. Any accidental direct Supabase JS client call made with the anon key
--      cannot read or write cross-org data.
--   2. Future Supabase Realtime subscriptions that use row-level auth cannot
--      leak data across organizations.
--   3. PostgREST (the Supabase auto-API) cannot expose unfiltered rows.
--
-- NOTE: Enabling RLS on a table with no policies makes it inaccessible to
-- anon/authenticated roles. The service_role (used by Prisma) is exempt from
-- RLS by default, so the app continues to work without any policy changes.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT tablename
    FROM   pg_tables
    WHERE  schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- ─── Realtime: allow only authenticated users to subscribe to their own org ──
-- The policies below are additive — they allow Supabase Realtime to push events
-- to users who are active members of the relevant org.

-- stock_movements: members of the org can read their own org's movements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE  tablename = 'stock_movements' AND policyname = 'org_members_can_read'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY org_members_can_read ON stock_movements
        FOR SELECT
        USING (
          org_id IN (
            SELECT org_id FROM org_members
            WHERE  user_id   = auth.uid()
              AND  is_active = true
          )
        )
    $pol$;
  END IF;
END $$;
