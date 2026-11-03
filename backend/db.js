/**
 * SQLite Database Connection using Node.js built-in `node:sqlite`
 */

const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'kequiv.sqlite');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Ensure data folder exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

// Enable foreign keys and WAL mode for reliability
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

// Initialize Schema
function initSchema() {
    const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
    db.exec(schemaSql);

    // Ensure company profile row exists
    const checkCompany = db.prepare('SELECT id FROM company_profile WHERE id = 1').get();
    if (!checkCompany) {
        db.prepare(`
            INSERT INTO company_profile (id, name, tax_id, address, phone, email, line_id, bank_info, default_terms, default_remark, year_format)
            VALUES (1, 'ร้านเคควิฟ ซัพพลาย แอนด์ เซอร์วิส', '', '88/9 หมู่ 5 ต.บางเมือง อ.เมือง จ.สมุทรปราการ 10270', '089-123-4567', 'contact@kequiv.local', '@kequiv', ?, ?, ?, 'BE')
        `).run(
            JSON.stringify([
                { bank: 'กสิกรไทย (KBANK)', account_no: '012-3-45678-9', account_name: 'นายสมชาย มั่นคง' },
                { bank: 'ไทยพาณิชย์ (SCB)', account_no: '987-6-54321-0', account_name: 'นายสมชาย มั่นคง' }
            ]),
            '1. กำหนดชำระเงินตามเงื่อนไขที่ตกลงกัน\n2. กรุณาโอนเงินเข้าบัญชีธนาคารที่ระบุ และส่งหลักฐานการชำระเงิน',
            'ขอบพระคุณที่ให้ความไว้วางใจในบริการของเรา'
        );
    }
}

initSchema();

module.exports = db;
