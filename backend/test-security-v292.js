const assert = require('assert');
const versionInfo = require('./config/version');
const { authenticateUser, incrementUserTokenVersion, verifyUserTokenVersion } = require('./services/userService');
const { logAudit, getAuditLogs } = require('./services/auditService');

async function testV292Features() {
    console.log('--- Testing v2.9.2 Token Versioning & Audit Logging ---');

    // 1. Version check
    assert.strictEqual(versionInfo.version, '2.9.2');
    assert(versionInfo.changelog[0].title.includes('Token Versioning'));
    console.log('  ✓ Version 2.9.2 verified');

    // 2. Token Versioning Test
    const authRes = await authenticateUser('phongphana', process.env.INITIAL_ADMIN_PASSWORD || 'plakrapong');
    assert(authRes.success, 'Phongphana authentication must succeed');
    const originalVersion = authRes.user.token_version || 1;
    console.log('  ✓ Initial user token_version:', originalVersion);

    // Verify current version is valid
    const isValidBefore = await verifyUserTokenVersion('phongphana', originalVersion);
    assert.strictEqual(isValidBefore, true, 'Original token version must be valid');
    console.log('  ✓ Token version validation before password change: VALID');

    // Simulate password change / session revocation
    const newVersion = await incrementUserTokenVersion('phongphana');
    assert(newVersion > originalVersion, 'New token version must be incremented');
    console.log('  ✓ Incremented token_version after simulated revocation:', newVersion);

    // Verify that the OLD token version is now rejected
    const isOldValid = await verifyUserTokenVersion('phongphana', originalVersion);
    assert.strictEqual(isOldValid, false, 'Old token version MUST be rejected (revoked)');
    console.log('  ✓ Old token rejection test: PASSED (Instant Session Revocation confirmed)');

    // 3. Audit Logging Test
    await logAudit({ user: { id: 1, username: 'phongphana' }, ip: '192.168.1.100', headers: { 'user-agent': 'TestAgent/1.0' } }, 'TEST_AUDIT_ACTION', {
        targetType: 'test',
        targetId: '999',
        details: 'Testing audit log creation'
    });

    const logs = await getAuditLogs({ limit: 10, action: 'TEST_AUDIT_ACTION' });
    assert(logs.length > 0, 'Audit log must be found in database');
    assert.strictEqual(logs[0].action, 'TEST_AUDIT_ACTION');
    assert.strictEqual(logs[0].username, 'phongphana');
    console.log('  ✓ Audit log recording & retrieval test: PASSED');

    console.log('=============================================');
    console.log('🎉 ALL v2.9.2 TESTS PASSED 100%!');
    console.log('=============================================');
}

testV292Features().then(() => process.exit(0)).catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
