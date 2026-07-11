// ===== 可拖曳雙頁角色裝備視窗 =====
(function () {
    const PAGE_SLOTS = [
        [
            { k: 'helm',    x: 76.2, y: 17.6, w: 11.6, h: 9.1 },
            { k: 'amulet',  x: 63.6, y: 23.5, w: 11.4, h: 9.2 },
            { k: 'tshirt',  x: 51.8, y: 35.8, w: 11.5, h: 9.4 },
            { k: 'armor',   x: 64.1, y: 35.4, w: 11.5, h: 9.4 },
            { k: 'cloak',   x: 76.4, y: 35.4, w: 11.5, h: 9.4 },
            { k: 'ring1',   x: 39.7, y: 46.4, w: 10.6, h: 8.7 },
            { k: 'wpn',     x: 39.9, y: 56.8, w: 11.4, h: 9.7 },
            { k: 'gloves',  x: 52.9, y: 53.4, w: 11.1, h: 9.1 },
            { k: 'belt',    x: 69.4, y: 45.6, w: 11.6, h: 9.1 },
            { k: 'shield',  x: 83.9, y: 49.0, w: 11.7, h: 9.7 },
            { k: 'ring2',   x: 83.0, y: 59.4, w: 11.5, h: 9.5 },
            { k: 'boots',   x: 82.3, y: 84.9, w: 11.8, h: 10.0 }
        ],
        [
            { k: 'ear1',    x: 63.6, y: 23.5, w: 11.4, h: 9.2 },
            { k: 'ear2',    x: 76.2, y: 17.6, w: 11.6, h: 9.1 },
            { k: 'ring3',   x: 39.7, y: 46.4, w: 10.6, h: 8.7 },
            { k: 'offwpn',  x: 51.8, y: 35.8, w: 11.5, h: 9.4 },
            { k: 'pet',     x: 52.9, y: 53.4, w: 11.1, h: 9.1 },
            { k: 'arrow',   x: 83.9, y: 49.0, w: 11.7, h: 9.7 },
            { k: 'ring4',   x: 83.0, y: 59.4, w: 11.5, h: 9.5 },
            { k: 'shin',    x: 69.4, y: 45.6, w: 11.6, h: 9.1 },
            { k: 'doll',    x: 82.3, y: 84.9, w: 11.8, h: 10.0 }
        ]
    ];

    let page = 0;
    let drag = null;
    let sideMode = null;
    let clickTimer = null;

    // 🎬 v3.0.44 變身立繪動畫（用戶提供 morph.spr）：這 15 個變身用 assets/morphanim/<名>/morph_N.png 逐幀循環（8fps），取代舊 assets/morph/<名>.jpg 靜態立繪。其餘變身維持 .jpg 退回鏈。
    // 🎬 v3.0.46 ①大小統一：以「炎魔」畫布高(191px)為基準像素比例——顯示高 = 帶高 × 本形態畫布高/191（炎魔=剛好填滿帶·其餘等比例縮·同一像素倍率）；
    //          ②三層疊放：morph_s(影子·multiply·墊底) + morph(本體) + morph_w(武器特效·screen·最上)——三者 --multi 共畫布→同 rect 疊放即像素級對齊。
    const MORPH_ANIM_PORTRAIT = new Set(['克特', '卡司特王', '思克巴女皇', '死亡騎士', '炎魔', '白金法師', '白金騎士', '艾莉絲', '銀光法師', '銀光騎士', '騎士范德', '黃金法師', '黃金騎士', '黑暗法師', '黑暗騎士',
        '亞力安', '人形殭屍', '侏儒', '哥布林', '地靈', '多羅', '妖魔', '妖魔弓箭手', '小惡魔', '巴列斯', '巴風特', '思克巴', '惡魔', '歐吉', '死亡', '狼人', '萊肯', '食人妖精王', '食屍鬼', '骷髏弓箭手', '骷髏斧手', '骷髏槍兵', '黑暗妖精刺客',   // 🧝 v3.0.50 +23 變身動態立繪
        '反王肯恩', '吸血鬼', '巨人', '白金巡守', '賽尼斯', '銀光巡守', '阿魯巴', '黃金巡守', '黑暗巡守', '黑暗精靈',   // 🧝 v3.0.52 +10 變身動態立繪
        '卡士柏', '史巴托', '妖魔巡守', '妖魔鬥士', '巨大牛人', '巴土瑟', '暴走兔', '果凍怪', '格利芬', '歐姆民兵', '獨眼巨人', '甘地妖魔', '石頭高崙', '紙人', '羅孚妖魔', '西瑪', '那魯加妖魔', '都達瑪拉妖魔', '重裝歐姆', '長老', '阿吐巴妖魔', '雪怪', '食人妖精', '馬庫爾', '骷髏', '黑暗妖精運送員', '黑長者', '黑騎士']);   // 🧝 v3.0.57 +28 變身動態立繪（合計 76＝POLY_TIERS 全形態·變身動畫全數到位）
    const MORPH_PORTRAIT_REF_H = 191;   // 炎魔 morph 畫布高＝基準（用戶：炎魔目前大小剛好）
    let _morphPortrait = { name: null, body: [], shadow: [], weapon: [], i: 0, timer: null, bandH: 0 };
    function _portraitLayers(image) {   // 影子/武器覆疊層（動態建立→index.html/test.html 免改）
        const box = image.parentElement;
        let sh = document.getElementById('equipment-morph-shadow');
        let wp = document.getElementById('equipment-morph-weapon');
        if (!sh) { sh = document.createElement('img'); sh.id = 'equipment-morph-shadow'; sh.alt = ''; sh.draggable = false; box.insertBefore(sh, image); }
        if (!wp) { wp = document.createElement('img'); wp.id = 'equipment-morph-weapon'; wp.alt = ''; wp.draggable = false; box.appendChild(wp); }
        // 🛡️ v3.0.51 關鍵定位樣式改 JS inline 設定（inline 優先於外部樣式表）：不依賴 floating-ui.css 是否為最新→根治「舊 CSS 快取使覆疊層 position:static→影子與本體垂直排開沒對到」。
        const baseCss = 'position:absolute;pointer-events:none;object-fit:contain;image-rendering:crisp-edges;image-rendering:pixelated;';
        if (sh.getAttribute('data-pmcss') !== '1') { sh.style.cssText = baseCss + 'mix-blend-mode:multiply;z-index:1;visibility:hidden;'; sh.setAttribute('data-pmcss', '1'); }
        if (wp.getAttribute('data-pmcss') !== '1') { wp.style.cssText = baseCss + 'mix-blend-mode:screen;z-index:3;visibility:hidden;'; wp.setAttribute('data-pmcss', '1'); }
        return { sh: sh, wp: wp };
    }
    function _syncPortraitLayerRect(image) {   // 覆疊層幾何 = 本體 img 的 offset box（共畫布→同 rect 即對齊）
        const sh = document.getElementById('equipment-morph-shadow');
        const wp = document.getElementById('equipment-morph-weapon');
        [sh, wp].forEach(l => { if (!l) return; l.style.left = image.offsetLeft + 'px'; l.style.top = image.offsetTop + 'px'; l.style.width = image.offsetWidth + 'px'; l.style.height = image.offsetHeight + 'px'; });
    }
    function _stopMorphPortrait() {
        if (_morphPortrait.timer) { clearInterval(_morphPortrait.timer); _morphPortrait.timer = null; }
        _morphPortrait.name = null; _morphPortrait.body = []; _morphPortrait.shadow = []; _morphPortrait.weapon = [];
        const sh = document.getElementById('equipment-morph-shadow'); if (sh) sh.style.visibility = 'hidden';
        const wp = document.getElementById('equipment-morph-weapon'); if (wp) wp.style.visibility = 'hidden';
    }
    function _startMorphPortrait(dir, image) {   // 逐號探測 morph_0..N（含 _s/_w）→ 8fps 三層同步循環
        _stopMorphPortrait();
        _morphPortrait.name = dir;
        image.classList.add('morph-anim-portrait');
        const base = 'assets/morphanim/' + encodeURIComponent(dir) + '/';
        let natH = 0, pending = 3;
        const seqs = { body: [], shadow: [], weapon: [] };
        const done = () => {
            if (--pending > 0 || _morphPortrait.name !== dir) return;
            _morphPortrait.body = seqs.body; _morphPortrait.shadow = seqs.shadow; _morphPortrait.weapon = seqs.weapon; _morphPortrait.i = 0;
            if (!seqs.body.length) { image.classList.remove('morph-anim-portrait'); image.classList.add('no-image'); return; }
            image.classList.remove('no-image');
            // 📏 大小統一：量測帶高（先還原 height 讀 flex 天然高·只量一次快取）→ 顯示高=帶高×natH/191（上限=帶高）
            if (!_morphPortrait.bandH) { image.style.height = ''; image.style.flex = ''; const bh = image.offsetHeight; if (bh > 20) _morphPortrait.bandH = bh; }
            if (_morphPortrait.bandH && natH > 0) {
                const targetH = Math.min(_morphPortrait.bandH, Math.round(_morphPortrait.bandH * natH / MORPH_PORTRAIT_REF_H));
                image.style.height = targetH + 'px'; image.style.flex = '0 0 auto'; image.style.margin = 'auto';
            }
            const L = _portraitLayers(image);
            image.src = seqs.body[0];
            const paint = () => {
                const i = _morphPortrait.i;
                image.src = seqs.body[i];
                if (seqs.shadow.length) { L.sh.style.visibility = 'visible'; L.sh.src = seqs.shadow[i < seqs.shadow.length ? i : i % seqs.shadow.length]; } else L.sh.style.visibility = 'hidden';
                if (seqs.weapon[i]) { L.wp.style.visibility = 'visible'; L.wp.src = seqs.weapon[i]; } else L.wp.style.visibility = 'hidden';   // 武器嚴格逐幀（本幀無→隱藏）
            };
            requestAnimationFrame(() => { _syncPortraitLayerRect(image); paint(); });
            _morphPortrait.timer = setInterval(() => {
                if (!_morphPortrait.body.length) return;
                _morphPortrait.i = (_morphPortrait.i + 1) % _morphPortrait.body.length;
                _syncPortraitLayerRect(image);   // 每幀順手同步幾何（視窗拖曳/縮放後仍對齊·讀 offset 便宜）
                paint();
            }, 125);
        };
        const probe = (pfx, arr, captureH) => {
            const step = (n) => {
                if (_morphPortrait.name !== dir) return;
                const im = new Image();
                im.onload = () => { if (captureH && n === 0) natH = im.naturalHeight; arr.push(base + pfx + n + '.png'); step(n + 1); };
                im.onerror = () => done();
                im.src = base + pfx + n + '.png';
            };
            step(0);
        };
        probe('morph_', seqs.body, true);
        probe('morph_s_', seqs.shadow, false);
        probe('morph_w_', seqs.weapon, false);
    }

    function el(id) { return document.getElementById(id); }
    function signed(n) { n = Number(n) || 0; return n > 0 ? '+' + n : String(n); }

    function renderStats() {
        if (typeof player === 'undefined' || !player || !player.d) return;
        const d = player.d;
        const expReq = getExpReq(player.lv);
        const expPct = player.lv >= 100 ? 100 : (expReq > 0 && isFinite(expReq) ? (player.exp / expReq) * 100 : 0);
        const values = [
            ['level', player.lv], ['exp', expPct.toFixed(2) + '%'],
            ['hp', `${Math.floor(player.hp)}/${Math.floor(player.mhp)}`],
            ['mp', `${Math.floor(player.mp)}/${Math.floor(player.mmp)}`],
            ['ac', player.d.ac], ['elixir', player.panaceaUsed || 0], ['pk', player.pk || 0],
            ['str', d.str], ['dex', d.dex], ['con', d.con], ['int', d.int], ['wis', d.wis], ['cha', d.cha],
            ['earth', Math.abs(Number(d.resEarth) || 0)], ['water', Math.abs(Number(d.resWater) || 0)],
            ['fire', Math.abs(Number(d.resFire) || 0)], ['wind', Math.abs(Number(d.resWind) || 0)],
            ['er', Math.abs(Number(d.er) || 0)]
        ];
        el('equipment-window-stats').innerHTML = values.map(([key, value]) =>
            `<span class="equipment-stat equipment-stat-${key}">${value}</span>`
        ).join('');
    }

    function renderMorphSnapshot() {
        const box = el('equipment-morph-snapshot');
        if (!box || typeof player === 'undefined' || !player) return;
        const form = player._setPoly || ((player.buffs && player.buffs.poly > 0 && player.poly) ? player.poly : null);
        if (!form) { _stopMorphPortrait(); const _im = el('equipment-morph-image'); if (_im) _im.setAttribute('data-morph', ''); box.classList.add('hidden'); return; }
        box.classList.remove('hidden');
        el('equipment-morph-name').textContent = form.n || '變身';
        const aliases = {
            '真‧死亡騎士':'死亡騎士', '真死亡騎士':'死亡騎士',
            '真‧克特':'克特', '真克特':'克特',
            '高等黑暗精靈':'黑暗精靈', '真‧黑暗妖精':'黑暗精靈', '真黑暗妖精':'黑暗精靈',
            '真‧黑暗精靈':'黑暗精靈', '真黑暗精靈':'黑暗精靈',
            // 🆕 v3.0.33 借用同族立繪的別名：本尊動畫部署後即移除（v3.0.50 刪 惡魔→小惡魔/黑暗妖精刺客→黑暗刺客·v3.0.52 刪 反王肯恩→反王肯特·v3.0.57 刪 暴走兔→曼波兔/重裝歐姆→歐姆＝本尊動畫已部署）。
            // ⚠️v3.0.35 古代黑/白銀/黃金/白金 騎士/搜索隊/法師 已改名為 黑暗/銀光/黃金/白金 巡守/騎士/法師（潔尼斯→賽尼斯）＝直接對應同名立繪，故移除其別名。
        };
        const rawName = (form.n || '').replace(/[()（）·‧\s]/g, '');
        const imageName = (aliases[form.n] || form.n || '').replace(/[()（）·‧\s]/g, '');
        const image = el('equipment-morph-image');
        // 🖼️ v3.0.33 圖片退回鏈＋只在「變身名稱改變」時重載：專屬立繪(assets/morph/*.jpg) → 該怪戰鬥動畫首幀(assets/anim/<原名>/idle_0.png) → 隱藏。
        //   守衛避免 500ms 定時刷新每次都把 src 重設回可能 404 的立繪 → 退回鏈重跑造成閃爍。
        if (image.getAttribute('data-morph') !== (form.n || '')) {
            image.setAttribute('data-morph', form.n || '');
            image.classList.remove('no-image');
            image.alt = form.n || '變身快照';
            if (MORPH_ANIM_PORTRAIT.has(imageName)) {   // 🎬 v3.0.44 動態立繪（morph.spr 幀循環）
                image.onerror = null;
                _startMorphPortrait(imageName, image);
            } else {   // 其餘：舊 .jpg → 動畫首幀 → 隱藏 退回鏈
                _stopMorphPortrait();
                image.classList.remove('morph-anim-portrait');
                image.style.height = ''; image.style.flex = ''; image.style.margin = '';   // 還原動態立繪的統一尺寸覆寫
                image.setAttribute('data-morphfb', 'assets/anim/' + encodeURIComponent(rawName) + '/idle_0.png');
                image.src = 'assets/morph/' + encodeURIComponent(imageName) + '.jpg';
                image.onerror = function () {
                    const fb = (this.getAttribute('data-morphfb') || '').split('|').filter(Boolean);
                    if (fb.length) { this.setAttribute('data-morphfb', fb.slice(1).join('|')); this.src = fb[0]; }
                    else { this.onerror = null; this.classList.add('no-image'); }
                };
            }
        }
        // 🚫 v3.0.34 用戶要求：只顯示變身「名稱＋圖片」，隱藏下方能力說明文字（之後放對應動態圖）。
        //   用 inline display:none 而非 class，避免 .equipment-morph-bonus{display:flex} 與 .hidden 誰後載入的層疊順序不確定。
        const bonus = el('equipment-morph-bonus');
        bonus.textContent = '';
        bonus.style.display = 'none';
    }

    function renderSlots() {
        if (typeof player === 'undefined' || !player || !player.eq) return;
        const host = el('equipment-window-slots');
        host.innerHTML = '';
        PAGE_SLOTS[page].forEach(pos => {
            const item = player.eq[pos.k];
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
                if (typeof isRelic === 'function' && isRelic(data)) img.classList.add('relic-glow');   // 🏺 已裝備遺物：藍光呼吸＋星芒（與背包一致）
                slot.appendChild(img);
                if (item.en) {
                    const badge = document.createElement('span');
                    badge.className = 'equipment-slot-enhance';
                    badge.textContent = '+' + item.en;
                    slot.appendChild(badge);
                }
                slot.classList.add('tip-host');
                slot.setAttribute('data-tip-uid', item.uid); slot.setAttribute('data-tip-src', 'eq');   // 🖱️ hover 即時顯示已裝備物品完整資訊 tooltip
                slot.onclick = function () {
                    clearTimeout(clickTimer);
                    clickTimer = setTimeout(function () {
                        openEquipmentSidePanel((data.type === 'wpn' || data.isArrow) ? 'weapons' : 'armors');
                    }, 230);
                };
                slot.ondblclick = function (event) {
                    clearTimeout(clickTimer);
                    event.preventDefault();
                    event.stopPropagation();
                    unequipItem(pos.k);
                };
            } else {
                slot.title = '尚未裝備';
                slot.onclick = function () {
                    openEquipmentSidePanel((pos.k === 'wpn' || pos.k === 'offwpn' || pos.k === 'arrow') ? 'weapons' : 'armors');
                };
            }
            host.appendChild(slot);
        });
        el('equipment-window-prev').disabled = page === 0;
        el('equipment-window-next').disabled = page === PAGE_SLOTS.length - 1;
    }

    function plainItemName(item) {
        const d = DB.items[item.id];
        const tmp = document.createElement('span');
        tmp.innerHTML = getItemFullName(item);
        return tmp.textContent || tmp.innerText || (d && d.n) || item.id;
    }

    function renderSidePanel() {
        const panel = el('equipment-side-panel');
        const list = el('equipment-side-list');
        if (!panel || panel.classList.contains('hidden') || !sideMode || typeof player === 'undefined') return;
        el('equipment-side-title').textContent = sideMode === 'weapons' ? '武器' : '防具與飾品';
        list.innerHTML = '';
        const items = player.inv.filter(function (item) {
            const d = DB.items[item.id];
            if (!d) return false;
            return sideMode === 'weapons' ? d.type === 'wpn' : (d.type === 'arm' || d.type === 'acc');
        });
        if (!items.length) {
            list.innerHTML = '<div class="equipment-side-empty">背包中沒有可顯示的裝備</div>';
            return;
        }
        items.forEach(function (item) {
            const d = DB.items[item.id];
            const row = document.createElement('button');
            row.type = 'button';
            row.className = 'equipment-side-item tip-host' + (checkCanEquip(item) ? '' : ' cannot-equip');
            row.setAttribute('data-tip-uid', item.uid); row.setAttribute('data-tip-src', 'inv');   // 🖱️ hover 即時顯示完整資訊 tooltip
            const icon = document.createElement('img');
            icon.src = getIconUrl(d);
            icon.alt = '';
            icon.draggable = false;
            icon.onerror = function () { this.style.visibility = 'hidden'; };
            const name = document.createElement('span');
            name.className = 'equipment-side-name ' + getItemColor(item);
            name.innerHTML = getItemFullName(item);
            const count = document.createElement('small');
            count.textContent = (item.cnt || 1) > 1 ? '×' + (item.cnt || 1).toLocaleString() : '';
            row.append(icon, name, count);
            row.onclick = function () {
                clearTimeout(clickTimer);
                clickTimer = setTimeout(function () { openModal(item, false); }, 230);
            };
            row.ondblclick = function (event) {
                clearTimeout(clickTimer);
                event.preventDefault();
                event.stopPropagation();
                equipItem(item);
            };
            list.appendChild(row);
        });
    }

    window.openEquipmentSidePanel = function (mode) {
        sideMode = mode === 'armors' ? 'armors' : 'weapons';
        const panel = el('equipment-side-panel');
        if (!panel) return;
        panel.classList.remove('hidden');
        const frame = el('equipment-window-frame');
        if (frame) frame.classList.add('side-open');
        renderSidePanel();
        requestAnimationFrame(fitEquipmentWindowToViewport);
    };

    window.closeEquipmentSidePanel = function () {
        const panel = el('equipment-side-panel');
        if (panel) panel.classList.add('hidden');
        const frame = el('equipment-window-frame');
        if (frame) frame.classList.remove('side-open');
        sideMode = null;
        requestAnimationFrame(fitEquipmentWindowToViewport);
    };

    function fitEquipmentWindowToViewport() {
        const frame = el('equipment-window-frame');
        const win = el('equipment-window');
        if (!frame || !win || win.classList.contains('hidden')) return;
        const rect = frame.getBoundingClientRect();
        const side = frame.classList.contains('side-open') ? el('equipment-side-panel') : null;
        const sideWidth = side && !side.classList.contains('hidden') ? side.getBoundingClientRect().width + 8 : 0;
        const totalWidth = rect.width + sideWidth;
        let left = rect.left, top = rect.top;
        left = Math.max(4, Math.min(left, innerWidth - totalWidth - 4));
        top = Math.max(4, Math.min(top, innerHeight - rect.height - 4));
        frame.style.left = left + 'px';
        frame.style.top = top + 'px';
        frame.style.transform = 'none';
    }

    window.refreshEquipmentWindow = function () {
        const win = el('equipment-window');
        if (!win || win.classList.contains('hidden')) return;
        renderStats();
        renderMorphSnapshot();
        renderSlots();
        renderSidePanel();
    };

    window.openEquipmentWindow = function () {
        const win = el('equipment-window');
        if (!win) return;
        win.classList.remove('hidden');
        win.setAttribute('aria-hidden', 'false');
        refreshEquipmentWindow();
        requestAnimationFrame(fitEquipmentWindowToViewport);
    };

    window.toggleEquipmentWindow = function () {
        const win = el('equipment-window');
        if (!win) return;
        if (win.classList.contains('hidden')) openEquipmentWindow();
        else closeEquipmentWindow();
    };

    window.closeEquipmentWindow = function () {
        const win = el('equipment-window');
        if (!win) return;
        win.classList.add('hidden');
        win.setAttribute('aria-hidden', 'true');
    };

    function init() {
        const frame = el('equipment-window-frame');
        const handle = el('equipment-window-drag');
        if (!frame || !handle) return;
        el('equipment-window-close').onclick = closeEquipmentWindow;
        el('equipment-side-close').onclick = closeEquipmentSidePanel;
        el('equipment-window-next').onclick = function () { if (page < 1) { page++; refreshEquipmentWindow(); } };
        el('equipment-window-prev').onclick = function () { if (page > 0) { page--; refreshEquipmentWindow(); } };

        handle.addEventListener('pointerdown', function (event) {
            const rect = frame.getBoundingClientRect();
            drag = { id: event.pointerId, dx: event.clientX - rect.left, dy: event.clientY - rect.top };
            handle.setPointerCapture(event.pointerId);
            frame.classList.add('is-dragging');
            event.preventDefault();
        });
        handle.addEventListener('pointermove', function (event) {
            if (!drag || drag.id !== event.pointerId) return;
            const side = frame.classList.contains('side-open') ? el('equipment-side-panel') : null;
            const sideWidth = side && !side.classList.contains('hidden') ? side.getBoundingClientRect().width + 8 : 0;
            const maxX = Math.max(0, innerWidth - frame.offsetWidth - sideWidth);
            const maxY = Math.max(0, innerHeight - frame.offsetHeight);
            frame.style.left = Math.max(0, Math.min(maxX, event.clientX - drag.dx)) + 'px';
            frame.style.top = Math.max(0, Math.min(maxY, event.clientY - drag.dy)) + 'px';
            frame.style.transform = 'none';
        });
        function stopDrag(event) {
            if (!drag || drag.id !== event.pointerId) return;
            drag = null;
            frame.classList.remove('is-dragging');
        }
        handle.addEventListener('pointerup', stopDrag);
        handle.addEventListener('pointercancel', stopDrag);
        window.addEventListener('resize', fitEquipmentWindowToViewport);
        // 純顯示更新：讓卷軸到期、重新變身或套裝切換能即時反映，不改動任何變身判定。
        window.setInterval(function () {
            const win = el('equipment-window');
            if (win && !win.classList.contains('hidden')) renderMorphSnapshot();
        }, 500);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();

// ===== 📖 裝備系統說明面板（內嵌於右側按鈕下方） =====
var _guideLoaded = false;
window.toggleEquipGuide = function () {
    var body = document.getElementById('equip-guide-body');
    var cont = document.getElementById('equip-guide-content');
    if (!body || !cont) return;
    if (cont.classList.contains('hidden')) {
        cont.classList.remove('hidden');
        cont.classList.add('flex');
        if (!_guideLoaded) {
            _guideLoaded = true;
            body.innerHTML = [
'<div class="space-y-4">',
'  <h3 class="text-sm font-bold text-sky-300 border-b border-slate-700 pb-1">一、強化系統</h3>',
'  <div class="text-xs space-y-1">',
'    <div><span class="text-amber-300 font-bold">強化上限</span>：武器 +30 / 防具 +20 / 飾品 +15</div>',
'    <div><span class="text-green-400 font-bold">安定值</span>：武器 ≤6 / 防具 ≤4 / 飾品 ≤0（100% 成功）</div>',
'    <div><span class="text-yellow-400 font-bold">武器</span>：+7~+8 1/3 成功 2/3 爆；+9 起 1/6 成功 1/6 無事 4/6 爆</div>',
'    <div><span class="text-yellow-400 font-bold">防具(安>0)</span>：成功率 = 1/en；<span class="text-yellow-400 font-bold">防具(安=0)/飾品</span>：+0 1/2，+1 起 1/(en×2)</div>',
'    <div><span class="text-cyan-300 font-bold">祝福卷</span>：+2 以下 +1~+3，+3~+5 +1~+2，+6 起 +1</div>',
'    <div><span class="text-purple-400 font-bold">詛咒卷</span>：強化 -1（100%），可降至 -1（紅變）</div>',
'    <div><span class="text-orange-300 font-bold">武器成長</span>：+0~+10 每階 dmg+1 hit+1；+11~+30 命中累積最高+75；最終倍率 +30×4.0</div>',
'    <div>強化方式：單次／一鍵到目標值／批次快速強化／詛咒降級</div>',
'  </div>',
'',
'  <h3 class="text-sm font-bold text-sky-300 border-b border-slate-700 pb-1">二、屬性附加</h3>',
'  <div class="text-xs space-y-1">',
'    <div>武器可附加火/水/風/地，T1(之)60% / T3(中階)30% / T5(靈)10%。</div>',
'    <table class="w-full text-xs border-collapse"><thead><tr class="text-amber-300"><th class="border border-slate-600 px-1 py-0.5">階</th><th class="border border-slate-600 px-1 py-0.5 text-red-400">火</th><th class="border border-slate-600 px-1 py-0.5 text-blue-400">水</th><th class="border border-slate-600 px-1 py-0.5 text-green-400">風</th><th class="border border-slate-600 px-1 py-0.5 text-amber-300">地</th></tr></thead><tbody>',
'    <tr><td class="border border-slate-600 px-1 py-0.5 font-bold">T1</td><td class="border border-slate-600 px-1 py-0.5">+1 剋地+6</td><td class="border border-slate-600 px-1 py-0.5">+1 剋火+6</td><td class="border border-slate-600 px-1 py-0.5">+1 剋水+6</td><td class="border border-slate-600 px-1 py-0.5">+1 剋風+6</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5 font-bold">T3</td><td class="border border-slate-600 px-1 py-0.5">+3 剋地+9</td><td class="border border-slate-600 px-1 py-0.5">+3 剋火+9</td><td class="border border-slate-600 px-1 py-0.5">+3 剋水+9</td><td class="border border-slate-600 px-1 py-0.5">+3 剋風+9</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5 font-bold">T5</td><td class="border border-slate-600 px-1 py-0.5">+5 剋地+12</td><td class="border border-slate-600 px-1 py-0.5">+5 剋火+12</td><td class="border border-slate-600 px-1 py-0.5">+5 剋水+12</td><td class="border border-slate-600 px-1 py-0.5">+5 剋風+12</td></tr>',
'    </tbody></table>',
'    <div>相剋：火→地→風→水→火。剋制 ×1.4，被剋 ×0.6。防具/飾品加對應抗性+1~3、MR+1~3。</div>',
'  </div>',
'',
'  <h3 class="text-sm font-bold text-sky-300 border-b border-slate-700 pb-1">三、祝福／詛咒</h3>',
'  <div class="text-xs space-y-1">',
'    <div><span class="text-yellow-400">祝福</span>：武器 dmg+1 hit+1 sp+2；防具 AC-1 DR+1；飾品 AC-1 MR+1</div>',
'    <div><span class="text-red-400">詛咒</span>：祝福的反向效果。碧恩 NPC 賦予／解除。</div>',
'  </div>',
'',
'  <h3 class="text-sm font-bold text-sky-300 border-b border-slate-700 pb-1">四、遠古系列（遠古→永恆→不朽→太初）</h3>',
'  <table class="w-full text-xs border-collapse"><thead><tr class="text-amber-300"><th class="border border-slate-600 px-1 py-0.5">階</th><th class="border border-slate-600 px-1 py-0.5">武器</th><th class="border border-slate-600 px-1 py-0.5">防具</th><th class="border border-slate-600 px-1 py-0.5">飾品</th></tr></thead><tbody>',
'    <tr><td class="border border-slate-600 px-1 py-0.5 font-bold">遠古</td><td class="border border-slate-600 px-1 py-0.5">dmg+2 魔傷+1</td><td class="border border-slate-600 px-1 py-0.5">DR+2</td><td class="border border-slate-600 px-1 py-0.5">DR+1 MR+1</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5 font-bold">永恆</td><td class="border border-slate-600 px-1 py-0.5">dmg+4</td><td class="border border-slate-600 px-1 py-0.5">AC-2</td><td class="border border-slate-600 px-1 py-0.5">dmg+1 AC-1</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5 font-bold">不朽</td><td class="border border-slate-600 px-1 py-0.5">hit+4</td><td class="border border-slate-600 px-1 py-0.5">ER+2</td><td class="border border-slate-600 px-1 py-0.5">dmg+1 hit+1</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5 font-bold">太初</td><td class="border border-slate-600 px-1 py-0.5">魔傷+2</td><td class="border border-slate-600 px-1 py-0.5">MR+4</td><td class="border border-slate-600 px-1 py-0.5">MR+2 sp+2</td></tr>',
'  </tbody></table>',
'',
'  <h3 class="text-sm font-bold text-sky-300 border-b border-slate-700 pb-1">五、武器特效與標籤</h3>',
'  <div class="grid grid-cols-2 gap-1 text-xs">',
'    <div><span class="text-rose-300">穿透</span>：無視防禦<br><span class="text-rose-300">月光爆裂</span>：範圍傷害<br><span class="text-rose-300">即死</span>：直接擊殺<br><span class="text-rose-300">重擊/切割</span>：降防+額外傷<br><span class="text-rose-300">雙擊(combo)</span>：額外攻擊(鋼爪33%/雙刀25%)<br><span class="text-rose-300">魔擊/魔爆</span>：魔法附加傷害</div>',
'    <div><span class="text-rose-300">出血</span>：持續傷害(匕首/矛)<br><span class="text-rose-300">紅惡靈逆襲</span>：4%水魔傷+吸血<br><span class="text-rose-300">藍惡靈奪魔</span>：4%回MP<br><span class="text-rose-300">連射</span>：遠距機率連射<br><span class="text-rose-300">格檔</span>：機率格檔<br><span class="text-rose-300">施放魔法</span>：命中觸發(克特/蕾雅等)</div>',
'    <div class="col-span-2 mt-1"><span class="text-amber-300">武器標籤內建</span>：反擊(單手劍)／居合(武士刀)／鈍擊(單手鈍器)／雙刃5%(雙刀)／重擊+5%(鋼爪)／弱點曝光(鎖鏈劍)／貫穿(暗黑十字弓)／吸取HP(嗜血者)</div>',
'  </div>',
'',
'  <h3 class="text-sm font-bold text-sky-300 border-b border-slate-700 pb-1">六、裝備品質</h3>',
'  <div class="text-xs">普通→高級→稀有→古代→傳說→遠古→神話</div>',
'',
'  <h3 class="text-sm font-bold text-sky-300 border-b border-slate-700 pb-1">七、席琳套裝（12 組 · 2/3/5 件）</h3>',
'  <div class="text-xs space-y-1">',
'    <div>掉落：一般 0.1%／恩賜 0.5%／頭目 5%。部位：武器/頭盔/盔甲/手套/靴/斗篷/盾+臂甲/腰帶。</div>',
'    <table class="w-full text-xs border-collapse"><thead><tr class="text-amber-300"><th class="border border-slate-600 px-1 py-0.5">套裝</th><th class="border border-slate-600 px-1 py-0.5">2件</th><th class="border border-slate-600 px-1 py-0.5">3件</th><th class="border border-slate-600 px-1 py-0.5">5件</th></tr></thead><tbody>',
'    <tr><td class="border border-slate-600 px-1 py-0.5 text-red-400 font-bold">紅獅</td><td class="border border-slate-600 px-1 py-0.5">dmg+5 sp+3</td><td class="border border-slate-600 px-1 py-0.5">DR+10</td><td class="border border-slate-600 px-1 py-0.5">最終傷+20%</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5 text-sky-300 font-bold">白鳥</td><td class="border border-slate-600 px-1 py-0.5">hit+5</td><td class="border border-slate-600 px-1 py-0.5">魅力+10</td><td class="border border-slate-600 px-1 py-0.5">攻擊脆弱+20%受傷</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5 text-slate-400 font-bold">鐵衛</td><td class="border border-slate-600 px-1 py-0.5">AC-3 DR+5</td><td class="border border-slate-600 px-1 py-0.5">受傷-20%</td><td class="border border-slate-600 px-1 py-0.5">受傷反擊全體</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5 text-pink-300 font-bold">麗人</td><td class="border border-slate-600 px-1 py-0.5">近dmg+3 hit+3</td><td class="border border-slate-600 px-1 py-0.5">近爆+3%</td><td class="border border-slate-600 px-1 py-0.5">未命中堆疊命中</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5 text-green-400 font-bold">疾風</td><td class="border border-slate-600 px-1 py-0.5">遠dmg+3 hit+3</td><td class="border border-slate-600 px-1 py-0.5">遠爆+3%</td><td class="border border-slate-600 px-1 py-0.5">連射30%→80%</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5 text-cyan-300 font-bold">月光</td><td class="border border-slate-600 px-1 py-0.5">dmg+2 hit+3</td><td class="border border-slate-600 px-1 py-0.5">ER+5 MR+10</td><td class="border border-slate-600 px-1 py-0.5">ER迴避魔法</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5 text-orange-300 font-bold">學徒</td><td class="border border-slate-600 px-1 py-0.5">MPR+5 sp+6</td><td class="border border-slate-600 px-1 py-0.5">魔爆+3%</td><td class="border border-slate-600 px-1 py-0.5">MP&lt;30%耗魔減半</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5 text-purple-400 font-bold">魔女</td><td class="border border-slate-600 px-1 py-0.5">魔傷+3</td><td class="border border-slate-600 px-1 py-0.5">水抗+10 sp+5</td><td class="border border-slate-600 px-1 py-0.5">5次共鳴→冰雪暴</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5 text-indigo-300 font-bold">暗影</td><td class="border border-slate-600 px-1 py-0.5">dmg+7</td><td class="border border-slate-600 px-1 py-0.5">迴避回2%HP</td><td class="border border-slate-600 px-1 py-0.5">雙擊傷×2</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5 text-rose-300 font-bold">幻覺</td><td class="border border-slate-600 px-1 py-0.5">魔傷回MP</td><td class="border border-slate-600 px-1 py-0.5">輔助耗MP-50%</td><td class="border border-slate-600 px-1 py-0.5">魔傷追加一次</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5 text-red-300 font-bold">龍血</td><td class="border border-slate-600 px-1 py-0.5">吸血1%(<50%→5%)</td><td class="border border-slate-600 px-1 py-0.5">龍裔受傷-15%</td><td class="border border-slate-600 px-1 py-0.5">HP技傷+20%</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5 text-orange-400 font-bold">狂怒</td><td class="border border-slate-600 px-1 py-0.5">負重+500</td><td class="border border-slate-600 px-1 py-0.5">MHP+20%</td><td class="border border-slate-600 px-1 py-0.5">HP少10%造傷+4%/受傷-4%</td></tr>',
'  </tbody></table>',
'  </div>',
'',
'  <h3 class="text-sm font-bold text-sky-300 border-b border-slate-700 pb-1">八、傳統套裝</h3>',
'  <table class="w-full text-xs border-collapse"><thead><tr class="text-amber-300"><th class="border border-slate-600 px-1 py-0.5">套裝</th><th class="border border-slate-600 px-1 py-0.5">件</th><th class="border border-slate-600 px-1 py-0.5">效果</th></tr></thead><tbody>',
'    <tr><td class="border border-slate-600 px-1 py-0.5">皮/歐西斯/銀釘</td><td class="border border-slate-600 px-1 py-0.5">4</td><td class="border border-slate-600 px-1 py-0.5">AC-3</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5">侏儒</td><td class="border border-slate-600 px-1 py-0.5">3</td><td class="border border-slate-600 px-1 py-0.5">AC-1 HP+5</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5">骷髏</td><td class="border border-slate-600 px-1 py-0.5">3</td><td class="border border-slate-600 px-1 py-0.5">AC-2 HP+10</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5">鋼鐵</td><td class="border border-slate-600 px-1 py-0.5">5</td><td class="border border-slate-600 px-1 py-0.5">AC-2 DR+2</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5">法師/抗魔</td><td class="border border-slate-600 px-1 py-0.5">2</td><td class="border border-slate-600 px-1 py-0.5">MP+50 / MR+5</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5">守護</td><td class="border border-slate-600 px-1 py-0.5">3</td><td class="border border-slate-600 px-1 py-0.5">AC-1</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5">死亡騎士/克特</td><td class="border border-slate-600 px-1 py-0.5">4</td><td class="border border-slate-600 px-1 py-0.5">AC-4 變身真死騎/真克特</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5">四大軍王</td><td class="border border-slate-600 px-1 py-0.5">4</td><td class="border border-slate-600 px-1 py-0.5">HP/MP+30 恢復+10 魅+3</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5">惡魔</td><td class="border border-slate-600 px-1 py-0.5">4</td><td class="border border-slate-600 px-1 py-0.5">AC-2 HPR+5 變身惡魔</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5">黑暗妖精</td><td class="border border-slate-600 px-1 py-0.5">3</td><td class="border border-slate-600 px-1 py-0.5">AC-3 力-2敏+2 變身高精</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5 font-bold text-amber-300" colspan="3">特殊套裝</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5">歐林西瑪</td><td class="border border-slate-600 px-1 py-0.5">2</td><td class="border border-slate-600 px-1 py-0.5">全屬+1 AC-5 HP+50</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5">冰之女王魅力</td><td class="border border-slate-600 px-1 py-0.5">3</td><td class="border border-slate-600 px-1 py-0.5">力+2魅+2 AC-5 HP+100 MPR+4 水抗+20</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5">寒冰</td><td class="border border-slate-600 px-1 py-0.5">3</td><td class="border border-slate-600 px-1 py-0.5">體+3 AC-5 HP+100 HPR+4 MPR+8 MR+15 水抗+20</td></tr>',
'    <tr><td class="border border-slate-600 px-1 py-0.5">藍海賊</td><td class="border border-slate-600 px-1 py-0.5">4</td><td class="border border-slate-600 px-1 py-0.5">智+1 AC-1 HP+10</td></tr>',
'  </tbody></table>',
'',
'  <h3 class="text-sm font-bold text-sky-300 border-b border-slate-700 pb-1">九、裝備收藏（29 類別）</h3>',
'  <div class="text-xs">收集完整類別內所有裝備獲得永久加成</div>',
'  <div class="grid grid-cols-2 gap-1 text-xs mt-1">',
'    <div><span class="text-amber-300">武器</span>：匕首MP+5／單手劍DR+1／雙手劍HP+10／武士刀HP+5／單手鈍器負重+10／雙手鈍器負重+10／矛MR+1／鋼爪HPR+1／雙刀DR+1／鎖鏈劍HP+5／弓ER+1／十字弓MR+1／魔杖MPR+1／奇古獸MP+5</div>',
'    <div><span class="text-amber-300">防具</span>：頭盔DR+1／盔甲AC-1／斗篷MR+1／長靴ER+1／手套DR+1／盾牌HP+10／臂甲負重+10<br><span class="text-amber-300">飾品</span>：項鍊HPR+1／戒指MPR+1／腰帶負重+20／耳環MPR+1／寵裝夥伴命中+1／娃娃全屬+1</div>',
'  </div>',
'',
'  <h3 class="text-sm font-bold text-sky-300 border-b border-slate-700 pb-1">十、遺物臂甲</h3>',
'  <div class="text-xs">門檻加成 +5/+7/+9，每強化+1 HP+10。遺物臂甲(relic)無法強化。</div>',
'',
'  <h3 class="text-sm font-bold text-sky-300 border-b border-slate-700 pb-1">十一、鎖定／廢品</h3>',
'  <div class="text-xs space-y-1">',
'    <div><span class="text-yellow-400">鎖定</span>：🔒 防止販賣/拆除/消耗</div>',
'    <div><span class="text-slate-400">廢品</span>：標記後10分鐘自動販賣，簽章記憶自動標記同類</div>',
'    <div><span class="text-slate-400">販賣價</span>：base p×30%，屬性/祝福/遠古各×10，最高×1000</div>',
'  </div>',
'</div>'
            ].join('\n');
        }
    } else {
        cont.classList.add('hidden');
        cont.classList.remove('flex');
    }
};
window.closeEquipGuide = function () {
    const panel = document.getElementById('equip-guide-panel');
    if (panel) panel.classList.add('hidden');
};
window.equipGuideBackdrop = function (event) {
    if (event.target === event.currentTarget) closeEquipGuide();
};
