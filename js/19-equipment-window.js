// ===== 嵌入式雙頁角色裝備面板 =====
// 🗑️ v3.5.87 整區刪除浮動視窗殘骸（用戶拍板）：本面板自 v3.5.x 起恆為嵌入模式（init 無條件加
//    equipment-window-embedded、全專案無 remove/toggle），原「可拖曳浮動視窗」的拖曳三件套、關閉鈕、
//    側欄清單（renderSidePanel/openEquipmentSidePanel/closeEquipmentSidePanel/plainItemName）、
//    closeEquipmentWindow、fitEquipmentWindowToViewport 非嵌入分支——共約 150 行永不可達死碼全數移除。
// 🗑️ 變身立繪引擎（_startMorphPortrait 三層 8fps 循環）一併移除：css/floating-ui.css 以
//    `.equipment-morph-snapshot{display:none!important}` 無條件隱藏（現行 183×408 純裝備格底圖無立繪區），
//    引擎只是在 display:none 子樹裡空轉探測圖檔＋跑 125ms interval（#17 計時器洩漏）。
//    素材 assets/morphanim/ 仍供戰鬥區變身動畫（js/09 MORPH_ANIM_3DIR）使用，未動；
//    日後若新底圖恢復立繪區，從 git 前版或 v3.5.86 的 js/19 找回 _startMorphPortrait 整組即可。
// 本面板保留：雙頁裝備格(renderSlots·第 2 頁＝席琳遺骸欄) ＋ 負重%(renderStats)。
(function () {
    const PAGE_SLOTS = [
        [
            { k: 'helm',    x: 50.0, y: 15.81, w: 19.67, h: 8.82 },
            { k: 'ear1',    x: 19.4, y: 18.01, w: 19.67, h: 8.82 },
            { k: 'ear2',    x: 80.1, y: 18.01, w: 19.67, h: 8.82 },
            { k: 'amulet',  x: 50.0, y: 33.46, w: 19.67, h: 8.82 },
            { k: 'gloves',  x: 19.4, y: 31.50, w: 19.67, h: 8.82 },
            { k: 'cloak',   x: 80.1, y: 31.50, w: 19.67, h: 8.82 },
            { k: 'tshirt',  x: 50.0, y: 42.77, w: 19.67, h: 8.82 },
            { k: 'wpn',     x: 19.4, y: 44.98, w: 19.67, h: 8.82 },
            { k: 'shield', alt: 'offwpn', x: 80.1, y: 44.98, w: 19.67, h: 8.82 },
            { k: 'armor',   x: 50.0, y: 52.08, w: 19.67, h: 8.82 },
            { k: 'ring1',   x: 19.4, y: 58.46, w: 19.67, h: 8.82 },
            { k: 'ring2',   x: 80.1, y: 58.46, w: 19.67, h: 8.82 },
            { k: 'belt',    x: 50.0, y: 63.36, w: 19.67, h: 8.82 },
            { k: 'ring3',   x: 19.4, y: 67.77, w: 19.67, h: 8.82 },
            { k: 'ring4',   x: 80.1, y: 67.77, w: 19.67, h: 8.82 },
            { k: 'shin',    x: 50.0, y: 72.67, w: 19.67, h: 8.82 },
            { k: 'boots',   x: 50.0, y: 81.99, w: 19.67, h: 8.82 },
            { k: 'doll',    x: 19.4, y: 80.76, w: 19.67, h: 8.82 },
            { k: 'arrow',   x: 80.1, y: 80.76, w: 19.67, h: 8.82 }
        ],
        [
            { k: 'rem_eye',   x: 50.0, y: 15.81, w: 19.67, h: 8.82 },
            { k: 'rem_blood', x: 80.1, y: 31.50, w: 19.67, h: 8.82 },
            { k: 'rem_scale', x: 50.0, y: 52.08, w: 19.67, h: 8.82 },
            { k: 'rem_bone',  x: 19.4, y: 31.50, w: 19.67, h: 8.82 },
            { k: 'rem_fang',  x: 80.1, y: 44.98, w: 19.67, h: 8.82 },
            { k: 'rem_heart', x: 50.0, y: 63.36, w: 19.67, h: 8.82 },
            { k: 'rem_flesh', x: 50.0, y: 81.99, w: 19.67, h: 8.82 },
            { k: 'rem_claw',  x: 19.4, y: 44.98, w: 19.67, h: 8.82 }
        ]
    ];

    let page = 0;

    function el(id) { return document.getElementById(id); }

    const EQUIPMENT_TEMPLATE_CLASS = {
        royal: '王族', knight: '騎士', mage: '法師', elf: '妖精',
        dark: '黑妖', illusion: '幻術', dragon: '龍騎', warrior: '戰士'
    };
    function equipmentTemplateUrl() {
        const cls = typeof player !== 'undefined' && player ? EQUIPMENT_TEMPLATE_CLASS[player.cls] : '';
        if (!cls) return 'public/assets/login/EQ%20UI/' + encodeURIComponent('原圖.png') + '?v=20260713';
        const avatar = String(player.avatar || '');
        const female = avatar.startsWith('女') || avatar === '公主';   // 👑 v3.6.01 王族性別直接看 avatar：舊制以 bloodPledge 推斷，血盟改版後創角不再自動入盟、陣營又隨盟主而非自己 → 公主未入盟/入王子盟會誤判為男
        return 'public/assets/login/EQ%20UI/' + encodeURIComponent((female ? '女' : '男') + cls + '.png') + '?v=20260713';
    }
    function syncEquipmentBackground() {
        const background = el('equipment-window-frame')?.querySelector('.equipment-window-bg');
        if (!background) return;
        const src = equipmentTemplateUrl();
        if (background.getAttribute('src') !== src) background.src = src;
    }

    // 🗑️ v3.5.84 移除 18 欄數值（等級/經驗/HP/MP/AC/萬能藥/PK/六維/四屬性抗/ER）：
    //    那批座標是「上一版角色卡版型」留下的百分比，現行底圖（public/assets/login/EQ UI/<性別><職業>.png）
    //    已改成純裝備格版型、上面沒有任何欄位標籤。這些數值在「能力」分頁本來就有完整顯示；
    //    PVP 的真實指標是性向值 alignmentValue，單一顯示點在 js/10 的 PVP 面板，勿在此重複。
    function renderStats() {
        if (typeof player === 'undefined' || !player || !player.d) return;
        const d = player.d;
        const weight = el('equipment-window-weight');
        if (weight) {
            const weightPct = Math.max(0, Math.round(Number(d.weightPct) || 0));
            const loadTier = Math.max(0, Math.min(3, Number(d.loadTier) || 0));
            weight.textContent = `負重 ${weightPct} %`;
            weight.dataset.loadTier = String(loadTier);
            weight.setAttribute('aria-label', `目前負重 ${weightPct}%`);
        }
    }

    function renderSlots() {
        if (typeof player === 'undefined' || !player || !player.eq) return;
        const host = el('equipment-window-slots');
        host.innerHTML = '';
        PAGE_SLOTS[page].forEach(pos => {
            const actualKey = pos.alt && player.eq[pos.alt] ? pos.alt : pos.k;
            const item = player.eq[actualKey];
            const data = item && typeof DB !== 'undefined' && DB.items[item.id];
            const slot = document.createElement('button');
            slot.type = 'button';
            slot.className = 'equipment-visual-slot' + (item ? ' is-filled' : ' is-empty');
            slot.style.cssText = `left:${pos.x}%;top:${pos.y}%;width:${pos.w}%;height:${pos.h}%;`;
            if (item && data) {
                const img = document.createElement('img');
                img.src = getIconUrl(data);
                img.alt = data.n || pos.k;
                img.draggable = false;
                img.onerror = function () { this.style.display = 'none'; };
                // 裝備框沿用背包／舊裝備欄的統一圖示光效：祝福金光、遠古紫光、屬性光、遺物與傳說皆由單一判定處理。
                if (typeof getGlowClass === 'function') {
                    const glowClass = getGlowClass(item, data);
                    if (glowClass) img.classList.add(...glowClass.split(/\s+/).filter(Boolean));
                }
                slot.appendChild(img);
                if ((data.type === 'wpn' || data.type === 'arm' || data.type === 'acc') && !data.isArrow) {
                    const equipped = document.createElement('span');
                    equipped.className = 'equipment-slot-equipped';
                    equipped.textContent = 'E';
                    equipped.setAttribute('aria-hidden', 'true');
                    slot.appendChild(equipped);
                }
                if ((Number(item.en) || 0) > 0) {
                    const badge = document.createElement('span');
                    badge.className = 'equipment-slot-enhance';
                    badge.textContent = '+' + capEn(item.en, data);
                    slot.appendChild(badge);
                } else if ((item.cnt || 1) > 1) {
                    const count = document.createElement('span');
                    count.className = 'equipment-slot-count';
                    count.textContent = (item.cnt || 1).toLocaleString();
                    slot.appendChild(count);
                }
                slot.classList.add('tip-host');
                slot.setAttribute('data-tip-uid', item.uid); slot.setAttribute('data-tip-src', 'eq');   // 🖱️ hover 即時顯示已裝備物品完整資訊 tooltip
                slot.onclick = function () {   // 嵌入模式：單擊開物品視窗（原浮動模式的側欄延遲單擊已隨側欄移除）
                    if (typeof openModal === 'function') openModal(item, true, actualKey);
                };
                slot.ondblclick = function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    unequipItem(actualKey);
                };
            } else {
                slot.title = '尚未裝備';
            }
            host.appendChild(slot);
        });
        const pageOne = el('equipment-window-prev');
        const pageTwo = el('equipment-window-next');
        pageOne.disabled = false;
        pageTwo.disabled = false;
        pageOne.classList.toggle('active', page === 0);
        pageTwo.classList.toggle('active', page === 1);
        pageOne.setAttribute('aria-pressed', page === 0 ? 'true' : 'false');
        pageTwo.setAttribute('aria-pressed', page === 1 ? 'true' : 'false');
    }

    function fitEquipmentWindowToViewport() {   // 嵌入模式唯一版型：貼齊 #tab-content-panel、寬度以 183×408 底圖比例夾擠
        const frame = el('equipment-window-frame');
        const win = el('equipment-window');
        if (!frame || !win || win.classList.contains('hidden')) return;
        const host = el('tab-content-panel');
        if (!host) return;
        let hostRect = host.getBoundingClientRect();
        const maxFrameWidth = 366;
        if (innerWidth <= 768) {
            const mobileFrameWidth = Math.min(hostRect.width, maxFrameWidth);
            const mobileHeight = Math.ceil(mobileFrameWidth * 408 / 183);
            host.style.setProperty('--equipment-panel-height', mobileHeight + 'px');
            hostRect = host.getBoundingClientRect();
        }
        const frameWidth = Math.max(0, Math.min(
            hostRect.width,
            maxFrameWidth,
            hostRect.height * 183 / 408
        ));
        win.style.left = hostRect.left + 'px';
        win.style.top = hostRect.top + 'px';
        win.style.right = 'auto';
        win.style.bottom = 'auto';
        win.style.width = hostRect.width + 'px';
        win.style.height = hostRect.height + 'px';
        frame.style.left = '50%';
        frame.style.top = '0';
        frame.style.setProperty('width', frameWidth + 'px', 'important');
        frame.style.transform = 'translateX(-50%)';
    }

    window.refreshEquipmentWindow = function () {
        const win = el('equipment-window');
        if (!win || win.classList.contains('hidden')) return;
        syncEquipmentBackground();
        renderStats();
        renderSlots();
    };

    window.setEquipmentPanelEmbedded = function (visible) {
        const win = el('equipment-window');
        if (!win) return;
        const host = el('tab-content-panel');
        if (host) {
            host.classList.toggle('equipment-panel-host', visible);
            if (!visible || innerWidth > 768) host.style.removeProperty('--equipment-panel-height');
            else host.style.setProperty('--equipment-panel-height', Math.ceil(Math.min(host.getBoundingClientRect().width, 366) * 408 / 183) + 'px');
        }
        win.classList.add('equipment-window-embedded');
        win.classList.toggle('hidden', !visible);
        win.setAttribute('aria-hidden', visible ? 'false' : 'true');
        if (!visible) return;
        if (innerWidth <= 768) {
            const scroller = el('game-screen');
            if (scroller && host) {
                const scrollerRect = scroller.getBoundingClientRect();
                const hostRect = host.getBoundingClientRect();
                if (hostRect.bottom > scrollerRect.bottom) scroller.scrollTop += hostRect.bottom - scrollerRect.bottom + 8;
                if (hostRect.top < scrollerRect.top) scroller.scrollTop -= scrollerRect.top - hostRect.top + 8;
            }
        }
        refreshEquipmentWindow();
        requestAnimationFrame(fitEquipmentWindowToViewport);
    };

    // 🗑️ 移除 window.openEquipmentWindow／window.toggleEquipmentWindow：
    //   v3.5.87 砍掉整組浮動視窗開關流程後兩者已零呼叫點（js/*.js、index.html/test.html 的 inline onclick、css/ 全域 Grep 皆無）。
    //   目前唯一活著的入口＝js/10-ui-tabs.js 直接呼叫 window.setEquipmentPanelEmbedded(布林)。

    function init() {
        const frame = el('equipment-window-frame');
        if (!frame) return;
        const win = el('equipment-window');
        if (win) win.classList.add('equipment-window-embedded');
        const background = frame.querySelector('.equipment-window-bg');
        if (background) {
            background.onerror = function () {
                this.onerror = null;
                this.src = 'public/assets/login/EQ%20UI/' + encodeURIComponent('原圖.png') + '?v=20260713';
            };
            syncEquipmentBackground();
        }
        el('equipment-window-prev').setAttribute('aria-label', '裝備第 1 頁');
        el('equipment-window-next').setAttribute('aria-label', '裝備第 2 頁');
        el('equipment-window-prev').onclick = function () { page = 0; refreshEquipmentWindow(); };
        el('equipment-window-next').onclick = function () { page = 1; refreshEquipmentWindow(); };
        window.addEventListener('resize', fitEquipmentWindowToViewport);
        const gameScroller = el('game-screen');
        if (gameScroller) gameScroller.addEventListener('scroll', fitEquipmentWindowToViewport, { passive: true });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();

function toggleEquipGuide() {
    let panel = document.getElementById('equip-guide-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'equip-guide-panel';
        panel.className = 'fixed inset-0 z-[200] flex items-center justify-center bg-black/60';
        panel.onclick = function(e) { if (e.target === panel) toggleEquipGuide(); };
        panel.innerHTML = '<div class="bg-slate-900 border border-slate-500 rounded-lg shadow-2xl w-[90vw] max-w-[700px] max-h-[85vh] flex flex-col"><div class="flex justify-between items-center p-4 border-b border-slate-600"><span class="text-xl font-bold text-sky-300">📖 裝備系統說明</span><button onclick="toggleEquipGuide()" class="text-slate-400 hover:text-white text-2xl leading-none">&times;</button></div><div id="equip-guide-body" class="overflow-y-auto p-4 text-sm text-slate-300 leading-relaxed space-y-4"></div></div>';
        document.body.appendChild(panel);
        let body = document.getElementById('equip-guide-body');
        body.innerHTML = _buildEquipGuideHTML();
    } else {
        panel.remove();
    }
}
function _buildEquipGuideHTML() {
    return `<h3 class="text-lg font-bold text-yellow-300">一、強化系統</h3>
<p>強化上限：<b>武器+30</b>、<b>防具+20</b>、<b>飾品+15</b></p>
<p>安定值：武器≤+6、防具≤+4、飾品≤+0（無安定）</p>
<p>成功率：武器+7→1/3、+9起→1/6成功/1/6無事/4/6爆裝；防具安定>0→1/目前強化值；防具安定=0/飾品→+0時1/2、+1起→1/(值×2)</p>
<p>祝福卷：+2以下+1~+3各1/3；+3~+5各+1~+2一半半；+6以上+1</p>
<p>詛咒卷：-1，100%成功，可降至-1</p>
<p>武器能力成長：+0~+10每階傷害+1命中+1；+11~+30傷害維持+10、命中最高+75</p>
<p>最終傷害倍率：+10 ×1.37、+20 ×2.50、+30 ×4.00</p>
<p>倍率依稀有度分級：權重1→×2.5、2~20→×2.25、21~50→×2.0、51~75→×1.75、76~100→×1.5；傳說一律×2.5</p>

<h3 class="text-lg font-bold text-yellow-300 mt-4">二、屬性附加</h3>
<p>武器附加火/水/風/地屬性：T1(之)60% / T3(中階)30% / T5(靈)10%</p>
<p>屬性相剋：火→地→風→水→火；剋×1.4、被剋×0.6</p>
<p>防具/飾品附加：對應抗性+1~3、MR+1~3</p>

<h3 class="text-lg font-bold text-yellow-300 mt-4">三、祝福/詛咒</h3>
<p><b>祝福的</b>：武器傷害+1命中+1魔力+2；防具AC-1 DR+1；飾品AC-1 MR+1</p>
<p><b>詛咒的</b>：效果反向</p>

<h3 class="text-lg font-bold text-yellow-300 mt-4">四、遠古系列</h3>
<p>遠古→永恆→不朽→太初</p>
<p>遠古：武器傷害+2魔傷+1、防具DR+2、飾品DR+1 MR+1</p>
<p>永恆：武器傷害+4、防具AC-2、飾品傷害+1 AC-1</p>
<p>不朽：武器命中+4、防具ER+2、飾品傷害+1命中+1</p>
<p>太初：武器魔傷+2、防具MR+4、飾品MR+2魔力+2</p>

<h3 class="text-lg font-bold text-yellow-300 mt-4">五、武器特效與標籤</h3>
<p>特效：穿透(pierce)、月光爆裂(moonburst)、即死(dice_death)、加速(haste)、重擊(crush)、切割(cleave)、雙擊(combo)、魔擊(magicstrike)、魔爆(magicburst)、吸取MP(mp_drain)、出血(bleed)</p>
<p>標籤：單手劍(反擊)、武士刀(居合)、匕首(出血)、矛(出血)、單手鈍器(鈍擊)、雙手鈍器(重擊)、雙手劍(切割)、雙刀(雙刃5%+雙擊25%)、鋼爪(重擊5%+雙擊33%)</p>
<p>特殊：鎖鏈劍弱點曝光12%/3層、吸取HP、貫穿(ignHardSkin)、紅/藍惡靈逆襲奪魔、連射、格檔、共鳴、施放魔法(procSkill)、免疫石化/中毒</p>

<h3 class="text-lg font-bold text-yellow-300 mt-4">六、套裝系統</h3>
<p><b>席琳套裝</b>(2/3/5件)：</p>
<p>紅獅：傷害+5魔力+3→DR+10→最終傷害+20%</p>
<p>白鳥：命中+5→魅力+10→受傷+20%</p>
<p>鐵衛：AC-3 DR+5→受傷-20%→反擊全體</p>
<p>麗人：近傷+3命中+3→近爆+3%→未命中堆疊命中</p>
<p>疾風：遠傷+3命中+3→遠爆+3%→連射30%→80%</p>
<p>月光：傷害+2命中+3→ER+5 MR+10→ER迴避魔攻</p>
<p>學徒：MP恢復+5魔力+6→魔爆+3%→MP<30%耗魔減半</p>
<p>魔女：魔傷+3→水抗+10魔力+5→5次共鳴免費冰雪暴</p>
<p>暗影：傷害+7→迴避恢復2%HP→雙擊額外傷害×2</p>
<p>幻覺：魔傷命中回MP→輔助耗MP-50%→追加同傷</p>
<p>龍血：吸血1%(HP<50%→5%)→龍裔受傷-15%→HP技+20%</p>
<p>狂怒：負重+500→最大HP+20%→每少10%HP造傷+4%/受傷-4%</p>

<h3 class="text-lg font-bold text-yellow-300 mt-4">七、裝備收藏(29類別)</h3>
<p>收集完整類別獲得永久加成。武器14類(MP/DR/HP/負重/MR/恢復等)、防具7類(DR/AC/MR/ER/HP/負重等)、飾品6類(恢復/MP/負重/命中/全屬性等)</p>

<h3 class="text-lg font-bold text-yellow-300 mt-4">八、其他系統</h3>
<p>遺物臂甲：強化+5/+7/+9門檻加成；relic:true無法強化/祝福</p>
<p>物品鎖定：🔒防販賣/拆除/合成消耗</p>
<p>廢品系統：靜置10分鐘自動販賣，廢品偏好記住簽章</p>
<p>販賣價格：基礎p×30%、詞綴×10、祝福×10、遠古×10、三者疊加最高×1000</p>
<p>唯一裝備(unique)：最多裝1個</p>`;
}
