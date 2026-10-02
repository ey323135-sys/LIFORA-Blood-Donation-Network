const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables if not already loaded
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: require('path').join(__dirname, '../../.env') });
} else {
  dotenv.config();
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Validation and diagnostics
const isConfigured = Boolean(
  supabaseUrl && 
  !supabaseUrl.includes('placeholder') && 
  (supabaseServiceRoleKey || supabaseAnonKey)
);

if (!isConfigured) {
  console.warn(`
[LIFORA Supabase Warning]
⚠️  SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY are not configured yet.
    Set them in your .env or platform environment variables.
    Supabase project URL should be in the format: https://xyzcompany.supabase.co
  `);
}

// In backend, always prioritize the service_role key for admin bypass of RLS when performing trusted system operations
const keyToUse = supabaseServiceRoleKey || supabaseAnonKey || 'placeholder-key';

const supabaseAdmin = createClient(supabaseUrl || 'https://placeholder.supabase.co', keyToUse, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper to create a client scoped to a user's JWT token (respecting RLS)
const createUserScopedClient = (userToken) => {
  if (!userToken) return supabaseAdmin;
  return createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || keyToUse, {
    global: {
      headers: {
        Authorization: `Bearer ${userToken}`
      }
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

module.exports = {
  supabase: supabaseAdmin,
  supabaseAdmin,
  createUserScopedClient,
  isConfigured
};
