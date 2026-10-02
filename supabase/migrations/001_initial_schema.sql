-- =====================================================================
-- LIFORA DIGITAL BLOOD DONATION EMERGENCY NETWORK
-- Migration 001: Initial Core Schema
-- Tables: profiles, donor_profiles, blood_requests, donor_responses,
--         donation_records, hospitals, hospital_verifications,
--         blood_banks, blood_inventory, notifications,
--         contact_messages, admin_audit_logs, user_consents
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. PROFILES TABLE (Linked to auth.users)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    role TEXT NOT NULL CHECK (role IN ('donor', 'requester', 'hospital', 'bloodbank', 'admin')) DEFAULT 'donor',
    city TEXT DEFAULT '',
    state TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    is_verified BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL CHECK (status IN ('active', 'suspended')) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---------------------------------------------------------------------
-- 2. DONOR PROFILES TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.donor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    blood_group TEXT NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    date_of_birth DATE,
    city TEXT NOT NULL,
    state TEXT DEFAULT '',
    is_available BOOLEAN DEFAULT FALSE,
    lat NUMERIC DEFAULT 28.6139,
    lng NUMERIC DEFAULT 77.2090,
    total_donations INTEGER DEFAULT 0 CHECK (total_donations >= 0),
    last_donated_date DATE,
    organ_donation_pledged BOOLEAN DEFAULT FALSE,
    email_alerts BOOLEAN DEFAULT TRUE,
    emergency_broadcasts BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---------------------------------------------------------------------
-- 3. HOSPITALS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    hospital_name TEXT NOT NULL,
    registration_no TEXT NOT NULL,
    official_email TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT DEFAULT '',
    address TEXT NOT NULL,
    lat NUMERIC DEFAULT 28.6139,
    lng NUMERIC DEFAULT 77.2090,
    contact_person TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---------------------------------------------------------------------
-- 4. HOSPITAL VERIFICATIONS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hospital_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    document_url TEXT NOT NULL,
    document_type TEXT NOT NULL DEFAULT 'license',
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    review_notes TEXT DEFAULT '',
    submitted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---------------------------------------------------------------------
-- 5. BLOOD BANKS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blood_banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    blood_bank_name TEXT NOT NULL,
    registration_no TEXT NOT NULL,
    official_email TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT DEFAULT '',
    address TEXT NOT NULL,
    lat NUMERIC DEFAULT 28.6139,
    lng NUMERIC DEFAULT 77.2090,
    contact_person TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---------------------------------------------------------------------
-- 6. BLOOD INVENTORY TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blood_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blood_bank_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blood_group TEXT NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    units INTEGER NOT NULL DEFAULT 0 CHECK (units >= 0),
    last_updated_by TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('In Stock', 'Low Stock', 'Out of Stock', 'Critical')) DEFAULT 'Out of Stock',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_blood_bank_group UNIQUE (blood_bank_id, blood_group)
);

-- ---------------------------------------------------------------------
-- 7. BLOOD REQUESTS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blood_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    blood_group TEXT NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    units_needed INTEGER NOT NULL DEFAULT 1 CHECK (units_needed > 0),
    required_date TIMESTAMPTZ NOT NULL,
    city TEXT NOT NULL,
    state TEXT DEFAULT '',
    hospital_name TEXT NOT NULL,
    hospital_address TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    emergency_level TEXT NOT NULL CHECK (emergency_level IN ('Standard', 'Urgent', 'Critical')) DEFAULT 'Urgent',
    emergency_description TEXT DEFAULT '',
    additional_notes TEXT DEFAULT '',
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Matching', 'Donor Responded', 'Hospital Verification', 'In Coordination', 'Fulfilled', 'Cancelled', 'Expired')) DEFAULT 'Pending',
    matched_donors UUID[] DEFAULT '{}'::UUID[],
    lat NUMERIC,
    lng NUMERIC,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---------------------------------------------------------------------
-- 8. DONOR RESPONSES TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.donor_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.blood_requests(id) ON DELETE CASCADE,
    donor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
    notes TEXT DEFAULT '',
    responded_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_request_donor UNIQUE (request_id, donor_id)
);

-- ---------------------------------------------------------------------
-- 9. DONATION RECORDS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.donation_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.blood_requests(id) ON DELETE SET NULL,
    donor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    blood_bank_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    units_donated INTEGER NOT NULL DEFAULT 1 CHECK (units_donated > 0),
    donated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    verification_status TEXT NOT NULL CHECK (verification_status IN ('Pending Verification', 'Verified', 'Rejected')) DEFAULT 'Verified',
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---------------------------------------------------------------------
-- 10. NOTIFICATIONS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('match_found', 'request_accepted', 'request_declined', 'status_updated', 'account_verified', 'system', 'low_stock')) DEFAULT 'system',
    related_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---------------------------------------------------------------------
-- 11. CONTACT MESSAGES TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT DEFAULT 'General Inquiry',
    message TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'replied')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---------------------------------------------------------------------
-- 12. ADMIN AUDIT LOGS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT DEFAULT '',
    entity_id UUID,
    details TEXT DEFAULT '',
    ip_address TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---------------------------------------------------------------------
-- 13. USER CONSENTS TABLE (Organ Pledges & Medical Consents)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    consent_type TEXT NOT NULL DEFAULT 'organ_pledge',
    organs_pledged TEXT[] DEFAULT '{}'::TEXT[],
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relation TEXT,
    witness_name TEXT,
    legal_disclaimer_accepted BOOLEAN DEFAULT FALSE,
    digital_signature TEXT,
    status TEXT NOT NULL CHECK (status IN ('Registered', 'Withdrawn')) DEFAULT 'Registered',
    withdrawn_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================================
-- INDEXES FOR PERFORMANCE & FAST QUERYING
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);

CREATE INDEX IF NOT EXISTS idx_donor_profiles_blood_group ON public.donor_profiles(blood_group);
CREATE INDEX IF NOT EXISTS idx_donor_profiles_city ON public.donor_profiles(city);
CREATE INDEX IF NOT EXISTS idx_donor_profiles_available ON public.donor_profiles(is_available);

CREATE INDEX IF NOT EXISTS idx_blood_requests_group ON public.blood_requests(blood_group);
CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON public.blood_requests(status);
CREATE INDEX IF NOT EXISTS idx_blood_requests_city ON public.blood_requests(city);
CREATE INDEX IF NOT EXISTS idx_blood_requests_requester ON public.blood_requests(requester_id);

CREATE INDEX IF NOT EXISTS idx_donor_responses_req ON public.donor_responses(request_id);
CREATE INDEX IF NOT EXISTS idx_donor_responses_donor ON public.donor_responses(donor_id);

CREATE INDEX IF NOT EXISTS idx_donation_records_donor ON public.donation_records(donor_id);
CREATE INDEX IF NOT EXISTS idx_donation_records_request ON public.donation_records(request_id);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.admin_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.admin_audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_blood_inventory_bank ON public.blood_inventory(blood_bank_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_user ON public.user_consents(user_id);

-- =====================================================================
-- DATABASE FUNCTIONS & TRIGGERS
-- =====================================================================

-- Auto-update updated_at timestamp function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SET search_path = public, pg_temp;

-- Apply updated_at trigger to all relevant tables
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN (
            'profiles', 'donor_profiles', 'hospitals', 'hospital_verifications',
            'blood_banks', 'blood_inventory', 'blood_requests', 'donor_responses',
            'donation_records', 'notifications', 'contact_messages', 'user_consents'
          )
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON public.%I', tbl);
        EXECUTE format('CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()', tbl);
    END LOOP;
END;
$$;

-- Trigger to create a public profile on new auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
    user_role TEXT;
    user_phone TEXT;
    user_city TEXT;
    user_state TEXT;
    user_avatar TEXT;
BEGIN
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
    );
    
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'donor');
    -- Security guard: never allow self-signup as admin
    IF user_role = 'admin' THEN
        user_role := 'donor';
    END IF;
    
    user_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
    user_city := COALESCE(NEW.raw_user_meta_data->>'city', '');
    user_state := COALESCE(NEW.raw_user_meta_data->>'state', '');
    user_avatar := COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '');

    INSERT INTO public.profiles (
        id, email, name, phone, role, city, state, avatar, is_verified, status
    ) VALUES (
        NEW.id,
        LOWER(NEW.email),
        user_name,
        user_phone,
        user_role,
        user_city,
        user_state,
        user_avatar,
        FALSE,
        'active'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(NULLIF(public.profiles.name, ''), EXCLUDED.name),
        avatar = COALESCE(NULLIF(public.profiles.avatar, ''), EXCLUDED.avatar);

    -- Only create a donor_profile if explicitly provided blood_group in metadata
    -- Google OAuth users without blood_group will complete their profile explicitly
    IF user_role = 'donor' AND NEW.raw_user_meta_data->>'blood_group' IS NOT NULL THEN
        INSERT INTO public.donor_profiles (
            user_id,
            blood_group,
            city,
            state,
            is_available
        ) VALUES (
            NEW.id,
            NEW.raw_user_meta_data->>'blood_group',
            user_city,
            user_state,
            FALSE -- Must explicitly toggle availability
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
