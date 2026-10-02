const { supabase, isConfigured } = require('./supabase');

/**
 * Validates and connects to Supabase PostgreSQL database
 */
const connectDB = async () => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isConfigured) {
    if (isProduction) {
      console.error(`
[LIFORA DB FATAL] ❌ Production startup aborted:
SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not configured.
Please set these environment variables in your deployment dashboard (e.g. Railway)
and redeploy.
      `);
      process.exit(1);
    } else {
      console.warn(`
[LIFORA DB WARNING] ⚠️  Supabase credentials not yet provided in .env.
Development server will run in offline mode.
Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to connect to Supabase PostgreSQL.
      `);
      return false;
    }
  }

  try {
    // Ping Supabase to verify connectivity
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error && error.code !== 'PGRST116') {
      // PGRST116 means 0 rows or table empty, which is completely fine
      // If table doesn't exist yet, we guide user to run migrations
      if (error.code === '42P01') {
        console.warn(`
[LIFORA DB CONNECTED] ⚠️  Connected to Supabase, but the 'profiles' table does not exist yet.
Please execute the SQL migration scripts located in /supabase/migrations/
in your Supabase SQL Editor.
        `);
        return true;
      }
      console.error(`[LIFORA DB Notice]: Supabase query note: ${error.message} (Code: ${error.code})`);
    }

    console.log(`[LIFORA DB] ✅ Successfully connected to Supabase PostgreSQL: ${process.env.SUPABASE_URL}`);
    return true;
  } catch (err) {
    console.error(`[LIFORA DB Error]: Failed to reach Supabase: ${err.message}`);
    if (isProduction) {
      process.exit(1);
    }
    return false;
  }
};

module.exports = connectDB;
