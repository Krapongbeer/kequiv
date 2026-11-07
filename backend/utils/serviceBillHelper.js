/**
 * Service Bill Helper (ระบบบิลที่ร้านให้บริการ / คิดค่าธรรมเนียมบริการและส่วนแบ่ง)
 */

function extractServiceBillInfo(doc) {
    if (!doc) return doc;

    const rawRemark = doc.remark || '';
    const match = rawRemark.match(/\[บิลที่ร้านให้บริการ:({.*?})\]/);

    if (match) {
        try {
            const data = JSON.parse(match[1]);
            doc.is_service_bill = true;
            doc.service_fee_percent = Number(data.percent) || 0;
            doc.service_fee_amount = Number(data.fee) || 0;
            doc.partner_payout_amount = Number(data.payout) || 0;
            doc.partner_name = data.partner || '';
            doc.clean_remark = rawRemark.replace(match[0], '').replace(/\[ไม่ลงวันที่\]/g, '').trim();
            return doc;
        } catch (e) {
            // JSON parse error fallback
        }
    }

    // Check direct column properties if present
    if (doc.is_service_bill === true || doc.is_service_bill === 1 || doc.is_service_bill === '1') {
        doc.is_service_bill = true;
        doc.service_fee_percent = Number(doc.service_fee_percent) || 0;
        doc.service_fee_amount = Number(doc.service_fee_amount) || 0;
        doc.partner_payout_amount = Number(doc.partner_payout_amount) || 0;
        doc.partner_name = doc.partner_name || '';
        doc.clean_remark = rawRemark.replace(/\[ไม่ลงวันที่\]/g, '').trim();
        return doc;
    }

    doc.is_service_bill = false;
    doc.service_fee_percent = 0;
    doc.service_fee_amount = 0;
    doc.partner_payout_amount = 0;
    doc.partner_name = '';
    doc.clean_remark = rawRemark.replace(/\[ไม่ลงวันที่\]/g, '').trim();
    return doc;
}

function serializeServiceBillRemark(remark, isServiceBill, percent, fee, payout, partner) {
    let clean = (remark || '').replace(/\[บิลที่ร้านให้บริการ:({.*?})\]/g, '').trim();
    if (!isServiceBill) return clean;

    const payload = JSON.stringify({
        percent: Number(percent) || 0,
        fee: Number(fee) || 0,
        payout: Number(payout) || 0,
        partner: (partner || '').trim()
    });

    const tag = `[บิลที่ร้านให้บริการ:${payload}]`;
    return clean ? `${clean}\n${tag}` : tag;
}

module.exports = {
    extractServiceBillInfo,
    serializeServiceBillRemark
};
