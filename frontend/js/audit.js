/**
 * Security & Compliance Audit Log Viewer Module
 */

window.auditModule = {
    filters: {
        action: 'all',
        username: '',
        limit: 100
    },
    logs: [],

    async load() {
        const container = document.getElementById('audit-logs-view-content');
        if (!container) return;

        this.renderShell(container);
        await this.fetchLogs();
    },

    renderShell(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
                    <div>
                        <h2 class="text-xl sm:text-2xl font-bold text-slate-800 font-typewriter flex items-center gap-2.5">
                            <span class="p-2 bg-sky-100 text-sky-700 rounded-xl">🛡️</span>
                            <span>ประวัติความปลอดภัยระบบ (Security Audit Logs)</span>
                        </h2>
                        <p class="text-xs text-slate-500 font-mono mt-1">
                            เก็บบันทึกประวัติการทำธุรกรรมความปลอดภัย, การเข้าสู่ระบบ, การเปลี่ยนรหัสผ่าน, สำรองข้อมูล และการยกเลิกบิล
                        </p>
                    </div>

                    <div class="flex items-center gap-2">
                        <button type="button" onclick="window.auditModule.exportCsv()" class="btn-paper text-xs py-2 px-3 border border-slate-300 hover:border-sky-500 flex items-center gap-1.5 shadow-xs">
                            <span>📥</span> ส่งออก CSV
                        </button>
                        <button type="button" onclick="window.auditModule.fetchLogs()" class="btn-ocean text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-xs font-bold">
                            <span>🔄</span> รีเฟรช Log
                        </button>
                    </div>
                </div>

                <!-- Stats Summary Cards -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 font-mono">
                    <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                        <div class="text-[11px] text-slate-500 flex items-center gap-1.5 font-bold">
                            <span class="w-2 h-2 rounded-full bg-emerald-500"></span> เข้าสู่ระบบสำเร็จ
                        </div>
                        <div id="stat-login-success" class="text-xl sm:text-2xl font-bold text-slate-900 mt-2 font-typewriter">-</div>
                    </div>
                    <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                        <div class="text-[11px] text-slate-500 flex items-center gap-1.5 font-bold">
                            <span class="w-2 h-2 rounded-full bg-rose-500"></span> ล็อกอินล้มเหลว
                        </div>
                        <div id="stat-login-failed" class="text-xl sm:text-2xl font-bold text-slate-900 mt-2 font-typewriter">-</div>
                    </div>
                    <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                        <div class="text-[11px] text-slate-500 flex items-center gap-1.5 font-bold">
                            <span class="w-2 h-2 rounded-full bg-amber-500"></span> เปลี่ยนรหัสผ่าน
                        </div>
                        <div id="stat-pwd-changed" class="text-xl sm:text-2xl font-bold text-slate-900 mt-2 font-typewriter">-</div>
                    </div>
                    <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                        <div class="text-[11px] text-slate-500 flex items-center gap-1.5 font-bold">
                            <span class="w-2 h-2 rounded-full bg-sky-500"></span> รวมรายการล่าสุด
                        </div>
                        <div id="stat-total-logs" class="text-xl sm:text-2xl font-bold text-slate-900 mt-2 font-typewriter">-</div>
                    </div>
                </div>

                <!-- Filter Bar -->
                <div class="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                    <div class="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                        <label class="font-bold text-slate-700">กรองกิจกรรม:</label>
                        <select id="filter-audit-action" onchange="window.auditModule.applyFilter()" class="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-sky-500">
                            <option value="all">ทั้งหมด ทุกกิจกรรม (All Events)</option>
                            <option value="LOGIN_SUCCESS">🟢 เข้าสู่ระบบสำเร็จ (LOGIN_SUCCESS)</option>
                            <option value="LOGIN_FAILED">🔴 เข้าสู่ระบบไม่สำเร็จ (LOGIN_FAILED)</option>
                            <option value="PASSWORD_CHANGED">🟡 เปลี่ยนรหัสผ่าน (PASSWORD_CHANGED)</option>
                            <option value="DOCUMENT_CANCELLED">❌ ยกเลิกเอกสาร (DOCUMENT_CANCELLED)</option>
                            <option value="BACKUP_DOWNLOAD">💾 ดาวน์โหลดสำรองข้อมูล (BACKUP_DOWNLOAD)</option>
                            <option value="COMPANY_PROFILE_UPDATED">⚙️ แก้ไขข้อมูลร้านค้า (COMPANY_PROFILE_UPDATED)</option>
                            <option value="LOGOUT">⚪ ออกจากระบบ (LOGOUT)</option>
                        </select>
                    </div>

                    <div class="flex items-center gap-2">
                        <input type="text" id="filter-audit-username" placeholder="ค้นหาชื่อผู้ใช้..." onkeyup="if(event.key==='Enter') window.auditModule.applyFilter()" class="px-3 py-1.5 border border-slate-300 rounded-lg text-xs w-44 focus:outline-none focus:border-sky-500">
                        <button type="button" onclick="window.auditModule.applyFilter()" class="btn-paper py-1.5 px-3 border border-slate-300 hover:border-sky-500">
                            ค้นหา
                        </button>
                    </div>
                </div>

                <!-- Audit Logs Table -->
                <div class="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                    <div id="audit-table-wrap">
                        <div class="p-12 text-center text-slate-400 font-mono text-xs">
                            <div class="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-sky-600 mb-2"></div>
                            <div>กำลังดึงบันทึกความปลอดภัยจากฐานข้อมูล...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async fetchLogs() {
        const wrap = document.getElementById('audit-table-wrap');
        if (!wrap) return;

        try {
            const params = { limit: this.filters.limit };
            if (this.filters.action && this.filters.action !== 'all') {
                params.action = this.filters.action;
            }
            if (this.filters.username) {
                params.username = this.filters.username;
            }

            const res = await api.getAuditLogs(params);
            this.logs = res.data || [];
            this.updateStats();
            this.renderTable();
        } catch (err) {
            wrap.innerHTML = `
                <div class="p-8 text-center text-rose-600 font-mono text-xs">
                    <p class="font-bold text-sm">🔒 ไม่สามารถโหลดข้อมูล Audit Logs ได้</p>
                    <p class="mt-1 text-slate-500">${err.message || 'จำเป็นต้องใช้สิทธิ์ผู้ดูแลระบบ (Admin) ในการเข้าถึง'}</p>
                </div>
            `;
        }
    },

    updateStats() {
        let successCount = 0;
        let failedCount = 0;
        let pwdCount = 0;

        this.logs.forEach(l => {
            if (l.action === 'LOGIN_SUCCESS') successCount++;
            if (l.action === 'LOGIN_FAILED') failedCount++;
            if (l.action === 'PASSWORD_CHANGED') pwdCount++;
        });

        const s1 = document.getElementById('stat-login-success');
        const s2 = document.getElementById('stat-login-failed');
        const s3 = document.getElementById('stat-pwd-changed');
        const s4 = document.getElementById('stat-total-logs');

        if (s1) s1.textContent = successCount;
        if (s2) s2.textContent = failedCount;
        if (s3) s3.textContent = pwdCount;
        if (s4) s4.textContent = this.logs.length;
    },

    renderTable() {
        const wrap = document.getElementById('audit-table-wrap');
        if (!wrap) return;

        if (this.logs.length === 0) {
            wrap.innerHTML = '<div class="p-10 text-center text-slate-400 font-mono text-xs">ไม่พบบันทึกกิจกรรมตามเงื่อนไขที่เลือก</div>';
            return;
        }

        const actionBadges = {
            LOGIN_SUCCESS: '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><span>🟢</span> เข้าสู่ระบบสำเร็จ</span>',
            LOGIN_FAILED: '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200"><span>🔴</span> เข้าสู่ระบบไม่สำเร็จ</span>',
            LOGOUT: '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200"><span>⚪</span> ออกจากระบบ</span>',
            PASSWORD_CHANGED: '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200"><span>🔑</span> เปลี่ยนรหัสผ่าน</span>',
            DOCUMENT_CANCELLED: '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200"><span>❌</span> ยกเลิกเอกสาร</span>',
            BACKUP_DOWNLOAD: '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200"><span>💾</span> สำรองฐานข้อมูล</span>',
            COMPANY_PROFILE_UPDATED: '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200"><span>⚙️</span> แก้ไขข้อมูลร้าน</span>'
        };

        wrap.innerHTML = `
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr class="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold font-mono">
                            <th class="p-3 whitespace-nowrap">ลำดับ</th>
                            <th class="p-3 whitespace-nowrap">วันและเวลา (UTC/ไทย)</th>
                            <th class="p-3 whitespace-nowrap">ผู้ใช้งาน</th>
                            <th class="p-3 whitespace-nowrap">กิจกรรม</th>
                            <th class="p-3 whitespace-nowrap">IP Address</th>
                            <th class="p-3">รายละเอียด (Details)</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 font-mono">
                        ${this.logs.map((log, index) => `
                            <tr class="hover:bg-slate-50/80 transition-colors">
                                <td class="p-3 text-slate-400 text-[11px]">${log.id || (index + 1)}</td>
                                <td class="p-3 whitespace-nowrap text-slate-600 text-[11px] font-medium">${log.created_at || '-'}</td>
                                <td class="p-3 whitespace-nowrap font-bold text-slate-900">${log.username || 'system'}</td>
                                <td class="p-3 whitespace-nowrap">${actionBadges[log.action] || `<span class="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">${log.action}</span>`}</td>
                                <td class="p-3 whitespace-nowrap text-slate-600 font-medium text-[11px]">
                                    <span class="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 border border-slate-200">${log.ip_address || '127.0.0.1'}</span>
                                </td>
                                <td class="p-3 text-slate-600 text-[11px] max-w-md break-words" title="${log.user_agent || ''}">
                                    ${log.details || '-'}
                                    ${log.user_agent ? `<div class="text-[10px] text-slate-400 truncate mt-0.5">${log.user_agent}</div>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    applyFilter() {
        const actionEl = document.getElementById('filter-audit-action');
        const userEl = document.getElementById('filter-audit-username');
        if (actionEl) this.filters.action = actionEl.value;
        if (userEl) this.filters.username = userEl.value.trim();
        this.fetchLogs();
    },

    exportCsv() {
        if (!this.logs || this.logs.length === 0) {
            app.toast('ไม่มีข้อมูลสำหรับส่งออก', 'warning');
            return;
        }

        const headers = ['ID', 'Created At', 'Username', 'Action', 'Target Type', 'Target ID', 'Details', 'IP Address', 'User Agent'];
        const rows = this.logs.map(l => [
            l.id,
            `"${l.created_at || ''}"`,
            `"${l.username || ''}"`,
            `"${l.action || ''}"`,
            `"${l.target_type || ''}"`,
            `"${l.target_id || ''}"`,
            `"${(l.details || '').replace(/"/g, '""')}"`,
            `"${l.ip_address || ''}"`,
            `"${(l.user_agent || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kequiv-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        app.toast('ส่งออกไฟล์ Audit Logs CSV เรียบร้อยแล้ว 📥', 'success');
    }
};
