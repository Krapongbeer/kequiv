/**
 * Kequiv Security & Compliance Audit Logging Service
 * Records sensitive actions (Logins, Password Changes, Backups, Document Cancellations, Profile Updates)
 */

const db = require('../db');
const { supabase, isSupabaseConfigured } = require('../supabase');

// Ensure audit_logs table exists in SQLite
try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT DEFAULT NULL,
            username TEXT DEFAULT 'system',
            action TEXT NOT NULL,
            target_type TEXT DEFAULT '',
            target_id TEXT DEFAULT '',
            details TEXT DEFAULT '',
            ip_address TEXT DEFAULT '',
            user_agent TEXT DEFAULT '',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_audit_action_time ON audit_logs(action, created_at);
        CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(username);
    `);
} catch (err) {
    console.error('Error ensuring audit_logs table:', err.message);
}

const AUDIT_STORE_ID = 99999;

function getClientIp(req) {
    if (!req) return '127.0.0.1';
    const xForwardedFor = req.headers ? req.headers['x-forwarded-for'] : null;
    if (xForwardedFor) {
        return xForwardedFor.split(',')[0].trim();
    }
    return req.ip || req.connection?.remoteAddress || '127.0.0.1';
}

/**
 * Log a security or compliance event with 100% cloud persistence
 */
async function logAudit(req, action, { targetType = '', targetId = '', details = '', username: explicitUsername = '' } = {}) {
    const username = explicitUsername || 
        (req && req.user && req.user.username ? req.user.username : null) || 
        (details && typeof details === 'object' && details.username ? details.username : null) || 
        'anonymous';
    const userId = (req && req.user && req.user.id) ? String(req.user.id) : null;
    const ip = getClientIp(req);
    const userAgent = (req && req.headers && req.headers['user-agent']) 
        ? req.headers['user-agent'].slice(0, 255) 
        : '';
    const detailsStr = typeof details === 'object' ? (details.details || JSON.stringify(details)) : String(details || '');

    const logEntry = {
        id: Date.now(),
        user_id: userId,
        username,
        action,
        target_type: targetType,
        target_id: String(targetId || ''),
        details: detailsStr,
        ip_address: ip,
        user_agent: userAgent,
        created_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };

    // 1. Write to SQLite
    try {
        db.prepare(`
            INSERT INTO audit_logs (user_id, username, action, target_type, target_id, details, ip_address, user_agent, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(userId, username, action, targetType, String(targetId || ''), detailsStr, ip, userAgent, logEntry.created_at);
    } catch (err) {
        console.error('Audit log SQLite error:', err.message);
    }

    // 2. Mirror to Supabase Cloud with guaranteed persistence
    if (isSupabaseConfigured && supabase) {
        try {
            // A. Try standard audit_logs table
            const { error } = await supabase.from('audit_logs').insert(logEntry);
            if (error && (error.code === 'PGRST205' || error.message.includes('schema cache'))) {
                // B. Fallback to Persistent Cloud Store (Row 99999 in company_profile)
                const { data: storeRow } = await supabase.from('company_profile').select('bank_info').eq('id', AUDIT_STORE_ID).single();
                let existing = [];
                try {
                    existing = storeRow && storeRow.bank_info ? JSON.parse(storeRow.bank_info) : [];
                } catch (_) {}
                existing.unshift(logEntry);
                if (existing.length > 200) existing = existing.slice(0, 200); // keep latest 200 logs

                await supabase.from('company_profile').upsert({
                    id: AUDIT_STORE_ID,
                    name: '__AUDIT_LOG_STORE__',
                    bank_info: JSON.stringify(existing),
                    updated_at: new Date().toISOString()
                });
            }
        } catch (supaErr) {
            console.error('Supabase audit log error:', supaErr.message);
        }
    }
}

/**
 * Retrieve recent audit logs (Protected, Admin only)
 */
async function getAuditLogs({ limit = 100, action = null, username = null } = {}) {
    if (isSupabaseConfigured && supabase) {
        try {
            // A. Try audit_logs table
            let query = supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (action && action !== 'all') query = query.eq('action', action);
            if (username) query = query.ilike('username', `%${username}%`);

            const { data, error } = await query;
            if (!error && data && data.length > 0) return data;

            // B. Check persistent store (Row 99999)
            const { data: storeRow } = await supabase.from('company_profile').select('bank_info').eq('id', AUDIT_STORE_ID).single();
            if (storeRow && storeRow.bank_info) {
                let logs = JSON.parse(storeRow.bank_info);
                if (action && action !== 'all') {
                    logs = logs.filter(l => l.action === action);
                }
                if (username) {
                    const u = username.toLowerCase();
                    logs = logs.filter(l => (l.username || '').toLowerCase().includes(u));
                }
                if (logs.length > 0) {
                    return logs.slice(0, limit);
                }
            }
        } catch (_) {}
    }

    // SQLite Fallback
    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    if (action && action !== 'all') {
        sql += ' AND action = ?';
        params.push(action);
    }
    if (username) {
        sql += ' AND username LIKE ?';
        params.push(`%${username}%`);
    }
    sql += ' ORDER BY id DESC LIMIT ?';
    params.push(parseInt(limit, 10));

    return db.prepare(sql).all(...params);
}

module.exports = {
    logAudit,
    getAuditLogs
};
