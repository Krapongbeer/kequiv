/**
 * Dashboard Module (v2.1 Clean Ocean Typewriter Edition)
 * Real-time business summary with clean colors & straightforward wording
 */

window.dashboardModule = {
    async load() {
        const container = document.getElementById('dashboard-content');
        if (!container) return;

        container.innerHTML = `
            <div class="flex items-center justify-center p-12 text-slate-500 font-mono">
                <div class="text-center">
                    <div class="animate-spin text-3xl mb-2">⚙️</div>
                    <div class="text-xs">กำลังโหลดสรุปยอดขาย...</div>
                </div>
            </div>
        `;

        try {
            const res = await api.getDashboard();
            this.render(res.data);
        } catch (err) {
            container.innerHTML = `
                <div class="p-6 typewriter-card border-rose-300 text-rose-800 font-mono bg-rose-50/50">
                    <p class="font-bold">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
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
            monthGrossBilled,
            monthRegularSales,
            monthServiceFee,
            unpaidBilling,
            overdueBilling,
            customerStats,
            recentDocs,
            topCustomers,
            availableReservations,
            serviceStats
        } = data;

        const hasServiceBills = serviceStats && (serviceStats.service_bills_count > 0 || (serviceStats.month_service_fee_revenue > 0));
        const regularSalesVal = monthRegularSales !== undefined ? monthRegularSales : (monthRevenue - (serviceStats?.month_service_fee_revenue || 0));
        const grossBilledVal = monthGrossBilled !== undefined ? monthGrossBilled : monthRevenue;

        container.innerHTML = `
            <!-- Top Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 font-mono">
                <!-- Month Revenue -->
                <div class="typewriter-card p-4 rounded-xl border-l-4 border-l-sky-500 bg-white">
                    <div class="flex items-center justify-between mb-2 pb-1 border-b border-slate-100">
                        <span class="text-xs font-bold text-sky-900">รายได้จริงเดือนนี้</span>
                        <span class="text-base text-sky-600">💰</span>
                    </div>
                    <div class="text-2xl font-bold font-typewriter text-slate-900">
                        ฿${app.formatCurrency(monthRevenue)}
                    </div>
                    <p class="text-[11px] text-slate-500 mt-1">
                        ${hasServiceBills ? 'เงินได้จริง (บิลขายปกติ + ค่าบริการร้าน)' : 'คำนวณจากใบเสร็จและบิลขายจริง (ไม่นับซ้ำ)'}
                    </p>
                    ${hasServiceBills ? `
                        <div class="mt-2 pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                            <div class="flex items-center justify-between text-slate-600">
                                <span>📦 บิลขายปกติ:</span>
                                <span class="font-bold text-slate-800">฿${app.formatCurrency(regularSalesVal)}</span>
                            </div>
                            <div class="flex items-center justify-between text-amber-900">
                                <span class="font-medium flex items-center gap-1">
                                    <span>🏢</span> ค่าบริการร้าน (${serviceStats.service_bills_count} บิล):
                                </span>
                                <span class="font-bold text-emerald-700">
                                    +฿${app.formatCurrency(serviceStats.month_service_fee_revenue)}
                                </span>
                            </div>
                            ${grossBilledVal > monthRevenue ? `
                                <div class="flex items-center justify-between text-slate-400 text-[10px] pt-1 border-t border-dashed border-slate-200">
                                    <span>(ยอดหน้าบิลรวมทั้งหมด):</span>
                                    <span>฿${app.formatCurrency(grossBilledVal)}</span>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>

                <!-- Unpaid Invoices -->
                <div class="typewriter-card p-4 rounded-xl border-l-4 border-l-amber-500 bg-amber-50/30">
                    <div class="flex items-center justify-between mb-2 pb-1 border-b border-amber-100">
                        <span class="text-xs font-bold text-amber-950">ยอดรอเก็บเงิน</span>
                        <span class="text-base text-amber-600">⏳</span>
                    </div>
                    <div class="text-2xl font-bold font-typewriter text-amber-950">
                        ฿${app.formatCurrency(unpaidBilling.total)}
                    </div>
                    <p class="text-[11px] text-amber-900 mt-1">
                        ค้าง ${unpaidBilling.count} บิล ${overdueBilling.count > 0 ? `<span class="text-rose-600 font-bold">(เลยกำหนด ${overdueBilling.count})</span>` : ''}
                    </p>
                </div>

                <!-- Customers & Projects -->
                <div class="typewriter-card p-4 rounded-xl border-l-4 border-l-slate-600 bg-white">
                    <div class="flex items-center justify-between mb-2 pb-1 border-b border-slate-100">
                        <span class="text-xs font-bold text-slate-700">ลูกค้าและโครงการ</span>
                        <span class="text-base text-slate-600">👥</span>
                    </div>
                    <div class="text-2xl font-bold font-typewriter text-slate-900">
                        ${customerStats.total_customers} <span class="text-xs font-normal text-slate-500">ราย</span>
                    </div>
                    <p class="text-[11px] text-slate-500 mt-1">รวม ${customerStats.total_projects} โครงการ/สาขาย่อย</p>
                </div>

                <!-- Reserved Numbers Pool -->
                <div class="typewriter-card p-4 rounded-xl border-l-4 border-l-purple-500 bg-purple-50/30">
                    <div class="flex items-center justify-between mb-2 pb-1 border-b border-purple-100">
                        <span class="text-xs font-bold text-purple-950">เลขสำรองในคลัง</span>
                        <span class="text-base text-purple-600">🔢</span>
                    </div>
                    <div class="text-2xl font-bold font-typewriter text-purple-950">
                        ${customerStats.active_reservations} <span class="text-xs font-normal text-slate-500">เลขว่าง</span>
                    </div>
                    <p class="text-[11px] text-purple-900 mt-1">พร้อมใช้สำหรับออกบิลย้อนหลังทันที</p>
                </div>
            </div>

            <!-- Quick Action Bar -->
            <div class="typewriter-card p-4 rounded-xl bg-slate-900 text-white mb-6 flex flex-col md:flex-row items-center justify-between gap-4 font-mono shadow-sm">
                <div>
                    <h3 class="text-sm font-bold font-typewriter flex items-center gap-2 text-sky-300">
                        <span>⚡</span> ออกเอกสารด่วน
                    </h3>
                    <p class="text-xs text-slate-400 mt-0.5">คลิกเพื่อสร้างเอกสารประเภทที่ต้องการได้ทันที</p>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <button onclick="app.switchTab('create-doc', { type: 'quotation' })" class="btn-ocean text-xs py-1.5 px-3">
                        + ใบเสนอราคา (QT)
                    </button>
                    <button onclick="app.switchTab('create-doc', { type: 'billing' })" class="btn-paper text-xs py-1.5 px-3 bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100">
                        + ใบแจ้งหนี้/วางบิล (INV)
                    </button>
                    <button onclick="app.switchTab('create-doc', { type: 'receipt' })" class="btn-paper text-xs py-1.5 px-3 bg-emerald-50 text-emerald-950 border-emerald-300 hover:bg-emerald-100">
                        + ใบเสร็จรับเงิน (RE)
                    </button>
                    <button onclick="app.switchTab('reservations')" class="btn-paper text-xs py-1.5 px-3 bg-purple-50 text-purple-950 border-purple-300 hover:bg-purple-100">
                        🔢 ดูคลังเลขสำรอง
                    </button>
                </div>
            </div>

            <!-- Main Content Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
                <!-- Left 2 Cols: Recent Documents -->
                <div class="lg:col-span-2 typewriter-card rounded-xl p-5 bg-white">
                    <div class="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                        <div>
                            <h3 class="font-bold text-slate-900 font-typewriter text-base flex items-center gap-2">
                                <span>📄</span> เอกสารล่าสุด
                            </h3>
                            <p class="text-xs text-slate-500">เอกสารที่ออกล่าสุดในระบบ</p>
                        </div>
                        <button onclick="app.switchTab('documents')" class="text-xs font-bold text-sky-700 hover:text-sky-900 hover:underline">
                            ดูทั้งหมด →
                        </button>
                    </div>

                    <div class="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                        <table class="w-full text-xs text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr class="border-b border-slate-200 text-slate-700 font-bold bg-slate-50">
                                    <th class="py-2.5 px-3 font-typewriter whitespace-nowrap w-40">เลขที่ / ประเภท</th>
                                    <th class="py-2.5 px-3 font-typewriter min-w-[180px]">ลูกค้า & โครงการ</th>
                                    <th class="py-2.5 px-3 font-typewriter whitespace-nowrap w-28">วันที่</th>
                                    <th class="py-2.5 px-3 text-right font-typewriter whitespace-nowrap w-28">ยอดเงิน</th>
                                    <th class="py-2.5 px-3 text-center font-typewriter whitespace-nowrap w-28">สถานะ</th>
                                    <th class="py-2.5 px-3 text-center font-typewriter whitespace-nowrap w-28">ดู / พิมพ์</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                ${recentDocs.length === 0 ? `
                                    <tr>
                                        <td colspan="6" class="py-8 text-center text-slate-400 font-mono">
                                            ยังไม่มีเอกสารในระบบ คลิกปุ่ม "+ ออกบิลใหม่" เพื่อเริ่มต้น
                                        </td>
                                    </tr>
                                ` : recentDocs.map(d => `
                                    <tr class="hover:bg-slate-50/80 transition">
                                        <td class="py-2.5 px-3 font-mono">
                                            <div class="font-bold text-slate-900 text-xs">${d.code}</div>
                                            <div class="mt-0.5">${app.getDocTypeBadge(d.type)}</div>
                                        </td>
                                        <td class="py-2.5 px-3">
                                            <div class="font-bold text-slate-900 truncate max-w-[170px]">${d.customer_name || '-'}</div>
                                            ${d.project_name_custom || d.project_name ? `
                                                <div class="text-[10px] text-sky-700 font-medium">📌 ${d.project_name_custom || d.project_name}</div>
                                            ` : ''}
                                        </td>
                                        <td class="py-2.5 px-3 whitespace-nowrap text-slate-600">
                                            ${app.formatDateThai(d.issue_date)}
                                        </td>
                                        <td class="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                                            ฿${app.formatCurrency(d.grand_total)}
                                        </td>
                                        <td class="py-2.5 px-3 text-center">
                                            ${app.getStatusBadge(d.status)}
                                        </td>
                                        <td class="py-2.5 px-3 text-center whitespace-nowrap">
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
                    <div class="typewriter-card rounded-xl p-5 bg-white border-purple-200">
                        <div class="flex items-center justify-between mb-2 pb-1 border-b border-purple-100">
                            <h3 class="font-bold text-purple-950 font-typewriter text-xs flex items-center gap-1">
                                <span>🔢</span> คลังเลขสำรอง
                            </h3>
                            <button onclick="app.switchTab('reservations')" class="text-[10px] font-bold text-purple-700 hover:underline">
                                ดูทั้งหมด →
                            </button>
                        </div>
                        ${availableReservations.length === 0 ? `
                            <p class="text-xs text-slate-400 py-3 text-center">ไม่มีเลขสำรองคงเหลือ</p>
                        ` : `
                            <div class="space-y-1.5 mt-2">
                                ${availableReservations.slice(0, 5).map(r => `
                                    <div class="flex items-center justify-between bg-purple-50/60 px-2.5 py-1.5 rounded-lg border border-purple-200 text-xs">
                                        <span class="font-bold text-purple-950 font-mono">${r.code}</span>
                                        <span class="text-[10px] text-slate-500">${r.customer_name ? r.customer_name.slice(0, 15) : 'พร้อมใช้งาน'}</span>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                        <button onclick="app.switchTab('reservations')" class="w-full mt-3 btn-paper text-xs py-1.5 border-purple-200 text-purple-900 hover:bg-purple-50">
                            + จัดการเลขสำรอง
                        </button>
                    </div>

                    <!-- Top 5 Customers -->
                    <div class="typewriter-card rounded-xl p-5 bg-white">
                        <h3 class="font-bold text-slate-900 font-typewriter text-xs pb-1 border-b border-slate-100 mb-2 flex items-center gap-1">
                            <span>⭐</span> ลูกค้ายอดซื้อสูงสุด
                        </h3>
                        ${topCustomers.length === 0 ? `
                            <p class="text-xs text-slate-400 py-3 text-center">ยังไม่มีข้อมูลคำสั่งซื้อ</p>
                        ` : `
                            <div class="space-y-1.5 mt-2">
                                ${topCustomers.map((c, idx) => `
                                    <div class="flex items-center justify-between bg-slate-50 px-2.5 py-2 rounded-lg border border-slate-200 text-xs">
                                        <div class="min-w-0 pr-2">
                                            <div class="font-bold text-slate-900 truncate">${idx + 1}. ${c.name}</div>
                                            <div class="text-[10px] text-slate-500">${c.doc_count} บิลขายจริง</div>
                                        </div>
                                        <div class="font-bold text-sky-800 font-mono shrink-0">
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
