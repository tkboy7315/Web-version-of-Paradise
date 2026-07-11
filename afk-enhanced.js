(function() {
'use strict';

var NAME = '[AFK-enhanced]';

// ===== 0. 確保 state.spd 存在 =====
try {
  if (typeof state !== 'undefined' && state && state.spd == null) state.spd = 1;
} catch(e) {}


// ===== 1. 強化上限放寬：wpn+30 / arm+20 / acc+15 =====
var AFK_ENHANCE_CAP = { wpn: 30, arm: 20, acc: 15 };

window.enhanceCap = function(d) {
  return (d && AFK_ENHANCE_CAP[d.type]) || 10;
};

window.capWpnEn = function(en) {
  return Math.min(Math.max(0, Number(en) || 0), AFK_ENHANCE_CAP.wpn);
};


// ===== 2. 最終傷害倍率表延伸至 +30 =====
var AFK_WPN_EN_FINALMULT = {
  1:1.02, 2:1.04, 3:1.06, 4:1.09, 5:1.12, 6:1.15, 7:1.19, 8:1.24, 9:1.30, 10:1.37,
  11:1.45, 12:1.53, 13:1.62, 14:1.72, 15:1.83, 16:1.95, 17:2.08, 18:2.21, 19:2.35, 20:2.50,
  21:2.65, 22:2.80, 23:2.95, 24:3.10, 25:3.25, 26:3.40, 27:3.55, 28:3.70, 29:3.85, 30:4.00
};

window.enhanceWpnFinalMult = function(en, def) {
  en = Math.max(0, Number(en) || 0);
  if (en <= 0) return 1;
  var base = AFK_WPN_EN_FINALMULT[Math.min(en, 30)] || 1;
  var cap = 2.5;
  if (typeof wpnEnCurveMax === 'function') cap = wpnEnCurveMax(def);
  return Math.min(base, cap);
};

window.wpnEnFinalMult = function(wpnInst) {
  return enhanceWpnFinalMult(wpnInst && wpnInst.en, wpnInst && DB.items[wpnInst.id]);
};


// ===== 3. 加速：動態包裝 gameLoop（支援 ×1～×10，適用於有/無 state.spd 的版本） =====
// 原理：在原始 gameLoop 前計算 elapsed 並預先加入 speed 對應的額外 tickDebt
var _origGL = window.gameLoop;
if (typeof _origGL === 'function') {
  window.gameLoop = function() {
    var spd = 1;
    try { spd = (typeof state !== 'undefined' && state) ? (state.spd || 1) : 1; } catch(e) {}
    if (spd > 1) {
      try {
        var now = performance.now();
        var elapsed = Math.min(now - (_loopLast || now), MAX_CATCHUP_MS || 5000);
        _tickDebt += elapsed * (spd - 1);
      } catch(e) {}
    }
    _origGL();
  };
}

window.setSpeed = function(v) {
  try { if (typeof state !== 'undefined' && state) state.spd = +v; } catch(e) {}
  var sel = document.getElementById('speed-select');
  if (sel) sel.value = v;
};

// 注入加速下拉選單（在 map-select 旁）
function _injectSpeedUI() {
  var mapSel = document.getElementById('map-select');
  if (!mapSel || !mapSel.parentNode) return;
  var parent = mapSel.parentNode;

  // 檢查是否已有加速 label 在 map-select 旁
  var existingLabel = mapSel.nextSibling;
  var hasLabel = existingLabel && existingLabel.nodeType === 1 && existingLabel.textContent === '加速';

  // 已有完整 UI → 略過
  var existingSel = document.getElementById('speed-select');
  if (existingSel && hasLabel) return;

  // 已有 dropdown 但缺 label → 補 label
  if (existingSel && !hasLabel) {
    var label = document.createElement('span');
    label.className = 'text-slate-300 text-base whitespace-nowrap';
    label.textContent = '加速';
    parent.insertBefore(label, existingSel);
    return;
  }

  // 都沒有 → 全部注入
  var label = document.createElement('span');
  label.className = 'text-slate-300 text-base whitespace-nowrap';
  label.textContent = '加速';

  var sel = document.createElement('select');
  sel.id = 'speed-select';
  sel.className = 'bg-slate-800 border border-slate-600 text-white px-2 py-1.5 text-base rounded outline-none';
  [1,2,3,4,5,10].forEach(function(v) {
    var opt = document.createElement('option');
    opt.value = String(v);
    opt.textContent = '\u00D7' + v;
    sel.appendChild(opt);
  });
  sel.onchange = function() { setSpeed(this.value); };

  parent.insertBefore(label, mapSel.nextSibling);
  parent.insertBefore(sel, mapSel.nextSibling);
}

function _tryInject() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _tryInject);
    return;
  }
  _injectSpeedUI();
}
_tryInject();

var _chk = setInterval(function() {
  if (document.getElementById('map-select') && !document.getElementById('speed-select')) _injectSpeedUI();
  if (document.getElementById('speed-select')) clearInterval(_chk);
}, 500);


// ===== 4. 工具提示強化：終傷倍率顯示 =====
var _origBuildDesc = window.buildItemDescHTML;
if (typeof _origBuildDesc === 'function') {
  window.buildItemDescHTML = function(item) {
    var html = _origBuildDesc(item);
    try {
      if (item && item.en > 0) {
        var d = DB.items[item.id];
        if (d) {
          var mult = enhanceWpnFinalMult(item.en, d);
          if (mult > 1 && html.indexOf('最終傷害') === -1) {
            html += '<br><span class="text-purple-300 font-bold">最終傷害倍率: ×' + mult.toFixed(2) + '</span>';
          }
        }
      }
    } catch(e) {}
    return html;
  };
}

console.log(NAME, 'hooks OK');

})();
