const { supabase } = require('../config/supabase');

/**
 * Logs administrative and operational activities to Supabase PostgreSQL table: admin_audit_logs
 */
const logActivity = async (userId, action, entity = '', entityId = null, details = '', ipAddress = '') => {
  try {
    const { error } = await supabase.from('admin_audit_logs').insert({
      user_id: userId || null,
      action,
      entity,
      entity_id: entityId || null,
      details: typeof details === 'object' ? JSON.stringify(details) : String(details || ''),
      ip_address: ipAddress || ''
    });

    if (error) {
      console.warn('[AuditService Note]: Audit record insert skipped:', error.message);
    }
  } catch (err) {
    console.warn('[AuditService Warning]:', err.message);
  }
};

module.exports = { logActivity };
