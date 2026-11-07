/**
 * Daily Auto-Buffer Reservation Service
 * Automatically ensures 5 reserve numbers per document type are created daily
 * and automatically backfills any missed days in the month/range.
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

function getDatesRangeToCheck(daysBack = 14) {
    const dates = [];
    const todayStr = getTodayThai();
    const [y, m, d] = todayStr.split('-').map(Number);
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' });

    for (let i = 0; i < daysBack; i++) {
        const targetDate = new Date(Date.UTC(y, m - 1, d - i));
        const dtStr = formatter.format(targetDate);
        if (dtStr < '2026-11-04') break; // Earliest date reservations started in Kequiv
        dates.push(dtStr);
    }
    // Return chronological order: earliest first
    return dates.reverse();
}

async function ensureDailyBuffer(count = 5) {
    if (isRunning) return;
    const today = getTodayThai();

    if (lastCheckedDate === today) {
        return; // Already checked and confirmed up to date
    }

    isRunning = true;
    try {
        const datesToCheck = getDatesRangeToCheck(14);
        const types = ['quotation', 'billing', 'receipt'];
        let hasCreatedAny = false;

        if (isSupabaseConfigured && supabase) {
            for (const targetDate of datesToCheck) {
                const noteTag = `โควตากันเลขสำรองประจำวัน [${targetDate}]`;
                for (const type of types) {
                    const { data: existing, error } = await supabase
                        .from('document_reservations')
                        .select('id')
                        .eq('note', noteTag)
                        .eq('doc_type', type)
                        .limit(1);

                    if (!error && (!existing || existing.length === 0)) {
                        console.log(`📦 Running Daily Auto-Buffer: Reserving ${count} ${type} numbers for ${targetDate}...`);
                        try {
                            await reserveBatchNumbersSupabase(supabase, type, count, {
                                note: noteTag
                            });
                            hasCreatedAny = true;
                            console.log(`✓ Daily Auto-Buffer completed for ${type} on ${targetDate}`);
                        } catch (e) {
                            console.error(`Auto-buffer error for ${type} on ${targetDate}:`, e.message);
                        }
                    }
                }
            }
        } else {
            // SQLite Fallback
            for (const targetDate of datesToCheck) {
                const noteTag = `โควตากันเลขสำรองประจำวัน [${targetDate}]`;
                for (const type of types) {
                    const existing = db.prepare('SELECT id FROM document_reservations WHERE note = ? AND doc_type = ? LIMIT 1').get(noteTag, type);
                    if (!existing) {
                        console.log(`📦 Running SQLite Daily Auto-Buffer: Reserving ${count} ${type} numbers for ${targetDate}...`);
                        try {
                            reserveBatchNumbers(db, type, count, {
                                note: noteTag
                            });
                            hasCreatedAny = true;
                            console.log(`✓ SQLite Daily Auto-Buffer completed for ${type} on ${targetDate}`);
                        } catch (e) {
                            console.error(`SQLite Auto-buffer error for ${type} on ${targetDate}:`, e.message);
                        }
                    }
                }
            }
        }

        lastCheckedDate = today;
    } catch (err) {
        console.error('ensureDailyBuffer error:', err);
    } finally {
        isRunning = false;
    }
}

// Middleware for Express
function autoBufferMiddleware(req, res, next) {
    const today = getTodayThai();
    if (lastCheckedDate !== today && !isRunning) {
        ensureDailyBuffer(5).catch(err => console.error('Auto-buffer background error:', err));
    }
    next();
}

module.exports = {
    ensureDailyBuffer,
    autoBufferMiddleware,
    getTodayThai,
    getDatesRangeToCheck
};
