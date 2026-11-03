const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// POST /api/upload
// Accepts { image: "data:image/...;base64,...", type: "item" | "logo" }
router.post('/', async (req, res) => {
    try {
        const { image, type = 'item' } = req.body;
        if (!image) {
            return res.status(400).json({ success: false, error: 'กรุณาส่งข้อมูลรูปภาพ' });
        }

        const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return res.status(400).json({ success: false, error: 'รูปแบบ Base64 รูปภาพไม่ถูกต้อง' });
        }

        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.webp`;
        const filepath = path.join(uploadDir, filename);

        // Resize and optimize
        // Items: compact thumbnail max 320x320
        // Logo: max 600x300
        const maxDimension = type === 'logo' ? 600 : 320;
        await sharp(buffer)
            .resize({
                width: maxDimension,
                height: maxDimension,
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: 85 })
            .toFile(filepath);

        res.json({
            success: true,
            url: `/uploads/${filename}`
        });
    } catch (err) {
        console.error('Image upload error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
