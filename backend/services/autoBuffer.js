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
let activePromise = null;

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

async function ensureDailyBuffer(count = 5, force = false) {
    const today = getTodayThai();

    if (!force && lastCheckedDate === today) {
        return { skipped: true, today, createdCount: 0 };
    }

    if (activePromise) {
        return activePromise;
    }

    activePromise = (async () => {
        const datesToCheck = getDatesRangeToCheck(14);
        const types = ['quotation', 'billing', 'receipt'];
        let createdCount = 0;
        let allSucceeded = true;

        try {
            if (isSupabaseConfigured && supabase) {
                // Single fast query to load existing daily quota tags + shop year_format
                const [
                    { data: existingRows, error: checkErr },
                    { data: compRow }
                ] = await Promise.all([
                    supabase
                        .from('document_reservations')
                        .select('doc_type, note')
                        .ilike('note', 'โควตากันเลขสำรองประจำวัน [%]'),
                    supabase
                        .from('company_profile')
                        .select('year_format')
                        .eq('id', 1)
                        .single()
                ]);

                if (checkErr) {
                    throw new Error(`Failed checking existing reservations: ${checkErr.message}`);
                }

                const yearFormat = compRow ? compRow.year_format : 'CE';
                const existingSet = new Set();
                for (const r of (existingRows || [])) {
                    const m = (r.note || '').match(/\[(\d{4}-\d{2}-\d{2})\]/);
                    if (m && m[1]) {
                        existingSet.add(`${r.doc_type}:${m[1]}`);
                    }
                }

                for (const targetDate of datesToCheck) {
                    const noteTag = `โควตากันเลขสำรองประจำวัน [${targetDate}]`;
                    for (const type of types) {
                        if (!existingSet.has(`${type}:${targetDate}`)) {
                            console.log(`📦 Running Daily Auto-Buffer: Reserving ${count} ${type} numbers for ${targetDate}...`);
                            try {
                                await reserveBatchNumbersSupabase(supabase, type, count, {
                                    note: noteTag,
                                    date: targetDate,
                                    yearFormat
                                });
                                existingSet.add(`${type}:${targetDate}`);
                                createdCount += count;
                                console.log(`✓ Daily Auto-Buffer completed for ${type} on ${targetDate}`);
                            } catch (e) {
                                allSucceeded = false;
                                console.error(`Auto-buffer error for ${type} on ${targetDate}:`, e.message);
                            }
                        }
                    }
                }
            } else {
                // SQLite Fallback
                const compRow = db.prepare('SELECT year_format FROM company_profile WHERE id = 1').get();
                const yearFormat = compRow ? compRow.year_format : 'BE';
                const { getYearMonth } = require('../utils/docNumber');

                for (const targetDate of datesToCheck) {
                    const noteTag = `โควตากันเลขสำรองประจำวัน [${targetDate}]`;
                    const ym = getYearMonth(targetDate, yearFormat);
                    for (const type of types) {
                        const existing = db.prepare('SELECT id FROM document_reservations WHERE note = ? AND doc_type = ? LIMIT 1').get(noteTag, type);
                        if (!existing) {
                            console.log(`📦 Running SQLite Daily Auto-Buffer: Reserving ${count} ${type} numbers for ${targetDate}...`);
                            try {
                                reserveBatchNumbers(db, type, count, {
                                    note: noteTag,
                                    yearMonth: ym
                                });
                                createdCount += count;
                                console.log(`✓ SQLite Daily Auto-Buffer completed for ${type} on ${targetDate}`);
                            } catch (e) {
                                allSucceeded = false;
                                console.error(`SQLite Auto-buffer error for ${type} on ${targetDate}:`, e.message);
                            }
                        }
                    }
                }
            }

            if (allSucceeded) {
                lastCheckedDate = today;
            }
            return { skipped: false, today, createdCount, allSucceeded };
        } catch (err) {
            console.error('ensureDailyBuffer error:', err);
            return { skipped: false, today, createdCount, allSucceeded: false, error: err.message };
        } finally {
            activePromise = null;
        }
    })();

    return activePromise;
}

// Middleware for Express (awaits cleanly on /api routes when date rolls over so serverless never kills it mid-run)
async function autoBufferMiddleware(req, res, next) {
    if (!req.path.startsWith('/api/') || req.path === '/api/health' || req.path.startsWith('/api/cron/')) {
        return next();
    }
    const today = getTodayThai();
    if (lastCheckedDate !== today) {
        try {
            await ensureDailyBuffer(5);
        } catch (err) {
            console.error('Auto-buffer middleware error:', err);
        }
    }
    next();
}

module.exports = {
    ensureDailyBuffer,
    autoBufferMiddleware,
    getTodayThai,
    getDatesRangeToCheck
};
