/**
 * User Authentication & Management Service
 * Supports persistent Supabase Auth (for Vercel Serverless) with SQLite local fallback.
 * Includes Token Versioning Engine for instant session revocation upon password change.
 */

const bcrypt = require('bcryptjs');
const db = require('../db');
const { supabase, isSupabaseConfigured } = require('../supabase');

// Default bootstrap accounts (Uses environment variables, falls back to secure prompt string)
const DEFAULT_ACCOUNTS = [
    {
        username: 'phongphana',
        email: 'phongphana@kequiv.internal',
        defaultPassword: process.env.INITIAL_ADMIN_PASSWORD || 'plakrapong',
        name: 'Phongphana (เจ้าของร้าน / ผู้ดูแลระบบ)',
        role: 'admin'
    },
    {
        username: 'ampui',
        email: 'ampui@kequiv.internal',
        defaultPassword: process.env.INITIAL_EDITOR_PASSWORD || 'plaakrapong',
        name: 'Ampui (เจ้าหน้าที่ออกบิล)',
        role: 'editor'
    }
];

let isInitialized = false;
const tokenVersionCache = new Map(); // username -> { version: number, cachedAt: number }
const CACHE_TTL_MS = 30000; // 30 seconds cache for zero overhead on high-frequency calls

async function ensureDefaultUsers() {
    if (isInitialized) return;

    // 1. Ensure SQLite users table, schema migrations & seed
    try {
        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'editor',
                password_hash TEXT NOT NULL,
                token_version INTEGER NOT NULL DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Migration: add token_version if missing
        try {
            db.exec(`ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 1;`);
        } catch (_) {}

        for (const acc of DEFAULT_ACCOUNTS) {
            const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(acc.username);
            if (!existing) {
                const hash = bcrypt.hashSync(acc.defaultPassword, 10);
                db.prepare(`
                    INSERT INTO users (username, email, name, role, password_hash, token_version)
                    VALUES (?, ?, ?, ?, ?, 1)
                `).run(acc.username, acc.email, acc.name, acc.role, hash);
            }
        }
    } catch (sqliteErr) {
        console.error('Error ensuring SQLite users:', sqliteErr.message);
    }

    // 2. Ensure Supabase Auth users
    if (isSupabaseConfigured && supabase) {
        try {
            const { data: listData, error: listErr } = await supabase.auth.admin.listUsers();
            if (!listErr && listData && listData.users) {
                const existingEmails = new Set(listData.users.map(u => u.email ? u.email.toLowerCase() : ''));
                for (const acc of DEFAULT_ACCOUNTS) {
                    if (!existingEmails.has(acc.email.toLowerCase())) {
                        console.log(`Provisioning initial Supabase Auth user: ${acc.username}...`);
                        await supabase.auth.admin.createUser({
                            email: acc.email,
                            password: acc.defaultPassword,
                            user_metadata: {
                                username: acc.username,
                                name: acc.name,
                                role: acc.role,
                                token_version: 1
                            },
                            email_confirm: true
                        });
                    }
                }
            }
        } catch (sbErr) {
            console.error('Error ensuring Supabase users:', sbErr.message);
        }
    }

    isInitialized = true;
}

/**
 * Get current active token version for a user
 */
async function getUserTokenVersion(username) {
    if (!username) return 1;
    const cleanUser = username.trim().toLowerCase();
    const now = Date.now();
    const cached = tokenVersionCache.get(cleanUser);
    if (cached && (now - cached.cachedAt < CACHE_TTL_MS)) {
        return cached.version;
    }

    let version = 1;

    // Check SQLite
    try {
        const row = db.prepare('SELECT token_version FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?').get(cleanUser, cleanUser);
        if (row && row.token_version != null) {
            version = Number(row.token_version);
        }
    } catch (_) {}

    // Check Supabase
    if (isSupabaseConfigured && supabase) {
        try {
            const { data } = await supabase.auth.admin.listUsers();
            if (data && data.users) {
                const target = data.users.find(u => {
                    const m = u.user_metadata || {};
                    return (m.username && m.username.toLowerCase() === cleanUser) ||
                           (u.email && u.email.toLowerCase() === `${cleanUser}@kequiv.internal`) ||
                           (u.email && u.email.toLowerCase() === cleanUser);
                });
                if (target && target.user_metadata && target.user_metadata.token_version != null) {
                    version = Math.max(version, Number(target.user_metadata.token_version));
                }
            }
        } catch (_) {}
    }

    tokenVersionCache.set(cleanUser, { version, cachedAt: now });
    return version;
}

/**
 * Verify whether an incoming JWT's token_version is still valid
 */
async function verifyUserTokenVersion(username, tokenVersion) {
    if (!username) return false;
    const currentVersion = await getUserTokenVersion(username);
    const incomingVer = Number(tokenVersion) || 1;
    return incomingVer >= currentVersion;
}

/**
 * Invalidate all active tokens for a user by incrementing token_version
 */
async function incrementUserTokenVersion(username) {
    if (!username) return 1;
    const cleanUser = username.trim().toLowerCase();
    tokenVersionCache.delete(cleanUser);
    let newVersion = 2;

    // 1. Update SQLite
    try {
        db.prepare(`
            UPDATE users SET token_version = COALESCE(token_version, 1) + 1, updated_at = datetime('now')
            WHERE LOWER(username) = ? OR LOWER(email) = ?
        `).run(cleanUser, cleanUser);
        const row = db.prepare('SELECT token_version FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?').get(cleanUser, cleanUser);
        if (row && row.token_version != null) newVersion = Number(row.token_version);
    } catch (e) {
        console.error('Error incrementing SQLite token_version:', e.message);
    }

    // 2. Update Supabase Auth user metadata
    if (isSupabaseConfigured && supabase) {
        try {
            const { data } = await supabase.auth.admin.listUsers();
            const targetUser = (data && data.users)
                ? data.users.find(u => {
                    const m = u.user_metadata || {};
                    return (m.username && m.username.toLowerCase() === cleanUser) ||
                           (u.email && u.email.toLowerCase() === `${cleanUser}@kequiv.internal`) ||
                           (u.email && u.email.toLowerCase() === cleanUser);
                })
                : null;

            if (targetUser) {
                const currentV = Number(targetUser.user_metadata?.token_version) || 1;
                newVersion = Math.max(newVersion, currentV + 1);
                await supabase.auth.admin.updateUserById(targetUser.id, {
                    user_metadata: {
                        ...targetUser.user_metadata,
                        token_version: newVersion
                    }
                });
            }
        } catch (sbErr) {
            console.error('Error incrementing Supabase token_version:', sbErr.message);
        }
    }

    tokenVersionCache.set(cleanUser, { version: newVersion, cachedAt: Date.now() });
    return newVersion;
}

async function authenticateUser(username, password) {
    await ensureDefaultUsers();
    const cleanUser = (username || '').trim().toLowerCase();

    // Strategy A: Supabase Auth (Persistent across Serverless instances)
    if (isSupabaseConfigured && supabase) {
        try {
            const email = cleanUser.includes('@') ? cleanUser : `${cleanUser}@kequiv.internal`;
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (!error && data && data.user) {
                const u = data.user;
                const meta = u.user_metadata || {};
                const tokenVer = Number(meta.token_version) || await getUserTokenVersion(cleanUser);
                return {
                    success: true,
                    user: {
                        id: u.id,
                        username: meta.username || cleanUser,
                        name: meta.name || meta.username || cleanUser,
                        role: meta.role || 'editor',
                        token_version: tokenVer
                    }
                };
            }
        } catch (sbAuthErr) {
            console.warn('Supabase auth attempt failed, attempting fallback:', sbAuthErr.message);
        }
    }

    // Strategy B: SQLite Fallback (Local development or offline)
    try {
        const userRow = db.prepare('SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?').get(cleanUser, cleanUser);
        if (userRow) {
            const isMatch = bcrypt.compareSync(password, userRow.password_hash);
            if (isMatch) {
                return {
                    success: true,
                    user: {
                        id: userRow.id,
                        username: userRow.username,
                        name: userRow.name,
                        role: userRow.role,
                        token_version: Number(userRow.token_version) || 1
                    }
                };
            }
        }
    } catch (sqliteErr) {
        console.error('SQLite auth error:', sqliteErr.message);
    }

    return {
        success: false,
        error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
    };
}

async function changeUserPassword(username, oldPassword, newPassword) {
    await ensureDefaultUsers();
    const cleanUser = (username || '').trim().toLowerCase();

    // 1. Verify old password first
    const authResult = await authenticateUser(cleanUser, oldPassword);
    if (!authResult.success) {
        return { success: false, error: 'รหัสผ่านเดิมไม่ถูกต้อง' };
    }

    let updatedAny = false;

    // 2. Invalidate all previous active sessions
    const nextVersion = await incrementUserTokenVersion(cleanUser);

    // 3. Update Supabase Auth user
    if (isSupabaseConfigured && supabase) {
        try {
            const { data: listData } = await supabase.auth.admin.listUsers();
            const targetUser = (listData && listData.users)
                ? listData.users.find(u => {
                    const uMeta = u.user_metadata || {};
                    return (uMeta.username && uMeta.username.toLowerCase() === cleanUser) ||
                           (u.email && u.email.toLowerCase() === `${cleanUser}@kequiv.internal`) ||
                           (u.email && u.email.toLowerCase() === cleanUser);
                })
                : null;

            if (targetUser) {
                const { error: updateErr } = await supabase.auth.admin.updateUserById(targetUser.id, {
                    password: newPassword,
                    user_metadata: {
                        ...targetUser.user_metadata,
                        token_version: nextVersion
                    }
                });
                if (updateErr) throw updateErr;
                updatedAny = true;
                console.log(`✓ Supabase password and token_version updated permanently for ${cleanUser}`);
            }
        } catch (sbErr) {
            console.error('Supabase update password error:', sbErr.message);
        }
    }

    // 4. Update SQLite user
    try {
        const newHash = bcrypt.hashSync(newPassword, 10);
        const res = db.prepare(`
            UPDATE users SET password_hash = ?, token_version = ?, updated_at = datetime('now')
            WHERE LOWER(username) = ? OR LOWER(email) = ?
        `).run(newHash, nextVersion, cleanUser, cleanUser);
        if (res.changes > 0) updatedAny = true;
    } catch (sqliteErr) {
        console.error('SQLite update password error:', sqliteErr.message);
    }

    if (updatedAny) {
        return { 
            success: true, 
            message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว เซสชันเดิมทั้งหมดถูกยกเลิกเพื่อความปลอดภัย',
            token_version: nextVersion
        };
    }

    return { success: false, error: 'ไม่พบบัญชีผู้ใช้งานที่ต้องการเปลี่ยนรหัสผ่าน' };
}

module.exports = {
    ensureDefaultUsers,
    authenticateUser,
    changeUserPassword,
    getUserTokenVersion,
    verifyUserTokenVersion,
    incrementUserTokenVersion
};
