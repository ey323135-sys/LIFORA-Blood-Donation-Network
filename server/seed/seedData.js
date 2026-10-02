const dotenv = require('dotenv');
dotenv.config({ path: require('path').join(__dirname, '../../.env') });

const { supabase } = require('../config/supabase');

const seedDatabase = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.log('[LIFORA Seed] Skipped: Production environment does not allow demo seeding.');
    return;
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('[LIFORA Seed] Skipped: Supabase credentials not set.');
    return;
  }

  try {
    console.log('[LIFORA Seed] Provisioning standard reference roles for development...');

    const demoUsers = [
      { name: 'Dr. Evelyn Vance (Platform Admin)', email: 'admin@lifora.org', role: 'admin', phone: '+1 800-555-0199', city: 'New Delhi' },
      { name: 'Metro Care Super Specialty Hospital', email: 'hospital@lifora.org', role: 'hospital', phone: '+1 800-555-0244', city: 'New Delhi' },
      { name: 'Red Cross Central Blood Bank', email: 'bloodbank@lifora.org', role: 'bloodbank', phone: '+1 800-555-0377', city: 'New Delhi' },
      { name: 'Marcus Brody (Emergency Requester)', email: 'requester@lifora.org', role: 'requester', phone: '+1 800-555-0455', city: 'New Delhi' },
      { name: 'Arthur Pendelton (Verified Donor)', email: 'donor@lifora.org', role: 'donor', phone: '+1 800-555-0511', city: 'New Delhi', bloodGroup: 'O+' }
    ];

    for (const u of demoUsers) {
      // Check if user already exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', u.email)
        .maybeSingle();

      if (!existing) {
        // Create in Supabase Auth
        const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
          email: u.email,
          password: 'Lifora@123',
          email_confirm: true,
          user_metadata: { name: u.name, role: u.role, phone: u.phone, city: u.city }
        });

        if (authErr) {
          console.warn(`[LIFORA Seed] Notice for ${u.email}:`, authErr.message);
          continue;
        }

        const userId = authData.user.id;

        // Upsert profile
        await supabase.from('profiles').upsert({
          id: userId,
          email: u.email,
          name: u.name,
          phone: u.phone,
          role: u.role,
          city: u.city,
          state: 'Delhi',
          is_verified: u.role === 'admin' || u.role === 'hospital' || u.role === 'bloodbank',
          status: 'active'
        });

        // If donor, create donor_profile
        if (u.role === 'donor') {
          await supabase.from('donor_profiles').upsert({
            user_id: userId,
            blood_group: u.bloodGroup || 'O+',
            city: u.city,
            state: 'Delhi',
            is_available: true,
            total_donations: 3
          });
        }

        // If hospital, create hospital profile
        if (u.role === 'hospital') {
          await supabase.from('hospitals').upsert({
            user_id: userId,
            hospital_name: u.name,
            registration_no: 'REG-HOSP-DELHI-001',
            official_email: u.email,
            phone: u.phone,
            city: u.city,
            state: 'Delhi',
            address: 'Plot 14, Ring Road, New Delhi',
            contact_person: 'Dr. Marcus Brody'
          });
        }

        // If bloodbank, create blood bank and inventory
        if (u.role === 'bloodbank') {
          await supabase.from('blood_banks').upsert({
            user_id: userId,
            blood_bank_name: u.name,
            registration_no: 'BB-LIC-DELHI-882',
            official_email: u.email,
            phone: u.phone,
            city: u.city,
            state: 'Delhi',
            address: '22 Civic Center Boulevard, New Delhi',
            contact_person: 'Elena Rostova'
          });

          const groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
          for (const bg of groups) {
            await supabase.from('blood_inventory').upsert({
              blood_bank_id: userId,
              blood_group: bg,
              units: bg === 'O+' ? 12 : bg === 'O-' ? 4 : 8,
              last_updated_by: 'Elena Rostova',
              status: bg === 'O-' ? 'Low Stock' : 'In Stock'
            }, { onConflict: 'blood_bank_id,blood_group' });
          }
        }

        console.log(`[LIFORA Seed] ✅ Seeded ${u.role}: ${u.email}`);
      } else {
        console.log(`[LIFORA Seed] Account ${u.email} already exists.`);
      }
    }

    console.log('[LIFORA Seed] Seed completed successfully.');
  } catch (err) {
    console.error('[LIFORA Seed Error]:', err.message);
  }
};

if (require.main === module) {
  seedDatabase().then(() => process.exit(0));
}

module.exports = seedDatabase;
