-- =====================================================================
-- LIFORA DIGITAL BLOOD DONATION EMERGENCY NETWORK
-- Migration 002: Row Level Security (RLS) Policies
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helper Function: Check if authenticated user is a verified Admin
-- Uses trusted profiles table role rather than client metadata
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE id = auth.uid() 
          AND role = 'admin' 
          AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
   SET search_path = public, pg_temp;

-- ---------------------------------------------------------------------
-- Enable Row Level Security (RLS) on all tables
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 1. PROFILES POLICIES
-- ---------------------------------------------------------------------
-- Authenticated users can view public profile details (name, city, role)
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

-- Users can update their own profile (cannot change their own role or verification status directly)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admins have full access to manage profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles FOR ALL 
TO authenticated 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------
-- 2. DONOR PROFILES POLICIES
-- ---------------------------------------------------------------------
-- Authenticated users can view donor profiles for matching purposes
DROP POLICY IF EXISTS "Donor profiles are viewable by authenticated users" ON public.donor_profiles;
CREATE POLICY "Donor profiles are viewable by authenticated users" 
ON public.donor_profiles FOR SELECT 
TO authenticated 
USING (true);

-- Donors can insert and update their own donor profile
DROP POLICY IF EXISTS "Donors can insert their own profile" ON public.donor_profiles;
CREATE POLICY "Donors can insert their own profile" 
ON public.donor_profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Donors can update their own profile" ON public.donor_profiles;
CREATE POLICY "Donors can update their own profile" 
ON public.donor_profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all donor profiles
DROP POLICY IF EXISTS "Admins can manage all donor profiles" ON public.donor_profiles;
CREATE POLICY "Admins can manage all donor profiles" 
ON public.donor_profiles FOR ALL 
TO authenticated 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------
-- 3. HOSPITALS POLICIES
-- ---------------------------------------------------------------------
-- Public and authenticated users can view registered hospitals
DROP POLICY IF EXISTS "Hospitals are viewable by everyone" ON public.hospitals;
CREATE POLICY "Hospitals are viewable by everyone" 
ON public.hospitals FOR SELECT 
TO authenticated, anon 
USING (true);

-- Hospital users can insert & update their own record
DROP POLICY IF EXISTS "Hospitals can insert own record" ON public.hospitals;
CREATE POLICY "Hospitals can insert own record" 
ON public.hospitals FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Hospitals can update own record" ON public.hospitals;
CREATE POLICY "Hospitals can update own record" 
ON public.hospitals FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all hospitals
DROP POLICY IF EXISTS "Admins can manage all hospitals" ON public.hospitals;
CREATE POLICY "Admins can manage all hospitals" 
ON public.hospitals FOR ALL 
TO authenticated 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------
-- 4. HOSPITAL VERIFICATIONS POLICIES
-- ---------------------------------------------------------------------
-- Hospitals can view their own verification submissions
DROP POLICY IF EXISTS "Hospitals view own verifications" ON public.hospital_verifications;
CREATE POLICY "Hospitals view own verifications" 
ON public.hospital_verifications FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.hospitals 
        WHERE id = hospital_verifications.hospital_id 
          AND user_id = auth.uid()
    ) OR public.is_admin()
);

-- Hospitals can submit their verification documents
DROP POLICY IF EXISTS "Hospitals can submit verifications" ON public.hospital_verifications;
CREATE POLICY "Hospitals can submit verifications" 
ON public.hospital_verifications FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.hospitals 
        WHERE id = hospital_verifications.hospital_id 
          AND user_id = auth.uid()
    )
);

-- Admins can update verification records (approve/reject)
DROP POLICY IF EXISTS "Admins can update verifications" ON public.hospital_verifications;
CREATE POLICY "Admins can update verifications" 
ON public.hospital_verifications FOR UPDATE 
TO authenticated 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------
-- 5. BLOOD BANKS POLICIES
-- ---------------------------------------------------------------------
-- Public can view registered blood banks
DROP POLICY IF EXISTS "Blood banks are viewable by everyone" ON public.blood_banks;
CREATE POLICY "Blood banks are viewable by everyone" 
ON public.blood_banks FOR SELECT 
TO authenticated, anon 
USING (true);

-- Blood banks manage their own profile
DROP POLICY IF EXISTS "Blood banks can insert own record" ON public.blood_banks;
CREATE POLICY "Blood banks can insert own record" 
ON public.blood_banks FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Blood banks can update own record" ON public.blood_banks;
CREATE POLICY "Blood banks can update own record" 
ON public.blood_banks FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all blood banks" ON public.blood_banks;
CREATE POLICY "Admins can manage all blood banks" 
ON public.blood_banks FOR ALL 
TO authenticated 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------
-- 6. BLOOD INVENTORY POLICIES
-- ---------------------------------------------------------------------
-- Public can read inventory stock levels
DROP POLICY IF EXISTS "Inventory is viewable by all" ON public.blood_inventory;
CREATE POLICY "Inventory is viewable by all" 
ON public.blood_inventory FOR SELECT 
TO authenticated, anon 
USING (true);

-- Blood bank accounts can manage their own stock
DROP POLICY IF EXISTS "Blood banks manage own inventory" ON public.blood_inventory;
CREATE POLICY "Blood banks manage own inventory" 
ON public.blood_inventory FOR ALL 
TO authenticated 
USING (
    auth.uid() = blood_bank_id OR public.is_admin()
)
WITH CHECK (
    auth.uid() = blood_bank_id OR public.is_admin()
);

-- ---------------------------------------------------------------------
-- 7. BLOOD REQUESTS POLICIES
-- ---------------------------------------------------------------------
-- Authenticated users can view active blood requests
DROP POLICY IF EXISTS "Active blood requests are viewable" ON public.blood_requests;
CREATE POLICY "Active blood requests are viewable" 
ON public.blood_requests FOR SELECT 
TO authenticated, anon 
USING (true);

-- Requesters and hospitals can create blood requests
DROP POLICY IF EXISTS "Users can create blood requests" ON public.blood_requests;
CREATE POLICY "Users can create blood requests" 
ON public.blood_requests FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = requester_id);

-- Requesters can update their own pending requests
DROP POLICY IF EXISTS "Requesters can update own requests" ON public.blood_requests;
CREATE POLICY "Requesters can update own requests" 
ON public.blood_requests FOR UPDATE 
TO authenticated 
USING (
    auth.uid() = requester_id OR 
    (hospital_id IS NOT NULL AND auth.uid() = hospital_id) OR
    public.is_admin()
);

-- Requesters can delete/cancel their own request
DROP POLICY IF EXISTS "Requesters can cancel own requests" ON public.blood_requests;
CREATE POLICY "Requesters can cancel own requests" 
ON public.blood_requests FOR DELETE 
TO authenticated 
USING (auth.uid() = requester_id OR public.is_admin());

-- ---------------------------------------------------------------------
-- 8. DONOR RESPONSES POLICIES
-- ---------------------------------------------------------------------
-- Donors can view and manage their own responses
DROP POLICY IF EXISTS "Donors manage own responses" ON public.donor_responses;
CREATE POLICY "Donors manage own responses" 
ON public.donor_responses FOR ALL 
TO authenticated 
USING (auth.uid() = donor_id OR public.is_admin())
WITH CHECK (auth.uid() = donor_id OR public.is_admin());

-- Request owners (requester or hospital) can view responses to their requests
DROP POLICY IF EXISTS "Requesters view responses to their requests" ON public.donor_responses;
CREATE POLICY "Requesters view responses to their requests" 
ON public.donor_responses FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.blood_requests 
        WHERE id = donor_responses.request_id 
          AND (requester_id = auth.uid() OR hospital_id = auth.uid())
    )
);

-- ---------------------------------------------------------------------
-- 9. DONATION RECORDS POLICIES
-- ---------------------------------------------------------------------
-- Donors can view their own donation records
DROP POLICY IF EXISTS "Donors view own records" ON public.donation_records;
CREATE POLICY "Donors view own records" 
ON public.donation_records FOR SELECT 
TO authenticated 
USING (
    auth.uid() = donor_id OR 
    auth.uid() = hospital_id OR 
    auth.uid() = blood_bank_id OR 
    public.is_admin()
);

-- Hospitals and blood banks can create donation records
DROP POLICY IF EXISTS "Hospitals and banks create donation records" ON public.donation_records;
CREATE POLICY "Hospitals and banks create donation records" 
ON public.donation_records FOR INSERT 
TO authenticated 
WITH CHECK (
    auth.uid() = hospital_id OR 
    auth.uid() = blood_bank_id OR 
    auth.uid() = verified_by OR
    public.is_admin()
);

-- Admins can manage all records
DROP POLICY IF EXISTS "Admins manage donation records" ON public.donation_records;
CREATE POLICY "Admins manage donation records" 
ON public.donation_records FOR ALL 
TO authenticated 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------
-- 10. NOTIFICATIONS POLICIES
-- ---------------------------------------------------------------------
-- Users can only see and update their own notifications
DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
CREATE POLICY "Users manage own notifications" 
ON public.notifications FOR ALL 
TO authenticated 
USING (auth.uid() = recipient_id OR public.is_admin())
WITH CHECK (auth.uid() = recipient_id OR public.is_admin());

-- ---------------------------------------------------------------------
-- 11. CONTACT MESSAGES POLICIES
-- ---------------------------------------------------------------------
-- Public and authenticated visitors can submit contact messages
DROP POLICY IF EXISTS "Anyone can submit contact message" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact message" 
ON public.contact_messages FOR INSERT 
TO authenticated, anon 
WITH CHECK (true);

-- Only Admins can view and update contact messages
DROP POLICY IF EXISTS "Admins can view contact messages" ON public.contact_messages;
CREATE POLICY "Admins can view contact messages" 
ON public.contact_messages FOR SELECT 
TO authenticated 
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;
CREATE POLICY "Admins can update contact messages" 
ON public.contact_messages FOR UPDATE 
TO authenticated 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------
-- 12. ADMIN AUDIT LOGS POLICIES
-- ---------------------------------------------------------------------
-- Only Admins can view audit logs
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Only admins can view audit logs" 
ON public.admin_audit_logs FOR SELECT 
TO authenticated 
USING (public.is_admin());

-- Authenticated system or server can insert audit logs
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Authenticated can insert audit logs" 
ON public.admin_audit_logs FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

-- ---------------------------------------------------------------------
-- 13. USER CONSENTS POLICIES
-- ---------------------------------------------------------------------
-- Users can view and manage their own consents
DROP POLICY IF EXISTS "Users manage own consents" ON public.user_consents;
CREATE POLICY "Users manage own consents" 
ON public.user_consents FOR ALL 
TO authenticated 
USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- ---------------------------------------------------------------------
-- 14. PREVENT PRIVILEGE ESCALATION ON PROFILES
-- Guarantees users cannot modify their own role, is_verified, or status
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- If role, is_verified, or status changed, only allow if user is an admin or service_role
    IF (OLD.role IS DISTINCT FROM NEW.role OR 
        OLD.is_verified IS DISTINCT FROM NEW.is_verified OR 
        OLD.status IS DISTINCT FROM NEW.status) THEN
        IF NOT (public.is_admin() OR current_setting('role', true) = 'service_role') THEN
            NEW.role := OLD.role;
            NEW.is_verified := OLD.is_verified;
            NEW.status := OLD.status;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_protect_profile_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_fields
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_sensitive_columns();

