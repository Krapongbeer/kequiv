/**
 * Thai Baht Text Converter (แปลงตัวเลขเป็นตัวอักษรภาษาไทย)
 * e.g., 15750.00 -> "หนึ่งหมื่นห้าพันเจ็ดร้อยห้าสิบบาทถ้วน"
 * e.g., 101.50 -> "หนึ่งร้อยเอ็ดบาทห้าสิบสตางค์"
 */

const THAI_NUMBERS = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
const THAI_UNITS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

function convertGroup(digits) {
    let text = '';
    const len = digits.length;

    for (let i = 0; i < len; i++) {
        const digit = parseInt(digits[i], 10);
        const pos = len - 1 - i;

        if (digit !== 0) {
            if (pos === 0 && digit === 1 && len > 1) {
                // ตัวสุดท้ายในหลักหน่วย ถ้าไม่ใช่หลักเดียวให้อ่านว่า "เอ็ด"
                text += 'เอ็ด';
            } else if (pos === 1 && digit === 2) {
                // หลักสิบ ถ้าเป็นเลข 2 อ่าน "ยี่"
                text += 'ยี่' + THAI_UNITS[pos];
            } else if (pos === 1 && digit === 1) {
                // หลักสิบ ถ้าเป็นเลข 1 อ่าน "สิบ" (ไม่ต้องอ่าน หนึ่งสิบ)
                text += THAI_UNITS[pos];
            } else {
                text += THAI_NUMBERS[digit] + THAI_UNITS[pos];
            }
        }
    }
    return text;
}

function thaiBahtText(number) {
    if (number === null || number === undefined || isNaN(number)) {
        return 'ศูนย์บาทถ้วน';
    }

    const num = Math.abs(parseFloat(number));
    if (num === 0) {
        return 'ศูนย์บาทถ้วน';
    }

    // Split into integer and 2 decimal places
    const fixedStr = num.toFixed(2);
    const [intPart, decPart] = fixedStr.split('.');

    let intText = '';
    // Process groups of 6 digits (ล้าน)
    const intGroups = [];
    let remainingInt = intPart;

    while (remainingInt.length > 0) {
        const chunkSize = Math.min(6, remainingInt.length);
        const chunk = remainingInt.slice(-chunkSize);
        intGroups.unshift(chunk);
        remainingInt = remainingInt.slice(0, -chunkSize);
    }

    for (let i = 0; i < intGroups.length; i++) {
        const groupText = convertGroup(intGroups[i]);
        if (groupText) {
            intText += groupText;
            if (i < intGroups.length - 1) {
                intText += 'ล้าน';
            }
        }
    }

    if (!intText) {
        intText = 'ศูนย์';
    }

    let result = '';
    const satangNum = parseInt(decPart, 10);

    if (satangNum === 0) {
        result = intText + 'บาทถ้วน';
    } else {
        const satangText = convertGroup(decPart);
        if (intText === 'ศูนย์') {
            result = satangText + 'สตางค์';
        } else {
            result = intText + 'บาท' + satangText + 'สตางค์';
        }
    }

    if (parseFloat(number) < 0) {
        result = 'ลบ' + result;
    }

    return result;
}

module.exports = { thaiBahtText };
