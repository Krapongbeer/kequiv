/**
 * Company Settings Module (Clean Ocean Edition)
 * Shop profile, logo & bank accounts configuration
 */

window.settingsModule = {
    bankAccounts: [],

    async load() {
        const container = document.getElementById('settings-content');
        if (!container) return;

        container.innerHTML = `
            <div class="flex items-center justify-center p-12 text-slate-500 font-mono">
                <div class="text-center">
                    <div class="animate-spin text-3xl mb-2">⚙️</div>
                    <div>กำลังโหลดข้อมูลร้านค้า...</div>
                </div>
            </div>
        `;

        try {
            const res = await api.getCompany();
            const company = res.data;
            this.bankAccounts = company.bank_accounts || [];
            this.render(company);
        } catch (err) {
            container.innerHTML = `
                <div class="p-6 typewriter-card border-rose-300 text-rose-800 font-mono bg-rose-50/50">
                    <p class="font-bold">เกิดข้อผิดพลาดในการโหลดการตั้งค่า</p>
                    <p class="text-xs mt-1">${err.message}</p>
                </div>
            `;
        }
    },

    render(company) {
        const container = document.getElementById('settings-content');
        if (!container) return;

        container.innerHTML = `
            <div class="max-w-4xl mx-auto typewriter-card rounded-xl p-6 md:p-8 font-mono bg-white">
                <!-- Header -->
                <div class="pb-4 border-b border-slate-200 mb-6">
                    <h2 class="text-xl font-bold text-slate-900 font-typewriter flex items-center gap-2">
                        <span>⚙️</span> ข้อมูลร้านค้าและบัญชีรับเงิน
                    </h2>
                    <p class="text-xs text-slate-500 mt-1">ข้อมูลส่วนนี้จะถูกแสดงบนหัวและท้ายกระดาษของใบเสนอราคา ใบแจ้งหนี้ และใบเสร็จรับเงิน</p>
                </div>

                <form id="settings-form" onsubmit="event.preventDefault(); window.settingsModule.submitSettings();" class="space-y-6 text-xs">
                    <!-- General Shop Info -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="md:col-span-2">
                            <label class="block font-bold text-slate-700 mb-1">ชื่อร้านค้า / กิจการ <span class="text-rose-600">*</span></label>
                            <input type="text" name="name" value="${company.name || ''}" class="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:outline-none focus:border-sky-500" required>
                        </div>

                        <div>
                            <label class="block font-bold text-slate-700 mb-1">เลขประจำตัวผู้เสียภาษี (ถ้ามี)</label>
                            <input type="text" name="tax_id" value="${company.tax_id || ''}" placeholder="ระบุหรือไม่ระบุก็ได้" class="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-sky-500">
                        </div>

                        <div>
                            <label class="block font-bold text-slate-700 mb-1">รูปแบบปีในเลขรันเอกสาร</label>
                            <select name="year_format" class="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:outline-none focus:border-sky-500">
                                <option value="BE" ${company.year_format === 'BE' ? 'selected' : ''}>พ.ศ. (เช่น QT256911-001)</option>
                                <option value="CE" ${company.year_format === 'CE' ? 'selected' : ''}>ค.ศ. (เช่น QT202611-001)</option>
                            </select>
                        </div>

                        <div class="md:col-span-2">
                            <label class="block font-bold text-slate-700 mb-1">ที่อยู่ร้านค้า / กิจการ</label>
                            <textarea name="address" rows="2" class="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-sky-500">${company.address || ''}</textarea>
                        </div>

                        <div>
                            <label class="block font-bold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                            <input type="text" name="phone" value="${company.phone || ''}" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-sky-500">
                        </div>

                        <div>
                            <label class="block font-bold text-slate-700 mb-1">LINE ID / ช่องทางติดต่อ</label>
                            <input type="text" name="line_id" value="${company.line_id || ''}" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-sky-500">
                        </div>

                        <div>
                            <label class="block font-bold text-slate-700 mb-1">อีเมล</label>
                            <input type="email" name="email" value="${company.email || ''}" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-sky-500">
                        </div>

                        <div>
                            <label class="block font-bold text-slate-700 mb-1">โลโก้ร้าน (URL หรือ Data URL)</label>
                            <input type="text" name="logo_url" value="${company.logo_url || ''}" placeholder="https://... หรือ data:image/png..." class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-sky-500">
                        </div>
                    </div>

                    <!-- Bank Accounts Management -->
                    <div class="pt-4 border-t border-slate-200">
                        <div class="flex items-center justify-between mb-3">
                            <div>
                                <h3 class="text-sm font-bold text-slate-900 font-typewriter">บัญชีธนาคารสำหรับรับโอนเงิน</h3>
                                <p class="text-xs text-slate-500">จะพิมพ์ลงท้ายใบแจ้งหนี้และใบเสร็จรับเงิน</p>
                            </div>
                            <button type="button" onclick="window.settingsModule.addBankRow()" class="btn-paper text-xs py-1.5 px-3">
                                + เพิ่มบัญชีธนาคาร
                            </button>
                        </div>

                        <div id="bank-accounts-container" class="space-y-3">
                            <!-- Bank row inputs rendered here -->
                        </div>
                    </div>

                    <!-- Default Terms & Remarks -->
                    <div class="pt-4 border-t border-slate-200 space-y-4">
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">เงื่อนไขการชำระเงินเริ่มต้น</label>
                            <textarea name="default_terms" rows="2" class="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-sky-500">${company.default_terms || ''}</textarea>
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">หมายเหตุท้ายเอกสารเริ่มต้น</label>
                            <textarea name="default_remark" rows="2" class="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-sky-500">${company.default_remark || ''}</textarea>
                        </div>
                    </div>

                    <!-- Save Button -->
                    <div class="pt-4 border-t border-slate-200 flex justify-end">
                        <button type="submit" class="btn-ocean text-xs py-2 px-5">
                            💾 บันทึกการตั้งค่า
                        </button>
                    </div>
                </form>
            </div>
        `;

        this.renderBankAccounts();
    },

    renderBankAccounts() {
        const container = document.getElementById('bank-accounts-container');
        if (!container) return;

        if (this.bankAccounts.length === 0) {
            container.innerHTML = '<div class="text-xs text-slate-400 italic border border-dashed border-slate-200 rounded-lg p-3">ยังไม่ได้ระบุบัญชีธนาคาร (คลิกปุ่ม "+ เพิ่มบัญชีธนาคาร" ด้านบน)</div>';
            return;
        }

        container.innerHTML = this.bankAccounts.map((b, idx) => `
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-3 items-center text-xs">
                <div>
                    <label class="block text-[10px] text-slate-500 mb-0.5">ชื่อธนาคาร / สาขา</label>
                    <input type="text" value="${b.bank || ''}" placeholder="เช่น กสิกรไทย, ไทยพาณิชย์" 
                        class="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                        oninput="window.settingsModule.updateBankField(${idx}, 'bank', this.value)">
                </div>
                <div>
                    <label class="block text-[10px] text-slate-500 mb-0.5">เลขที่บัญชี</label>
                    <input type="text" value="${b.account_no || ''}" placeholder="เช่น 123-4-56789-0" 
                        class="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg bg-white"
                        oninput="window.settingsModule.updateBankField(${idx}, 'account_no', this.value)">
                </div>
                <div class="flex items-center gap-2">
                    <div class="flex-1">
                        <label class="block text-[10px] text-slate-500 mb-0.5">ชื่อบัญชี</label>
                        <input type="text" value="${b.account_name || ''}" placeholder="ชื่อเจ้าของบัญชี" 
                            class="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                            oninput="window.settingsModule.updateBankField(${idx}, 'account_name', this.value)">
                    </div>
                    <button type="button" onclick="window.settingsModule.removeBankRow(${idx})" class="btn-paper text-[10px] mt-4 py-1.5 px-2 text-rose-700 border-rose-300 hover:bg-rose-50" title="ลบบัญชีนี้">
                        ✕
                    </button>
                </div>
            </div>
        `).join('');
    },

    addBankRow() {
        this.bankAccounts.push({ bank: '', account_no: '', account_name: '' });
        this.renderBankAccounts();
    },

    removeBankRow(index) {
        this.bankAccounts.splice(index, 1);
        this.renderBankAccounts();
    },

    updateBankField(index, field, value) {
        if (this.bankAccounts[index]) {
            this.bankAccounts[index][field] = value;
        }
    },

    async submitSettings() {
        const form = document.getElementById('settings-form');
        if (!form) return;

        const data = {
            name: form.name.value.trim(),
            tax_id: form.tax_id.value.trim(),
            address: form.address.value.trim(),
            phone: form.phone.value.trim(),
            line_id: form.line_id.value.trim(),
            email: form.email.value.trim(),
            logo_url: form.logo_url.value.trim(),
            year_format: form.year_format.value,
            default_terms: form.default_terms.value.trim(),
            default_remark: form.default_remark.value.trim(),
            bank_accounts: this.bankAccounts.filter(b => b.bank && b.account_no)
        };

        try {
            const res = await api.updateCompany(data);
            app.state.company = res.data;
            const brandEl = document.getElementById('header-company-name');
            if (brandEl) brandEl.textContent = res.data.name;

            app.toast('บันทึกข้อมูลร้านค้าเรียบร้อยแล้ว', 'success');
        } catch (err) {
            app.toast(err.message, 'error');
        }
    }
};
