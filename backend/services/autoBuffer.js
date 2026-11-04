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
        const types = ['quotation', 'billing', 'receipt'];

        if (isSupabaseConfigured && supabase) {
            for (const type of types) {
                // Check if already created for today for this specific document type
                const { data: existing, error } = await supabase
                    .from('document_reservations')
                    .select('id')
                    .eq('note', noteTag)
                    .eq('doc_type', type)
                    .limit(1);

                if (!error && (!existing || existing.length === 0)) {
                    console.log(`📦 Running Daily Auto-Buffer: Reserving ${count} ${type} numbers for ${today}...`);
                    try {
                        await reserveBatchNumbersSupabase(supabase, type, count, {
                            note: noteTag
                        });
                        console.log(`✓ Daily Auto-Buffer completed for ${type} (${count} numbers)`);
                    } catch (e) {
                        console.error(`Auto-buffer error for ${type}:`, e.message);
                    }
                }
            }
            lastCheckedDate = today;
        } else {
            // SQLite Fallback
            for (const type of types) {
                const existing = db.prepare('SELECT id FROM document_reservations WHERE note = ? AND doc_type = ? LIMIT 1').get(noteTag, type);
                if (!existing) {
                    console.log(`📦 Running SQLite Daily Auto-Buffer: Reserving ${count} ${type} numbers for ${today}...`);
                    try {
                        reserveBatchNumbers(db, type, count, {
                            note: noteTag
                        });
                        console.log(`✓ SQLite Daily Auto-Buffer completed for ${type} (${count} numbers)`);
                    } catch (e) {
                        console.error(`SQLite Auto-buffer error for ${type}:`, e.message);
                    }
                }
            }
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
