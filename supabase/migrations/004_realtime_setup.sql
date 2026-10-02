-- =====================================================================
-- LIFORA DIGITAL BLOOD DONATION EMERGENCY NETWORK
-- Migration 004: Supabase Realtime Publication Setup
-- Enables postgres_changes broadcasts for real-time notifications,
-- live requests, live donor responses, and inventory monitoring.
-- =====================================================================

-- Add tables to the supabase_realtime publication
DO $$
BEGIN
    -- Ensure publication exists
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;

    -- Check and add notifications
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;

    -- Check and add blood_requests
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'blood_requests'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.blood_requests;
    END IF;

    -- Check and add donor_responses
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'donor_responses'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.donor_responses;
    END IF;

    -- Check and add blood_inventory
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'blood_inventory'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.blood_inventory;
    END IF;
END;
$$;
