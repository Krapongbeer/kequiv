/**
 * Dashboard Module (สไตล์สมุดคุมและพิมพ์ดีดโบราณ)
 */

window.dashboardModule = {
    async load() {
        const container = document.getElementById('dashboard-content');
        if (!container) return;

        container.innerHTML = `
            <div class="flex items-center justify-center p-12 text-stone-600 font-mono">
                <div class="text-center">
                    <div class="text-3xl mb-2">⌨️</div>
                    <div>กำลังเปิดสมุดสรุปยอดประจำโต๊ะ...</div>
                </div>
            </div>
        `;

        try {
            const res = await api.getDashboard();
            this.render(res.data);
        } catch (err) {
            container.innerHTML = `
                <div class="p-6 typewriter-card border-red-800 text-red-800 font-mono">
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
            <!-- Top Summary Cards (Retro Ledgers) -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 font-mono">
                <!-- Month Revenue -->
                <div class="typewriter-card p-4 rounded-lg">
                    <div class="flex items-center justify-between mb-2 pb-1 border-b border-dashed border-stone-400">
                        <span class="text-[11px] font-bold text-stone-600 uppercase">[ ยอดขายเดือนนี้ ]</span>
                        <span class="text-base">💰</span>
                    </div>
                    <div class="text-2xl font-bold font-typewriter text-stone-900">
                        ฿${app.formatCurrency(monthRevenue)}
                    </div>
                    <p class="text-[10px] text-stone-500 mt-1">บิลแจ้งหนี้ & ใบเสร็จ (ไม่รวม VAT)</p>
                </div>

                <!-- Unpaid Invoices -->
                <div class="typewriter-card p-4 rounded-lg border-amber-900 bg-[#fdfaf3]">
                    <div class="flex items-center justify-between mb-2 pb-1 border-b border-dashed border-stone-400">
                        <span class="text-[11px] font-bold text-amber-900 uppercase">[ ยอดค้างชำระ ]</span>
                        <span class="text-base">⏳</span>
                    </div>
                    <div class="text-2xl font-bold font-typewriter text-amber-900">
                        ฿${app.formatCurrency(unpaidBilling.total)}
                    </div>
                    <p class="text-[10px] text-stone-600 mt-1">
                        ค้าง ${unpaidBilling.count} ฉบับ ${overdueBilling.count > 0 ? `<span class="text-red-700 font-bold">(เกินกำหนด ${overdueBilling.count})</span>` : ''}
                    </p>
                </div>

                <!-- Customers & Projects -->
                <div class="typewriter-card p-4 rounded-lg">
                    <div class="flex items-center justify-between mb-2 pb-1 border-b border-dashed border-stone-400">
                        <span class="text-[11px] font-bold text-stone-600 uppercase">[ ลูกค้า & โครงการ ]</span>
                        <span class="text-base">👥</span>
                    </div>
                    <div class="text-2xl font-bold font-typewriter text-stone-900">
                        ${customerStats.total_customers} <span class="text-xs font-normal">ราย</span>
                    </div>
                    <p class="text-[10px] text-stone-500 mt-1">แยกเป็น ${customerStats.total_projects} โครงการ/หัวบิลย่อย</p>
                </div>

                <!-- Reserved Numbers Pool -->
                <div class="typewriter-card p-4 rounded-lg border-purple-900 bg-[#faf6fe]">
                    <div class="flex items-center justify-between mb-2 pb-1 border-b border-dashed border-stone-400">
                        <span class="text-[11px] font-bold text-purple-900 uppercase">[ เลขกันไว้ในคลัง ]</span>
                        <span class="text-base">🔢</span>
                    </div>
                    <div class="text-2xl font-bold font-typewriter text-purple-950">
                        ${customerStats.active_reservations} <span class="text-xs font-normal">เลขว่าง</span>
                    </div>
                    <p class="text-[10px] text-purple-800 mt-1">พร้อมนำไปใช้ออกบิลย้อนหลังทันที</p>
                </div>
            </div>

            <!-- Quick Action Ribbon Bar -->
            <div class="typewriter-card p-4 rounded-xl bg-[#2b2725] text-[#fdfbf7] mb-6 flex flex-col md:flex-row items-center justify-between gap-4 font-mono">
                <div>
                    <h3 class="text-base font-bold font-typewriter flex items-center gap-2">
                        <span>⌨️</span> แผงกดออกบิลด่วน (QUICK TYPEWRITER)
                    </h3>
                    <p class="text-xs text-stone-400 mt-0.5">เลือกประเภทเอกสารที่ต้องการพิมพ์ดีดออกบิลทันที</p>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <button onclick="app.switchTab('create-doc', { type: 'quotation' })" class="btn-paper text-xs">
                        + [QT] ใบเสนอราคา
                    </button>
                    <button onclick="app.switchTab('create-doc', { type: 'billing' })" class="btn-paper text-xs">
                        + [INV] ใบแจ้งหนี้/วางบิล
                    </button>
                    <button onclick="app.switchTab('create-doc', { type: 'receipt' })" class="btn-paper text-xs">
                        + [RE] ใบเสร็จรับเงิน
                    </button>
                    <button onclick="app.switchTab('reservations')" class="btn-typewriter text-xs bg-purple-900 border-purple-950">
                        🔢 จัดการเลขกันไว้
                    </button>
                </div>
            </div>

            <!-- Main Content Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
                <!-- Left 2 Cols: Recent Documents Ledger -->
                <div class="lg:col-span-2 typewriter-card rounded-xl p-5">
                    <div class="flex items-center justify-between mb-3 pb-2 border-b-2 border-stone-800">
                        <div>
                            <h3 class="font-bold text-stone-900 font-typewriter text-base flex items-center gap-2">
                                <span>📑</span> สมุดลงรายการเอกสารล่าสุด
                            </h3>
                            <p class="text-xs text-stone-500">บันทึก 8 รายการล่าสุดในระบบ</p>
                        </div>
                        <button onclick="app.switchTab('documents')" class="text-xs font-bold text-stone-700 hover:text-black underline">
                            เปิดดูแฟ้มทั้งหมด →
                        </button>
                    </div>

                    <div class="overflow-x-auto border-2 border-stone-800 rounded-lg bg-white">
                        <table class="w-full text-xs text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr class="border-b-2 border-stone-800 text-stone-900 font-bold bg-[#ede4d3]">
                                    <th class="py-2.5 px-3 font-typewriter whitespace-nowrap w-40">เลขที่ / ประเภท</th>
                                    <th class="py-2.5 px-3 font-typewriter min-w-[180px]">ลูกค้า & โครงการ</th>
                                    <th class="py-2.5 px-3 font-typewriter whitespace-nowrap w-28">วันที่</th>
                                    <th class="py-2.5 px-3 text-right font-typewriter whitespace-nowrap w-28">ยอดสุทธิ</th>
                                    <th class="py-2.5 px-3 text-center font-typewriter whitespace-nowrap w-28">สถานะ</th>
                                    <th class="py-2.5 px-3 text-center font-typewriter whitespace-nowrap w-24">คำสั่ง</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-stone-200">
                                ${recentDocs.length === 0 ? `
                                    <tr>
                                        <td colspan="6" class="py-8 text-center text-stone-500 font-mono">
                                            - ยังไม่มีเอกสารในระบบ สอดกระดาษเพื่อออกบิลใบแรก -
                                        </td>
                                    </tr>
                                ` : recentDocs.map(d => `
                                    <tr class="hover:bg-stone-100/70 transition">
                                        <td class="py-2 px-2.5 font-mono">
                                            <div class="font-bold text-stone-900 text-xs">${d.code}</div>
                                            <div class="mt-0.5">${app.getDocTypeBadge(d.type)}</div>
                                        </td>
                                        <td class="py-2 px-2.5">
                                            <div class="font-bold text-stone-900 truncate max-w-[170px]">${d.customer_name || '-'}</div>
                                            ${d.project_name_custom || d.project_name ? `
                                                <div class="text-[10px] text-indigo-900 font-medium">📌 ${d.project_name_custom || d.project_name}</div>
                                            ` : ''}
                                        </td>
                                        <td class="py-2 px-2.5 whitespace-nowrap text-stone-600">
                                            ${app.formatDateThai(d.issue_date)}
                                        </td>
                                        <td class="py-2 px-2.5 text-right font-bold text-stone-900 font-mono">
                                            ฿${app.formatCurrency(d.grand_total)}
                                        </td>
                                        <td class="py-2 px-2.5 text-center">
                                            ${app.getStatusBadge(d.status)}
                                        </td>
                                        <td class="py-2 px-2.5 text-center whitespace-nowrap">
                                            <button onclick="window.printModule.openPrint(${d.id})" class="btn-paper text-[10px] py-1 px-2">
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
                        <div class="flex items-center justify-between mb-2 pb-1 border-b border-dashed border-stone-400">
                            <h3 class="font-bold text-purple-950 font-typewriter text-xs flex items-center gap-1">
                                <span>🔢</span> [ คลังเลขที่กันไว้ ]
                            </h3>
                            <button onclick="app.switchTab('reservations')" class="text-[10px] font-bold text-purple-800 underline">
                                เปิดสมุด
                            </button>
                        </div>
                        <p class="text-[10px] text-stone-600 mb-3">กันเลขไว้ล่วงหน้าเพื่อออกบิลย้อนหลังโดยไม่ชนกัน</p>
                        
                        ${availableReservations.length === 0 ? `
                            <div class="text-center py-4 text-xs text-stone-500 bg-white/70 border border-dashed border-stone-400 rounded">
                                ไม่มีเลขที่กันไว้ในขณะนี้<br>
                                <button onclick="app.switchTab('reservations')" class="mt-2 text-blue-900 font-bold underline text-[11px]">
                                    + คลิกเพื่อกันเลขล่วงหน้า
                                </button>
                            </div>
                        ` : `
                            <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
                                ${availableReservations.map(r => `
                                    <div class="flex items-center justify-between p-2 bg-white border border-stone-300 rounded text-xs">
                                        <div>
                                            <span class="font-bold font-typewriter text-purple-950">${r.code}</span>
                                            <span class="ml-1 text-[10px]">${app.getDocTypeBadge(r.doc_type)}</span>
                                            ${r.note ? `<div class="text-[10px] text-stone-500 mt-0.5 truncate max-w-[150px]">${r.note}</div>` : ''}
                                        </div>
                                        <button onclick="app.switchTab('create-doc', { type: '${r.doc_type}', useReservedCode: '${r.code}', customer_id: ${r.customer_id || 'null'}, project_id: ${r.project_id || 'null'} })" class="btn-typewriter text-[10px] py-1 px-2 bg-purple-900 border-purple-950">
                                            ออกบิล
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>

                    <!-- Top Customers Widget -->
                    <div class="typewriter-card rounded-xl p-5">
                        <div class="flex items-center justify-between mb-2 pb-1 border-b border-dashed border-stone-400">
                            <h3 class="font-bold text-stone-900 font-typewriter text-xs flex items-center gap-1">
                                <span>🏆</span> [ บัญชีลูกค้าหลัก ]
                            </h3>
                            <button onclick="app.switchTab('customers')" class="text-[10px] font-bold underline">
                                ดูทั้งหมด
                            </button>
                        </div>
                        <div class="space-y-2 text-xs">
                            ${topCustomers.map((c, i) => `
                                <div class="flex items-center justify-between py-1 border-b border-dotted border-stone-300">
                                    <div class="flex items-center gap-1.5">
                                        <span class="font-mono text-stone-500">[${i + 1}]</span>
                                        <span class="font-bold text-stone-900 truncate max-w-[130px]">${c.name}</span>
                                    </div>
                                    <span class="font-bold text-stone-800">฿${app.formatCurrency(c.total_spent)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};
