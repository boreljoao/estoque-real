-- ============================================================
-- Supabase Realtime: RLS policy + REPLICA IDENTITY
-- Run this once in Supabase SQL Editor or via migration
-- ============================================================

-- Allow authenticated users to read only their own org's movements
-- (Required for Supabase Realtime postgres_changes to work with RLS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'stock_movements'
      AND policyname = 'realtime_stock_movements'
  ) THEN
    CREATE POLICY "realtime_stock_movements" ON stock_movements
      FOR SELECT USING (
        org_id IN (
          SELECT org_id FROM org_members
          WHERE user_id = auth.uid() AND is_active = true
        )
      );
  END IF;
END $$;

-- REPLICA IDENTITY FULL is required so Supabase Realtime sends
-- the full row data in the payload (including all columns)
ALTER TABLE stock_movements REPLICA IDENTITY FULL;

-- Enable RLS on the table if not already enabled
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Also enable Realtime publication for this table
-- (run once; safe to run again)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'stock_movements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE stock_movements;
  END IF;
END $$;
