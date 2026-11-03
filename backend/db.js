/**
 * SQLite Database Connection using Node.js built-in `node:sqlite`
 */

const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.VERCEL
    ? path.join('/tmp', 'kequiv.sqlite')
    : path.join(__dirname, '..', 'data', 'kequiv.sqlite');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Ensure data folder exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    try {
        fs.mkdirSync(dataDir, { recursive: true });
    } catch (e) {
        // Ignore if read-only or exists
    }
}

const db = new DatabaseSync(DB_PATH);

// Enable foreign keys and WAL mode for reliability
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

const { DEFAULT_CONTENT, DEFAULT_SERVICES, DEFAULT_PORTFOLIO } = require('./utils/defaultCmsData');

// Initialize Schema & Default Seeds
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

    // Ensure default website content exists
    const contentCount = db.prepare('SELECT count(*) as count FROM website_content').get().count;
    if (contentCount === 0) {
        const stmtContent = db.prepare('INSERT OR REPLACE INTO website_content (key, value) VALUES (?, ?)');
        for (const [k, v] of DEFAULT_CONTENT) {
            stmtContent.run(k, v);
        }
    }

    // Ensure default services exist
    const servicesCount = db.prepare('SELECT count(*) as count FROM website_services').get().count;
    if (servicesCount === 0) {
        const stmtService = db.prepare(`
            INSERT INTO website_services (category, title, description, icon, bullets, sort_order)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        for (const item of DEFAULT_SERVICES) {
            stmtService.run(...item);
        }
    }

    // Ensure default portfolio exists
    const portfolioCount = db.prepare('SELECT count(*) as count FROM website_portfolio').get().count;
    if (portfolioCount === 0) {
        const stmtPortfolio = db.prepare(`
            INSERT INTO website_portfolio (category, title, location, description, tag, status, gradient, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const item of DEFAULT_PORTFOLIO) {
            stmtPortfolio.run(...item);
        }
    }
}

initSchema();

module.exports = db;
