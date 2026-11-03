/**
 * Dashboard Module (v2.0 Ocean Typewriter Edition)
 * Real-time ledger summary with Ocean Cyan accents
 */

window.dashboardModule = {
    async load() {
        const container = document.getElementById('dashboard-content');
        if (!container) return;

        container.innerHTML = `
            <div class="flex items-center justify-center p-12 text-slate-600 font-mono">
                <div class="text-center">
                    <div class="animate-spin text-3xl mb-2">⚙️</div>
                    <div class="text-xs">กำลังเปิดสมุดสรุปยอดประจำโต๊ะ...</div>
                </div>
            </div>
        `;

        try {
            const res = await api.getDashboard();
            this.render(res.data);
        } catch (err) {
            container.innerHTML = `
                <div class="p-6 typewriter-card border-rose-700 text-rose-800 font-mono">
                    <p class="font-bold">[ เกิดข้อผิดพลาดในการโหลดสมุดสรุปยอด ]</p>
                    <p class="text-xs mt-1">${err.message}</p>
                </div>
            `;
        }
    },

    render(data) {
        const container = document.getElementById('dashboard-content');
        if (!container) return;

        const {
            monthRevenue,
            unpaidBilling,
            overdueBilling,
            customerStats,
            recentDocs,
            topCustomers,
            availableReservations
        } = data;

        container.innerHTML = `
            <!-- Top Summary Cards (Retro Ledgers with Ocean Accents) -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 font-mono">
                <!-- Month Revenue -->
                <div class="typewriter-card p-4 rounded-xl border-l-4 border-l-sky-600">
                    <div class="flex items-center justify-between mb-2 pb-1 border-b border-dashed border-slate-300">
                        <span class="text-[11px] font-bold text-sky-900 uppercase">[ ยอดขายเดือนนี้ ]</span>
                        <span class="text-base text-sky-600">💰</span>
                    </div>
                    <div class="text-2xl font-bold font-typewriter text-slate-900">
                        ฿${app.formatCurrency(monthRevenue)}
                    </div>
                    <p class="text-[10px] text-slate-500 mt-1">บิลแจ้งหนี้ & ใบเสร็จ (ไม่รวม VAT)</p>
                </div>

                <!-- Unpaid Invoices -->
                <div class="typewriter-card p-4 rounded-xl border-l-4 border-l-amber-600 bg-amber-50/40">
                    <div class="flex items-center justify-between mb-2 pb-1 border-b border-dashed border-amber-300">
                        <span class="text-[11px] font-bold text-amber-950 uppercase">[ ยอดรอชำระ ]</span>
                        <span class="text-base text-amber-600">⏳</span>
                    </div>
                    <div class="text-2xl font-bold font-typewriter text-amber-950">
                        ฿${app.formatCurrency(unpaidBilling.total)}
                    </div>
                    <p class="text-[10px] text-amber-900 mt-1">
                        ค้าง ${unpaidBilling.count} ฉบับ ${overdueBilling.count > 0 ? `<span class="text-rose-700 font-bold">(เกินกำหนด ${overdueBilling.count})</span>` : ''}
                    </p>
                </div>

                <!-- Customers & Projects -->
                <div class="typewriter-card p-4 rounded-xl border-l-4 border-l-slate-700">
                    <div class="flex items-center justify-between mb-2 pb-1 border-b border-dashed border-slate-300">
                        <span class="text-[11px] font-bold text-slate-700 uppercase">[ ลูกค้า & แฟ้มงาน ]</span>
                        <span class="text-base text-slate-700">👥</span>
                    </div>
                    <div class="text-2xl font-bold font-typewriter text-slate-900">
                        ${customerStats.total_customers} <span class="text-xs font-normal">ราย</span>
                    </div>
                    <p class="text-[10px] text-slate-500 mt-1">แยกเป็น ${customerStats.total_projects} โครงการ/หัวบิลย่อย</p>
                </div>

                <!-- Reserved Numbers Pool -->
                <div class="typewriter-card p-4 rounded-xl border-l-4 border-l-purple-600 bg-purple-50/40">
                    <div class="flex items-center justify-between mb-2 pb-1 border-b border-dashed border-purple-300">
                        <span class="text-[11px] font-bold text-purple-950 uppercase">[ เลขกันไว้ในคลัง ]</span>
                        <span class="text-base text-purple-600">🔢</span>
                    </div>
                    <div class="text-2xl font-bold font-typewriter text-purple-950">
                        ${customerStats.active_reservations} <span class="text-xs font-normal">เลขว่าง</span>
                    </div>
                    <p class="text-[10px] text-purple-900 mt-1">พร้อมนำไปใช้ออกบิลย้อนหลังทันที</p>
                </div>
            </div>

            <!-- Quick Action Ribbon Bar -->
            <div class="typewriter-card p-4 rounded-xl bg-slate-900 text-white mb-6 flex flex-col md:flex-row items-center justify-between gap-4 font-mono shadow-md border-2 border-slate-800">
                <div>
                    <h3 class="text-base font-bold font-typewriter flex items-center gap-2 text-sky-300">
                        <span>⌨️</span> แผงออกบิลด่วน (QUICK TYPEWRITER)
                    </h3>
                    <p class="text-xs text-slate-400 mt-0.5">เลือกประเภทเอกสารเพื่อพิมพ์ดีดออกบิลทันที</p>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <button onclick="app.switchTab('create-doc', { type: 'quotation' })" class="btn-ocean text-xs">
                        + [QT] ใบเสนอราคา
                    </button>
                    <button onclick="app.switchTab('create-doc', { type: 'billing' })" class="btn-paper text-xs bg-amber-50 text-amber-950 border-amber-800">
                        + [INV] ใบแจ้งหนี้/วางบิล
                    </button>
                    <button onclick="app.switchTab('create-doc', { type: 'receipt' })" class="btn-paper text-xs bg-emerald-50 text-emerald-950 border-emerald-800">
                        + [RE] ใบเสร็จรับเงิน
                    </button>
                    <button onclick="app.switchTab('reservations')" class="btn-typewriter text-xs bg-purple-950 border-purple-800 text-purple-200">
                        🔢 จัดการเลขกันไว้
                    </button>
                </div>
            </div>

            <!-- Main Content Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
                <!-- Left 2 Cols: Recent Documents Ledger -->
                <div class="lg:col-span-2 typewriter-card rounded-xl p-5">
                    <div class="flex items-center justify-between mb-3 pb-2 border-b-2 border-slate-800">
                        <div>
                            <h3 class="font-bold text-slate-900 font-typewriter text-base flex items-center gap-2">
                                <span>📑</span> สมุดลงรายการเอกสารล่าสุด
                            </h3>
                            <p class="text-xs text-slate-500">บันทึกล่าสุดในระบบ</p>
                        </div>
                        <button onclick="app.switchTab('documents')" class="text-xs font-bold text-sky-800 hover:text-sky-950 underline">
                            เปิดดูแฟ้มทั้งหมด →
                        </button>
                    </div>

                    <div class="overflow-x-auto border-2 border-slate-800 rounded-lg bg-white">
                        <table class="w-full text-xs text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr class="border-b-2 border-slate-800 text-slate-900 font-bold bg-[#ede4d3]">
                                    <th class="py-2.5 px-3 font-typewriter whitespace-nowrap w-40">เลขที่ / ประเภท</th>
                                    <th class="py-2.5 px-3 font-typewriter min-w-[180px]">ลูกค้า & โครงการ</th>
                                    <th class="py-2.5 px-3 font-typewriter whitespace-nowrap w-28">วันที่</th>
                                    <th class="py-2.5 px-3 text-right font-typewriter whitespace-nowrap w-28">ยอดสุทธิ</th>
                                    <th class="py-2.5 px-3 text-center font-typewriter whitespace-nowrap w-28">สถานะ</th>
                                    <th class="py-2.5 px-3 text-center font-typewriter whitespace-nowrap w-28">คำสั่ง</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-200">
                                ${recentDocs.length === 0 ? `
                                    <tr>
                                        <td colspan="6" class="py-8 text-center text-slate-500 font-mono">
                                            - ยังไม่มีเอกสารในระบบ สอดกระดาษเพื่อออกบิลใบแรก -
                                        </td>
                                    </tr>
                                ` : recentDocs.map(d => `
                                    <tr class="hover:bg-sky-50/40 transition">
                                        <td class="py-2 px-2.5 font-mono">
                                            <div class="font-bold text-slate-900 text-xs">${d.code}</div>
                                            <div class="mt-0.5">${app.getDocTypeBadge(d.type)}</div>
                                        </td>
                                        <td class="py-2 px-2.5">
                                            <div class="font-bold text-slate-900 truncate max-w-[170px]">${d.customer_name || '-'}</div>
                                            ${d.project_name_custom || d.project_name ? `
                                                <div class="text-[10px] text-sky-900 font-medium">📌 ${d.project_name_custom || d.project_name}</div>
                                            ` : ''}
                                        </td>
                                        <td class="py-2 px-2.5 whitespace-nowrap text-slate-600">
                                            ${app.formatDateThai(d.issue_date)}
                                        </td>
                                        <td class="py-2 px-2.5 text-right font-bold text-slate-900 font-mono">
                                            ฿${app.formatCurrency(d.grand_total)}
                                        </td>
                                        <td class="py-2 px-2.5 text-center">
                                            ${app.getStatusBadge(d.status)}
                                        </td>
                                        <td class="py-2 px-2.5 text-center whitespace-nowrap">
                                            <button onclick="window.printModule.openPrint(${d.id})" class="btn-ocean text-[11px] py-1 px-2.5">
                                                พิมพ์ A4
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Right 1 Col: Reserved Pool & Top Customers -->
                <div class="space-y-6">
                    <!-- Reserved Numbers Widget -->
                    <div class="typewriter-card rounded-xl p-5 border-purple-900 bg-[#fdfaf3]">
                        <div class="flex items-center justify-between mb-2 pb-1 border-b border-dashed border-slate-400">
                            <h3 class="font-bold text-purple-950 font-typewriter text-xs flex items-center gap-1">
                                <span>🔢</span> [ คลังเลขที่กันไว้ ]
                            </h3>
                            <button onclick="app.switchTab('reservations')" class="text-[10px] font-bold text-purple-800 underline">
                                ดูทั้งหมด →
                            </button>
                        </div>
                        ${availableReservations.length === 0 ? `
                            <p class="text-xs text-slate-500 py-3 text-center">- ไม่มีเลขกันไว้ในคลัง -</p>
                        ` : `
                            <div class="space-y-1 mt-2">
                                ${availableReservations.slice(0, 5).map(r => `
                                    <div class="flex items-center justify-between bg-white px-2 py-1 rounded border border-purple-200 text-xs">
                                        <span class="font-bold text-purple-950 font-mono">${r.code}</span>
                                        <span class="text-[10px] text-slate-500">${r.customer_name ? r.customer_name.slice(0, 15) : 'ทั่วไป'}</span>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                        <button onclick="app.switchTab('reservations')" class="w-full mt-3 btn-paper text-xs py-1">
                            + กันเลขใหม่สำหรับออกย้อนหลัง
                        </button>
                    </div>

                    <!-- Top 5 Customers -->
                    <div class="typewriter-card rounded-xl p-5">
                        <h3 class="font-bold text-slate-900 font-typewriter text-xs pb-1 border-b border-dashed border-slate-300 mb-2 flex items-center gap-1">
                            <span>⭐</span> [ ลูกค้ามียอดสั่งซื้อสูงสุด ]
                        </h3>
                        ${topCustomers.length === 0 ? `
                            <p class="text-xs text-slate-500 py-3 text-center">- ยังไม่มีข้อมูลคำสั่งซื้อ -</p>
                        ` : `
                            <div class="space-y-1.5 mt-2">
                                ${topCustomers.map((c, idx) => `
                                    <div class="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200 text-xs">
                                        <div class="min-w-0 pr-2">
                                            <div class="font-bold text-slate-900 truncate">${idx + 1}. ${c.name}</div>
                                            <div class="text-[10px] text-slate-500">${c.doc_count} เอกสาร</div>
                                        </div>
                                        <div class="font-bold text-sky-900 font-mono shrink-0">
                                            ฿${app.formatCurrency(c.total_spent)}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }
};
