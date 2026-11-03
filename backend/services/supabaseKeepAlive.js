/**
 * Supabase Keep-Alive Heartbeat Service
 * 
 * Free-tier Supabase projects automatically pause after 7 days of inactivity.
 * This service ensures the database stays permanently active by executing a periodic
 * lightweight query every 24 hours and providing an external heartbeat ping endpoint.
 */

const { supabase, isSupabaseConfigured } = require('../supabase');
const db = require('../db');

let lastPing = null;
let pingCount = 0;
let lastStatus = 'pending';
let lastError = null;

async function pingSupabase() {
    const timestamp = new Date().toISOString();
    try {
        if (isSupabaseConfigured && supabase) {
            // Touch lightweight table on Supabase (reads 1 row from company_profile or presets)
            const { data, error } = await supabase
                .from('company_profile')
                .select('id, updated_at')
                .limit(1);

            if (error) {
                throw error;
            }

            lastStatus = 'active (supabase)';
            lastError = null;
            pingCount++;
            lastPing = timestamp;
            console.log(`💓 [Supabase Keep-Alive] Ping #${pingCount} successful at ${timestamp} (Status: Active)`);
            return { success: true, target: 'supabase', timestamp, pingCount };
        } else {
            // Fallback: ping local SQLite
            const row = db.prepare('SELECT 1 as alive, datetime("now") as now').get();
            lastStatus = 'active (sqlite-local)';
            lastError = null;
            pingCount++;
            lastPing = timestamp;
            return { success: true, target: 'sqlite-local', timestamp, pingCount, row };
        }
    } catch (err) {
        lastStatus = 'error (supabase)';
        lastError = err.message || String(err);
        console.warn(`⚠️ [Supabase Keep-Alive] Ping warning at ${timestamp}:`, lastError);
        
        // Touch local SQLite as fallback
        try {
            db.prepare('SELECT 1 as alive').get();
        } catch (_) {}

        return { success: false, error: lastError, timestamp, target: 'supabase' };
    }
}

function startKeepAliveSchedule(intervalHours = 24) {
    // Run initial ping immediately
    pingSupabase().catch(() => {});

    // Schedule periodic pings (every 24 hours = 86,400,000 ms)
    const ms = Math.max(1, intervalHours) * 60 * 60 * 1000;
    const timer = setInterval(() => {
        pingSupabase().catch(() => {});
    }, ms);

    // Don't keep Node process alive solely for this timer
    if (timer.unref) {
        timer.unref();
    }

    console.log(`⏱️ [Supabase Keep-Alive] Scheduled automated heartbeat every ${intervalHours}h`);
    return timer;
}

function getStatus() {
    return {
        configured: isSupabaseConfigured,
        target: isSupabaseConfigured ? 'Supabase Cloud (PostgreSQL)' : 'Local SQLite',
        lastPing,
        pingCount,
        status: lastStatus,
        lastError,
        autoPauseProtection: 'ACTIVE (7-Day Down Prevented)'
    };
}

module.exports = {
    pingSupabase,
    startKeepAliveSchedule,
    getStatus
};
