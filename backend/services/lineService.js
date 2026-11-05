/**
 * LINE Official Account & Messaging API Service
 * Supports Flex Message Quotation Cards, Text, and Webhook Event Handling
 */

const crypto = require('crypto');

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;

/**
 * Verify HMAC-SHA256 signature from LINE Webhook
 */
function verifySignature(body, signature) {
    if (!LINE_CHANNEL_SECRET || !signature) return false;
    const hash = crypto
        .createHmac('sha256', LINE_CHANNEL_SECRET)
        .update(body)
        .digest('base64');
    return hash === signature;
}

/**
 * Send messages via LINE Messaging API
 */
async function sendLineRequest(endpoint, payload) {
    if (!LINE_CHANNEL_ACCESS_TOKEN) {
        throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not configured');
    }

    const res = await fetch(`https://api.line.me/v2/bot/${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
        },
        body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.message || `LINE API error: ${res.status}`);
    }
    return data;
}

/**
 * Push message to a specific LINE User ID
 */
async function pushMessage(toUserId, messages) {
    const msgArray = Array.isArray(messages) ? messages : [messages];
    return sendLineRequest('message/push', {
        to: toUserId,
        messages: msgArray
    });
}

/**
 * Reply to an incoming webhook message
 */
async function replyMessage(replyToken, messages) {
    const msgArray = Array.isArray(messages) ? messages : [messages];
    return sendLineRequest('message/reply', {
        replyToken,
        messages: msgArray
    });
}

/**
 * Generate a luxury Flex Message for a Kequiv Business Document (Quotation / Invoice / Receipt)
 */
function buildDocumentFlexMessage(doc, shareUrl) {
    const typeNames = {
        quotation: 'ใบเสนอราคา (Quotation)',
        billing: 'ใบแจ้งหนี้/วางบิล (Billing Note)',
        receipt: 'ใบเสร็จรับเงิน (Receipt)'
    };
    const title = typeNames[doc.type] || 'เอกสารธุรกิจ';
    const grandTotal = Number(doc.grand_total || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 });

    return {
        type: 'flex',
        altText: `📄 ${title} เลขที่ ${doc.code} (฿${grandTotal} บาท)`,
        contents: {
            type: 'bubble',
            size: 'mega',
            header: {
                type: 'box',
                layout: 'vertical',
                backgroundColor: '#0284c7',
                paddingAll: '16px',
                contents: [
                    {
                        type: 'text',
                        text: 'เคอีควิป KEQUIV',
                        weight: 'bold',
                        color: '#ffffff',
                        size: 'md'
                    },
                    {
                        type: 'text',
                        text: title,
                        weight: 'bold',
                        color: '#ffffff',
                        size: 'xl',
                        margin: 'xs'
                    },
                    {
                        type: 'text',
                        text: `เลขที่: ${doc.code}`,
                        color: '#e0f2fe',
                        size: 'xs',
                        margin: 'xs'
                    }
                ]
            },
            body: {
                type: 'box',
                layout: 'vertical',
                spacing: 'md',
                contents: [
                    {
                        type: 'box',
                        layout: 'vertical',
                        contents: [
                            {
                                type: 'text',
                                text: 'ลูกค้า / ผู้รับบริการ:',
                                size: 'xs',
                                color: '#64748b'
                            },
                            {
                                type: 'text',
                                text: doc.customer_name || 'ลูกค้าทั่วไป',
                                weight: 'bold',
                                size: 'sm',
                                color: '#0f172a',
                                wrap: true
                            }
                        ]
                    },
                    ...(doc.project_name_custom || doc.project_name ? [{
                        type: 'box',
                        layout: 'vertical',
                        contents: [
                            {
                                type: 'text',
                                text: 'โครงการ:',
                                size: 'xs',
                                color: '#64748b'
                            },
                            {
                                type: 'text',
                                text: doc.project_name_custom || doc.project_name,
                                size: 'xs',
                                color: '#0369a1',
                                wrap: true
                            }
                        ]
                    }] : []),
                    {
                        type: 'separator',
                        color: '#e2e8f0'
                    },
                    {
                        type: 'box',
                        layout: 'horizontal',
                        contents: [
                            {
                                type: 'text',
                                text: 'ยอดรวมสุทธิ:',
                                size: 'sm',
                                weight: 'bold',
                                color: '#334155'
                            },
                            {
                                type: 'text',
                                text: `฿${grandTotal} บาท`,
                                size: 'lg',
                                weight: 'bold',
                                color: '#0284c7',
                                align: 'end'
                            }
                        ]
                    },
                    {
                        type: 'text',
                        text: doc.grand_total_thai ? `( ${doc.grand_total_thai} )` : '',
                        size: 'xxs',
                        color: '#64748b',
                        align: 'end'
                    }
                ]
            },
            footer: {
                type: 'box',
                layout: 'vertical',
                spacing: 'sm',
                contents: [
                    {
                        type: 'button',
                        style: 'primary',
                        color: '#0284c7',
                        height: 'sm',
                        action: {
                            type: 'uri',
                            label: '📥 เปิดดูบิล & ดาวน์โหลด PDF',
                            uri: shareUrl
                        }
                    },
                    {
                        type: 'button',
                        style: 'link',
                        height: 'sm',
                        action: {
                            type: 'uri',
                            label: '💬 สอบถามร้านค้า LINE OA',
                            uri: 'https://line.me/R/ti/p/@vcv6921d'
                        }
                    }
                ]
            }
        }
    };
}

module.exports = {
    verifySignature,
    pushMessage,
    replyMessage,
    buildDocumentFlexMessage,
    isConfigured: () => Boolean(LINE_CHANNEL_ACCESS_TOKEN && LINE_CHANNEL_SECRET)
};
