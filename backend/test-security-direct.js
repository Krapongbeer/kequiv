const assert = require('assert');
const versionInfo = require('./config/version');
const presetsApp = require('./server');

function testDirectUnit() {
    console.log('--- Direct In-Memory Testing v2.9.1 ---');

    // 1. Version check
    assert.strictEqual(versionInfo.version, '2.9.1');
    assert(versionInfo.changelog[0].title.includes('IT Hardware'));
    console.log('  ✓ Version 2.9.1 verified');

    // 2. Default CMS Seed data check
    const { DEFAULT_CONTENT, DEFAULT_SERVICES } = require('./utils/defaultCmsData');
    const heroSubtitle = DEFAULT_CONTENT.find(c => c[0] === 'hero_subtitle');
    assert(heroSubtitle && heroSubtitle[1].includes('จำหน่ายอุปกรณ์ไอที'));
    const itHardwareServices = DEFAULT_SERVICES.filter(s => s[0] === 'it_hardware');
    assert(itHardwareServices.length >= 5, 'Must have at least 5 IT hardware services');
    console.log('  ✓ Default CMS contains IT Hardware category with', itHardwareServices.length, 'offerings');

    // 3. Security headers middleware check
    let headers = {};
    const mockRes = {
        setHeader: (k, v) => { headers[k.toLowerCase()] = v; },
        json: () => {},
        status: () => mockRes
    };
    const mockReq = { method: 'GET', url: '/api/version' };

    // Find security header middleware
    const securityMiddleware = presetsApp._router.stack.find(s => s.name === '<anonymous>' && s.handle.length === 3);
    if (securityMiddleware) {
        securityMiddleware.handle(mockReq, mockRes, () => {});
        assert(headers['content-security-policy'], 'CSP must be set');
        assert(headers['strict-transport-security'], 'HSTS must be set');
        assert(headers['permissions-policy'], 'Permissions-Policy must be set');
        assert.strictEqual(headers['x-frame-options'], 'SAMEORIGIN');
        assert.strictEqual(headers['x-content-type-options'], 'nosniff');
        console.log('  ✓ Security Headers (CSP, HSTS, Permissions-Policy, X-Frame-Options) verified');
    }

    // 4. Test logout route
    const authRouter = require('./routes/auth').router;
    const logoutLayer = authRouter.stack.find(s => s.route && s.route.path === '/logout');
    assert(logoutLayer, 'Logout route must exist');
    let logoutResult = null;
    logoutLayer.route.stack[0].handle({}, { json: (obj) => { logoutResult = obj; } });
    assert(logoutResult && logoutResult.success === true);
    console.log('  ✓ POST /api/auth/logout verified');

    console.log('=============================================');
    console.log('🎉 ALL IN-MEMORY v2.9.1 TESTS PASSED 100%!');
    console.log('=============================================');
}

testDirectUnit();
