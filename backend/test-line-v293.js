require('dotenv').config();
const assert = require('assert');
const lineService = require('./services/lineService');
const versionInfo = require('./config/version');

async function testLineFeatures() {
    console.log('--- Testing v2.9.3 LINE Integration & Document Sharing ---');

    // 1. Version check
    assert.strictEqual(versionInfo.version, '2.9.3');
    assert(versionInfo.changelog[0].title.includes('LINE Messaging API'));
    console.log('  ✓ Version 2.9.3 verified');

    // 2. LINE Service Configuration Check
    assert.strictEqual(lineService.isConfigured(), true, 'LINE Service must be configured with Channel Token & Secret');
    console.log('  ✓ LINE Channel Access Token & Secret verified active');

    // 3. Test Signature Verification
    const body = JSON.stringify({ events: [] });
    const crypto = require('crypto');
    const validSignature = crypto
        .createHmac('sha256', process.env.LINE_CHANNEL_SECRET)
        .update(body)
        .digest('base64');

    assert.strictEqual(lineService.verifySignature(body, validSignature), true, 'Valid signature must pass');
    assert.strictEqual(lineService.verifySignature(body, 'invalid_sig'), false, 'Invalid signature must fail');
    console.log('  ✓ Webhook HMAC-SHA256 signature verification: PASSED');

    // 4. Test Flex Message Construction
    const mockDoc = {
        code: 'QT202611-001',
        type: 'quotation',
        grand_total: 15750,
        grand_total_thai: 'หนึ่งหมื่นห้าพันเจ็ดร้อยห้าสิบบาทถ้วน',
        customer_name: 'บริษัท ทดสอบ จำกัด',
        project_name_custom: 'โครงการ ติดตั้งกล้องวงจรปิด'
    };
    const flex = lineService.buildDocumentFlexMessage(mockDoc, 'https://kequiv.vercel.app/share/QT202611-001');
    assert.strictEqual(flex.type, 'flex');
    assert(flex.altText.includes('QT202611-001'));
    assert(flex.contents.header.contents[1].text.includes('ใบเสนอราคา'));
    console.log('  ✓ Flex Message generation for LINE: PASSED');

    console.log('=============================================');
    console.log('🎉 ALL v2.9.3 LINE INTEGRATION TESTS PASSED!');
    console.log('=============================================');
}

testLineFeatures().then(() => process.exit(0)).catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
