const express = require('express');
const router = express.Router();
const db = require('../db');
const { supabase, isSupabaseConfigured } = require('../supabase');
const { requireAuth } = require('../middleware/auth');
const lineService = require('../services/lineService');
const { logAudit } = require('../services/auditService');
const { generateDocShareKey } = require('../utils/shareSecurity');

// GET /api/line/status - Check LINE Bot status
router.get('/status', (req, res) => {
    res.json({
        success: true,
        configured: lineService.isConfigured(),
        line_id: '@vcv6921d'
    });
});

// POST /api/line/webhook - Public Webhook for LINE Platform
router.post('/webhook', async (req, res) => {
    try {
        const signature = req.headers['x-line-signature'];
        
        let bodyString = '';
        if (req.rawBody) {
            bodyString = req.rawBody.toString('utf8');
        } else if (Buffer.isBuffer(req.body)) {
            bodyString = req.body.toString('utf8');
        } else if (typeof req.body === 'string') {
            bodyString = req.body;
        } else {
            bodyString = JSON.stringify(req.body);
        }

        if (!signature || !lineService.verifySignature(bodyString, signature)) {
            console.warn('⚠️ Invalid LINE Webhook Signature rejected');
            return res.status(403).json({ success: false, error: 'Invalid signature' });
        }

        const data = (typeof req.body === 'object' && !Buffer.isBuffer(req.body) && req.body !== null) 
            ? req.body 
            : JSON.parse(bodyString || '{}');
        const events = data.events || [];

        // Instant 200 OK for verification events from LINE Developers console
        if (events.length === 0) {
            return res.status(200).json({ success: true, message: 'Webhook verified' });
        }

        for (const ev of events) {
            if (ev.type === 'message' && ev.message && ev.message.type === 'text') {
                const text = (ev.message.text || '').trim();
                const senderId = ev.source ? ev.source.userId : null;

                console.log(`💬 [LINE Message from ${senderId}]: "${text}"`);

                // Check if user is inquiring about a document code (e.g. QT202611-001)
                const docCodeMatch = text.match(/\b(QT|INV|RE)\d{6}-\d{3}\b/i);
                if (docCodeMatch) {
                    const code = docCodeMatch[0].toUpperCase();
                    // Lookup document in DB
                    const doc = db.prepare('SELECT * FROM documents WHERE code = ? AND deleted_at IS NULL').get(code);
                    if (doc) {
                        const host = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://kequiv.vercel.app';
                        const shareKey = generateDocShareKey(doc.code, doc.id);
                        const shareUrl = `${host}/share/${doc.code}?k=${shareKey}`;
                        const flexMsg = lineService.buildDocumentFlexMessage(doc, shareUrl);
                        await lineService.replyMessage(ev.replyToken, flexMsg).catch(err => console.error('LINE Reply error:', err.message));
                        continue;
                    }
                }

                // If user sends generic greeting or inquiry
                if (text.includes('ใบเสนอราคา') || text.includes('บิล') || text.includes('สอบถาม')) {
                    await lineService.replyMessage(ev.replyToken, {
                        type: 'text',
                        text: `สวัสดีครับ 🙏 ร้านเคอีควิป KEQUIV ยินดีให้บริการครับ\n\nหากท่านต้องการขอใบเสนอราคา หรือสอบถามสเปกอุปกรณ์ไอที กล้องวงจรปิด และงานระบบ สามารถพิมพ์แจ้งรายละเอียด หรือระบุเบอร์โทรศัพท์ไว้ได้เลยครับ ทีมช่างจะรีบติดต่อกลับครับ ⚡`
                    }).catch(err => console.error('LINE Reply error:', err.message));
                }
            }
        }

        res.json({ success: true });
    } catch (err) {
        console.error('LINE Webhook error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/line/push-document - Send document via LINE Bot (Protected)
router.post('/push-document', requireAuth, async (req, res) => {
    try {
        const { docId, targetUserId } = req.body;
        if (!docId) {
            return res.status(400).json({ success: false, error: 'กรุณาระบุ docId' });
        }

        const doc = db.prepare('SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL').get(docId);
        if (!doc) {
            return res.status(404).json({ success: false, error: 'ไม่พบเอกสาร' });
        }

        const host = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://kequiv.vercel.app';
        const shareKey = generateDocShareKey(doc.code, doc.id);
        const shareUrl = `${host}/share/${doc.code}?k=${shareKey}`;

        // If targetUserId is provided, push via LINE Bot
        if (targetUserId) {
            const flexMsg = lineService.buildDocumentFlexMessage(doc, shareUrl);
            await lineService.pushMessage(targetUserId, flexMsg);
            
            await logAudit(req, 'LINE_DOCUMENT_PUSH', {
                targetType: 'document',
                targetId: doc.id,
                details: `Document ${doc.code} pushed to LINE user ${targetUserId}`
            });

            return res.json({
                success: true,
                message: `ส่งเอกสาร ${doc.code} เข้า LINE เรียบร้อยแล้ว`,
                shareUrl
            });
        }

        // Return share URL and message preview
        res.json({
            success: true,
            shareUrl,
            code: doc.code
        });
    } catch (err) {
        console.error('Push document error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
