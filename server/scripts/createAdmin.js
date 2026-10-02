/**
 * LIFORA – Create Admin User Script (Supabase)
 * ============================================
 * This script provisions the administrator account securely in Supabase Auth & PostgreSQL.
 *
 * Usage:
 *   node server/scripts/createAdmin.js
 *
 * Environment: Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const readline = require('readline');
const { supabase } = require('../config/supabase');

const ADMIN_NAME  = process.env.ADMIN_NAME  || 'LIFORA Administrator';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@lifora.org';
const ADMIN_PHONE = process.env.ADMIN_PHONE || '+1 800-555-0100';
const ADMIN_PASS  = process.env.ADMIN_PASSWORD;

const promptPassword = () => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Enter admin password (min 8 chars): ', (pass) => {
      rl.close();
      resolve(pass.trim());
    });
  });
};

const createAdmin = async () => {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env before running this script.');
      process.exit(1);
    }

    // 1. Check if admin profile already exists
    const { data: existingAdmin } = await supabase
      .from('profiles')
      .select('id, email, name, role')
      .eq('role', 'admin')
      .maybeSingle();

    if (existingAdmin) {
      console.log(`ℹ️   Admin account already exists in Supabase: ${existingAdmin.email} (ID: ${existingAdmin.id})`);
      process.exit(0);
    }

    // 2. Get password
    let plainPassword = ADMIN_PASS;
    if (!plainPassword) {
      plainPassword = await promptPassword();
    }

    if (!plainPassword || plainPassword.length < 8) {
      console.error('❌  Password must be at least 8 characters long.');
      process.exit(1);
    }

    const lowerEmail = ADMIN_EMAIL.toLowerCase().trim();

    // 3. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: lowerEmail,
      password: plainPassword,
      email_confirm: true,
      user_metadata: {
        name: ADMIN_NAME,
        role: 'admin',
        phone: ADMIN_PHONE
      }
    });

    if (authError) {
      console.error('❌  Supabase Auth creation error:', authError.message);
      process.exit(1);
    }

    const authUser = authData.user;

    // 4. Ensure profile in public.profiles table has role: 'admin'
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authUser.id,
        email: lowerEmail,
        name: ADMIN_NAME,
        phone: ADMIN_PHONE,
        role: 'admin',
        city: 'HQ Command',
        state: 'Emergency Operations',
        is_verified: true,
        status: 'active'
      })
      .select('*')
      .single();

    if (profileError) {
      console.error('❌  Profile upsert error:', profileError.message);
      process.exit(1);
    }

    // 5. Insert audit log
    await supabase.from('admin_audit_logs').insert({
      user_id: authUser.id,
      action: 'ADMIN_ACCOUNT_PROVISIONED',
      entity: 'profiles',
      entity_id: authUser.id,
      details: `Admin account provisioned via CLI: ${lowerEmail}`
    });

    console.log('\n✅  LIFORA Administrator Provisioned Successfully!');
    console.log('─────────────────────────────────────────────────');
    console.log(`   Name  : ${adminProfile.name}`);
    console.log(`   Email : ${adminProfile.email}`);
    console.log(`   Role  : ${adminProfile.role}`);
    console.log(`   ID    : ${adminProfile.id}`);
    console.log('─────────────────────────────────────────────────');
    console.log('   Store these credentials securely.');
    console.log('   Access dashboard at: /login\n');

    process.exit(0);
  } catch (err) {
    console.error('❌  Fatal error:', err.message);
    process.exit(1);
  }
};

createAdmin();
