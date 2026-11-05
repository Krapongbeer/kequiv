/**
 * User Authentication & Management Service
 * Supports persistent Supabase Auth (for Vercel Serverless) with SQLite local fallback.
 */

const bcrypt = require('bcryptjs');
const db = require('../db');
const { supabase, isSupabaseConfigured } = require('../supabase');

// Default bootstrap accounts (used ONLY for initial first-time database provisioning if no users exist)
const DEFAULT_ACCOUNTS = [
    {
        username: 'phongphana',
        email: 'phongphana@kequiv.internal',
        defaultPassword: 'plakrapong',
        name: 'Phongphana (เจ้าของร้าน / ผู้ดูแลระบบ)',
        role: 'admin'
    },
    {
        username: 'ampui',
        email: 'ampui@kequiv.internal',
        defaultPassword: 'plaakrapong',
        name: 'Ampui (เจ้าหน้าที่ออกบิล)',
        role: 'editor'
    }
];

let isInitialized = false;

async function ensureDefaultUsers() {
    if (isInitialized) return;

    // 1. Ensure SQLite users table & seed
    try {
        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'editor',
                password_hash TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);

        for (const acc of DEFAULT_ACCOUNTS) {
            const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(acc.username);
            if (!existing) {
                const hash = bcrypt.hashSync(acc.defaultPassword, 10);
                db.prepare(`
                    INSERT INTO users (username, email, name, role, password_hash)
                    VALUES (?, ?, ?, ?, ?)
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
                                role: acc.role
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

async function authenticateUser(username, password) {
    await ensureDefaultUsers();
    const cleanUser = (username || '').trim().toLowerCase();

    // Strategy A: Supabase Auth (Persistent across Serverless instances)
    if (isSupabaseConfigured && supabase) {
        try {
            // Find email corresponding to username
            const email = cleanUser.includes('@') ? cleanUser : `${cleanUser}@kequiv.internal`;
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (!error && data && data.user) {
                const u = data.user;
                const meta = u.user_metadata || {};
                return {
                    success: true,
                    user: {
                        id: u.id,
                        username: meta.username || cleanUser,
                        name: meta.name || meta.username || cleanUser,
                        role: meta.role || 'editor'
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
                        role: userRow.role
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

    // 2. Update Supabase Auth user
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
                    password: newPassword
                });
                if (updateErr) throw updateErr;
                updatedAny = true;
                console.log(`✓ Supabase password updated permanently for ${cleanUser}`);
            }
        } catch (sbErr) {
            console.error('Supabase update password error:', sbErr.message);
        }
    }

    // 3. Update SQLite user
    try {
        const newHash = bcrypt.hashSync(newPassword, 10);
        const res = db.prepare(`
            UPDATE users SET password_hash = ?, updated_at = datetime('now')
            WHERE LOWER(username) = ? OR LOWER(email) = ?
        `).run(newHash, cleanUser, cleanUser);
        if (res.changes > 0) updatedAny = true;
    } catch (sqliteErr) {
        console.error('SQLite update password error:', sqliteErr.message);
    }

    if (updatedAny) {
        return { success: true, message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' };
    }

    return { success: false, error: 'ไม่พบบัญชีผู้ใช้งานที่ต้องการเปลี่ยนรหัสผ่าน' };
}

module.exports = {
    ensureDefaultUsers,
    authenticateUser,
    changeUserPassword
};
