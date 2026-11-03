/**
 * Daily Auto-Buffer Reservation Service
 * Automatically ensures 5 reserve numbers per document type are created daily.
 */

const { supabase, isSupabaseConfigured } = require('../supabase');
const db = require('../db');
const { reserveBatchNumbersSupabase } = require('../utils/docNumberSupabase');
const { reserveBatchNumbers } = require('../utils/docNumber');

let lastCheckedDate = null;
let isRunning = false;

function getTodayThai() {
    // Return YYYY-MM-DD in Asia/Bangkok
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' });
    return formatter.format(now);
}

async function ensureDailyBuffer(count = 5) {
    if (isRunning) return;
    const today = getTodayThai();

    if (lastCheckedDate === today) {
        return; // Already checked today in-memory
    }

    isRunning = true;
    try {
        const noteTag = `โควตากันเลขสำรองประจำวัน [${today}]`;

        if (isSupabaseConfigured && supabase) {
            // Check if already created for today
            const { data: existing, error } = await supabase
                .from('document_reservations')
                .select('id')
                .eq('note', noteTag)
                .limit(1);

            if (!error && existing && existing.length > 0) {
                lastCheckedDate = today;
                return;
            }

            console.log(`📦 Running Daily Auto-Buffer: Reserving ${count} numbers for ${today}...`);

            const types = ['quotation', 'billing', 'receipt'];
            for (const type of types) {
                try {
                    await reserveBatchNumbersSupabase(supabase, type, count, {
                        note: noteTag
                    });
                } catch (e) {
                    console.error(`Auto-buffer error for ${type}:`, e.message);
                }
            }

            console.log(`✓ Daily Auto-Buffer completed for ${today} (${count} per type)`);
            lastCheckedDate = today;
        } else {
            // SQLite Fallback
            const existing = db.prepare('SELECT id FROM document_reservations WHERE note = ? LIMIT 1').get(noteTag);
            if (existing) {
                lastCheckedDate = today;
                return;
            }

            console.log(`📦 Running SQLite Daily Auto-Buffer: Reserving ${count} numbers for ${today}...`);
            const types = ['quotation', 'billing', 'receipt'];
            for (const type of types) {
                try {
                    reserveBatchNumbers(db, type, count, {
                        note: noteTag
                    });
                } catch (e) {
                    console.error(`SQLite Auto-buffer error for ${type}:`, e.message);
                }
            }

            console.log(`✓ SQLite Daily Auto-Buffer completed for ${today}`);
            lastCheckedDate = today;
        }
    } catch (err) {
        console.error('ensureDailyBuffer error:', err);
    } finally {
        isRunning = false;
    }
}

// Middleware for Express
function autoBufferMiddleware(req, res, next) {
    // Trigger in background without blocking response
    const today = getTodayThai();
    if (lastCheckedDate !== today && !isRunning) {
        ensureDailyBuffer(5).catch(err => console.error('Auto-buffer background error:', err));
    }
    next();
}

module.exports = {
    ensureDailyBuffer,
    autoBufferMiddleware,
    getTodayThai
};
