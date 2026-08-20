/* =========================================================
   个人日常生活工作台 · Vue3 纯前端 · 完全离线
   数据存浏览器 localStorage；Vue3 / 农历库均本地引入
   ========================================================= */
const { createApp, reactive, ref, computed, watch, onMounted, onUnmounted } = Vue;

/* ---------- 存储 ---------- */
const PREFIX = "lifeWB:";
const LS = {
  get(k, d) { try { const v = localStorage.getItem(PREFIX + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { localStorage.setItem(PREFIX + k, JSON.stringify(v)); },
};

/* 工作台全部数据键（本地 / 云端共用同一份结构） */
const KEYS = ["tasks", "memos", "memoCats", "plants", "sportProfile", "sportActs", "sport", "weights", "finance", "anniv", "babyProfile", "baby", "moods", "expressStart", "brainBest", "brainLast"];

/* 纯本地使用：数据存浏览器 localStorage，无需登录账号 */

/* ---------- 工具 ---------- */
const $ = (s, r = document) => r.querySelector(s);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = (n) => String(n).padStart(2, "0");
const fmtDate = (d) => { const x = new Date(d); return x.getFullYear() + "-" + pad(x.getMonth() + 1) + "-" + pad(x.getDate()); };
const fmtDateTime = (d) => { const x = new Date(d); return fmtDate(x) + " " + pad(x.getHours()) + ":" + pad(x.getMinutes()); };
const todayStr = () => fmtDate(new Date());
const parseD = (s) => { const a = String(s).split("-").map(Number); return new Date(a[0], a[1] - 1, a[2] || 1); };
const dayDiff = (a, b) => Math.round((new Date(a) - new Date(b)) / 86400000);
const addDays = (s, n) => { const d = new Date(s); d.setDate(d.getDate() + n); return fmtDate(d); };
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const sameDay = (ts, ds) => fmtDate(ts) === ds;

/* 农历 + 节气 */
function getLunar(date) {
  try {
    if (typeof Solar === "undefined") return { text: "", term: "" };
    const solar = Solar.fromDate(new Date(date));
    const l = solar.getLunar();
    const term = l.getJieQi ? l.getJieQi() : "";
    return {
      text: l.getMonthInChinese() + "月" + l.getDayInChinese(),
      full: l.getYearInChinese() + "年 " + l.getYearShengXiao() + " " + l.getYearInGanZhi(),
      term: term || "",
    };
  } catch (e) { return { text: "", term: "" }; }
}
/* 农历 → 公历（纪念日按农历录入用），返回 "yyyy-mm-dd" */
function lunarToSolar(y, m, d) {
  try {
    if (typeof Lunar === "undefined") return todayStr();
    return Lunar.fromYmd(+y, +m, +d).getSolar().toYmd();
  } catch (e) { return todayStr(); }
}
/* 纪念日倒计时目标公历日（全局唯一）：
   - 农历 + 不重复：按录入时选择的农历年对应公历日（固定那一天）
   - 农历 + 每年重复：按下一个到来的农历月日对应公历日
   - 公历 + 不重复：按录入的固定日期
   - 公历 + 每年重复：按今年/明年下一个到来
   纪念日模块列表、首页「最近纪念日」、日程管理区块、日历同步统一调用，保证各处完全一致。 */
function annivTargetDate(a) {
  if (a.lunar && a.lunar.m && a.lunar.d) {
    if (a.repeat === false) return lunarToSolar(a.lunar.y, a.lunar.m, a.lunar.d);
    const y = +todayStr().slice(0, 4);
    let cand = lunarToSolar(y, a.lunar.m, a.lunar.d);
    if (cand < todayStr()) cand = lunarToSolar(y + 1, a.lunar.m, a.lunar.d);
    return cand;
  }
  let d = parseD(a.date);
  if (a.repeat !== false) { const t = parseD(todayStr()); d.setFullYear(t.getFullYear()); if (d < t) d.setFullYear(t.getFullYear() + 1); }
  return fmtDate(d);
}
function annivDays(a) { return dayDiff(annivTargetDate(a), todayStr()); }

/* 线条小狗（马尔济斯）—— 奶油治愈主题吉祥物 */
const DOG_SVG = '<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M38 62 C30 62 26 72 27 84 C28 98 38 106 60 106 C82 106 92 98 93 84 C94 72 90 62 82 62 C76 62 74 66 60 66 C46 66 44 62 38 62 Z" fill="#FFF6EA" stroke="#8A6D5B" stroke-width="2.5" stroke-linejoin="round"/><path d="M36 72 C26 66 20 64 17 70 C14 76 18 80 24 78" stroke="#8A6D5B" stroke-width="2.5" stroke-linecap="round"/><path d="M44 100 C43 106 46 109 50 109 C54 109 55 106 54 101" fill="#FFF6EA" stroke="#8A6D5B" stroke-width="2.2" stroke-linejoin="round"/><path d="M66 101 C65 106 66 109 70 109 C74 109 77 106 76 100" fill="#FFF6EA" stroke="#8A6D5B" stroke-width="2.2" stroke-linejoin="round"/><circle cx="60" cy="40" r="27" fill="#FFF6EA" stroke="#8A6D5B" stroke-width="2.5"/><path d="M35 30 C28 20 22 22 24 31 C25 37 30 41 36 41" fill="#FFF6EA" stroke="#8A6D5B" stroke-width="2.5" stroke-linejoin="round"/><path d="M85 30 C92 20 98 22 96 31 C95 37 90 41 84 41" fill="#FFF6EA" stroke="#8A6D5B" stroke-width="2.5" stroke-linejoin="round"/><path d="M34 44 C36 52 44 56 60 56 C76 56 84 52 86 44" fill="none" stroke="#8A6D5B" stroke-width="2.5" stroke-linecap="round"/><circle cx="51" cy="37" r="2.6" fill="#5C4636"/><circle cx="69" cy="37" r="2.6" fill="#5C4636"/><ellipse cx="60" cy="44" rx="3" ry="2.4" fill="#5C4636"/><path d="M60 46.4 V49 M56.5 48 C57.5 50.5 62.5 50.5 63.5 48" stroke="#5C4636" stroke-width="1.6" stroke-linecap="round"/><path d="M57.5 49.5 C57 52 63 52 62.5 49.5" fill="#F7C7CF"/><ellipse cx="44" cy="43" rx="3.2" ry="2" fill="#FBD9C4" opacity=".8"/><ellipse cx="76" cy="43" rx="3.2" ry="2" fill="#FBD9C4" opacity=".8"/><path d="M44 55 C48 60 72 60 76 55" stroke="#D9B98A" stroke-width="3" stroke-linecap="round" fill="none"/></svg>';

/* 功能图标集：每个模块一眼可识别的图标 */
const ICON_SVGS = {
  home: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 10.5 L12 4 L20 10.5" stroke="#C79A6B" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.5 9 V19.5 H17.5 V9" stroke="#C79A6B" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 19.5 V14 H14 V19.5" stroke="#C79A6B" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  tasks: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4.5" y="6" width="15" height="14" rx="2.5" stroke="#E8A87C" stroke-width="1.7"/><path d="M9 3.5 V6 M15 3.5 V6 M4.5 10.5 H19.5" stroke="#E8A87C" stroke-width="1.7" stroke-linecap="round"/><path d="M9.5 15.5 L12 18 L15.5 13.5" stroke="#E8A87C" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  memo: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.5 3.5 H15 L19.5 8 V20.5 H6.5 Z" stroke="#D9A05B" stroke-width="1.7" stroke-linejoin="round"/><path d="M15 3.5 V8 H19.5" stroke="#D9A05B" stroke-width="1.7" stroke-linejoin="round"/><path d="M9.5 12 H15.5 M9.5 15.5 H15.5 M9.5 19 H12.5" stroke="#D9A05B" stroke-width="1.7" stroke-linecap="round"/></svg>',
  anniv: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 19.5 C6.5 15 4.5 11.5 5 8.5 C5.5 6 7.5 5 9.5 5.5 C10.8 5.8 11.6 6.5 12 7.5 C12.4 6.5 13.2 5.8 14.5 5.5 C16.5 5 18.5 6 19 8.5 C19.5 11.5 17.5 15 12 19.5 Z" stroke="#E08A80" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  finance: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8.5" stroke="#B8863B" stroke-width="1.7"/><path d="M9 7.5 L12 14.5 L15 7.5 M8.5 11 H15.5 M9.8 17 H14.2" stroke="#B8863B" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  sport: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3.5" y="9.5" width="3.2" height="5" rx="1.2" stroke="#DD7A6C" stroke-width="1.7"/><rect x="17.3" y="9.5" width="3.2" height="5" rx="1.2" stroke="#DD7A6C" stroke-width="1.7"/><path d="M6.7 11.4 H17.3 M6.7 12.6 H17.3" stroke="#DD7A6C" stroke-width="2.4" stroke-linecap="round"/></svg>',
  plants: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 12.5 H15 L14 19.5 H10 Z" stroke="#5FA98A" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 12 V8.5" stroke="#5FA98A" stroke-width="1.7" stroke-linecap="round"/><path d="M12 8.5 C9.8 8.5 8.5 6.5 9 4 C11.2 4.3 12 6 12 8.5 M12 8.5 C14.2 8.5 15.5 6.5 15 4 C12.8 4.3 12 6 12 8.5" stroke="#5FA98A" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  baby: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="8.5" width="8" height="10.5" rx="3.2" stroke="#F0A8B8" stroke-width="1.7"/><path d="M10 8.5 V5.8 H14 V8.5 M9 3.2 H15" stroke="#F0A8B8" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.8 12.5 H11 M9.8 15.5 H11" stroke="#F0A8B8" stroke-width="1.7" stroke-linecap="round"/></svg>',
  express: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 5.5 H20 V14 H13.5 L9 18.5 V14 H4 Z" stroke="#7FA8D9" stroke-width="1.7" stroke-linejoin="round"/><circle cx="8.3" cy="9.8" r="0.45" fill="#7FA8D9"/><circle cx="12" cy="9.8" r="0.45" fill="#7FA8D9"/><circle cx="15.7" cy="9.8" r="0.45" fill="#7FA8D9"/></svg>',
  brain: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3.5 C8.8 3.5 6.5 6 6.5 8.8 C6.5 11 8 12.3 8.8 13.3 C9.6 14.3 9.8 15.2 9.9 16 H14.1 C14.2 15.2 14.4 14.3 15.2 13.3 C16 12.3 17.5 11 17.5 8.8 C17.5 6 15.2 3.5 12 3.5 Z" stroke="#B08FD0" stroke-width="1.7" stroke-linejoin="round"/><path d="M10 18 H14 M10.3 20 H13.7" stroke="#B08FD0" stroke-width="1.7" stroke-linecap="round"/><path d="M12 6.5 C10.8 6.8 10 7.8 10 9" stroke="#B08FD0" stroke-width="1.5" stroke-linecap="round"/></svg>',
};
function iconSvg(name) {
  return ICON_SVGS[name] || ICON_SVGS.home;
}
/* 模块 → Hello Kitty PNG 图标（log/ 文件夹，加版本号强制刷新缓存） */
const HK_ICONS = { home: "icons/首页.png?v=20260811de", tasks: "icons/日程管理.png?v=20260811de", memo: "icons/备忘录.png?v=20260811de", anniv: "icons/纪念日.png?v=20260811de", finance: "icons/理财管理.png?v=20260811de", sport: "icons/减脂管理.png?v=20260811de", plants: "icons/我的植物.png?v=20260811de", baby: "icons/宝宝养育.png?v=20260811de", express: "icons/表达能力.png?v=20260811de", brain: "icons/前额叶训练.png?v=20260811de" };
function iconFor(name) { return HK_ICONS[name] || HK_ICONS.home; }

/* SVG 环形图 */
function svgPie(data) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, e) => s + e[1], 0) || 1;
  const colors = ["#5fa98a", "#7fc8b0", "#d99a4e", "#dd7a6c", "#7fa8d9", "#b08fd0", "#e0b85a", "#8ac9a0"];
  const R = 58, cx = 68, cy = 68; let ang = -Math.PI / 2; const parts = [];
  entries.forEach((e, i) => {
    const frac = e[1] / total; const a2 = ang + frac * Math.PI * 2;
    const x1 = cx + R * Math.cos(ang), y1 = cy + R * Math.sin(ang);
    const x2 = cx + R * Math.cos(a2), y2 = cy + R * Math.sin(a2);
    const large = frac > 0.5 ? 1 : 0;
    parts.push('<path d="M' + cx + ',' + cy + ' L' + x1.toFixed(2) + ',' + y1.toFixed(2) + ' A' + R + ',' + R + ' 0 ' + large + ' 1 ' + x2.toFixed(2) + ',' + y2.toFixed(2) + ' Z" fill="' + colors[i % colors.length] + '" stroke="#fff" stroke-width="1.5"></path>');
    ang = a2;
  });
  const legend = entries.map((e, i) => '<span><i class="dot" style="background:' + colors[i % colors.length] + '"></i>' + esc(e[0]) + " " + Math.round(e[1] / total * 100) + "%</span>").join("");
  return '<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><svg width="136" height="136" viewBox="0 0 136 136">' + parts.join("") + '</svg><div class="legend" style="flex-direction:column;margin:0">' + legend + "</div></div>";
}

/* SVG 折线图（x 为月数或时间戳） */
function svgLine(series, colors, xLabel) {
  const all = []; Object.values(series).forEach((a) => a.forEach((p) => all.push(p)));
  if (!all.length) return "";
  const W = 560, H = 210, padL = 38, padB = 28, padT = 12, padR = 14;
  const xs = all.map((p) => p.x); const xmin = Math.min(...xs), xmax = Math.max(...xs);
  const ymax = Math.max(...all.map((p) => p.y)) * 1.12 || 1; const ymin = 0;
  const sx = (x) => padL + (xmax === xmin ? (W - padL - padR) / 2 : (x - xmin) / (xmax - xmin) * (W - padL - padR));
  const sy = (y) => H - padB - (y - ymin) / (ymax - ymin) * (H - padT - padB);
  let grid = "";
  for (let i = 0; i <= 4; i++) { const y = padT + i * (H - padT - padB) / 4; const val = Math.round(ymax * (1 - i / 4)); grid += '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '" stroke="#eef2f0"></line><text x="4" y="' + (y + 4) + '" font-size="10" fill="#a2b1aa">' + val + "</text>"; }
  let paths = "";
  Object.keys(series).forEach((k) => {
    const arr = series[k]; if (!arr.length) return;
    const d = arr.map((p, i) => (i ? "L" : "M") + sx(p.x).toFixed(1) + "," + sy(p.y).toFixed(1)).join(" ");
    let c = colors[k] || "#5fa98a"; let dash = ""; let noDot = false;
    if (typeof c === "string") { const parts = c.split("|"); if (parts.length > 1) { c = parts[0]; dash = parts[1]; noDot = true; } }
    paths += '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="2.5"' + (dash ? ' stroke-dasharray="' + dash + '"' : "") + "></path>";
    if (!noDot) arr.forEach((p) => { paths += '<circle cx="' + sx(p.x).toFixed(1) + '" cy="' + sy(p.y).toFixed(1) + '" r="3.3" fill="' + c + '"></circle>'; });
  });
  const lg = Object.keys(series).map((k) => { const c0 = (colors[k] || "#5fa98a").split("|")[0]; return '<span><i class="dot" style="background:' + c0 + '"></i>' + k + "</span>"; }).join("");
  const xl = xLabel ? '<text x="' + (W - padR) + '" y="' + (H - 6) + '" font-size="10" fill="#a2b1aa" text-anchor="end">' + xLabel + "</text>" : "";
  return '<svg width="100%" viewBox="0 0 ' + W + " " + H + '">' + grid + paths + xl + '</svg><div class="legend">' + lg + "</div>";
}

/* ---------- 全局状态 ---------- */
const state = reactive({
  tasks: [],
  moods: {},
  memos: [],
  memoCats: [],
  plants: [],
  sportProfile: { sex: "男", height: 170, age: 30, weight: 65, bmr: 0 },
  sportActs: [],
  sport: [],
  weights: [],
  finance: [],
  anniv: [],
  babyProfile: { name: "", birth: "" },
  baby: [],
  expressStart: "",
  brainBest: null,
  brainLast: null,
});

const SLOGANS = ["今天也要好好生活 🌿", "慢慢来，比较快", "把日子过成自己喜欢的样子", "一草一木，皆是生活", "记录，是对生活最好的回应", "微小而确定的幸福", "好好吃饭，好好睡觉，好好爱你", "日子清净，抬头见喜"];

let toastTimer = null;
const toastMsg = ref("");
function showToast(m) { toastMsg.value = m; clearTimeout(toastTimer); toastTimer = setTimeout(() => (toastMsg.value = ""), 1800); }

/* 首次进入：全部从空开始，不做任何预置数据（用户手动录入） */
function seedIfEmpty() {
  if (LS.get("seeded")) return;
  state.tasks = [];
  state.memoCats = [];
  state.memos = [];
  state.plants = [];
  state.sportActs = SPORT_ACTS_BUILTIN.map((a) => ({ id: uid(), name: a.name, kcalPerMin: a.kcalPerMin, custom: false }));
  state.sport = [];
  state.finance = [];
  state.anniv = [];
  state.babyProfile = {};
  state.baby = [];
  LS.set("seeded", true);
}


/* 载入已有数据 */
function loadAll() {
  KEYS.forEach((k) => { const v = LS.get(k, null); if (v != null) state[k] = v; });
}
function saveAll() {
  KEYS.forEach((k) => LS.set(k, state[k])); // 始终写本地缓存
}

/* 老用户迁移：把缺失的内置运动项目补进 sportActs */
function ensureSportActs() {
  const have = new Set(state.sportActs.map((a) => a.name));
  SPORT_ACTS_BUILTIN.forEach((a) => { if (!have.has(a.name)) state.sportActs.push({ id: uid(), name: a.name, kcalPerMin: a.kcalPerMin, custom: false }); });
}

/* 同步：开了「同步到待办」的备忘录 + 所有纪念日 → 自动生成日程管理待办（显示在日历）
   src 标记来源，重建时保留已完成状态 */
function syncPlanTasks() {
  const old = {};
  state.tasks.forEach((t) => { if (t.src) old[t.src + ":" + t.srcId] = t; });
  const out = state.tasks.filter((t) => !t.src);
  const add = (key, src, srcId, title, note, due, short) => {
    const o = old[key];
    out.push({ id: o ? o.id : uid(), title, short: short || (o && o.short) || "", note, due, priority: "普通", done: o ? !!o.done : false, src, srcId, createdAt: o ? o.createdAt : Date.now() });
  };
  state.memos.forEach((m) => { if (m.syncTask && m.due) add("memo:" + m.id, "memo", m.id, "📝 " + (m.title || "备忘"), m.content ? m.content.slice(0, 40) : "", m.due, m.title ? m.title.slice(0, 8) : "备忘"); });
  state.anniv.forEach((a) => {
    if (!a.date) return;
    const due = annivTargetDate(a); // 与倒计时口径一致：农历不重复按所选农历年、公历不重复按固定日
    add("anniv:" + a.id, "anniv", a.id, "🎈 " + (a.name || "纪念日"), a.type || "", due, a.name ? a.name.slice(0, 8) : "纪念日");
  });
  state.tasks = out;
}

/* =========================================================
   账号登录 + 云端同步（Supabase 方案，当前已停用）
   - 认证：Supabase Auth REST API（/auth/v1）
   - 数据：PostgREST（/rest/v1），需建表 wb_data(uid, data)
   - 配置：SUPA_URL / SUPA_ANON 填你的 Supabase 项目地址与 anon key
   - 启用：把 AUTH_ENABLED 改为 true，并在 index.html 填好 Supabase 配置
   ========================================================= */
const AUTH_ENABLED = true; // ← 登录功能总开关
const SUPA_URL = (typeof SUPABASE_URL !== "undefined" && SUPABASE_URL) ? SUPABASE_URL : "";
const SUPA_ANON = (typeof SUPABASE_ANON_KEY !== "undefined" && SUPABASE_ANON_KEY) ? SUPABASE_ANON_KEY : "";
const authState = reactive({ user: null, token: "", refreshToken: "" });
(function initAuth() {
  try { const a = JSON.parse(localStorage.getItem("lifeWB:auth") || "null"); if (a && a.token) { authState.user = a.user || null; authState.token = a.token; authState.refreshToken = a.refreshToken || ""; } } catch (e) {}
})();
function persistAuth() {
  localStorage.setItem("lifeWB:auth", JSON.stringify(authState.token ? { user: authState.user, token: authState.token, refreshToken: authState.refreshToken } : null));
}
/* 用 refresh_token 刷新 access_token（JWT 过期时自动调用） */
let refreshing = null; // 防止并发刷新
async function refreshToken() {
  if (!authState.refreshToken) throw new Error("登录已过期，请重新登录");
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const j = await supaFetch("/auth/v1/token?grant_type=refresh_token", "POST", { refresh_token: authState.refreshToken }, true);
      authState.token = j.access_token;
      if (j.refresh_token) authState.refreshToken = j.refresh_token;
      persistAuth();
      return j.access_token;
    } finally { refreshing = null; }
  })();
  return refreshing;
}
function supaHeaders(anon) {
  const h = { "apikey": SUPA_ANON, "Content-Type": "application/json" };
  if (SUPA_ANON) h["Authorization"] = "Bearer " + (anon ? SUPA_ANON : authState.token);
  return h;
}
async function supaFetch(path, method, body, anon, extra) {
  if (!SUPA_URL || !SUPA_ANON) throw new Error("请先在 index.html 配置 Supabase 地址与 anon key");
  const headers = supaHeaders(anon);
  if (extra) Object.keys(extra).forEach((k) => { headers[k] = extra[k]; });
  const res = await fetch(SUPA_URL + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  let j = null;
  try { j = await res.json(); } catch (e) {}
  /* JWT 过期 → 自动刷新 token 重试一次（仅对需认证的请求） */
  if (!res.ok && !anon && res.status === 401 && (j && (j.error_description || "").indexOf("expired") !== -1)) {
    try { await refreshToken(); } catch(e2) { /* refresh 也失败 → 抛原始错误 */ }
    const h2 = supaHeaders(anon);
    if (extra) Object.keys(extra).forEach((k) => { h2[k] = extra[k]; });
    const r2 = await fetch(SUPA_URL + path, { method, headers: h2, body: body === undefined ? undefined : JSON.stringify(body) });
    let j2 = null;
    try { j2 = await r2.json(); } catch (e) {}
    if (!r2.ok) {
      const msg = (j2 && (j2.error_description || j2.msg || j2.message)) || (j2 && j2.error) || ("请求失败(" + r2.status + ")");
      throw new Error(String(msg));
    }
    return j2;
  }
  if (!res.ok) {
    const msg = (j && (j.error_description || j.msg || j.message)) || (j && j.error) || ("请求失败(" + res.status + ")");
    throw new Error(String(msg));
  }
  return j;
}
/* 账号归一化：输入"账号或邮箱"，账号自动转成虚拟邮箱（编码@wb.local），Supabase 底层仍按邮箱认证 */
function normAccount(acc) {
  const a = (acc || "").trim();
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a)) return a; // 已像邮箱：直接用
  return encodeURIComponent(a).replace(/%/g, "_").toLowerCase() + "@wb.local"; // 账号 → 编码虚拟邮箱（唯一、可复现）
}
/* 注册：账号/邮箱 + 密码（Confirm email 已关闭，注册即登录） */
async function authRegister(acc, password) {
  const j = await supaFetch("/auth/v1/signup", "POST", { email: normAccount(acc), password }, true);
  authState.user = { id: j.user.id, username: (acc || "").trim() }; authState.token = j.access_token; authState.refreshToken = j.refresh_token || ""; persistAuth(); return authState.user;
}
/* 登录：账号/邮箱 + 密码 */
async function authLogin(acc, password) {
  const j = await supaFetch("/auth/v1/token?grant_type=password", "POST", { email: normAccount(acc), password }, true);
  authState.user = { id: j.user.id, username: (acc || "").trim() }; authState.token = j.access_token; authState.refreshToken = j.refresh_token || ""; persistAuth(); return authState.user;
}
function authLogout() { authState.user = null; authState.token = ""; authState.refreshToken = ""; persistAuth(); }
/* 修改密码（需已登录；Supabase 返回 200 但邮箱会收到改密确认链接，用 manage 方式需要 service key） */
async function authChangePw(newPassword) {
  return supaFetch("/auth/v1/user", "PUT", { password: newPassword });
}
/* 上传：本地 → 云端（upsert 到 wb_data 表，按 uid 一行） */
async function syncPush() {
  const data = {};
  KEYS.forEach((k) => (data[k] = state[k]));
  const body = { uid: authState.user.id, data, updated_at: new Date().toISOString() };
  const j = await supaFetch("/rest/v1/wb_data?on_conflict=uid", "POST", body, false, { "Prefer": "resolution=merge-duplicates, return=representation" });
  if (Array.isArray(j)) return { ok: true };
  if (j && (j.code || j.message)) throw new Error("上传失败：" + (j.message || j.code));
  return { ok: true };
}
/* 下载：云端 → 本地（覆盖，保留同步来源待办重建） */
async function syncPull() {
  const j = await supaFetch("/rest/v1/wb_data?uid=eq." + encodeURIComponent(authState.user.id) + "&select=*", "GET");
  const row = Array.isArray(j) ? j[0] : null;
  if (!row || !row.data) throw new Error("云端暂无数据，先上传一次");
  Object.keys(row.data).forEach((k) => { if (state[k] !== undefined) state[k] = row.data[k]; });
  syncPlanTasks(); return { ok: true };
}


/* =========================================================
   组件：Modal
   ========================================================= */
const Modal = {
  props: { show: Boolean, title: String },
  emits: ["close"],
  template: `<div class="modal-mask" v-if="show" @click.self="$emit('close')">
    <div class="modal"><div class="modal-head"><span>{{title}}</span><button class="modal-close" @click="$emit('close')">✕</button></div>
    <div class="modal-body"><slot/></div></div></div>`,
};

/* =========================================================
   组件：首页仪表盘
   ========================================================= */
const Dashboard = {
  setup() {
    const now = ref(new Date());
    const timer = setInterval(() => (now.value = new Date()), 60000);
    onUnmounted(() => clearInterval(timer));
    const slogan = ref(SLOGANS[Math.floor(Math.random() * SLOGANS.length)]);
    const hintShow = ref(true); // 手机端菜单引导提示

    const lunar = computed(() => getLunar(now.value));
    const week = "日一二三四五六"[now.value.getDay()];
    const dateText = computed(() => { const p = fmtDate(now.value).split("-"); return p[0] + "年" + p[1] + "月" + p[2] + "日"; });

    const tasksActive = computed(() => state.tasks.filter((t) => !t.done).length);
    const tasksToday = computed(() => state.tasks.filter((t) => !t.done && t.due === todayStr()).length);
    const tasksOverdue = computed(() => state.tasks.filter((t) => !t.done && t.due && t.due < todayStr()).length);

    const plantsTotal = computed(() => state.plants.length);
    const plantsNeed = computed(() => state.plants.filter((p) => {
      const nw = p.lastWater ? dayDiff(addDays(p.lastWater, plantWaterDays(p)), todayStr()) : 0;
      const nf = p.lastFertilize ? dayDiff(addDays(p.lastFertilize, p.fertilizeInterval || 30), todayStr()) : 0;
      return nw <= 0 || nf <= 0;
    }).length);

    const sportToday = computed(() => {
      const recs = state.sport.filter((r) => r.date === todayStr());
      const burn = recs.filter((r) => r.kind === "exercise").reduce((s, r) => s + (+r.calories || 0), 0);
      const dur = recs.filter((r) => r.kind === "exercise").reduce((s, r) => s + (+r.duration || 0), 0);
      const intake = recs.filter((r) => r.kind === "food").reduce((s, r) => s + (+r.calories || 0), 0);
      const deficit = (state.sportProfile.bmr || 0) + burn - intake;
      return { burn, dur, intake, deficit };
    });

    const finMonth = computed(() => {
      const ym = todayStr().slice(0, 7);
      const inc = state.finance.filter((r) => r.type === "income" && r.date.slice(0, 7) === ym).reduce((s, r) => s + (+r.amount || 0), 0);
      const exp = state.finance.filter((r) => r.type === "expense" && r.date.slice(0, 7) === ym).reduce((s, r) => s + (+r.amount || 0), 0);
      const tInc = state.finance.filter((r) => r.type === "income" && r.date === todayStr()).reduce((s, r) => s + (+r.amount || 0), 0);
      const tExp = state.finance.filter((r) => r.type === "expense" && r.date === todayStr()).reduce((s, r) => s + (+r.amount || 0), 0);
      return { inc, exp, bal: inc - exp, tInc, tExp };
    });

    const annivNear = computed(() => state.anniv.map((a) => ({ ...a, days: annivDays(a) })).sort((x, y) => x.days - y.days).slice(0, 3));

    /* 宝宝成长曲线（体重/身高/头围 × 月龄，与宝宝养育一致，含国标 P50 中位虚线） */
    function babyMonthsAt(ts) { if (!state.babyProfile.birth) return 0; return Math.floor(dayDiff(fmtDate(ts), state.babyProfile.birth) / 30.44); }
    const growthChart = computed(() => {
      const ser = { 体重: [], 身高: [], 头围: [] };
      state.baby.forEach((r) => { if (["体重", "身高", "头围"].includes(r.type) && r.value !== "" && !isNaN(+r.value)) ser[r.type].push({ x: babyMonthsAt(r.datetime), y: +r.value }); });
      Object.keys(ser).forEach((k) => ser[k].sort((a, b) => a.x - b.x));
      const hasBirth = !!state.babyProfile.birth;
      const sex = state.babyProfile.sex === "女" ? "f" : "m";
      let maxMo = 60;
      Object.values(ser).forEach((a) => a.forEach((p) => { if (p.x > maxMo) maxMo = p.x; }));
      if (maxMo < 36) maxMo = 36;
      const out = {}; const outC = {};
      const GCO = { 体重: "#5fa98a", 身高: "#7fa8d9", 头围: "#d99a4e" };
      const KEYM = { 体重: "weight", 身高: "height", 头围: "head" };
      Object.keys(ser).forEach((k) => {
        if (ser[k].length) { out[k] = ser[k]; outC[k] = GCO[k]; }
        if (hasBirth) { const ref = []; for (let m = 0; m <= maxMo; m += 3) ref.push({ x: m, y: Math.round(growthRef(KEYM[k], sex, m) * 10) / 10 }); out[k + " P50"] = ref; outC[k + " P50"] = GCO[k] + "|4 3"; }
      });
      const any = Object.values(ser).some((a) => a.length >= 2) || (hasBirth && Object.keys(ser).length > 0);
      return any ? svgLine(out, outC, "月龄") : "";
    });

    return { now, slogan, hintShow, lunar, week, dateText, tasksActive, tasksToday, tasksOverdue, plantsTotal, plantsNeed, sportToday, finMonth, annivNear, growthChart, iconSvg, DOG_SVG };
  },
  template: `
  <div>
    <div class="dash-hint" v-if="hintShow">
      <span class="dh-text">点击左上角头像展开菜单，按住可拖到别处</span>
      <button class="dh-close" @click="hintShow=false">✕</button>
    </div>
    <div class="dash-hero">
      <div>
        <div class="date">{{dateText}} · 周{{week}}</div>
        <div class="sub">农历 {{lunar.text}}　{{lunar.term ? '· '+lunar.term : ''}}　{{lunar.full}}</div>
      </div>
      <div class="slogan">“{{slogan}}”</div>
      <div class="dog"><img src="icons/bow.png" alt="蝴蝶结"></div>
    </div>

    <div class="dash-grid">
      <div class="dash-card" style="cursor:pointer" @click="$emit('goto','tasks')">
        <h3><span class="mt-ico"><img :src="iconFor('tasks')"></span>待办事件 <span class="go-hint">查看 ›</span></h3>
        <div class="row2">
          <div class="mini"><div class="mv">{{tasksActive}}</div><div class="mk">未完成总数</div></div>
          <div class="mini"><div class="mv">{{tasksToday}}</div><div class="mk">今日待办</div></div>
          <div class="mini"><div class="mv danger">{{tasksOverdue}}</div><div class="mk">逾期事件</div></div>
        </div>
      </div>

      <div class="dash-card" style="cursor:pointer" @click="$emit('goto','anniv')">
        <h3><span class="mt-ico"><img :src="iconFor('anniv')"></span>最近纪念日 <span class="go-hint">查看 ›</span></h3>
        <div class="dash-line" v-for="a in annivNear" :key="a.id">
          <span>{{a.name}} <span class="tag gray" style="font-size:10px">{{a.type}}</span></span>
          <b :style="{color: a.days<=7 ? 'var(--warn)' : 'var(--text-soft)'}">{{a.days===0?'今天！':a.days+' 天后'}}</b>
        </div>
        <div v-if="!annivNear.length" class="empty" style="padding:14px 0">暂无纪念日</div>
      </div>

      <div class="dash-card" style="cursor:pointer" @click="$emit('goto','plants')">
        <h3><span class="mt-ico"><img :src="iconFor('plants')"></span>绿植状态 <span class="go-hint">查看 ›</span></h3>
        <div class="row2">
          <div class="mini"><div class="mv">{{plantsTotal}}</div><div class="mk">养护中总数</div></div>
          <div class="mini"><div class="mv warn">{{plantsNeed}}</div><div class="mk">今日需养护</div></div>
        </div>
      </div>

      <div class="dash-card" style="cursor:pointer" @click="$emit('goto','sport')">
        <h3><span class="mt-ico"><img :src="iconFor('sport')"></span>减脂数据 <span class="go-hint">查看 ›</span></h3>
        <div class="row2">
          <div class="mini"><div class="mv">{{sportToday.burn}}</div><div class="mk">运动消耗(kcal)</div></div>
          <div class="mini"><div class="mv">{{sportToday.intake}}</div><div class="mk">饮食摄入(kcal)</div></div>
          <div class="mini"><div class="mv" :class="sportToday.deficit>=0?'':'danger'">{{sportToday.deficit}}</div><div class="mk">热量缺口(kcal)</div></div>
        </div>
      </div>

      <div class="dash-card" style="cursor:pointer" @click="$emit('goto','finance')">
        <h3><span class="mt-ico"><img :src="iconFor('finance')"></span>理财概览 <span class="go-hint">查看 ›</span></h3>
        <div class="dash-line"><span>本月收入</span><b style="color:var(--green-deep)">+{{finMonth.inc}}</b></div>
        <div class="dash-line"><span>本月支出</span><b style="color:var(--danger)">−{{finMonth.exp}}</b></div>
        <div class="dash-line"><span>本月结余</span><b>{{finMonth.bal}}</b></div>
        <div class="dash-line"><span>今日收支</span><b>+{{finMonth.tInc}} / −{{finMonth.tExp}}</b></div>
      </div>

      <div class="dash-card" style="cursor:pointer" @click="$emit('goto','baby')">
        <h3><span class="mt-ico"><img :src="iconFor('baby')"></span>成长曲线 <span class="go-hint">查看 ›</span></h3>
        <div v-if="growthChart" v-html="growthChart"></div>
        <div v-else class="empty" style="padding:14px 0">暂无成长数据，去「宝宝养育」记录身高体重吧～</div>
      </div>
    </div>
  </div>`,
};

/* 心情选项 */
const MOODS = [
  { k: "happy", e: "😊", t: "开心" },
  { k: "calm", e: "😌", t: "平静" },
  { k: "love", e: "🥰", t: "幸福" },
  { k: "normal", e: "😐", t: "一般" },
  { k: "tired", e: "😴", t: "疲惫" },
  { k: "sad", e: "😢", t: "难过" },
  { k: "angry", e: "😡", t: "生气" },
  { k: "sick", e: "🤒", t: "生病" },
];

/* =========================================================
   组件：日程管理（日历 · 待办 · 心情）
   ========================================================= */
const Tasks = {
  components: { Modal },
  setup() {
    const today = todayStr();
    const view = reactive({ y: +today.slice(0, 4), m: +today.slice(5, 7) - 1 });
    const sel = ref(today);
    const form = reactive({ show: false, title: "新事件", id: null, name: "", short: "", note: "", due: today, priority: "普通" });
    const showMood = ref(false);
    const WK = ["日", "一", "二", "三", "四", "五", "六"];

    const monthLabel = computed(() => view.y + "年" + (view.m + 1) + "月");
    const weeks = computed(() => {
      const first = new Date(view.y, view.m, 1);
      const start = new Date(view.y, view.m, 1 - first.getDay());
      const cells = [];
      for (let i = 0; i < 42; i++) {
        const dt = new Date(start); dt.setDate(start.getDate() + i);
        const ds = fmtDate(dt);
        const todos = state.tasks.filter((t) => t.due === ds).sort((x, y) => (x.done - y.done));
        const hasUndone = todos.some((t) => !t.done);
        const allDone = todos.length > 0 && todos.every((t) => t.done);
        cells.push({ ds, day: dt.getDate(), cur: dt.getMonth() === view.m, hasUndone, allDone, mood: state.moods[ds] || null, isToday: ds === today, tds: todos.slice(0, 2), more: todos.length > 2 ? todos.length - 2 : 0 });
      }
      const w = []; for (let i = 0; i < 6; i++) w.push(cells.slice(i * 7, i * 7 + 7));
      return w;
    });
    const selTodos = computed(() => state.tasks.filter((t) => t.due === sel.value).sort((a, b) => a.done - b.done));
    const selMood = computed(() => state.moods[sel.value] || null);
    const selLunar = computed(() => getLunar(parseD(sel.value)));
    const annivNear = computed(() => state.anniv.map((a) => ({ ...a, days: annivDays(a) })).sort((x, y) => x.days - y.days).slice(0, 3));

    function prevMonth() { if (view.m === 0) { view.m = 11; view.y--; } else view.m--; }
    function nextMonth() { if (view.m === 11) { view.m = 0; view.y++; } else view.m++; }
    function goToday() { const t = new Date(); view.y = t.getFullYear(); view.m = t.getMonth(); sel.value = today; }
    function pick(ds) { sel.value = ds; showMood.value = false; }
    function setMood(k) { if (state.moods[sel.value] === k) delete state.moods[sel.value]; else state.moods[sel.value] = k; showMood.value = false; }
    const statusOf = (t) => {
      if (t.done) return { cls: "gray", txt: "已完成" };
      if (t.due && t.due < today) return { cls: "red", txt: "逾期" };
      return { cls: "qing", txt: "未完成" };
    };
    function openAdd() { Object.assign(form, { show: true, title: "新事件", id: null, name: "", short: "", note: "", due: sel.value, priority: "普通" }); }
    function openEdit(t) { Object.assign(form, { show: true, title: "编辑事件", id: t.id, name: t.title, short: t.short || "", note: t.note || "", due: t.due || "", priority: t.priority || "普通" }); }
    function save() {
      if (!form.name.trim()) return showToast("标题不能为空");
      if (form.id) { const t = state.tasks.find((x) => x.id === form.id); Object.assign(t, { title: form.name.trim(), short: form.short.trim(), note: form.note.trim(), due: form.due, priority: form.priority }); }
      else state.tasks.push({ id: uid(), title: form.name.trim(), short: form.short.trim(), note: form.note.trim(), due: form.due, priority: form.priority, done: false, createdAt: Date.now() });
      form.show = false; showToast("已保存");
    }
    function toggle(t) { t.done = !t.done; }
    function del(id) { state.tasks = state.tasks.filter((x) => x.id !== id); showToast("已删除"); }
    function clearDone() { const n = state.tasks.filter((t) => t.done).length; state.tasks = state.tasks.filter((x) => !x.done); showToast("已清空 " + n + " 条已完成"); }
    return { MOODS, WK, today, monthLabel, weeks, sel, selTodos, selMood, selLunar, annivNear, prevMonth, nextMonth, goToday, pick, setMood, showMood, statusOf, form, openAdd, openEdit, save, toggle, del, clearDone };
  },
  template: `
  <div>
    <div class="module-head">
      <div><div class="module-title"><span class="mt-ico"><img :src="iconFor('tasks')"></span>日程管理</div><div class="module-desc">日历 · 待办 · 心情，一天一记</div></div>
      <div style="display:flex;gap:8px"><button class="btn gray" @click="clearDone">清空已完成</button><button class="btn" @click="openAdd">＋ 新事件</button></div>
    </div>

    <div class="dash-card" style="margin-bottom:14px">
      <h3><span class="mt-ico"><img :src="iconFor('anniv')"></span>最近纪念日</h3>
      <div class="dash-line" v-for="a in annivNear" :key="a.id">
        <span>{{a.name}} <span class="tag gray" style="font-size:10px">{{a.type}}</span></span>
        <b :style="{color: a.days<=7 ? 'var(--warn)' : 'var(--text-soft)'}">{{a.days===0?'今天！':a.days+' 天后'}}</b>
      </div>
      <div v-if="!annivNear.length" class="empty" style="padding:14px 0">暂无纪念日</div>
    </div>

    <div class="cal">
      <div class="cal-bar">
        <button class="icon-btn" @click="prevMonth" title="上一月">‹</button>
        <div class="cal-ml">{{monthLabel}}</div>
        <button class="icon-btn" @click="nextMonth" title="下一月">›</button>
        <button class="btn gray sm" @click="goToday" style="margin-left:auto">今天</button>
      </div>
      <div class="cal-grid cal-wk">
        <div class="cal-cell hdr" v-for="w in WK" :key="w">{{w}}</div>
      </div>
      <div class="cal-grid">
        <template v-for="(w, wi) in weeks" :key="wi">
          <div v-for="c in w" :key="c.ds" class="cal-cell" :class="{cur:c.cur, other:!c.cur, today:c.isToday, sel:c.ds===sel}" @click="pick(c.ds)">
            <div class="cal-top">
              <span class="cal-day" :class="{todo:c.hasUndone, alldone:c.allDone}">{{c.day}}</span>
              <span v-if="c.mood" class="cal-mood" :title="'心情：' + ((MOODS.find(m=>m.k===c.mood)||{}).t || '')">{{(MOODS.find(m=>m.k===c.mood)||{}).e}}</span>
            </div>
            <div class="cal-list">
              <div v-for="td in c.tds" :key="td.id" class="cal-td" :class="{done:td.done}">{{td.done?'✓ ':''}}{{td.short || td.title}}</div>
              <div v-if="c.more" class="cal-td more">+{{c.more}} 项</div>
            </div>
          </div>
        </template>
      </div>
      <div class="cal-legend">
        <span><i class="cal-dot red"></i>红圈有未完成待办</span>
        <span><i class="cal-dot gray"></i>灰圈待办已完成</span>
        <span>😊 当日心情</span>
      </div>
    </div>

    <div class="day-panel">
      <div class="dp-head">
        <div>
          <div class="dp-date">{{sel}} <span class="dp-lunar">农历 {{selLunar.text}}<template v-if="selLunar.term"> · {{selLunar.term}}</template></span></div>
          <div class="dp-sub">{{selLunar.full}}</div>
        </div>
        <button class="btn gray sm" @click="showMood=!showMood">😊 心情{{selMood?('：'+(MOODS.find(m=>m.k===selMood)||{}).t):''}}</button>
      </div>

      <div v-if="showMood" class="mood-row">
        <button v-for="m in MOODS" :key="m.k" class="mood-chip" :class="{on:selMood===m.k}" @click="setMood(m.k)">
          <span class="me">{{m.e}}</span><span class="mt">{{m.t}}</span>
        </button>
      </div>

      <div class="dp-section-title">📋 当日待办（{{selTodos.length}}）</div>
      <div v-if="selTodos.length">
        <div class="item" v-for="t in selTodos" :key="t.id">
          <input type="checkbox" :checked="t.done" @change="toggle(t)" style="margin-top:4px;width:17px;height:17px;accent-color:var(--green)">
          <div class="body">
            <div class="title" :class="{done:t.done}">{{t.title}}</div>
            <div class="meta">
              <span class="tag" :class="statusOf(t).cls">{{statusOf(t).txt}}</span>
              <span v-if="t.priority==='紧急'" class="tag red">紧急</span>
              <span v-if="t.due">📅 {{t.due}}</span>
              <span v-if="t.note">📌 {{t.note}}</span>
            </div>
          </div>
          <div class="ops">
            <button class="icon-btn" @click="openEdit(t)" title="编辑">✏️</button>
            <button class="icon-btn danger" @click="del(t.id)" title="删除">🗑️</button>
          </div>
        </div>
      </div>
      <div v-else class="empty sm"><span class="big">🗒️</span>这一天还没有待办，点「＋ 新事件」添加</div>
    </div>

    <modal :show="form.show" :title="form.title" @close="form.show=false">
      <div class="field"><label>事件标题</label><input class="input" v-model="form.name" placeholder="要做什么？"></div>
      <div class="field"><label>日历简称（可选）</label><input class="input" v-model="form.short" placeholder="日历格子显示，如：例会、浇水"></div>
      <div class="pl-grid">
        <div class="field"><label>优先级</label><select class="select" v-model="form.priority"><option>普通</option><option>紧急</option></select></div>
        <div class="field"><label>日期</label><input class="input" type="date" v-model="form.due"></div>
      </div>
      <div class="field"><label>备注</label><textarea class="textarea" v-model="form.note" placeholder="补充说明（可选）"></textarea></div>
      <div style="text-align:right"><button class="btn" @click="save">保存</button></div>
    </modal>
  </div>`,
};

/* =========================================================
   组件：备忘录（自定义分类）
   ========================================================= */
const Memo = {
  components: { Modal },
  setup() {
    const filter = ref("全部");
    const kw = ref("");
    const manage = ref(false);
    const form = reactive({ show: false, title: "新建备忘", id: null, name: "", content: "", catId: "", pinned: false, due: "", syncTask: false });
    const catForm = reactive({ show: false, title: "分类", id: null, name: "" });

    const catName = (id) => { const c = state.memoCats.find((x) => x.id === id); return c ? c.name : "未分类"; };
    const list = computed(() => {
      let r = state.memos;
      if (filter.value !== "全部") r = r.filter((m) => (m.catId ? catName(m.catId) : "未分类") === filter.value);
      if (kw.value) r = r.filter((m) => (m.title + m.content).toLowerCase().includes(kw.value.toLowerCase()));
      return r.sort((a, b) => (b.pinned - a.pinned) || (b.createdAt - a.createdAt));
    });
    function openAdd() { const def = state.memoCats[0] ? state.memoCats[0].id : ""; Object.assign(form, { show: true, title: "新建备忘", id: null, name: "", content: "", catId: def, pinned: false, due: "", syncTask: false }); }
    function openEdit(m) { Object.assign(form, { show: true, title: "编辑备忘", id: m.id, name: m.title, content: m.content, catId: m.catId || "", pinned: !!m.pinned, due: m.due || "", syncTask: !!m.syncTask }); }
    function save() { if (!form.name.trim()) return showToast("标题不能为空");
      if (form.id) { const m = state.memos.find((x) => x.id === form.id); Object.assign(m, { title: form.name.trim(), content: form.content.trim(), catId: form.catId, pinned: form.pinned, due: form.due, syncTask: form.syncTask }); }
      else state.memos.push({ id: uid(), title: form.name.trim(), content: form.content.trim(), catId: form.catId, pinned: form.pinned, due: form.due, syncTask: form.syncTask, createdAt: Date.now() });
      form.show = false; syncPlanTasks(); showToast(form.syncTask && form.due ? "已保存，并同步到日程管理" : "已保存"); }
    function del(id) { state.memos = state.memos.filter((x) => x.id !== id); syncPlanTasks(); showToast("已删除"); }
    function pin(m) { m.pinned = !m.pinned; }
    function openCatAdd() { Object.assign(catForm, { show: true, title: "新增分类", id: null, name: "" }); }
    function openCatEdit(c) { Object.assign(catForm, { show: true, title: "重命名分类", id: c.id, name: c.name }); }
    function saveCat() { if (!catForm.name.trim()) return showToast("填分类名");
      if (catForm.id) { const c = state.memoCats.find((x) => x.id === catForm.id); c.name = catForm.name.trim(); }
      else state.memoCats.push({ id: uid(), name: catForm.name.trim() });
      catForm.show = false; }
    function delCat(id) { state.memoCats = state.memoCats.filter((x) => x.id !== id); state.memos.forEach((m) => { if (m.catId === id) m.catId = ""; }); showToast("分类已删除，相关备忘归入未分类"); }
    return { filter, kw, manage, form, catForm, catName, list, openAdd, openEdit, save, del, pin, openCatAdd, openCatEdit, saveCat, delCat, state };
  },
  template: `
  <div>
    <div class="module-head">
      <div><div class="module-title"><span class="mt-ico"><img :src="iconFor('memo')"></span>备忘录</div><div class="module-desc">碎片化记录，按分类归档</div></div>
      <div style="display:flex;gap:8px"><button class="btn gray" @click="manage=!manage">{{manage?'完成':'管理分类'}}</button><button class="btn" @click="openAdd">＋ 新建备忘</button></div>
    </div>
    <div class="toolbar">
      <input class="input search" v-model="kw" placeholder="🔍 搜索标题或内容">
      <button class="chip" :class="{active:filter==='全部'}" @click="filter='全部'">全部</button>
      <button class="chip" v-for="c in state.memoCats" :key="c.id" :class="{active:filter===c.name}" @click="filter=c.name">{{c.name}}
        <span v-if="manage" style="margin-left:4px" @click.stop="openCatEdit(c)">✎</span>
        <span v-if="manage" style="margin-left:2px;color:var(--danger)" @click.stop="delCat(c.id)">✕</span>
      </button>
      <button v-if="manage" class="chip" @click="openCatAdd">＋ 分类</button>
    </div>
    <div class="grid cards-auto">
      <div class="card" v-for="m in list" :key="m.id" style="position:relative">
        <span v-if="m.pinned" class="due-flag tag warn">📌 置顶</span>
        <div style="font-weight:700;font-size:15px;padding-right:54px">{{m.title}}</div>
        <div style="color:var(--text-soft);font-size:13px;white-space:pre-wrap;word-break:break-word;margin-top:4px">{{m.content}}</div>
        <div class="meta" style="margin-top:10px"><span class="tag blue">{{catName(m.catId)}}</span><span>🕒 {{fmtDate(m.createdAt)}}</span><span v-if="m.due" class="tag warn">📅 {{m.due}}</span><span v-if="m.syncTask&&m.due" class="tag green">↔ 已同步</span></div>
        <div class="ops" style="position:absolute;bottom:14px;right:14px;display:flex;gap:6px">
          <button class="icon-btn" @click="pin(m)" title="置顶">📌</button>
          <button class="icon-btn" @click="openEdit(m)" title="编辑">✏️</button>
          <button class="icon-btn danger" @click="del(m.id)" title="删除">🗑️</button>
        </div>
      </div>
      <div v-if="!list.length" class="empty" style="grid-column:1/-1"><span class="big">🗒️</span>还没有备忘</div>
    </div>

    <modal :show="form.show" :title="form.title" @close="form.show=false">
      <div class="field"><label>标题</label><input class="input" v-model="form.name"></div>
      <div class="field"><label>分类</label><select class="select" v-model="form.catId"><option value="">未分类</option><option v-for="c in state.memoCats" :key="c.id" :value="c.id">{{c.name}}</option></select></div>
      <div class="field"><label>内容</label><textarea class="textarea" style="min-height:120px" v-model="form.content"></textarea></div>
      <div class="field"><label>日期（可选）</label><input class="input" type="date" v-model="form.due" style="max-width:240px"></div>
      <div class="field"><label style="display:flex;align-items:center;gap:6px;font-weight:600;color:var(--text-soft)"><input type="checkbox" v-model="form.syncTask" style="width:15px;height:15px;accent-color:var(--green)"> 同步到日程管理</label><div class="hint" style="margin-top:6px">勾选并设置日期后，会自动生成一条待办显示在日程管理日历里。</div></div>
      <div class="field"><label style="display:flex;align-items:center;gap:6px;font-weight:600;color:var(--text-soft)"><input type="checkbox" v-model="form.pinned" style="width:15px;height:15px;accent-color:var(--green)"> 置顶</label></div>
      <div style="text-align:right"><button class="btn" @click="save">保存</button></div>
    </modal>

    <modal :show="catForm.show" :title="catForm.title" @close="catForm.show=false">
      <div class="field"><label>分类名称</label><input class="input" v-model="catForm.name" placeholder="如：生活琐事 / 购物清单"></div>
      <div style="text-align:right"><button class="btn" @click="saveCat">保存</button></div>
    </modal>
  </div>`,
};

/* =========================================================
   组件：我的植物（绿植养护）
   ========================================================= */
const Plants = {
  components: { Modal },
  setup() {
    const PLANT_LIB = window.PLANT_LIB || [];
    const CATS = [...new Set(PLANT_LIB.map((x) => x.cat).filter(Boolean))];
    const form = reactive({ show: false, title: "添加植物", id: null, name: "", emoji: "🌷", species: "", location: "", city: "", lightHours: "", waterNeed: "适中", waterInterval: 5, fertilizeInterval: 30, light: "", acquired: todayStr(), img: "", note: "" });
    const care = reactive({ show: false, title: "", id: null, kind: "", date: todayStr(), note: "" });
    const search = reactive({ loading: false, results: [] });
    const lib = reactive({ kw: "", cat: "全部" });
    const detail = reactive({ show: false, id: null });
    const opForm = reactive({ date: todayStr(), temp: "", weather: "", type: "浇水", detail: "", note: "" });
    const opTypes = ["浇水", "施肥", "喷药除虫", "修剪", "换盆"];
    const EMOJIS = ["🌷", "🌸", "🌺", "🌻", "🌵", "🎍", "🪴", "🌿", "🍀", "🌴", "🌲", "🍁", "🌾", "🎋", "🌹", "🥀", "🪻", "🌼", "🍃", "🌰"];
    const emojiOpen = ref(false);
    function pickEmoji(e) { form.emoji = e; emojiOpen.value = false; }

    const cur = computed(() => state.plants.find((x) => x.id === detail.id) || null);
    const libList = computed(() => PLANT_LIB.filter((x) => (lib.cat === "全部" || x.cat === lib.cat) && (!lib.kw || (x.name + (x.latin || "")).toLowerCase().includes(lib.kw.toLowerCase()))));
    const logList = computed(() => cur.value ? [...(cur.value.logs || [])].sort((a, b) => (b.date < a.date ? -1 : 1)) : []);
    const cares = computed(() => cur.value ? plantNextCares(cur.value) : []);

    function searchPlant() {
      const q = lib.kw.trim();
      if (!q) return;
      search.loading = true; search.results = [];
      const url = "https://zh.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=" + encodeURIComponent(q + " 植物") + "&gsrlimit=6&prop=pageimages|extracts&exintro&explaintext&pithumbsize=240&piprop=thumbnail";
      fetch(url).then((r) => { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
        .then((j) => {
          const pages = j.query && j.query.pages ? Object.values(j.query.pages) : [];
          search.results = pages.filter((p) => p.title).map((p) => ({ id: p.pageid, title: p.title, img: p.thumbnail ? p.thumbnail.source : "", extract: (p.extract || "").slice(0, 90) }));
          search.loading = false;
          if (!search.results.length) showToast("在线没搜到，试试更常见的名字");
        })
        .catch(() => { search.loading = false; search.results = []; showToast("联网查询暂不可用（网络/服务问题）"); });
    }
    function pickPlant(r) {
      const name = r.title.replace(/\(.*\)$/, "").replace(/（.*）$/, "").trim();
      const ex = (r.extract || "") + " " + r.title;
      form.name = name; form.img = r.img; form.species = r.title;
      form.waterNeed = /耐旱|多肉|仙人掌/.test(ex) ? "耐旱" : (/喜湿|湿润|水生/.test(ex) ? "喜湿" : "适中");
      form.fertilizeInterval = /多肉|仙人掌|耐旱/.test(ex) ? 45 : (/开花|花期|花大/.test(ex) ? 15 : 30);
      form.light = /散射/.test(ex) ? "散射光" : (/耐阴|阴性/.test(ex) ? "耐阴" : (/喜光|全日照|直射|强光/.test(ex) && !/避免|怕|忌|不要/.test(ex) ? "充足光照" : ""));
      lib.kw = ""; search.results = [];
      showToast("已选用，补充位置/光照时长后保存");
    }
    function fetchWeather(p) {
      const city = (p.city || p.location || "").trim();
      if (!city) return showToast("先填城市（或位置里写城市名）再查天气");
      showToast("正在获取 " + city + " 天气…");
      fetch("https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(city) + "&count=1&language=zh")
        .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
        .then((g) => {
          const loc = g.results && g.results[0];
          if (!loc) throw new Error("no geo");
          return fetch("https://api.open-meteo.com/v1/forecast?latitude=" + loc.latitude + "&longitude=" + loc.longitude + "&current=temperature_2m,relative_humidity_2m,precipitation,weather_code&daily=precipitation_probability_max,daylight_duration&forecast_days=1&timezone=auto").then((r) => r.json());
        })
        .then((f) => {
          const c = f.current || {};
          const dl = f.daily && f.daily.daylight_duration && f.daily.daylight_duration[0] ? Math.round(f.daily.daylight_duration[0] / 3600) : 0;
          p.weather = { temp: Math.round(c.temperature_2m || 0), hum: Math.round(c.relative_humidity_2m || 0), precip: c.precipitation || 0, precipProb: (f.daily && f.daily.precipitation_probability_max && f.daily.precipitation_probability_max[0]) || 0, code: c.weather_code || 0, city, daylight: dl, at: Date.now() };
          if (!p.lightHours && dl) p.lightHours = dl; /* 天气自动写入光照时长 */
          if (detail.show && cur.value && cur.value.id === p.id) { opForm.temp = p.weather.temp; opForm.weather = wIco(p.weather.code) + " " + p.weather.temp + "℃ " + p.weather.hum + "%"; } /* 详情自动写入当日气温/天气 */
          showToast("天气已更新 🌤 " + p.weather.temp + "°C / 湿度 " + p.weather.hum + "%" + (dl ? " · 光照约" + dl + "小时" : ""));
        })
        .catch(() => showToast("天气获取失败，检查网络后重试"));
    }
    const WCODE = { 0: "☀️", 1: "🌤", 2: "⛅", 3: "☁️", 45: "🌫", 48: "🌫", 51: "🌦", 53: "🌦", 55: "🌧", 56: "🌧", 57: "🌧", 61: "🌧", 63: "🌧", 65: "🌧", 66: "🌧", 67: "🌧", 71: "🌨", 73: "🌨", 75: "❄️", 77: "🌨", 80: "🌦", 81: "🌧", 82: "🌧", 85: "🌨", 86: "❄️", 95: "⛈", 96: "⛈", 99: "⛈" };
    const wIco = (c) => WCODE[c] || "🌤";

    const waterLeft = (p) => (p.lastWater ? dayDiff(addDays(p.lastWater, plantWaterDays(p)), todayStr()) : 0);
    const needsWater = (p) => waterLeft(p) <= 0;
    const needsFert = (p) => (p.lastFertilize ? dayDiff(addDays(p.lastFertilize, p.fertilizeInterval || 30), todayStr()) : 0) <= 0;
    function openAdd() { Object.assign(form, { show: true, title: "添加植物", id: null, name: "", emoji: "🌷", species: "", location: "", city: "", lightHours: "", waterNeed: "适中", waterInterval: 5, fertilizeInterval: 30, light: "", acquired: todayStr(), img: "", note: "" }); lib.kw = ""; lib.cat = "全部"; search.results = []; }
    function openEdit(p) { Object.assign(form, { show: true, title: "编辑植物", id: p.id, name: p.name, emoji: p.emoji || "🌷", species: p.species || "", location: p.location || "", city: p.city || "", lightHours: p.lightHours || "", waterNeed: p.waterNeed || "适中", waterInterval: p.waterInterval || 5, fertilizeInterval: p.fertilizeInterval || 30, light: p.light || "", acquired: p.acquired || todayStr(), img: p.img || "", note: p.note || "" }); search.results = []; }
    function save() { if (!form.name.trim()) return showToast("名称不能为空");
      if (form.id) { const p = state.plants.find((x) => x.id === form.id); Object.assign(p, { name: form.name.trim(), emoji: form.emoji.trim() || "🌷", species: form.species.trim(), location: form.location.trim(), city: form.city.trim(), lightHours: form.lightHours, waterNeed: form.waterNeed, waterInterval: +form.waterInterval || 5, fertilizeInterval: +form.fertilizeInterval || 30, light: form.light.trim(), acquired: form.acquired, img: form.img.trim(), note: form.note.trim() }); }
      else state.plants.push({ id: uid(), name: form.name.trim(), emoji: form.emoji.trim() || "🌷", species: form.species.trim(), location: form.location.trim(), city: form.city.trim(), lightHours: form.lightHours, waterNeed: form.waterNeed, waterInterval: +form.waterInterval || 5, fertilizeInterval: +form.fertilizeInterval || 30, light: form.light.trim(), acquired: form.acquired, img: form.img.trim(), lastWater: form.acquired, lastFertilize: form.acquired, logs: [], note: form.note.trim() });
      form.show = false; showToast("已添加 🌱"); }
    function openCare(p, kind) { Object.assign(care, { show: true, title: (kind === "water" ? "浇水" : "施肥") + " · " + p.name, id: p.id, kind, date: todayStr(), note: "" }); }
    function saveCare() { const p = state.plants.find((x) => x.id === care.id); const type = care.kind === "water" ? "浇水" : "施肥"; p.logs = p.logs || []; p.logs.push({ date: care.date, type, temp: "", weather: "", detail: care.note.trim(), note: "" }); if (care.kind === "water") p.lastWater = care.date; else p.lastFertilize = care.date; care.show = false; showToast(type + "已记录 💧"); }
    function del(id) { state.plants = state.plants.filter((x) => x.id !== id); showToast("已删除"); }
    function openDetail(p) { detail.id = p.id; detail.show = true; Object.assign(opForm, { date: todayStr(), temp: p.weather ? p.weather.temp : "", weather: p.weather ? (wIco(p.weather.code) + " " + p.weather.temp + "℃ " + p.weather.hum + "%") : "", type: "浇水", detail: "", note: "" }); }
    function pickLib(p) {
      form.name = p.name; form.species = p.latin || p.name;
      form.img = "https://3ab55124cc754bb4be8f920a6bfb423d.app.codebuddy.work/images/" + p.id + ".png";
      form.emoji = p.emoji || "🌷";
      const w = p.water || "", lg = p.light || "", cat = p.cat || "";
      form.waterNeed = /喜湿|湿润|常喷|多喷水/.test(w) ? "喜湿" : (/耐旱|宁干|控水|少浇/.test(w) ? "耐旱" : "适中");
      form.fertilizeInterval = cat.includes("多肉") || /耐旱/.test(w) ? 45 : (cat.includes("开花") ? 15 : 30);
      form.light = /散射/.test(lg) ? "散射光" : (/耐阴/.test(lg) ? "耐阴" : (/直射|充足|全日照|强光/.test(lg) && !/避免|怕|忌|不要/.test(lg) ? "充足光照" : ""));
      lib.kw = ""; search.results = [];
      showToast("已选用「" + p.name + "」，补充位置/光照时长后保存");
    }
    function saveOp() {
      const p = cur.value; if (!p) return;
      if (!opForm.date) return showToast("选日期");
      const t = opForm.type;
      p.logs = p.logs || [];
      p.logs.push({ date: opForm.date, type: t, temp: opForm.temp, weather: opForm.weather, detail: opForm.detail.trim(), note: opForm.note.trim() });
      const key = t === "浇水" ? "lastWater" : t === "施肥" ? "lastFertilize" : t === "喷药除虫" ? "lastSpray" : t === "修剪" ? "lastTrim" : "lastRepot";
      p[key] = opForm.date;
      Object.assign(opForm, { date: todayStr(), temp: p.weather ? p.weather.temp : "", weather: p.weather ? (wIco(p.weather.code) + " " + p.weather.temp + "℃ " + p.weather.hum + "%") : "", type: "浇水", detail: "", note: "" });
      showToast(t + "已记录 ✅");
    }
    function delLog(i) { const p = cur.value; if (p && p.logs) { p.logs.splice(i, 1); showToast("已删除"); } }
    /* 护理注意事项（联网获取：植物库科普优先，否则维基百科） */
    const notes = reactive({ show: false, title: "", loading: false, items: [] });
    function getNotes(p) {
      notes.title = p.name + " · 护理注意事项";
      const hit = PLANT_LIB.find((x) => x.name === p.name);
      if (hit) {
        notes.items = [
          { k: "☀️ 光照", v: hit.light },
          { k: "💧 浇水", v: hit.water },
          { k: "🌡️ 温度", v: hit.temp },
          { k: "🪴 土壤", v: hit.soil },
          { k: "🚫 避坑", v: (hit.pitfalls || []).map((x) => "· " + x).join("\n") },
        ];
        notes.loading = false; notes.show = true;
      } else {
        notes.loading = true; notes.show = true; notes.items = [];
        fetch("https://zh.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=" + encodeURIComponent(p.name + " 植物") + "&gsrlimit=1&prop=extracts&exintro&explaintext")
          .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
          .then((j) => {
            const pages = j.query && j.query.pages ? Object.values(j.query.pages) : [];
            const ex = pages[0] && pages[0].extract ? pages[0].extract : "";
            notes.loading = false;
            notes.items = ex ? [{ k: "📖 简介与养护", v: ex.slice(0, 600) }] : [{ k: "提示", v: "没找到相关科普，建议在添加弹窗的植物库里选同款获取注意事项。" }];
          })
          .catch(() => { notes.loading = false; notes.items = [{ k: "提示", v: "联网获取失败，检查网络后重试。" }]; });
      }
    }
    return { PLANT_LIB, form, care, search, lib, CATS, libList, detail, cur, opForm, opTypes, EMOJIS, emojiOpen, pickEmoji, logList, cares, notes, getNotes, wIco, needsWater, needsFert, waterLeft, openAdd, openEdit, save, openCare, saveCare, del, openDetail, pickLib, saveOp, delLog, searchPlant, pickPlant, fetchWeather };
  },
  template: `
  <div>
    <div class="module-head">
      <div><div class="module-title"><span class="mt-ico"><img :src="iconFor('plants')"></span>我的植物</div><div class="module-desc">联网植物库选种，天气+光照智能推算养护</div></div>
      <button class="btn" @click="openAdd">＋ 添加植物</button>
    </div>
    <div class="grid cards-auto">
      <div class="card plant-card" v-for="p in state.plants" :key="p.id" @click="openDetail(p)" style="cursor:pointer">
        <span v-if="needsWater(p)" class="due-flag tag red">💧 待浇水</span>
        <span v-else-if="needsFert(p)" class="due-flag tag warn">🌱 待施肥</span>
        <div style="display:flex;gap:13px;align-items:flex-start">
          <div class="plant-avatar" style="overflow:hidden;padding:0;position:relative">
            <img v-if="p.img" :src="p.img" style="width:100%;height:100%;object-fit:cover" @error="$event.target.style.display='none'" alt="">
            <span style="position:absolute;inset:0;display:grid;place-items:center;font-size:22px">{{p.emoji||'🌷'}}</span>
          </div>
          <div style="flex:1">
            <div style="font-weight:700;font-size:15.5px">{{p.name}}</div>
            <div style="color:var(--text-mute);font-size:12px">{{p.species||''}}{{p.location?(' · '+p.location):''}}{{p.city?(' · '+p.city):''}}</div>
            <div class="meta" style="margin-top:8px">
              <span class="tag" :class="needsWater(p)?'red':'gray'">{{needsWater(p)?'该浇水了！':'预计 '+waterLeft(p)+' 天后浇水'}}</span>
              <span v-if="p.lightHours" class="tag blue">☀️ {{p.lightHours}}h/天</span>
              <span v-if="p.waterNeed" class="tag qing">{{p.waterNeed}}</span>
              <span v-if="p.weather" class="tag gray">{{wIco(p.weather.code)}} {{p.weather.temp}}°</span>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:13px;flex-wrap:wrap">
          <button class="btn sm" @click.stop="openDetail(p)">📋 详情/养护</button>
          <button class="btn sm line" @click.stop="openCare(p,'water')">💧 浇水</button>
          <button class="btn sm line" @click.stop="openCare(p,'fert')">🌱 施肥</button>
          <button class="btn sm gray" @click.stop="getNotes(p)">📖 注意事项</button>
          <button class="btn sm gray" @click.stop="fetchWeather(p)">🌤 天气</button>
          <button class="icon-btn" @click.stop="openEdit(p)" title="编辑">✏️</button>
          <button class="icon-btn danger" @click.stop="del(p.id)" title="删除">🗑️</button>
        </div>
      </div>
      <div v-if="!state.plants.length" class="empty" style="grid-column:1/-1"><span class="big">🌱</span>还没有植物，添加第一盆吧</div>
    </div>

    <modal :show="form.show" :title="form.title" @close="form.show=false">
      <div class="field" v-if="!form.id">
        <label>🌱 搜索植物（植物库 {{PLANT_LIB.length}} 种 + 在线一起搜）</label>
        <div style="display:flex;gap:6px">
          <input class="input" v-model="lib.kw" placeholder="输入植物名，如：绿萝 / 龟背竹" @keyup.enter="searchPlant">
          <button class="btn sm" @click="searchPlant">{{search.loading?'…在线搜':'在线搜'}}</button>
        </div>
        <div v-if="libList.length || search.results.length" style="margin-top:8px;display:flex;flex-direction:column;gap:6px;max-height:140px;overflow-y:auto">
          <div v-for="lp in libList" :key="'lib'+lp.id" @click="pickLib(lp)" style="display:flex;gap:8px;align-items:center;background:var(--panel-2);border:1px solid var(--border);border-radius:10px;padding:6px 8px;cursor:pointer">
            <div style="width:38px;height:38px;border-radius:8px;overflow:hidden;position:relative;flex-shrink:0;background:linear-gradient(135deg,#fdf3e4,#f7e8d0);display:grid;place-items:center;font-size:18px">
              <img :src="'https://3ab55124cc754bb4be8f920a6bfb423d.app.codebuddy.work/images/'+lp.id+'.png'" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" @error="$event.target.style.display='none'" alt="">
              <span>{{lp.emoji}}</span>
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:600"><span class="tag qing" style="font-size:10px;padding:0 5px;margin-right:4px">库</span>{{lp.name}}<span v-if="lp.cat" style="color:var(--text-mute);font-weight:400;font-size:11px"> · {{lp.cat}}</span></div>
              <div style="font-size:11.5px;color:var(--text-mute);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{lp.summary}}</div>
            </div>
            <button class="btn sm" @click.stop="pickLib(lp)">选用</button>
          </div>
          <div v-if="search.results.length" style="font-size:11px;color:var(--text-mute);margin-top:2px">— 在线结果（维基百科） —</div>
          <div v-for="r in search.results" :key="'net'+r.id" style="display:flex;gap:8px;align-items:center;background:var(--panel-2);border:1px solid var(--border);border-radius:10px;padding:6px 8px;cursor:pointer" @click="pickPlant(r)">
            <img v-if="r.img" :src="r.img" style="width:38px;height:38px;border-radius:8px;object-fit:cover;flex-shrink:0" alt="">
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:600"><span class="tag blue" style="font-size:10px;padding:0 5px;margin-right:4px">在线</span>{{r.title}}</div>
              <div style="font-size:11.5px;color:var(--text-mute);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{r.extract}}</div>
            </div>
            <button class="btn sm" @click.stop="pickPlant(r)">选用</button>
          </div>
        </div>
        <div v-if="lib.kw && !libList.length && !search.results.length" style="font-size:11.5px;color:var(--text-mute);margin-top:6px">本地库没有，点「在线搜」联网查找。</div>
        <div v-if="!lib.kw && !libList.length && !search.results.length" style="font-size:11.5px;color:var(--text-mute);margin-top:6px">输入名称实时过滤植物库；点「在线搜」联网补充。</div>
      </div>
      <div class="row">
        <div class="field"><label>名称</label><input class="input" v-model="form.name"></div>
        <div class="field" style="position:relative">
          <label>头像</label>
          <button type="button" class="emoji-trigger" @click="emojiOpen=!emojiOpen">
            <span style="font-size:22px">{{form.emoji||'🌷'}}</span>
            <span style="font-size:12px;color:var(--text-mute);margin-left:6px">点击选择 ▾</span>
          </button>
          <div v-if="emojiOpen" class="emoji-pop">
            <button v-for="e in EMOJIS" :key="e" class="chip" :class="{active:form.emoji===e}" @click="pickEmoji(e)" style="font-size:20px">{{e}}</button>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="field"><label>放置位置</label><input class="input" v-model="form.location" placeholder="如：客厅窗台"></div>
        <div class="field"><label>城市（查天气用）</label><input class="input" v-model="form.city" placeholder="如：北京"></div>
      </div>
      <div class="pl-grid">
        <div class="field"><label>水分习性</label><select class="select" v-model="form.waterNeed"><option>喜湿</option><option>适中</option><option>耐旱</option></select></div>
        <div class="field"><label>入库日期</label><input class="input" type="date" v-model="form.acquired"></div>
      </div>
      <div class="field"><label>备注</label><textarea class="textarea" v-model="form.note"></textarea></div>
      <div style="font-size:12px;color:var(--text-mute);margin:-4px 0 8px">💡 光照需求 / 施肥间隔 / 光照时长由联网自动获取（查天气会自动填入当日光照时长）；浇水间隔 = 习性基准 × 温度/降水/湿度/光照修正。</div>
      <div style="text-align:right"><button class="btn" @click="save">保存</button></div>
    </modal>

    <modal :show="detail.show" :title="cur?cur.name+' · 详情与养护':'详情'" @close="detail.show=false">
      <div v-if="cur">
        <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
          <div class="plant-avatar" style="width:56px;height:56px;overflow:hidden;padding:0;position:relative">
            <img v-if="cur.img" :src="cur.img" style="width:100%;height:100%;object-fit:cover" @error="$event.target.style.display='none'" alt="">
            <span style="position:absolute;inset:0;display:grid;place-items:center;font-size:24px">{{cur.emoji||'🌷'}}</span>
          </div>
          <div style="flex:1">
            <div style="font-weight:700;font-size:16px">{{cur.name}} <span v-if="cur.species" style="font-size:12px;color:var(--text-mute)">{{cur.species}}</span></div>
            <div style="font-size:12px;color:var(--text-soft)">{{cur.location||'位置未填'}}{{cur.city?(' · '+cur.city):''}}{{cur.lightHours?(' · ☀️'+cur.lightHours+'h/天'):''}}{{cur.waterNeed?(' · '+cur.waterNeed):''}}</div>
            <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">
              <span v-if="cur.weather" class="tag gray">{{wIco(cur.weather.code)}} {{cur.weather.temp}}° · 💧{{cur.weather.hum}}% · ☔{{cur.weather.precipProb}}%</span>
              <button class="btn sm gray" @click="fetchWeather(cur)">🌤 更新天气</button>
            </div>
          </div>
        </div>
        <div style="background:var(--green-soft);border:1px dashed #f0dcc4;border-radius:12px;padding:10px 12px;margin-bottom:12px">
          <div style="font-weight:700;font-size:13px;margin-bottom:8px">🔮 下次养护建议（按当前天气+光照）</div>
          <div v-for="c in cares" :key="c.type" class="dash-line" style="align-items:center;font-size:12.5px">
            <span>{{c.ico}} {{c.type}}<template v-if="c.date"> · {{c.date}}</template> · <b :class="c.left!==null&&c.left<=0?'red':''">{{c.left===null?'尽快安排':(c.left<=0?'今天/已到期':'还有 '+c.left+' 天')}}</b></span>
            <span style="color:var(--text-mute);font-size:11.5px;max-width:55%;text-align:right">{{c.reason}}</span>
          </div>
        </div>
        <div style="font-weight:700;font-size:13px;margin-bottom:8px">📝 记录一次养护</div>
        <div class="pl-grid">
          <div class="field"><label>日期</label><input class="input" type="date" v-model="opForm.date"></div>
          <div class="field"><label>操作类型</label><select class="select" v-model="opForm.type"><option v-for="t in opTypes" :key="t">{{t}}</option></select></div>
          <div class="field"><label>当日气温(℃)</label><input class="input" type="number" v-model="opForm.temp" placeholder="查天气后自动填"></div>
          <div class="field"><label>当日天气</label><input class="input" v-model="opForm.weather" placeholder="如：☀️ 26℃ 晴"></div>
        </div>
        <div class="field"><label>操作详情</label><input class="input" v-model="opForm.detail" placeholder="如：浇透 / 薄肥 / 喷吡虫啉"></div>
        <div class="field"><label>备注</label><input class="input" v-model="opForm.note"></div>
        <div style="text-align:right"><button class="btn" @click="saveOp">保存记录</button></div>
        <div style="font-weight:700;font-size:13px;margin:14px 0 8px">📋 养护日志（{{logList.length}}）</div>
        <div v-if="logList.length" style="max-height:170px;overflow-y:auto;display:flex;flex-direction:column;gap:4px">
          <div v-for="(l,i) in logList" :key="i" style="display:flex;align-items:center;gap:6px;background:var(--panel-2);border:1px solid var(--border);border-radius:8px;padding:5px 8px;font-size:12px">
            <span style="flex-shrink:0">{{l.date}} <b>{{l.type}}</b></span>
            <span v-if="l.temp!==''&&l.temp!=null" style="color:var(--text-mute);flex-shrink:0">🌡{{l.temp}}°</span>
            <span v-if="l.weather" style="color:var(--text-mute);flex-shrink:0">{{l.weather}}</span>
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-soft)">{{l.detail||l.note}}</span>
            <button class="icon-btn danger" style="width:22px;height:22px;font-size:11px" @click="delLog(i)">🗑️</button>
          </div>
        </div>
        <div v-else style="font-size:12px;color:var(--text-mute)">还没有养护记录</div>
      </div>
    </modal>

    <modal :show="care.show" :title="care.title" @close="care.show=false">
      <div class="field"><label>日期</label><input class="input" type="date" v-model="care.date"></div>
      <div class="field"><label>备注</label><input class="input" v-model="care.note" placeholder="如：浇透 / 用了营养液"></div>
      <div style="text-align:right"><button class="btn" @click="saveCare">记录</button></div>
    </modal>

    <modal :show="notes.show" :title="notes.title" @close="notes.show=false">
      <div v-if="notes.loading" style="font-size:13px;color:var(--text-mute);padding:10px 0">正在联网获取护理注意事项…</div>
      <div v-else style="display:flex;flex-direction:column;gap:10px">
        <div v-for="(n,i) in notes.items" :key="i" style="background:var(--panel-2);border:1px solid var(--border);border-radius:10px;padding:9px 11px">
          <div style="font-weight:700;font-size:13px;margin-bottom:4px">{{n.k}}</div>
          <div style="font-size:12.5px;color:var(--text-soft);line-height:1.7;white-space:pre-line">{{n.v}}</div>
        </div>
      </div>
    </modal>
  </div>`,
};


/* 植物浇水智能推算（全局，供我的植物/首页/侧边栏徽标共用）：习性基础间隔 × 天气/光照修正 */
const PLANT_BASE = { 喜湿: 4, 适中: 7, 耐旱: 12 };
function plantWaterDays(p) {
  let d = PLANT_BASE[p.waterNeed] || p.waterInterval || 7;
  const w = p.weather;
  if (w) {
    if (w.temp >= 30) d *= 0.7; else if (w.temp >= 25) d *= 0.85;
    if (w.temp <= 5) d *= 1.5; else if (w.temp <= 10) d *= 1.3;
    if (w.precipProb >= 60) d *= 1.3; else if (w.precipProb >= 30) d *= 1.15;
    if (w.hum >= 70) d *= 1.15;
  }
  const lg = p.light || "";
  if (/阳台|户外|露台|强/.test(lg)) d *= 0.9;
  if (/阴|弱|北/.test(lg)) d *= 1.1;
  const lh = +p.lightHours || 0;
  if (lh && lh < 4) d *= 1.15;   /* 光照不足蒸发慢 */
  if (lh && lh > 8) d *= 0.85;   /* 光照强蒸发快 */
  return Math.max(1, Math.round(d));
}

/* 下次护理建议（全局）：按操作类型给出预计日期/剩余天数/理由（结合天气与光照） */
const CARE_CYCLES = { 施肥: 30, 喷药除虫: 30, 修剪: 60, 换盆: 180 };
function plantNextCares(p) {
  const t = todayStr();
  const res = [];
  const w = p.weather;
  const wd = plantWaterDays(p);
  const wDate = p.lastWater ? addDays(p.lastWater, wd) : t;
  let wReason = "按" + (PLANT_BASE[p.waterNeed] || "适中") + "习性基准 " + wd + " 天";
  if (w) {
    const bits = [];
    if (w.temp >= 30) bits.push("高温" + w.temp + "℃ 蒸发快");
    else if (w.temp >= 25) bits.push("偏热" + w.temp + "℃");
    else if (w.temp <= 5) bits.push("低温" + w.temp + "℃ 需控水");
    if (w.precipProb >= 30) bits.push("降水概率" + w.precipProb + "%");
    if (w.hum >= 70) bits.push("湿度大");
    if (bits.length) wReason += "，天气修正：" + bits.join("、");
  }
  const lh = +p.lightHours || 0;
  if (lh && lh < 4) wReason += "；光照仅" + lh + "小时/天，建议补光/移亮处并拉长间隔";
  else if (lh && lh > 8) wReason += "；光照" + lh + "小时/天偏强，蒸发快注意补水";
  res.push({ type: "浇水", ico: "💧", date: wDate, left: dayDiff(wDate, t), reason: wReason });
  Object.keys(CARE_CYCLES).forEach((k) => {
    const key = k === "施肥" ? "lastFertilize" : k === "喷药除虫" ? "lastSpray" : k === "修剪" ? "lastTrim" : "lastRepot";
    const last = p[key];
    const date = last ? addDays(last, CARE_CYCLES[k]) : "";
    const left = last ? dayDiff(date, t) : null;
    let reason = "建议每 " + CARE_CYCLES[k] + " 天一次";
    if (!last) reason = k === "换盆" ? "还没做过，植株长大后建议换盆" : "还没做过，建议近期安排一次";
    res.push({ type: k, ico: { 施肥: "🌱", 喷药除虫: "🧪", 修剪: "✂️", 换盆: "🪴" }[k], date, left, reason });
  });
  return res;
}

/* 常见食物热量库（kcal/100g，中式为主） */
const FOODS = [
  // 主食
  { n: "米饭", k: 116 }, { n: "面条（煮）", k: 110 }, { n: "米粉", k: 110 }, { n: "白粥", k: 46 }, { n: "馒头", k: 223 },
  { n: "全麦面包", k: 246 }, { n: "燕麦片（干）", k: 377 }, { n: "玉米", k: 112 }, { n: "红薯", k: 86 }, { n: "土豆", k: 77 },
  { n: "年糕", k: 154 }, { n: "饺子（猪肉）", k: 253 }, { n: "包子（肉馅）", k: 227 }, { n: "馄饨", k: 220 }, { n: "小笼包", k: 250 },
  { n: "油条", k: 388 }, { n: "煎饼果子", k: 210 }, { n: "葱油饼", k: 259 }, { n: "炒饭", k: 180 }, { n: "蛋炒饭", k: 200 },
  { n: "炒面", k: 180 }, { n: "意面（煮）", k: 158 }, { n: "汉堡", k: 295 }, { n: "披萨", k: 260 }, { n: "寿司", k: 150 },
  // 肉蛋奶
  { n: "鸡蛋（煮）", k: 144 }, { n: "煎蛋", k: 199 }, { n: "牛奶", k: 54 }, { n: "酸奶", k: 72 }, { n: "豆浆（无糖）", k: 31 },
  { n: "豆腐", k: 84 }, { n: "豆腐干", k: 142 }, { n: "鸡胸肉", k: 133 }, { n: "鸡腿（去皮）", k: 146 }, { n: "鸡翅", k: 194 },
  { n: "瘦猪肉", k: 143 }, { n: "猪排骨", k: 277 }, { n: "五花肉", k: 568 }, { n: "牛肉（瘦）", k: 106 }, { n: "牛腩", k: 250 },
  { n: "羊肉", k: 203 }, { n: "三文鱼", k: 139 }, { n: "草鱼", k: 113 }, { n: "虾", k: 93 }, { n: "蟹", k: 87 },
  { n: "鱿鱼", k: 92 }, { n: "培根", k: 393 }, { n: "火腿", k: 330 }, { n: "香肠", k: 508 }, { n: "午餐肉", k: 229 },
  // 蔬菜
  { n: "西兰花", k: 36 }, { n: "菠菜", k: 28 }, { n: "西红柿", k: 20 }, { n: "黄瓜", k: 16 }, { n: "胡萝卜", k: 39 },
  { n: "大白菜", k: 20 }, { n: "生菜", k: 15 }, { n: "芹菜", k: 16 }, { n: "茄子", k: 25 }, { n: "青椒", k: 22 },
  { n: "洋葱", k: 40 }, { n: "冬瓜", k: 12 }, { n: "南瓜", k: 26 }, { n: "丝瓜", k: 20 }, { n: "豆角", k: 34 },
  { n: "蘑菇", k: 22 }, { n: "金针菇", k: 32 }, { n: "香菇", k: 26 }, { n: "海带", k: 13 }, { n: "木耳（水发）", k: 27 },
  // 水果
  { n: "苹果", k: 53 }, { n: "香蕉", k: 93 }, { n: "橙子", k: 48 }, { n: "西瓜", k: 30 }, { n: "葡萄", k: 45 },
  { n: "草莓", k: 32 }, { n: "桃子", k: 42 }, { n: "梨", k: 51 }, { n: "猕猴桃", k: 61 }, { n: "菠萝", k: 44 },
  { n: "芒果", k: 60 }, { n: "柚子", k: 42 }, { n: "樱桃", k: 63 }, { n: "蓝莓", k: 57 }, { n: "火龙果", k: 55 },
  { n: "哈密瓜", k: 34 }, { n: "荔枝", k: 71 }, { n: "龙眼", k: 71 }, { n: "柠檬", k: 37 }, { n: "牛油果", k: 171 },
  // 豆类坚果
  { n: "花生", k: 567 }, { n: "核桃", k: 654 }, { n: "杏仁", k: 609 }, { n: "腰果", k: 559 }, { n: "开心果", k: 631 },
  { n: "夏威夷果", k: 718 }, { n: "瓜子", k: 606 }, { n: "腐竹", k: 461 }, { n: "黄豆", k: 390 }, { n: "红豆", k: 324 },
  // 零食饮料
  { n: "蛋糕", k: 347 }, { n: "曲奇", k: 546 }, { n: "薯片", k: 548 }, { n: "巧克力", k: 586 }, { n: "冰淇淋", k: 127 },
  { n: "可乐", k: 43 }, { n: "雪碧", k: 43 }, { n: "橙汁", k: 45 }, { n: "奶茶", k: 150 }, { n: "美式咖啡", k: 2 },
  { n: "拿铁", k: 100 }, { n: "啤酒", k: 43 }, { n: "红酒", k: 85 }, { n: "白酒（50度）", k: 350 }, { n: "鲜榨果汁", k: 50 },
  // 家常菜（估算）
  { n: "红烧肉", k: 520 }, { n: "宫保鸡丁", k: 180 }, { n: "鱼香肉丝", k: 150 }, { n: "番茄炒蛋", k: 90 }, { n: "麻婆豆腐", k: 130 },
  { n: "清炒时蔬", k: 60 }, { n: "白灼虾", k: 100 }, { n: "清蒸鱼", k: 110 }, { n: "酸辣土豆丝", k: 90 }, { n: "糖醋里脊", k: 260 },
  { n: "回锅肉", k: 330 }, { n: "红烧鸡腿", k: 240 }, { n: "炸鸡", k: 300 }, { n: "薯条", k: 298 }, { n: "沙拉（凯撒）", k: 180 },
  { n: "例汤", k: 40 }, { n: "紫菜蛋花汤", k: 25 }, { n: "番茄牛腩汤", k: 80 }, { n: "重庆小面", k: 220 }, { n: "兰州拉面", k: 150 },
  { n: "黄焖鸡米饭", k: 190 }, { n: "麻辣烫", k: 140 }, { n: "火锅（人均）", k: 350 }, { n: "烧烤（人均）", k: 300 }, { n: "关东煮", k: 90 },
  { n: "寿司卷", k: 160 }, { n: "饭团", k: 180 }, { n: "三明治", k: 250 }, { n: "吐司", k: 283 }, { n: "玉米片", k: 500 },
  // 沙县小吃 & 中式小吃面点（估算）
  { n: "沙县鸡腿饭", k: 550 }, { n: "沙县蒸饺", k: 250 }, { n: "沙县拌面", k: 320 }, { n: "沙县馄饨", k: 220 }, { n: "沙县炖汤", k: 120 },
  { n: "沙县鸭腿饭", k: 520 }, { n: "沙县飘香拌面", k: 350 }, { n: "沙县炸酱面", k: 300 },
  { n: "酱香饼", k: 320 }, { n: "手抓饼", k: 350 }, { n: "鸡蛋灌饼", k: 340 }, { n: "烤冷面", k: 300 }, { n: "杂粮煎饼", k: 230 },
  { n: "肉夹馍", k: 340 }, { n: "凉皮", k: 130 }, { n: "酸辣粉", k: 180 }, { n: "螺蛳粉", k: 300 }, { n: "热干面", k: 280 },
  { n: "炸酱面", k: 300 }, { n: "葱油拌面", k: 330 }, { n: "阳春面", k: 150 }, { n: "担担面", k: 290 }, { n: "刀削面", k: 190 },
  { n: "牛肉面", k: 220 }, { n: "过桥米线", k: 260 }, { n: "砂锅米线", k: 280 }, { n: "桂林米粉", k: 230 }, { n: "湖南米粉", k: 240 },
  { n: "煲仔饭", k: 450 }, { n: "卤肉饭", k: 420 }, { n: "猪脚饭", k: 460 }, { n: "叉烧饭", k: 480 }, { n: "烧鹅饭", k: 500 },
  { n: "白切鸡饭", k: 420 }, { n: "海南鸡饭", k: 430 }, { n: "梅菜扣肉", k: 480 }, { n: "粉蒸肉", k: 430 }, { n: "小炒黄牛肉", k: 220 },
  { n: "辣椒炒肉", k: 240 }, { n: "青椒肉丝", k: 190 }, { n: "木须肉", k: 180 }, { n: "京酱肉丝", k: 230 }, { n: "锅包肉", k: 330 },
  { n: "干煸四季豆", k: 160 }, { n: "地三鲜", k: 200 }, { n: "虎皮青椒", k: 130 }, { n: "蒜蓉粉丝虾", k: 160 }, { n: "水煮鱼", k: 220 },
  { n: "酸菜鱼", k: 200 }, { n: "剁椒鱼头", k: 200 }, { n: "毛血旺", k: 250 }, { n: "辣子鸡", k: 330 }, { n: "大盘鸡", k: 280 },
  { n: "手撕包菜", k: 90 }, { n: "干锅花菜", k: 160 }, { n: "铁板豆腐", k: 180 }, { n: "炸臭豆腐", k: 250 }, { n: "北京烤鸭", k: 350 },
  { n: "糯米鸡", k: 300 }, { n: "肠粉", k: 150 }, { n: "虾饺", k: 160 }, { n: "烧卖", k: 220 }, { n: "豉汁凤爪", k: 200 },
  { n: "蛋挞", k: 230 }, { n: "珍珠奶茶", k: 180 }, { n: "芋圆", k: 220 }, { n: "双皮奶", k: 160 },
  // 中式面点·早点（扩充）
  { n: "牛肉饼", k: 295 }, { n: "牛肉馅饼", k: 280 }, { n: "烧饼", k: 330 }, { n: "千层饼", k: 320 }, { n: "生煎包", k: 230 }, { n: "水煎包", k: 220 },
  { n: "锅贴", k: 240 }, { n: "煎饺", k: 210 }, { n: "韭菜盒子", k: 220 }, { n: "春卷（炸）", k: 240 }, { n: "糖糕", k: 320 }, { n: "麻团", k: 350 },
  { n: "油饼", k: 400 }, { n: "糖油粑粑", k: 330 }, { n: "糍粑", k: 240 }, { n: "叶儿粑", k: 230 }, { n: "驴打滚", k: 330 }, { n: "豌豆黄", k: 280 },
  { n: "艾窝窝", k: 260 }, { n: "糖火烧", k: 350 }, { n: "绿豆糕", k: 350 }, { n: "桂花糕", k: 300 }, { n: "茯苓糕", k: 290 },
  // 粥·汤·羹
  { n: "皮蛋瘦肉粥", k: 80 }, { n: "瘦肉粥", k: 75 }, { n: "小米粥", k: 46 }, { n: "南瓜粥", k: 50 }, { n: "八宝粥（甜）", k: 90 }, { n: "海鲜粥", k: 85 },
  { n: "生滚鱼片粥", k: 80 }, { n: "艇仔粥", k: 82 }, { n: "及第粥", k: 85 }, { n: "红豆汤", k: 90 }, { n: "绿豆汤", k: 70 }, { n: "银耳汤", k: 60 },
  { n: "西湖牛肉羹", k: 70 }, { n: "酸辣汤", k: 65 }, { n: "胡辣汤", k: 60 }, { n: "冬瓜排骨汤", k: 90 }, { n: "玉米排骨汤", k: 95 }, { n: "莲藕排骨汤", k: 100 },
  { n: "山药排骨汤", k: 95 }, { n: "海带排骨汤", k: 90 }, { n: "乌鸡汤", k: 110 }, { n: "老鸭汤", k: 120 }, { n: "菌菇汤", k: 55 },
  // 牛肉·家畜
  { n: "酱牛肉", k: 250 }, { n: "卤牛肉", k: 230 }, { n: "牛肉丸", k: 180 }, { n: "牛肉粉丝", k: 120 }, { n: "牛肉粉", k: 130 }, { n: "肥牛卷", k: 250 },
  { n: "水煮牛肉", k: 210 }, { n: "红烧牛肉", k: 230 }, { n: "白切鸡", k: 200 }, { n: "盐水鸭", k: 220 }, { n: "可乐鸡翅", k: 240 }, { n: "蒜香骨", k: 300 },
  { n: "椒盐排条", k: 300 }, { n: "糖醋排骨", k: 280 }, { n: "红烧排骨", k: 290 }, { n: "酱肘花", k: 280 }, { n: "夫妻肺片", k: 200 }, { n: "口水鸡", k: 190 },
  { n: "棒棒鸡", k: 190 }, { n: "灯影牛肉", k: 330 }, { n: "麻辣牛肉", k: 300 }, { n: "腊肠", k: 500 }, { n: "腊肉", k: 530 }, { n: "粉蒸排骨", k: 280 },
  { n: "红烧狮子头", k: 250 }, { n: "四喜丸子", k: 250 },
  // 地方小吃·粉面·甜饮
  { n: "豆腐脑", k: 50 }, { n: "酸汤水饺", k: 220 }, { n: "红油抄手", k: 230 }, { n: "钟水饺", k: 230 }, { n: "赖汤圆", k: 250 }, { n: "钵钵鸡", k: 180 },
  { n: "串串香", k: 200 }, { n: "冒菜", k: 180 }, { n: "麻辣香锅", k: 210 }, { n: "冰粉", k: 90 }, { n: "凉糕", k: 110 }, { n: "龟苓膏", k: 90 },
  { n: "醪糟", k: 100 }, { n: "杨枝甘露", k: 120 }, { n: "冰糖雪梨", k: 70 }, { n: "酸梅汤", k: 40 },
  // 素菜·凉拌（扩充）
  { n: "拍黄瓜", k: 70 }, { n: "凉拌木耳", k: 80 }, { n: "凉拌海带", k: 60 }, { n: "皮蛋豆腐", k: 120 }, { n: "凉拌腐竹", k: 140 }, { n: "老醋花生", k: 560 },
  { n: "凉拌藕片", k: 90 }, { n: "蒜蓉西兰花", k: 70 }, { n: "白灼菜心", k: 50 }, { n: "蚝油生菜", k: 60 }, { n: "清炒芦笋", k: 80 }, { n: "上汤娃娃菜", k: 90 },
  { n: "红烧茄子", k: 120 }, { n: "鱼香豆腐", k: 130 }, { n: "宫保豆腐", k: 150 }, { n: "家常豆腐", k: 140 },
  // 火锅·丸滑·粉类
  { n: "鱼丸", k: 120 }, { n: "虾丸", k: 110 }, { n: "贡丸", k: 150 }, { n: "鱼豆腐", k: 150 }, { n: "蟹柳", k: 140 }, { n: "墨鱼丸", k: 120 },
  { n: "牛百叶", k: 90 }, { n: "鸭血", k: 55 }, { n: "冻豆腐", k: 80 }, { n: "宽粉", k: 350 }, { n: "土豆粉", k: 340 },
];
/* 基础代谢（Mifflin-St Jeor）：男 +5，女 −161 */
function calcBmr(sex, height, age, weight) {
  const h = +height || 170, a = +age || 30, w = +weight || 65;
  return Math.round(10 * w + 6.25 * h - 5 * a + (sex === "女" ? -161 : 5));
}

/* 内置运动项目库（kcal/分，参考 MET 标准） */
const SPORT_ACTS_BUILTIN = [
  { name: "跑步（慢）", kcalPerMin: 8 }, { name: "跑步（快）", kcalPerMin: 11 }, { name: "快走", kcalPerMin: 5 }, { name: "散步", kcalPerMin: 3 }, { name: "竞走", kcalPerMin: 6 },
  { name: "跳绳", kcalPerMin: 12 }, { name: "跳绳（快）", kcalPerMin: 14 }, { name: "游泳", kcalPerMin: 9 }, { name: "骑行", kcalPerMin: 8 }, { name: "羽毛球", kcalPerMin: 7 },
  { name: "篮球", kcalPerMin: 7 }, { name: "足球", kcalPerMin: 8 }, { name: "乒乓球", kcalPerMin: 5 }, { name: "网球", kcalPerMin: 7 }, { name: "排球", kcalPerMin: 5 },
  { name: "瑜伽", kcalPerMin: 3 }, { name: "普拉提", kcalPerMin: 4 }, { name: "健身（力量）", kcalPerMin: 8 }, { name: "深蹲", kcalPerMin: 9 }, { name: "俯卧撑", kcalPerMin: 7 },
  { name: "仰卧起坐", kcalPerMin: 6 }, { name: "引体向上", kcalPerMin: 9 }, { name: "平板支撑", kcalPerMin: 5 }, { name: "波比跳", kcalPerMin: 12 }, { name: "战绳（甩绳）", kcalPerMin: 12 },
  { name: "HIIT 高强度", kcalPerMin: 12 }, { name: "Tabata", kcalPerMin: 14 }, { name: "有氧操", kcalPerMin: 7 }, { name: "动感单车", kcalPerMin: 9 }, { name: "椭圆机", kcalPerMin: 7 },
  { name: "登山 / 爬山", kcalPerMin: 9 }, { name: "爬楼梯", kcalPerMin: 9 }, { name: "徒步", kcalPerMin: 5 }, { name: "攀岩", kcalPerMin: 10 }, { name: "划船机", kcalPerMin: 7 },
  { name: "舞蹈", kcalPerMin: 6 }, { name: "街舞", kcalPerMin: 8 }, { name: "轮滑", kcalPerMin: 7 }, { name: "滑冰", kcalPerMin: 7 }, { name: "滑雪", kcalPerMin: 8 },
  { name: "高尔夫", kcalPerMin: 4 }, { name: "太极", kcalPerMin: 3 }, { name: "拳击", kcalPerMin: 10 }, { name: "跆拳道", kcalPerMin: 8 }, { name: "搏击操", kcalPerMin: 9 },
  { name: "蹦床", kcalPerMin: 8 }, { name: "骑马", kcalPerMin: 5 }, { name: "飞盘", kcalPerMin: 5 }, { name: "板羽球", kcalPerMin: 4 }, { name: "拉伸", kcalPerMin: 2 },
  { name: "家务（打扫）", kcalPerMin: 3.5 }, { name: "做饭", kcalPerMin: 2.5 }, { name: "洗碗", kcalPerMin: 2 }, { name: "带娃", kcalPerMin: 3 }, { name: "购物", kcalPerMin: 3 },
  { name: "园艺", kcalPerMin: 4 }, { name: "搬重物", kcalPerMin: 6 }, { name: "遛狗", kcalPerMin: 3.5 }, { name: "站立办公", kcalPerMin: 1.5 }, { name: "冥想", kcalPerMin: 1.2 },
];

/* =========================================================
   组件：运动记录（热量+缺口+体重曲线）
   ========================================================= */
const Sport = {
  components: { Modal },
  setup() {
    const form = reactive({ show: false, title: "记运动", id: null, actId: "", duration: 30, calories: 0, date: todayStr() });
    const food = reactive({ show: false, id: null, name: "", kcal100: 0, grams: 100, calories: 0, meal: "午餐", custom: true, date: todayStr(), items: [] });
    const prof = reactive({ show: false, sex: "男", height: 170, age: 30, weight: 65 });
    const actForm = reactive({ show: false, name: "", kcalPerMin: 8 });
    const wform = reactive({ show: false, weight: 65, date: todayStr() });

    function syncCal() { const a = state.sportActs.find((x) => x.id === form.actId); if (a) form.calories = Math.round(a.kcalPerMin * (+form.duration || 0)); }
    function openAdd() { form.id = null; form.title = "记运动"; form.actId = state.sportActs[0] ? state.sportActs[0].id : ""; form.duration = 30; form.date = todayStr(); syncCal(); form.show = true; }
    function openEditAct(r) { form.id = r.id; form.title = "编辑运动"; form.actId = r.actId; form.duration = r.duration; form.calories = r.calories; form.date = r.date; form.show = true; }
    function save() { if (!form.actId) return showToast("选个项目"); if (!form.duration) return showToast("填时长");
      if (form.id) { const r = state.sport.find((x) => x.id === form.id); if (r) Object.assign(r, { actId: form.actId, duration: +form.duration, calories: +form.calories, date: form.date }); }
      else state.sport.push({ id: uid(), kind: "exercise", actId: form.actId, duration: +form.duration, calories: +form.calories, date: form.date });
      form.show = false; showToast("已保存 ⚽"); }
    function foodCal() { food.calories = Math.round((+food.kcal100 || 0) * (+food.grams || 0) / 100); }
    function autoMeal() { const h = new Date().getHours(); if (h < 10) return "早餐"; if (h < 14) return "午餐"; if (h < 17) return "加餐"; if (h < 21) return "晚餐"; return "加餐"; }
    function openFood() { Object.assign(food, { show: true, id: null, name: "", kcal100: 0, grams: 100, calories: 0, meal: autoMeal(), custom: true, date: todayStr(), items: [] }); search.kw = ""; search.results = []; search.done = false; search.loading = false; }
    function openEditFood(r) { Object.assign(food, { show: true, id: r.id, name: r.food || "", kcal100: 0, grams: r.grams || 100, calories: r.calories || 0, meal: r.meal || "午餐", custom: !(r.grams), date: r.date, items: [] }); search.kw = ""; search.results = []; search.done = false; search.loading = false; }
    function saveFood() { if (!food.name.trim()) return showToast("填食物名称"); const c = +food.calories || 0; if (!c) return showToast("热量为 0，填一下分量或热量");
      if (food.id) { const r = state.sport.find((x) => x.id === food.id); if (r) Object.assign(r, { food: food.name.trim(), meal: food.meal, grams: food.custom ? 0 : (+food.grams || 0), calories: c, date: food.date }); }
      else state.sport.push({ id: uid(), kind: "food", food: food.name.trim(), meal: food.meal, grams: food.custom ? 0 : (+food.grams || 0), calories: c, date: food.date });
      food.show = false; showToast("已保存 🍽️"); }
    /* 同一餐记录多个食物：逐条加入本餐列表，最后统一保存 */
    function addToMeal() { if (!food.name.trim()) return showToast("填食物名称"); const c = +food.calories || 0; if (!c) return showToast("热量为 0，填一下分量或热量"); food.items.push({ name: food.name.trim(), meal: food.meal, grams: food.custom ? 0 : (+food.grams || 0), calories: c }); food.name = ""; food.kcal100 = 0; food.grams = 100; food.calories = 0; food.custom = true; search.kw = ""; search.results = []; search.done = false; search.loading = false; showToast("已加入本餐，可继续加 ➕"); }
    function delMealItem(i) { food.items.splice(i, 1); }
    function saveMeal() { if (!food.items.length) return showToast("先加入至少一个食物"); const n = food.items.length; food.items.forEach((it) => state.sport.push({ id: uid(), kind: "food", food: it.name, meal: it.meal, grams: it.grams, calories: it.calories, date: food.date })); food.items = []; food.show = false; showToast("已记录 " + n + " 个食物 🍽️"); }
    /* 统一食物搜索：本地库 + 在线（OpenFoodFacts）结果汇总在一个列表 */
    const search = reactive({ kw: "", results: [], loading: false, done: false });
    let searchTimer = null;
    function onKw() { clearTimeout(searchTimer); searchTimer = setTimeout(doSearch, 450); }
    function doSearch() {
      const q = search.kw.trim();
      const local = q ? FOODS.filter((f) => f.n.includes(q)).slice(0, 8).map((f) => ({ name: f.n, kcal: f.k, from: "local" })) : [];
      search.results = local; search.done = false; search.loading = true;
      if (!q) { search.loading = false; search.done = true; return; }
      fetch("https://world.openfoodfacts.org/cgi/search.pl?search_terms=" + encodeURIComponent(q) + "&search_simple=1&action=process&json=1&page_size=6")
        .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
        .then((j) => {
          const on = (j.products || []).filter((p) => p.product_name && /[一-龥]/.test(p.product_name)).map((p) => { const k = p.nutriments && p.nutriments["energy-kcal_100g"]; return { name: p.product_name, kcal: k ? Math.round(k) : null, brands: p.brands || "", from: "online" }; }).slice(0, 6);
          search.results = local.concat(on); search.loading = false; search.done = true;
        })
        .catch(() => { search.loading = false; search.done = true; });
    }
    function pick(r) { food.custom = false; food.name = r.name; food.kcal100 = r.kcal || 0; food.grams = 100; foodCal(); search.kw = ""; search.results = []; search.done = false; search.loading = false; }
    const bmrNow = computed(() => calcBmr(prof.sex, prof.height, prof.age, prof.weight));
    function openProf() { const p = state.sportProfile; Object.assign(prof, { sex: p.sex || "男", height: p.height || 170, age: p.age || 30, weight: p.weight || 65 }); prof.show = true; }
    function saveProf() { const p = state.sportProfile; p.sex = prof.sex; p.height = +prof.height || 170; p.age = +prof.age || 30; p.weight = +prof.weight || 65; p.bmr = calcBmr(p.sex, p.height, p.age, p.weight); prof.show = false; showToast("已保存，基础代谢 " + p.bmr + " kcal/天"); }
    function openAct() { actForm.show = true; actForm.name = ""; actForm.kcalPerMin = 8; }
    function saveAct() { if (!actForm.name.trim()) return showToast("填项目名"); state.sportActs.push({ id: uid(), name: actForm.name.trim(), kcalPerMin: +actForm.kcalPerMin || 0, custom: true }); actForm.show = false; showToast("已添加运动项目"); }
    function delAct(id) { const a = state.sportActs.find((x) => x.id === id); if (a && !a.custom) return showToast("内置项目不可删"); state.sportActs = state.sportActs.filter((x) => x.id !== id); }
    function delRec(id) { state.sport = state.sport.filter((x) => x.id !== id); showToast("已删除"); }
    const actName = (id) => { const a = state.sportActs.find((x) => x.id === id); return a ? a.name : ""; };

    function openW() { Object.assign(wform, { show: true, weight: state.sportProfile.weight || 65, date: todayStr() }); }
    function saveW() { if (!(+wform.weight)) return showToast("填体重"); state.weights.push({ id: uid(), weight: +wform.weight, date: wform.date }); state.sportProfile.weight = +wform.weight; wform.show = false; showToast("已记录 ⚖️"); }
    function delW(id) { state.weights = state.weights.filter((x) => x.id !== id); }
    const wlist = computed(() => [...state.weights].sort((a, b) => (b.date < a.date ? -1 : 1)));
    const wSeries = computed(() => { const pts = [...state.weights].sort((a, b) => (a.date < b.date ? -1 : 1)).map((w) => ({ x: new Date(w.date).getTime(), y: w.weight })); return { "体重(kg)": pts }; });
    const wChartHtml = computed(() => (wSeries.value["体重(kg)"].length ? svgLine(wSeries.value, { "体重(kg)": "#c08457" }, "日期") : ""));
    const wTrend = computed(() => { if (wlist.value.length < 2) return null; const latest = +wlist.value[0].weight, prev = +wlist.value[1].weight; return { diff: +(latest - prev).toFixed(1) }; });

    const records = computed(() => [...state.sport].sort((a, b) => (b.date < a.date ? -1 : 1)));
    const daily = computed(() => {
      const map = {};
      state.sport.forEach((r) => { map[r.date] = map[r.date] || { burn: 0, dur: 0, intake: 0 };
        if (r.kind === "exercise") { map[r.date].burn += +r.calories || 0; map[r.date].dur += +r.duration || 0; } else map[r.date].intake += +r.calories || 0; });
      return Object.keys(map).sort().reverse().map((d) => { const m = map[d]; return { date: d, burn: m.burn, dur: m.dur, intake: m.intake, deficit: (state.sportProfile.bmr || 0) + m.burn - m.intake }; });
    });
    const today = computed(() => { const r = state.sport.filter((x) => x.date === todayStr()); const burn = r.filter((x) => x.kind === "exercise").reduce((s, x) => s + (+x.calories || 0), 0); const dur = r.filter((x) => x.kind === "exercise").reduce((s, x) => s + (+x.duration || 0), 0); const intake = r.filter((x) => x.kind === "food").reduce((s, x) => s + (+x.calories || 0), 0); return { burn, dur, intake, deficit: (state.sportProfile.bmr || 0) + burn - intake }; });

    return { form, food, prof, actForm, wform, FOODS, bmrNow, search, onKw, doSearch, pick, actName, openAdd, openEditAct, save, openFood, openEditFood, foodCal, saveFood, addToMeal, saveMeal, delMealItem, openProf, saveProf, openAct, saveAct, delAct, delRec, syncCal, openW, saveW, delW, wlist, wChartHtml, wTrend, records, daily, today, state };
  },
  template: `
  <div>
    <div class="module-head">
      <div><div class="module-title"><span class="mt-ico"><img :src="iconFor('sport')"></span>减脂管理</div><div class="module-desc">热量缺口 = 基础代谢 + 运动消耗 − 饮食摄入</div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn gray" @click="openProf">⚙️ 基础设置</button>
        <button class="btn gray" @click="openAct">＋ 运动项目</button>
        <button class="btn line" @click="openW">⚖️ 记体重</button>
        <button class="btn line" @click="openFood">🍽️ 记饮食</button>
        <button class="btn" @click="openAdd">＋ 记运动</button>
      </div>
    </div>
    <div class="stats">
      <div class="stat"><div class="v">{{state.sportProfile.bmr || '—'}}</div><div class="k">基础代谢(kcal)</div></div>
      <div class="stat"><div class="v">{{today.burn}}</div><div class="k">运动消耗(kcal)</div></div>
      <div class="stat"><div class="v">{{today.intake}}</div><div class="k">饮食摄入(kcal)</div></div>
      <div class="stat"><div class="v" :class="today.deficit>=0?'':'danger'">{{today.deficit}}</div><div class="k">热量缺口(kcal)</div></div>
    </div>
    <div class="grid cards-2">
      <div class="card">
        <div style="font-weight:700;margin-bottom:10px">📅 每日汇总</div>
        <table class="tbl" v-if="daily.length"><thead><tr><th>日期</th><th>时长</th><th>消耗+</th><th>摄入−</th><th>缺口</th></tr></thead><tbody>
          <tr v-for="d in daily" :key="d.date"><td>{{d.date}}</td><td>{{d.dur}}′</td><td style="color:var(--green-deep);font-weight:600">+{{d.burn}}</td><td style="color:var(--danger);font-weight:600">−{{d.intake}}</td><td style="font-weight:700" :style="{color:d.deficit>=0?'var(--green-deep)':'var(--danger)'}">{{d.deficit>=0?'+':''}}{{d.deficit}}</td></tr>
        </tbody></table>
        <div v-else class="empty"><span class="big">🔥</span>还没有记录</div>
      </div>
      <div class="card">
        <div style="font-weight:700;margin-bottom:10px">📋 全部记录</div>
        <table class="tbl" v-if="records.length"><thead><tr><th>日期</th><th>项目</th><th>时长</th><th>热量</th><th></th></tr></thead><tbody>
          <tr v-for="r in records" :key="r.id"><td>{{r.date}}</td><td>{{r.kind==='exercise'?(actName(r.actId)):('🍽️ '+(r.meal||'')+' '+(r.food||'饮食')+(r.grams?'·'+r.grams+'g':''))}}</td><td>{{r.kind==='exercise'?r.duration+'′':'—'}}</td><td :style="{color:r.kind==='exercise'?'var(--green-deep)':'var(--danger)','font-weight':600}">{{r.kind==='exercise'?'+':'−'}}{{r.calories}}</td><td><div style="display:flex;gap:4px"><button class="icon-btn" @click="r.kind==='exercise'?openEditAct(r):openEditFood(r)">✏️</button><button class="icon-btn danger" @click="delRec(r.id)">🗑️</button></div></td></tr>
        </tbody></table>
        <div v-else class="empty"><span class="big">🔥</span>还没有记录</div>
      </div>
    </div>
    <div class="card" style="margin-top:14px">
      <div style="font-weight:700;margin-bottom:8px">⚖️ 体重趋势 <span v-if="wTrend" class="tag" :class="wTrend.diff<=0?'green':'red'" style="margin-left:6px">{{wTrend.diff>0?'+':''}}{{wTrend.diff}} kg（较上次）</span></div>
      <div v-if="wChartHtml" v-html="wChartHtml"></div>
      <div v-else class="empty" style="padding:16px 0"><span class="big">⚖️</span>记录几次体重，就能看到波动曲线</div>
      <div v-if="wlist.length" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
        <span v-for="w in wlist.slice(0,8)" :key="w.id" class="tag qing" style="display:inline-flex;align-items:center;gap:5px">{{w.date}} {{w.weight}}kg<button @click="delW(w.id)" style="border:0;background:transparent;color:var(--danger);cursor:pointer;font-size:11px;padding:0">✕</button></span>
      </div>
    </div>

    <modal :show="form.show" :title="form.title" @close="form.show=false">
      <div class="field"><label>运动项目</label><select class="select" v-model="form.actId" @change="syncCal"><option v-for="a in state.sportActs" :key="a.id" :value="a.id">{{a.name}}（{{a.kcalPerMin}} kcal/分）</option></select></div>
      <div class="row">
        <div class="field"><label>时长(分钟)</label><input class="input" type="number" min="1" v-model="form.duration" @input="syncCal"></div>
        <div class="field"><label>消耗热量(kcal)</label><input class="input" type="number" min="0" v-model="form.calories"></div>
      </div>
      <div class="field"><label>日期</label><input class="input" type="date" v-model="form.date" style="max-width:240px"></div>
      <div style="font-size:12px;color:var(--text-mute);margin:-4px 0 8px">热量 = 项目单位消耗 × 时长，自动估算，可改。</div>
      <div style="text-align:right"><button class="btn" @click="save">保存</button></div>
    </modal>

    <modal :show="food.show" :title="food.id?'编辑饮食':'记饮食摄入'" @close="food.show=false">
      <div class="row">
        <div class="field"><label>餐次</label><select class="select" v-model="food.meal"><option>早餐</option><option>午餐</option><option>晚餐</option><option>加餐</option></select></div>
        <div class="field"><label>日期</label><input class="input" type="date" v-model="food.date"></div>
      </div>
      <div class="field">
        <label>🔍 搜索食物（本地库 + 在线一起搜）</label>
        <div style="display:flex;gap:6px">
          <input class="input" v-model="search.kw" placeholder="输入食物名，如：披萨 / 红烧肉" @input="onKw" @keyup.enter="doSearch">
          <button class="btn sm" @click="doSearch">{{search.loading?'…':'搜索'}}</button>
        </div>
        <div v-if="search.results.length" style="margin-top:8px;display:flex;flex-direction:column;gap:4px">
          <div v-for="r in search.results" :key="r.name+r.from" style="display:flex;align-items:center;gap:6px;background:var(--panel-2);border:1px solid var(--border);border-radius:8px;padding:5px 8px">
            <span style="flex:1;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{r.name}}<span v-if="r.brands" style="color:var(--text-mute)"> · {{r.brands}}</span></span>
            <span style="font-size:10.5px;color:var(--text-mute);flex-shrink:0">{{r.from==='local'?'本地':'在线'}}</span>
            <span style="font-size:12px;color:var(--green-deep);font-weight:600;flex-shrink:0">{{r.kcal!=null?r.kcal+' kcal/100g':'—'}}</span>
            <button class="btn sm" @click="pick(r)">选用</button>
          </div>
        </div>
        <div v-if="search.done&&!search.results.length&&!search.loading" style="font-size:12px;color:var(--text-mute);margin-top:6px">没搜到？直接在下面手填名称和热量。</div>
      </div>
      <div class="row">
        <div class="field"><label>食物名称</label><input class="input" v-model="food.name" placeholder="选搜索结果或手填"></div>
        <div class="field"><label>每100g热量(kcal)</label><input class="input" type="number" min="0" v-model="food.kcal100" @input="foodCal"></div>
      </div>
      <div class="row">
        <div class="field"><label>分量(克)</label><input class="input" type="number" min="1" v-model="food.grams" @input="foodCal"></div>
        <div class="field"><label>摄入热量(kcal)</label><input class="input" type="number" min="0" v-model="food.calories"></div>
      </div>
      <div style="font-size:12px;color:var(--text-mute);margin:-4px 0 8px">点搜索结果自动填名称和每100g热量，再按「分量 × 每100g」算总热量，可手动改。</div>

      <div v-if="!food.id">
        <button class="btn line" style="width:100%" @click="addToMeal">➕ 加入本餐</button>
        <div v-if="food.items.length" style="margin-top:10px">
          <div style="font-size:12px;font-weight:600;color:var(--text-mute);margin-bottom:6px">已加入本餐（{{food.items.length}}）</div>
          <div v-for="(it,i) in food.items" :key="i" style="display:flex;align-items:center;gap:8px;background:var(--panel-2);border:1px solid var(--border);border-radius:8px;padding:6px 9px;margin-bottom:5px">
            <span style="flex:1;font-size:13px">{{it.name}}<span style="color:var(--text-mute);font-size:11px"> · {{it.meal}}{{it.grams?(' · '+it.grams+'g'):''}}</span></span>
            <span style="font-size:12px;color:var(--danger);font-weight:600">−{{it.calories}}</span>
            <button class="icon-btn danger" @click="delMealItem(i)">✕</button>
          </div>
        </div>
        <div style="text-align:right;margin-top:10px"><button class="btn" :disabled="!food.items.length" @click="saveMeal">保存本餐（{{food.items.length}}个）</button></div>
      </div>
      <div v-else style="text-align:right;margin-top:6px"><button class="btn" @click="saveFood">保存</button></div>
    </modal>

    <modal :show="prof.show" :title="'基础信息（自动算基础代谢）'" @close="prof.show=false">
      <div class="row">
        <div class="field"><label>性别</label><select class="select" v-model="prof.sex"><option>男</option><option>女</option></select></div>
        <div class="field"><label>身高(cm)</label><input class="input" type="number" v-model="prof.height"></div>
      </div>
      <div class="row">
        <div class="field"><label>年龄(岁)</label><input class="input" type="number" v-model="prof.age"></div>
        <div class="field"><label>体重(kg)</label><input class="input" type="number" v-model="prof.weight"></div>
      </div>
      <div class="hint">💡 基础代谢（Mifflin-St Jeor）自动计算：<b style="color:var(--green-deep)">{{bmrNow}}</b> kcal/天（男 +5 / 女 −161）。热量缺口 = 基础代谢 + 运动消耗 − 饮食摄入。</div>
      <div style="text-align:right"><button class="btn" @click="saveProf">保存</button></div>
    </modal>

    <modal :show="wform.show" :title="'记录体重'" @close="wform.show=false">
      <div class="pl-grid"><div class="field"><label>体重(kg)</label><input class="input" type="number" step="0.1" v-model="wform.weight"></div><div class="field"><label>日期</label><input class="input" type="date" v-model="wform.date"></div></div>
      <div style="text-align:right"><button class="btn" @click="saveW">保存</button></div>
    </modal>

    <modal :show="actForm.show" :title="'新增运动项目'" @close="actForm.show=false">
      <div class="row"><div class="field"><label>项目名称</label><input class="input" v-model="actForm.name" placeholder="如：爬楼"></div><div class="field"><label>单位消耗(kcal/分)</label><input class="input" type="number" v-model="actForm.kcalPerMin"></div></div>
      <div style="text-align:right"><button class="btn" @click="saveAct">保存</button></div>
    </modal>
  </div>`,
};

/* =========================================================
   组件：理财管理
   ========================================================= */
const Finance = {
  components: { Modal },
  setup() {
    const filter = ref("全部");
    const typeF = ref("全部");
    const form = reactive({ show: false, title: "记支出", id: null, type: "expense", amount: 0, category: "餐饮", date: todayStr(), note: "" });
    const expCats = ["餐饮", "房租", "购物", "交通", "育儿", "医疗", "娱乐", "教育", "理财收益", "其他"];
    const incCats = ["工资", "理财收益", "红包", "兼职", "其他"];

    function inRange(d) { const t = todayStr(); if (filter.value === "今日") return d === t; if (filter.value === "本月") return d.slice(0, 7) === t.slice(0, 7); if (filter.value === "本周") { const diff = dayDiff(d, t); const wd = new Date(t).getDay(); return diff >= -wd && diff < 7 - wd; } return true; }
    const sum = (arr, type) => arr.filter((r) => r.type === type && inRange(r.date)).reduce((s, r) => s + (+r.amount || 0), 0);
    const stat = computed(() => { const a = state.finance; return { inc: sum(a, "income"), exp: sum(a, "expense") }; });
    const statBal = computed(() => stat.value.inc - stat.value.exp);
    const list = computed(() => state.finance.filter((r) => inRange(r.date) && (typeF.value === "全部" || r.type === typeF.value)).sort((a, b) => (b.date < a.date ? -1 : 1)));

    const expByCat = computed(() => { const m = {}; state.finance.filter((r) => r.type === "expense").forEach((r) => (m[r.category] = (m[r.category] || 0) + (+r.amount || 0))); return m; });
    const incByCat = computed(() => { const m = {}; state.finance.filter((r) => r.type === "income").forEach((r) => (m[r.category] = (m[r.category] || 0) + (+r.amount || 0))); return m; });
    const expPie = computed(() => Object.keys(expByCat.value).length ? svgPie(expByCat.value) : "");
    const incPie = computed(() => Object.keys(incByCat.value).length ? svgPie(incByCat.value) : "");

    function open(type) { Object.assign(form, { show: true, title: type === "income" ? "记收入" : "记支出", id: null, type, amount: 0, category: type === "income" ? "工资" : "餐饮", date: todayStr(), note: "" }); }
    function openEdit(r) { Object.assign(form, { show: true, title: r.type === "income" ? "编辑收入" : "编辑支出", id: r.id, type: r.type, amount: r.amount, category: r.category, date: r.date, note: r.note || "" }); }
    function save() { if (!form.amount) return showToast("填金额"); if (form.id) { const r = state.finance.find((x) => x.id === form.id); if (r) Object.assign(r, { type: form.type, amount: +form.amount, category: form.category, date: form.date, note: form.note.trim() }); } else state.finance.push({ id: uid(), type: form.type, amount: +form.amount, category: form.category, date: form.date, note: form.note.trim() }); form.show = false; showToast("已保存"); }
    function del(id) { state.finance = state.finance.filter((x) => x.id !== id); showToast("已删除"); }
    function cats() { return form.type === "income" ? incCats : expCats; }
    return { filter, typeF, form, expCats, incCats, stat, statBal, list, incPie, expPie, open, openEdit, save, del, cats };
  },
  template: `
  <div>
    <div class="module-head">
      <div><div class="module-title"><span class="mt-ico"><img :src="iconFor('finance')"></span>理财管理</div><div class="module-desc">收支台账，结余一目了然</div></div>
      <div style="display:flex;gap:8px"><button class="btn line" @click="open('income')">＋ 收入</button><button class="btn" @click="open('expense')">＋ 支出</button></div>
    </div>
    <div class="stats">
      <div class="stat"><div class="v">{{stat.inc}}</div><div class="k">{{filter}}收入</div></div>
      <div class="stat"><div class="v warn">{{stat.exp}}</div><div class="k">{{filter}}支出</div></div>
      <div class="stat"><div class="v">{{statBal}}</div><div class="k">{{filter}}结余</div></div>
    </div>
    <div class="grid cards-2">
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="chart-wrap">
          <div style="font-weight:700;margin-bottom:10px">📈 收入分类占比</div>
          <div v-if="incPie" v-html="incPie"></div>
          <div v-else class="empty"><span class="big">🪙</span>还没有收入记录</div>
        </div>
        <div class="chart-wrap">
          <div style="font-weight:700;margin-bottom:10px">🍩 支出分类占比</div>
          <div v-if="expPie" v-html="expPie"></div>
          <div v-else class="empty"><span class="big">🪙</span>还没有支出记录</div>
        </div>
      </div>
      <div class="card">
      <div class="toolbar" style="margin-bottom:10px">
        <button class="chip" :class="{active:filter==='全部'}" @click="filter='全部'">全部</button>
        <button class="chip" :class="{active:filter==='今日'}" @click="filter='今日'">今日</button>
        <button class="chip" :class="{active:filter==='本周'}" @click="filter='本周'">本周</button>
        <button class="chip" :class="{active:filter==='本月'}" @click="filter='本月'">本月</button>
        <button class="chip" :class="{active:typeF==='全部'}" @click="typeF='全部'">全部类型</button>
        <button class="chip" :class="{active:typeF==='income'}" @click="typeF='income'">收入</button>
        <button class="chip" :class="{active:typeF==='expense'}" @click="typeF='expense'">支出</button>
      </div>
      <table class="tbl" v-if="list.length"><thead><tr><th>日期</th><th>类型</th><th>分类</th><th>金额</th><th>备注</th><th></th></tr></thead><tbody>
        <tr v-for="r in list" :key="r.id"><td>{{r.date}}</td><td><span class="tag" :class="r.type==='income'?'blue':'red'">{{r.type==='income'?'收入':'支出'}}</span></td><td>{{r.category}}</td><td :style="{color:r.type==='income'?'var(--green-deep)':'var(--danger)','font-weight':600}">{{r.type==='income'?'+':'−'}}{{r.amount}}</td><td style="color:var(--text-mute)">{{r.note}}</td><td><button class="icon-btn" @click="openEdit(r)" title="编辑">✏️</button><button class="icon-btn danger" @click="del(r.id)" title="删除">🗑️</button></td></tr>
      </tbody></table>
      <div v-else class="empty"><span class="big">🪙</span>暂无记录</div>
      </div>
    </div>

    <modal :show="form.show" :title="form.title" @close="form.show=false">
      <div class="pl-grid">
        <div class="field"><label>金额</label><input class="input" type="number" step="0.01" v-model="form.amount"></div>
        <div class="field"><label>分类</label><select class="select" v-model="form.category"><option v-for="c in cats()" :key="c" :value="c">{{c}}</option></select></div>
        <div class="field"><label>日期</label><input class="input" type="date" v-model="form.date"></div>
        <div class="field"><label>备注</label><input class="input" v-model="form.note"></div>
      </div>
      <div style="text-align:right"><button class="btn" @click="save">保存</button></div>
    </modal>
  </div>`,
};

/* =========================================================
   组件：纪念日
   ========================================================= */
const Anniv = {
  components: { Modal },
  setup() {
    const form = reactive({ show: false, title: "新建纪念日", id: null, name: "", date: todayStr(), type: "生日", repeat: true, lunar: false, ly: new Date().getFullYear(), lm: 8, ld: 15 });
    const lunarYears = (() => { const a = []; for (let y = 1900; y <= 2035; y++) a.push(y); return a; })();
    const list = computed(() => state.anniv.map((a) => ({ ...a, days: annivDays(a) })).sort((x, y) => x.days - y.days));
    const TYPES = ["生日", "纪念日", "节日", "证件到期日", "其他"];
    const cat = ref("全部");
    const view = computed(() => cat.value === "全部" ? list.value : list.value.filter((a) => a.type === cat.value));
    function openAdd() { Object.assign(form, { show: true, title: "新建纪念日", id: null, name: "", date: todayStr(), type: "生日", repeat: true, lunar: false, ly: new Date().getFullYear(), lm: 8, ld: 15 }); }
    function openEdit(a) {
      Object.assign(form, { show: true, title: "编辑纪念日", id: a.id, name: a.name, date: a.date, type: a.type, repeat: a.repeat, lunar: !!a.lunar, ly: (a.lunar && a.lunar.y) || new Date().getFullYear(), lm: (a.lunar && a.lunar.m) || 8, ld: (a.lunar && a.lunar.d) || 15 });
    }
    function save() {
      if (!form.name.trim()) return showToast("填名称");
      const date = form.lunar ? lunarToSolar(form.ly, form.lm, form.ld) : form.date;
      const lunar = form.lunar ? { y: +form.ly, m: +form.lm, d: +form.ld } : null;
      if (form.id) { const a = state.anniv.find((x) => x.id === form.id); Object.assign(a, { name: form.name.trim(), date, type: form.type, repeat: form.repeat, lunar }); }
      else state.anniv.push({ id: uid(), name: form.name.trim(), date, type: form.type, repeat: form.repeat, lunar });
      form.show = false; syncPlanTasks(); showToast("已添加，并同步到日程管理");
    }
    function del(id) { state.anniv = state.anniv.filter((x) => x.id !== id); syncPlanTasks(); showToast("已删除"); }
    return { form, list, lunarYears, TYPES, cat, view, openAdd, openEdit, save, del };
  },
  template: `
  <div>
    <div class="module-head">
      <div><div class="module-title"><span class="mt-ico"><img :src="iconFor('anniv')"></span>纪念日</div><div class="module-desc">重要日子自动倒数，并同步到日程管理日历</div></div>
      <button class="btn" @click="openAdd">＋ 新建</button>
    </div>
    <div class="tabs" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
      <button class="chip" :class="{active:cat==='全部'}" @click="cat='全部'">全部</button>
      <button class="chip" v-for="t in TYPES" :key="t" :class="{active:cat===t}" @click="cat=t">{{t}}</button>
    </div>
    <div class="grid cards-auto">
      <div class="card" v-for="a in view" :key="a.id">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div style="font-weight:700;font-size:15.5px">{{a.name}}</div>
          <span class="tag" :class="a.days<=7?(a.days===0?'red':'warn'):'gray'">{{a.days===0?'就是今天！🎈':a.days+' 天后'}}</span>
        </div>
        <div class="meta" style="margin-top:8px"><span class="tag blue">{{a.type}}</span><span>📅 {{a.date}}<span v-if="a.lunar" style="color:var(--text-soft)">（农历{{a.lunar.m}}月{{a.lunar.d}}日）</span>{{a.repeat?'（每年）':''}}</span></div>
        <div style="display:flex;gap:8px;margin-top:12px"><button class="icon-btn" @click="openEdit(a)" title="编辑">✏️</button><button class="icon-btn danger" @click="del(a.id)" title="删除">🗑️</button></div>
      </div>
      <div v-if="!view.length" class="empty" style="grid-column:1/-1"><span class="big">🎂</span>还没有纪念日</div>
    </div>

    <modal :show="form.show" :title="form.title" @close="form.show=false">
      <div class="field"><label>名称</label><input class="input" v-model="form.name"></div>
      <div style="display:flex;gap:6px;margin-bottom:10px">
        <button class="chip" :class="{active:!form.lunar}" @click="form.lunar=false">公历</button>
        <button class="chip" :class="{active:form.lunar}" @click="form.lunar=true">农历</button>
      </div>
      <div v-if="!form.lunar" class="pl-grid">
        <div class="field"><label>日期</label><input class="input" type="date" v-model="form.date"></div>
        <div class="field"><label>类型</label><select class="select" v-model="form.type"><option>生日</option><option>纪念日</option><option>节日</option><option>证件到期日</option><option>其他</option></select></div>
      </div>
      <div v-else>
        <div class="row">
          <div class="field"><label>农历年</label><select class="select" v-model="form.ly"><option v-for="y in lunarYears" :key="y" :value="y">{{y}}年</option></select></div>
          <div class="field"><label>农历月</label><select class="select" v-model="form.lm"><option v-for="m in 12" :key="m" :value="m">{{m}}月</option></select></div>
          <div class="field"><label>农历日</label><select class="select" v-model="form.ld"><option v-for="d in 30" :key="d" :value="d">{{d}}日</option></select></div>
        </div>
        <div class="hint" style="margin:-2px 0 4px">自动换算为公历保存，每年重复按公历提醒；农历日期按所选年份换算。</div>
      </div>
      <div class="field"><label style="display:flex;align-items:center;gap:6px;font-weight:600;color:var(--text-soft)"><input type="checkbox" v-model="form.repeat" style="width:15px;height:15px;accent-color:var(--green)"> 每年重复</label></div>
      <div style="text-align:right"><button class="btn" @click="save">保存</button></div>
    </modal>
  </div>`,
};

/* =========================================================
   组件：宝宝养育
   ========================================================= */
/* 最新国标《7 岁以下儿童生长标准》WS/T 423-2022 中位数（P50），0-60 月，分性别 m=男 f=女 */
const GROWTH = {
  weight: {
    m: { 0: 3.32, 1: 4.51, 2: 5.68, 3: 6.64, 4: 7.44, 5: 8.11, 6: 8.67, 7: 9.14, 8: 9.54, 9: 9.90, 10: 10.23, 11: 10.53, 12: 10.80, 15: 11.53, 18: 12.20, 21: 12.82, 24: 13.38, 27: 13.92, 30: 14.43, 33: 14.92, 36: 15.38, 42: 16.30, 48: 17.21, 54: 18.13, 60: 19.05 },
    f: { 0: 3.24, 1: 4.24, 2: 5.27, 3: 6.12, 4: 6.83, 5: 7.43, 6: 7.94, 7: 8.38, 8: 8.77, 9: 9.11, 10: 9.42, 11: 9.71, 12: 9.98, 15: 10.68, 18: 11.30, 21: 11.88, 24: 12.41, 27: 12.91, 30: 13.38, 33: 13.84, 36: 14.28, 42: 15.13, 48: 15.98, 54: 16.86, 60: 17.75 },
  },
  height: {
    m: { 0: 49.9, 1: 54.7, 2: 58.4, 3: 61.4, 4: 63.9, 5: 66.0, 6: 67.8, 7: 69.5, 8: 71.0, 9: 72.4, 10: 73.7, 11: 74.9, 12: 76.1, 15: 79.1, 18: 82.0, 21: 84.7, 24: 87.2, 27: 89.5, 30: 91.6, 33: 93.6, 36: 95.4, 42: 99.0, 48: 102.6, 54: 105.9, 60: 109.1 },
    f: { 0: 49.2, 1: 53.7, 2: 57.1, 3: 59.8, 4: 62.1, 5: 64.1, 6: 65.7, 7: 67.3, 8: 68.7, 9: 70.1, 10: 71.3, 11: 72.5, 12: 73.7, 15: 77.2, 18: 80.3, 21: 83.2, 24: 85.7, 27: 88.0, 30: 90.1, 33: 92.0, 36: 93.9, 42: 97.6, 48: 101.2, 54: 104.5, 60: 107.7 },
  },
  head: {
    m: { 0: 34.5, 1: 37.3, 2: 39.2, 3: 40.7, 4: 41.8, 5: 42.7, 6: 43.5, 7: 44.1, 8: 44.6, 9: 45.0, 10: 45.4, 11: 45.7, 12: 46.0, 15: 46.6, 18: 47.1, 21: 47.4, 24: 47.7, 27: 48.0, 30: 48.2, 33: 48.4, 36: 48.6, 42: 48.9, 48: 49.2, 54: 49.5, 60: 49.7 },
    f: { 0: 33.9, 1: 36.5, 2: 38.3, 3: 39.7, 4: 40.8, 5: 41.7, 6: 42.4, 7: 43.0, 8: 43.5, 9: 44.0, 10: 44.3, 11: 44.7, 12: 45.0, 15: 45.6, 18: 46.1, 21: 46.5, 24: 46.8, 27: 47.1, 30: 47.4, 33: 47.6, 36: 47.8, 42: 48.2, 48: 48.5, 54: 48.8, 60: 49.1 },
  },
};
/* 国标 P50 插值：sex = "m"|"f" */
function growthRef(key, sex, months) {
  const t = (GROWTH[key] || {})[sex === "女" || sex === "f" ? "f" : "m"] || GROWTH[key].m || {};
  const ks = Object.keys(t).map(Number).sort((a, b) => a - b);
  if (!ks.length) return 0;
  if (months <= ks[0]) return t[ks[0]];
  if (months >= ks[ks.length - 1]) return t[ks[ks.length - 1]];
  for (let i = 0; i < ks.length - 1; i++) { if (months >= ks[i] && months <= ks[i + 1]) { const r = (months - ks[i]) / (ks[i + 1] - ks[i]); return t[ks[i]] + (t[ks[i + 1]] - t[ks[i]]) * r; } }
  return t[ks[ks.length - 1]];
}
/* 兼容旧调用：默认按男童 */
function median(key, months) { return growthRef(key, "m", months); }
/* 成长评估：sex 可传 "男"/"女"/"m"/"f"，缺省按男童 */
function growthFlag(key, months, val, sex) { const m = growthRef(key, sex, months); if (val < m * 0.85) return "偏低"; if (val > m * 1.15) return "偏高"; return "正常"; }

function babyAge(birth) { if (!birth) return null; const diff = dayDiff(todayStr(), birth); const months = Math.floor(diff / 30.44); const y = Math.floor(months / 12); const m = months % 12; return { months, text: y > 0 ? y + "岁" + (m ? m + "个月" : "") : months + "个月" }; }
function foodRec(months) {
  if (months == null) return { stage: "未设置", foods: [], note: "先在「宝宝信息」里填好出生日期～" };
  if (months < 6) return { stage: "0-6 月", foods: ["母乳 / 配方奶（主食）"], note: "未满 6 个月以奶为主，暂不加辅食。" };
  if (months < 8) return { stage: "6-8 月", foods: ["米粉（调稀糊）", "胡萝卜泥", "南瓜泥", "西兰花泥", "苹果泥", "香蕉泥", "蛋黄泥（少量）"], note: "细软泥状、天然微甜，不加盐不加肉。" };
  if (months < 10) return { stage: "8-10 月", foods: ["烂粥", "碎菜末", "豆腐脑", "蒸蛋羹", "土豆泥", "山药泥", "鱼泥（去刺、极少量）"], note: "软糯好吞咽，口味清淡带天然甜味，避开肉块与硬物。" };
  if (months < 12) return { stage: "10-12 月", foods: ["软面条", "迷你馄饨皮（煮烂）", "蒸蛋糕", "蔬果小丁（软）", "酸奶", "豆腐"], note: "尝试手指食物但要够软，依然少肉、不咸不硬。" };
  return { stage: "1 岁 +", foods: ["软饭", "番茄鸡蛋面", "蔬菜小饼", "蒸蛋", "酸奶水果", "豆腐丸子（软）", "南瓜浓汤"], note: "口味丰富些，肉类做成肉松/肉糜少量尝试；宝宝不爱可暂缓，主推蔬果蛋奶。" };
}
function eduRec(months) {
  if (months == null) return { stage: "未设置", items: [], note: "先在「宝宝信息」里填好出生日期～" };
  if (months < 3) return { stage: "0-3 月", items: ["黑白卡追视训练", "轻柔抚触按摩", "听舒缓人声/音乐", "面对面微笑交流"], note: "以感官刺激和亲子联结为主，每次几分钟即可，别累着宝宝。" };
  if (months < 6) return { stage: "3-6 月", items: ["俯卧抬头练习", "摇铃追声抓握", "照镜子认脸", "躲猫猫游戏"], note: "练习抬头与手眼协调，多和宝宝面对面说话、唱儿歌。" };
  if (months < 9) return { stage: "6-9 月", items: ["积木对敲", "指认日常物品", "儿歌互动回应", "鼓励爬行探索"], note: "语言输入要丰富，鼓励爬行，锻炼双侧协调。" };
  if (months < 12) return { stage: "9-12 月", items: ["翻布书指图", "模仿拍手/再见", "听懂简单指令『给妈妈』", "扶站扶走"], note: "理解简单指令，大动作快速发展，多示范。" };
  if (months < 18) return { stage: "12-18 月", items: ["叠高积木", "涂鸦乱画", "命名身边物品", "滚球互动"], note: "语言爆发期，抓住机会多对话、多命名。" };
  if (months < 24) return { stage: "18-24 月", items: ["简单拼图", "角色扮演(喂娃娃)", "唱完整儿歌", "颜色/形状配对"], note: "象征性游戏萌芽，培养归类与因果意识。" };
  if (months < 36) return { stage: "24-36 月", items: ["讲故事+提问", "数数 1-10", "过家家情景游戏", "轮流社交游戏"], note: "语言与社交飞速发展，多互动、多提问。" };
  return { stage: "3 岁 +", items: ["认字涂色", "逻辑分类游戏", "拍球/跳绳", "角色扮演『买东西』"], note: "认知与运动并进，建立规律作息和规则意识。" };
}

const Baby = {
  components: { Modal },
  setup() {
    const prof = reactive({ show: false, name: "", birth: "", sex: "男" });
    const form = reactive({ show: false, dt: "", h: "", w: "", hc: "", vax: "", note: "" });
    const TYPES = ["身高", "体重", "头围", "疫苗", "备注"];
    const UNIT = { 身高: "cm", 体重: "kg", 头围: "cm", 疫苗: "", 备注: "" };
    const G_COLORS = { 体重: "#5fa98a", 身高: "#7fa8d9", 头围: "#d99a4e" };
    const KEY_OF = { 体重: "weight", 身高: "height", 头围: "head" };

    const age = computed(() => babyAge(state.babyProfile.birth));
    const rec = computed(() => foodRec(age.value ? age.value.months : null));
    const edu = computed(() => eduRec(age.value ? age.value.months : null));
    const sex = computed(() => (state.babyProfile.sex === "女" ? "f" : "m"));

    function toLocal(ts) { const d = new Date(ts); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes()); }
    function openProf() { Object.assign(prof, { show: true, name: state.babyProfile.name || "", birth: state.babyProfile.birth || "", sex: state.babyProfile.sex || "男" }); }
    function saveProf() { state.babyProfile.name = prof.name.trim() || "宝宝"; state.babyProfile.birth = prof.birth; state.babyProfile.sex = prof.sex; prof.show = false; showToast("已保存"); }
    function del(id) { state.baby = state.baby.filter((x) => x.id !== id); }

    function ageMonthsAt(ts) { if (!state.babyProfile.birth) return 0; return Math.floor(dayDiff(fmtDate(ts), state.babyProfile.birth) / 30.44); }
    /* 成长曲线：用户数据 + 最新国标 P50 中位虚线（默认显示，无需先有记录） */
    const growthLine = computed(() => {
      const ser = { 体重: [], 身高: [], 头围: [] };
      state.baby.forEach((r) => { if (["体重", "身高", "头围"].includes(r.type) && r.value !== "" && !isNaN(+r.value)) ser[r.type].push({ x: ageMonthsAt(r.datetime), y: +r.value }); });
      Object.keys(ser).forEach((k) => ser[k].sort((a, b) => a.x - b.x));
      const hasBirth = !!state.babyProfile.birth;
      let maxMo = 60;
      Object.values(ser).forEach((a) => a.forEach((p) => { if (p.x > maxMo) maxMo = p.x; }));
      if (maxMo < 36) maxMo = 36;
      const out = {}; const outC = {};
      Object.keys(ser).forEach((k) => {
        if (ser[k].length) { out[k] = ser[k]; outC[k] = G_COLORS[k]; }
        if (hasBirth) { const ref = []; for (let m = 0; m <= maxMo; m += 3) ref.push({ x: m, y: Math.round(growthRef(KEY_OF[k], sex.value, m) * 10) / 10 }); out[k + " P50"] = ref; outC[k + " P50"] = G_COLORS[k] + "|4 3"; }
      });
      const any = Object.values(ser).some((a) => a.length >= 2) || (hasBirth && Object.keys(ser).length > 0);
      return any ? svgLine(out, outC, "月龄") : "";
    });
    /* 单条记录成长评估（身高/体重/头围 → 按月龄对照国标 P50） */
    function flagOf(r) { if (!["身高", "体重", "头围"].includes(r.type) || r.value === "") return "—"; return growthFlag(KEY_OF[r.type], ageMonthsAt(r.datetime), +r.value, sex.value); }
    /* 全部成长数据逐条评估（按时间倒序） */
    const evals = computed(() => state.baby.filter((x) => ["身高", "体重", "头围"].includes(x.type) && x.value !== "").map((r) => { const mo = ageMonthsAt(r.datetime); return { ...r, mo, flag: growthFlag(KEY_OF[r.type], mo, +r.value, sex.value) }; }).sort((a, b) => b.datetime - a.datetime));
    /* 成长评估：固定显示约 3 条高度，侧边滚动条拉动看全部 */
    /* 养育时间线（按时间分组：同一时间的记录合并一行，按时间倒序） */
    const timeline = computed(() => {
      const groups = {};
      state.baby.forEach((r) => { (groups[r.datetime] = groups[r.datetime] || []).push(r); });
      return Object.keys(groups).sort((a, b) => +b - +a).map((dt) => ({ dt: +dt, items: groups[dt] }));
    });
    function valOf(items, type) { const r = items.find((x) => x.type === type); return r && r.value !== "" ? r.value : ""; }
    function noteOf(items) { const r = items.find((x) => x.note && x.note.trim() !== ""); return r ? r.note : ""; }
    function evalsOf(items) { return items.filter((x) => ["身高", "体重", "头围"].includes(x.type) && x.value !== "").map((r) => ({ type: r.type, flag: flagOf(r) })); }
    function delGroup(dt) { state.baby = state.baby.filter((x) => x.datetime !== dt); showToast("已删除该时间记录"); }
    /* 弹窗录入：所有字段平铺，填了哪项记哪条 */
    function openAdd() { Object.assign(form, { show: true, dt: toLocal(Date.now()), h: "", w: "", hc: "", vax: "", note: "" }); }
    function save() {
      const dt = new Date(form.dt).getTime();
      let n = 0;
      const add = (type, value, note) => { state.baby.push({ id: uid(), type, value, datetime: dt, note: (note || "").trim() }); n++; };
      if (form.h !== "") add("身高", form.h, "");
      if (form.w !== "") add("体重", form.w, "");
      if (form.hc !== "") add("头围", form.hc, "");
      if (form.vax.trim() !== "") add("疫苗", form.vax.trim(), "");
      if (form.note.trim() !== "") add("备注", "", form.note);
      if (!n) return showToast("至少填一项");
      form.show = false;
      Object.assign(form, { dt: toLocal(Date.now()), h: "", w: "", hc: "", vax: "", note: "" });
      showToast("已记录 " + n + " 条 🍼");
    }

    return { prof, form, TYPES, UNIT, age, rec, edu, openProf, saveProf, openAdd, save, del, delGroup, valOf, noteOf, evalsOf, growthLine, flagOf, evals, timeline, state };
  },
  template: `
  <div>
    <div class="module-head">
      <div><div class="module-title"><span class="mt-ico"><img :src="iconFor('baby')"></span>宝宝养育</div><div class="module-desc">{{state.babyProfile.name||'宝宝'}}{{age?(' · '+age.text):''}} · 成长精细化记录</div></div>
      <div style="display:flex;gap:8px"><button class="btn gray" @click="openProf">🍼 宝宝信息</button><button class="btn" @click="openAdd">＋ 记一笔</button></div>
    </div>

    <div class="grid cards-2" style="margin-bottom:14px">
      <div class="card">
        <div style="font-weight:700;margin-bottom:8px">🍲 今日辅食推荐 <span class="tag qing" v-if="age">{{rec.stage}}</span></div>
        <div v-if="rec.foods.length" style="display:flex;flex-wrap:wrap;gap:7px"><span class="tag" v-for="f in rec.foods" :key="f">{{f}}</span></div>
        <div style="font-size:12.5px;color:var(--text-soft);margin-top:10px">💡 {{rec.note}}</div>
      </div>
      <div class="card">
        <div style="font-weight:700;margin-bottom:8px">📚 早教内容推荐 <span class="tag green" v-if="age">{{edu.stage}}</span></div>
        <div v-if="edu.items.length" style="display:flex;flex-wrap:wrap;gap:7px"><span class="tag green" v-for="it in edu.items" :key="it">{{it}}</span></div>
        <div style="font-size:12.5px;color:var(--text-soft);margin-top:10px">💡 {{edu.note}}</div>
      </div>
    </div>

    <div class="card" style="margin-bottom:14px">
      <div style="font-weight:700;margin-bottom:8px">📈 成长评估 <span class="tag qing" v-if="evals.length">共 {{evals.length}} 条</span></div>
      <div v-if="evals.length" class="ev-scroll">
        <div v-for="(e,i) in evals" :key="i" class="dash-line" style="align-items:center">
          <span>{{e.type}} {{e.value}}{{UNIT[e.type]}} · {{e.mo}}月龄</span>
          <b :style="{color: e.flag==='正常'?'var(--green-deep)':(e.flag==='偏低'?'var(--warn)':'var(--danger)')}">参考{{e.flag}}</b>
        </div>
      </div>
      <div v-if="!evals.length" class="empty" style="padding:12px 0">记录身高/体重/头围后评估</div>
      <div style="font-size:12px;color:var(--text-mute);margin-top:6px">逐条按月龄对照中位值估算，仅供参考，异常请遵医嘱。</div>
    </div>

    <div class="chart-wrap" style="margin-bottom:14px">
      <div style="font-weight:700;margin-bottom:10px">📈 成长曲线（按月龄）<span class="tag qing" v-if="state.babyProfile.birth">{{state.babyProfile.sex||'男'}}宝宝 · 国标P50参考</span></div>
      <div v-if="growthLine" v-html="growthLine"></div>
      <div v-else class="empty"><span class="big">📏</span>先在「宝宝信息」填出生日期，即显示最新国标 P50 中位参考线；记录身高/体重/头围后生成实际曲线</div>
    </div>

    <div class="card">
      <div style="font-weight:700;margin-bottom:10px">📋 养育时间线</div>
      <div style="overflow-x:auto">
      <table class="tbl" v-if="timeline.length"><thead><tr><th>时间</th><th>身高</th><th>体重</th><th>头围</th><th>疫苗</th><th>备注</th><th>成长评估</th><th></th></tr></thead><tbody>
        <tr v-for="g in timeline" :key="g.dt">
          <td style="white-space:nowrap">{{fmtDateTime(g.dt)}}</td>
          <td>{{valOf(g.items,'身高')!==''?valOf(g.items,'身高')+' cm':'—'}}</td>
          <td>{{valOf(g.items,'体重')!==''?valOf(g.items,'体重')+' kg':'—'}}</td>
          <td>{{valOf(g.items,'头围')!==''?valOf(g.items,'头围')+' cm':'—'}}</td>
          <td>{{valOf(g.items,'疫苗')!==''?valOf(g.items,'疫苗'):'—'}}</td>
          <td style="color:var(--text-mute)">{{noteOf(g.items)||'—'}}</td>
          <td><template v-if="evalsOf(g.items).length"><span v-for="e in evalsOf(g.items)" :key="e.type" class="tag" :class="e.flag==='正常'?'green':(e.flag==='偏低'?'qing':'red')">{{e.type}} 参考{{e.flag}}</span></template><span v-else>—</span></td>
          <td><button class="icon-btn danger" @click="delGroup(g.dt)" title="删除该时间全部记录">🗑️</button></td>
        </tr>
      </tbody></table>
      </div>
      <div v-if="!timeline.length" class="empty"><span class="big">🍼</span>还没有记录</div>
    </div>

    <modal :show="prof.show" :title="'宝宝信息'" @close="prof.show=false">
      <div class="row">
        <div class="field"><label>宝宝称呼</label><input class="input" v-model="prof.name"></div>
        <div class="field"><label>性别</label><select class="select" v-model="prof.sex"><option>男</option><option>女</option></select></div>
      </div>
      <div class="field"><label>出生日期</label><input class="input" type="date" v-model="prof.birth" style="max-width:240px"></div>
      <div class="hint">💡 性别用于对照最新国标《7 岁以下儿童生长标准》对应 P50 曲线与评估。</div>
      <div style="text-align:right"><button class="btn" @click="saveProf">保存</button></div>
    </modal>

    <modal :show="form.show" title="记一笔" @close="form.show=false">
      <div class="row" style="gap:8px">
        <div class="field"><label>身高(cm)</label><input class="input" type="number" step="0.01" v-model="form.h" placeholder="如 72.5"></div>
        <div class="field"><label>体重(kg)</label><input class="input" type="number" step="0.01" v-model="form.w" placeholder="如 9.2"></div>
        <div class="field"><label>头围(cm)</label><input class="input" type="number" step="0.01" v-model="form.hc" placeholder="如 44"></div>
      </div>
      <div class="row" style="gap:8px">
        <div class="field"><label>疫苗</label><input class="input" v-model="form.vax" placeholder="如：乙肝第二针"></div>
        <div class="field"><label>备注</label><input class="input" v-model="form.note" placeholder="如：今天状态很好"></div>
      </div>
      <div class="field"><label>时间</label><input class="input" type="datetime-local" v-model="form.dt"></div>
      <div style="font-size:12px;color:var(--text-mute);margin:-4px 0 8px">填了哪几项就保存哪几条（共用同一时间），至少填一项。</div>
      <div style="text-align:right"><button class="btn" @click="save">保存</button></div>
    </modal>
  </div>`,
};

/* =========================================================
   组件：表达能力（每日 3 个优化表达能力的方法 · 可立即训练）
   ========================================================= */
const EXPRESS_TIPS = [
  { t: "金字塔结构", d: "先给结论，再列 2-3 个理由，最后复述结论，听众一眼抓住重点。", why: "人脑对『结论优先』的信息记忆最牢：先给答案再给论证，听众不用猜你的重点在哪。", how: ["说任何事先憋住细节，第一句直接报结论：『我建议…』", "再给 2-3 个理由，每条一句话", "最后用结论收尾：『所以，我的建议是…』"], ex: "『我们应该把发布提前到周三：一来竞品周四上新，二来我们的测试已跑通，三来团队周五有会。所以周三发最稳。』", sec: 60 },
  { t: "60 秒口播", d: "每天挑一个观点，录一段 60 秒语音讲清楚，回听找口头禅和断点。", why: "录音回放是最诚实的一面镜子：口头禅、停顿、逻辑断点，一听便知。", how: ["随便挑一个今天想到的观点", "开录音，用 60 秒把它讲完整，不许重录", "回放，记下口头禅（然后/那个）和卡壳处", "重讲一遍，砍掉口头禅"], ex: "观点『为什么微信比邮件快』→ 用 60 秒讲完整。", sec: 60 },
  { t: "复述确认", d: "对方说完后，用自己的话复述：『你刚说的是…对吗？』，大幅减少误会。", why: "复述强制你真正听懂而不是假装听懂，误会率随之大幅下降。", how: ["听对方讲完，先不急着回答", "用『我理解你刚说的是…』开头复述", "补一句『对吗？是这个意思吗』请对方确认", "有偏差就请对方纠正，再继续往下聊"], ex: "『你刚说的是：希望我先把报表发你，再约周三对数据，对吗？』", sec: 60 },
  { t: "带目的开口", d: "开口前先想『我想让对方知道什么、做什么』，带着目的说废话自然变少。", why: "有目的地说，每一句都在推进；没目的地说，别人听完不知道你到底要什么。", how: ["开口前默问：我要让对方知道什么？", "再问：我要让对方做什么？", "按『目的 → 要点 → 请求』的顺序说", "说完检查：这三点对方都收到了吗"], ex: "『我想请你确认预算（目的），下周采购要 3 万（要点），麻烦今天下班前回复（请求）。』", sec: 60 },
  { t: "因为所以", d: "描述一件事时强制加『因为…所以…』，逼自己把因果说完整。", why: "因果链是逻辑的地基，强迫自己把因果说完整，逻辑会肉眼可见地变清晰。", how: ["描述任何结论都追问自己一句『为什么』", "用『因为 A，所以 B』把原因和结果连起来", "说不清因果时，承认并去查证，别含糊带过", "每天挑 3 句话用因果结构重说一遍"], ex: "『我不建议现在推广，因为安卓端还有 8% 崩溃率，所以想先压到 3% 再上量。』", sec: 60 },
  { t: "三句话概括", d: "读一段好文章，合上后用 3 句话概括它，训练抓主干、舍细节。", why: "概括是最值钱的提炼能力：会概括的人，抓重点的能力一定强。", how: ["找一篇短文或一段新闻通读一遍", "合上屏幕，默写 3 句：讲了什么、关键论据、结论", "对照原文，检查漏了什么关键信息", "坚持两周，抓重点能力肉眼可见提升"], ex: "『文章讲睡眠不足影响记忆力；依据是海马体实验；结论是成年人也要保证 7 小时睡眠。』", sec: 120 },
  { t: "证据代替『我觉得』", d: "把『我觉得』换成具体依据：数据显示 / 他刚才说 / 上次经验表明…", why: "『我觉得』是观点，听者可以无视；数据、事实、引述是无法反驳的证据。", how: ["发言前把『我觉得』换成『数据显示/他提到/上次记录』", "一个观点至少配一个可查证的依据", "没有依据时，明确说『这只是我的猜测』", "每周收集 5 个可以引用的数据点"], ex: "『不是我觉得用户想要搜索，是后台数据显示 40% 的会话以搜索开头。』", sec: 60 },
  { t: "故事四步法", d: "任何经历都用『背景-冲突-行动-结果』四步讲，别人更愿意听。", why: "人对故事没有抵抗力，四步结构让经历自带钩子，平淡的事也能讲出味道。", how: ["一句话交代背景（时间地点人物）", "点出冲突（遇到了什么难题）", "讲你的行动（你做了什么）", "收在结果（带来了什么改变）"], ex: "『上周客户要周三交付（背景），但素材周一才齐（冲突），我连夜排了优先级表（行动），结果提前半天交付还加了预算（结果）。』", sec: 120 },
  { t: "汇报三段式", d: "汇报工作用『结论先行 + 关键数据 + 下一步』，老板最吃这套。", why: "老板最在意结果和风险：先给结论再给数据，汇报永远不跑题、不啰嗦。", how: ["第一句：结论（做成 / 没做成 / 有风险）", "第二段：2-3 个关键数据支撑", "第三段：下一步计划 + 需要什么支持", "整体控制在 60-90 秒内讲完"], ex: "『本周目标已完成 90%（结论）；转化率 3.2%，比上周 +0.4%，新渠道贡献 30%（数据）；下周主攻留存，需要设计出 2 张引导图（下一步）。』", sec: 60 },
  { t: "短句说话", d: "一句话只说一个意思，多用句号，把长句拆短。", why: "长句是听力的敌人：短句让每句话都能被消化，听众的理解负担骤降。", how: ["一句话只装一个观点", "用句号代替逗号和分号", "写完或说完后，把超过 20 字的句子拆开", "重要表达前先默说一遍，掐掉多余从句"], ex: "『我们延迟了。因为素材没到齐。周五前补齐。』而不是『由于素材未能按时到达所以我们决定将项目整体顺延至周五。』", sec: 60 },
  { t: "类比解释", d: "把抽象概念比作熟悉事物（如『缓存像便签条』），对方秒懂。", why: "人只能理解已有经验范围内的东西：类比把新概念接到对方的旧经验上。", how: ["遇到难懂概念先问自己：它像什么？", "找一个对方熟悉领域里的东西做类比", "说清楚『哪里像、哪里不像』", "用『你可以把它想成…』开场"], ex: "『缓存就像便签条：常用的电话号码记在便签上，不用每次翻通讯录。』", sec: 60 },
  { t: "先肯定再提意见", d: "『你说得对，另外…』比直接反驳管用，不激起防御。", why: "直接否定会触发对方的防御机制；先肯定，情绪门槛降下来，意见才进得去。", how: ["先找对方观点里至少一个合理之处", "用『你说得对，另外/同时…』接话", "只对事不对人，不评价对方本人", "实在不认同，至少肯定他的出发点"], ex: "『你说的渠道没问题，同时我建议先小规模试投，控制首周预算。』", sec: 60 },
  { t: "30 秒电梯演讲", d: "假设只有 30 秒，你怎样介绍你的项目 / 自己？", why: "时间限制是表达最好的过滤器：逼你删到最核心，只剩最有价值的信息。", how: ["写下：我是谁、做什么、解决什么问题、结果如何", "压缩成 4 句话，每句不超过 10 秒", "对着计时器练，超时就读秒砍句", "练 3 遍，直到 30 秒内从容讲完"], ex: "『我做了款植物养护提醒器。它解决养什么死什么的问题。用天气加光照算法。试用用户存活率提升 60%。』", sec: 120 },
  { t: "先列提纲", d: "写东西先列提纲再动笔，结构清晰了文字才不会跑偏。", why: "写作跑偏都是因为没提纲：列提纲是在出发前先画好地图。", how: ["写下中心观点，一句话", "列 3 个支撑小标题", "每个小标题下写 1-2 个要点", "按提纲填充，卡住就回看提纲"], ex: "『提纲：1.问题（绿萝黄叶）2.原因（浇水过频）3.解法（见干见湿）』", sec: 120 },
  { t: "眼神接触", d: "说话时看着对方眼睛（或摄像头），眼神接触能显著增强可信度。", why: "大脑会把回避眼神解读为心虚，直视则代表坦诚与自信。", how: ["开口前先看对方眼睛，再开始说", "每句话都落在一个听众 / 镜头点位上", "紧张就看他眉心或鼻梁，效果等同", "线上会议把摄像头调到眼睛高度"], ex: "『下次汇报时，讲结论那句一定抬眼看老板。』", sec: 60 },
  { t: "但是→同时", d: "把『但是』换成『同时』：『方案不错，同时成本偏高』。", why: "『但是』否定前半句，『同时』是并列：听者不会觉得自己被全盘否定。", how: ["察觉自己要说『但是』时强制刹车", "换成『同时 / 不过换个角度看』", "先肯定的部分必须真心，不是套路", "每周数一次自己说了几次『但是』"], ex: "『方案不错，同时成本偏高，我们再看一版。』", sec: 60 },
  { t: "停顿两秒", d: "被提问先停顿 2 秒再答，既显沉稳，也给自己组织语言的时间。", why: "停顿让你有时间组织语言，也让听者觉得你经过思考，回答更有分量。", how: ["听到问题先深呼吸", "默数 2 秒再开口", "利用这 2 秒想『结论 + 一个理由』", "回答结尾再停 1 秒，示意讲完"], ex: "『（停顿 2 秒）我的判断是不做，因为测试数据不支持。』", sec: 60 },
  { t: "用数字说话", d: "『提升体验』不如『把等待从 5 分钟降到 1 分钟』有说服力。", why: "数字是可验证的事实，形容词是主观感受：数字的冲击力大得多。", how: ["找观点背后的可量化指标", "用『从 X 到 Y』的对比格式", "没有精确数字就给范围或百分比", "发言前把形容词改成数字"], ex: "『不是体验变好了，是把加载时间从 5 秒压到 1.2 秒，跳出率降了 30%。』", sec: 60 },
  { t: "结构化提问", d: "『目标是什么？现状如何？卡点在哪？』，沟通效率翻倍。", why: "好问题能引导对方讲重点：结构化提问让混乱的信息自动归位。", how: ["接手任务先问：目标是什么？", "再问：现在的进展 / 现状？", "最后问：卡点在哪、需要什么帮助？", "每次沟通用同一套框架，形成习惯"], ex: "『这个活动目标是什么？现在筹备到哪一步了？缺什么我这边能补？』", sec: 60 },
  { t: "术语翻白话", d: "把专业术语翻译成大白话，让外行也听懂，是高级的表达能力。", why: "术语是圈子里的捷径、圈子外的墙：翻成白话才真正检验你懂没懂。", how: ["说到术语先停一下，问『这句怎么说人话』", "用『说白了就是…』补一句解释", "对外沟通只保留必要的术语", "遇到新术语，强迫自己用一句大白话定义它"], ex: "『说白了，KPI 就是你上班要完成的几个具体指标。』", sec: 60 },
  { t: "每日一个新词", d: "每日记录 1 个『今天学到的新词/新概念』，词汇量决定表达的精度。", why: "词库里没这个词，再好的想法也说不出来：词汇量是表达的上限。", how: ["每天留意一个让你『原来如此』的词", "写下它的意思 + 一个使用场景", "当天找机会在对话或写作里用一次", "周末回看，挑 3 个用到下周"], ex: "『今天新词：钝感力。场景：同事催进度时，用钝感力过滤焦虑。』", sec: 120 },
  { t: "练好开场 30 秒", d: "演讲前对着镜子练开场 30 秒，好的开头决定观众要不要听下去。", why: "开头 30 秒是注意力红利期：错过它，观众就开始刷手机了。", how: ["设计开场：一个钩子（问题 / 故事 / 惊人数字）", "对着镜子或录视频练这 30 秒", "表情、语速、停顿都过一遍", "开场背熟，进入正题再自由发挥"], ex: "『开场钩子：你知道养死的绿萝，90% 是浇死的吗？』", sec: 60 },
  { t: "诚实的不确定", d: "『我不确定，但我去确认后告诉你』，诚实比硬撑更专业。", why: "硬撑的答案一旦穿帮会损失全部信任；诚实的不确定反而显得严谨可靠。", how: ["不确定时直接说『我需要确认』", "给出确认的时限：『今天下班前答复你』", "确认后第一时间补上完整答案", "绝不事后编造当时没说的信息"], ex: "『这个问题我手头数据不够，我核对完预算表，下午 3 点前给你准确数字。』", sec: 60 },
  { t: "邮件标题三要素", d: "标题写清『动作+对象+时间』，如『请周三前确认方案』，收件人秒懂。", why: "标题是第一过滤器：写清动作对象时间，对方不用点开就知道该怎么处理。", how: ["标题固定格式：动作 + 对象 + 时间", "紧急的加【重要 / 需回复】前缀", "正文第一句重复标题里的请求", "发前检查：5 秒读完标题知道要做什么吗"], ex: "『【请确认】请周五前确认 Q3 预算方案 - 张三』", sec: 60 },
  { t: "情绪与事实分开", d: "『我很着急（情绪），因为截止是今天（事实）』，沟通更建设性。", why: "情绪和事实混在一起，对方只会被情绪带走；拆开说，沟通才谈得下去。", how: ["表达前先分清：这句是情绪还是事实？", "情绪用『我感到…』开头，不指责对方", "事实用『因为…』给出依据", "先情绪后事实，对方才接得住"], ex: "『我有点焦虑（情绪），因为交付节点就是今天，我担心时间不够（事实）。』", sec: 60 },
  { t: "一二三列举", d: "练习用『第一、第二、第三』列举，对方脑子里的框架立刻被你搭好。", why: "列举词是给听者的路标：框架一旦立起来，信息再多也不会乱。", how: ["说之前先在脑子里列出 3 点", "用『第一 / 第二 / 第三』或『1/2/3』开口", "每点只讲一句话，别展开过深", "收尾用『这三点就是…』回扣框架"], ex: "『支持提前发布有三个理由：第一竞品空窗，第二测试通过，第三团队状态最好。』", sec: 60 },
  { t: "戒掉模糊词", d: "少说『大概、可能、应该』这类模糊词，确定时就干脆给结论。", why: "模糊词是信心的稀释剂：说多了，别人会默认你自己也不确定。", how: ["列一张自己的口头禅清单（大概 / 可能 / 还行）", "发言时一旦冒出，立刻重说一遍确定版", "确定的事直接给结论，不给自己留退路", "不确定时用『我确认后再回你』替代含糊词"], ex: "『确定版：周五交付，没问题。』而不是『应该周五能好吧，大概。』", sec: 60 },
  { t: "忍住插话", d: "听别人说话时忍住插话，等对方说完再回应，倾听本身就是高级表达。", why: "打断是表达里最贵的人际税；耐心听完，对方会加倍珍惜你的发言。", how: ["对方说话时手里别拿手机", "想插话先记下来，等他停顿再说", "用点头和『嗯』给反馈，但不抢话", "他说完停顿 2 秒，确认讲完再开口"], ex: "『他讲完的瞬间，先接一句：你刚才说的 X 很关键。』", sec: 60 },
  { t: "画图讲流程", d: "把复杂流程画成一张图再讲，视觉化能让最绕的逻辑变简单。", why: "视觉信息处理比文字快得多：一张流程图，顶十段口头描述。", how: ["先把流程拆成『节点 + 箭头』", "用纸笔或白板画出流向", "按图讲，手指跟着箭头走", "讲完指回起点问一句『哪里断了？』"], ex: "『画一条：用户下单 → 库存校验 → 支付 → 发货，每一步一句话。』", sec: 120 },
  { t: "结尾给下一步", d: "讲完别飘着，明确『接下来谁做什么、何时』。", why: "没有下一步的讲话是零产出：给出行动项，才把沟通变成成果。", how: ["讲话结尾固定问：接下来谁做？做什么？何时？", "把这三项说成一句话", "复杂事项当场复述确认分工", "会后把行动项发到群里留痕"], ex: "『下一步：小王周四前出方案，我周五评审，下周一上线。』", sec: 60 },
  { t: "把话语权交出去", d: "用『你觉得呢？』把话语权交出去，收集意见也显得尊重对方。", why: "单向输出是自嗨：把话语权交出去，既能收集真实信息，也抬高对方参与感。", how: ["讲完自己的观点后留一句『你怎么看』", "真的听完，不急着反驳", "收集 2-3 个不同视角再综合", "对采纳的意见明确说『按你说的改』"], ex: "『我的建议是先做搜索，你觉得呢？你更了解用户这头。』", sec: 60 },
  { t: "三个万能故事", d: "准备失败 / 成长 / 价值观三个故事，关键时刻信手拈来。", why: "面试、述职、破冰全靠故事撑场面：提前备好素材，临场才不慌。", how: ["写一个失败故事：出了什么错、学到什么", "写一个成长故事：从菜到行的过程", "写一个价值观故事：你最坚持什么", "每个压缩成 60 秒版本，能脱稿讲"], ex: "『失败故事：我搞砸过一次发布，从那以后上线前必跑全量测试。』", sec: 120 },
  { t: "放慢放低", d: "说话音量放慢一点、降低一点，重要内容反而更被重视。", why: "语速快显得紧张，音量高显得急躁：慢而稳的声音自带权威感。", how: ["说话速度降到平时的 70%", "重要句子前停 1 秒再说", "音量保持在『清晰但不用力』", "录音对比，找自己最舒服的节奏"], ex: "『（停顿）接下来这句很重要——发布推迟到周五。』", sec: 60 },
  { t: "问题→机会", d: "把『用户流失』重述为『我们找到了留存突破口』，视角一换士气不同。", why: "语言塑造心态：同一件事换个说法，团队士气完全不同。", how: ["遇到问题先记下来，不急着叹气", "用『这暴露了…的机会』重新表述", "找到问题背后可行动的切入点", "和团队说『新表述』，而不是『坏消息』"], ex: "『不是用户流失，是我们第一次看清了流失的 3 个时点，每个都有解法可做。』", sec: 60 },
  { t: "一句话总结", d: "练习在会议 / 群里用一句话总结刚才的讨论，做思路最清的人。", why: "总结是表达里的高光动作：能把混乱收束成结论的人，天然是话语中心。", how: ["讨论进行中记下关键词", "快结束时说『我总结一下』", "格式：结论 + 决定 + 待办", "练久了你会成为会议里最清晰的人"], ex: "『我总结下：目标定了留存，渠道选 B，小王周四出数据。』", sec: 60 },
  { t: "只让他记住一句", d: "表达前问：如果对方只能记住一句，我希望是哪句？然后放在最显眼处。", why: "人脑对一次沟通只能留一句核心：主动设计这句话，主动权就在你手里。", how: ["发言前写下：我希望他记住的唯一一句", "把它放在开头或结尾（记忆位置）", "中间的内容都往这句话上靠", "说完检查：这句够不够金句"], ex: "『今天这句要记住：把等待从 5 分钟降到 1 分钟，其他都是铺垫。』", sec: 60 },
  { t: "赞美术语化", d: "『你这个分类维度选得真巧』比『好棒』有重量，赞到细节里。", why: "空泛的赞美是噪音：指出具体好在哪，对方才知道你认真听了。", how: ["观察对方具体的做法，不止看结果", "赞美拆成：具体动作 + 价值", "少用『好棒 / 厉害』，多用『这个 X 做得真 Y』", "真诚第一，夸错宁可不夸"], ex: "『你把这个流程拆成三步这个动作很关键，新手照着也能上手。』", sec: 60 },
];
/* 每个方法对应的「今天具体做什么」任务，训练计划按天安排用 */
const EXPRESS_TASKS = {
  "金字塔结构": "今天找个决定要跟人说（周末安排 / 工作建议 / 孩子的安排），用『结论 → 2-3 条理由 → 结论』完整讲一遍，对象选家人或同事。",
  "60 秒口播": "今天睡前用手机录一段 60 秒语音，讲『今天最有意思的一件事』，回放找出口头禅和卡壳处。",
  "复述确认": "今天和任何人聊完一件重要的事，用『你刚说的是…对吗』复述一遍，至少 1 次。",
  "带目的开口": "今天找人帮忙前，先在脑子里说清『要对方知道什么、要对方做什么』，再开口。",
  "因为所以": "今天描述 3 件事时强制用『因为…所以…』，比如跟同事解释为什么改方案、跟家人说为什么出门。",
  "三句话概括": "今天读一篇新闻或文章，合上后写 3 句话：讲了什么、关键依据、结论。",
  "证据代替『我觉得』": "今天发言前把『我觉得』换成数据或事实，至少 1 次；找不到依据就明说『这只是我的猜测』。",
  "故事四步法": "今天把最近发生的一件小事用『背景-冲突-行动-结果』讲给一个人听，饭桌上或电话里都行。",
  "汇报三段式": "今天向领导 / 长辈 / 老师汇报任何进展时，用『结论 → 关键数据 → 下一步』三段式。",
  "短句说话": "今天发消息或说话时，把每句话压到 20 字以内，多用句号断句，不要一口气说长句。",
  "类比解释": "今天向别人解释一个概念时用类比（比如『缓存像便签条』），直到对方说『懂了』为止。",
  "先肯定再提意见": "今天要提意见时，先找对方观点里一个合理之处，用『你说得对，另外…』开口。",
  "30 秒电梯演讲": "今天用 30 秒向一个人介绍你的工作 / 最近的项目，对着计时器练 3 遍再正式说。",
  "先列提纲": "今天写任何一段文字（朋友圈 / 邮件 / 计划 / 汇报）之前，先列 3 点提纲再动笔。",
  "眼神接触": "今天和人对视说话至少 3 次，讲关键句时一定看对方眼睛，别低头看手机。",
  "但是→同时": "今天一整天，察觉自己想说『但是』时换成『同时』，至少 2 次，说完心里记一下。",
  "停顿两秒": "今天被问问题时不抢答，先停 2 秒再开口，全天至少 3 次。",
  "用数字说话": "今天说话时把形容词换成数字（『快』→『5 分钟』，『很多』→『3 个渠道』），至少 1 次。",
  "结构化提问": "今天接手任何新任务，先问三连：目标是什么？现状如何？卡点在哪？",
  "术语翻白话": "今天把一个专业词（工作里的 / 育儿里的 / 理财里的）用大白话讲给一个不懂的人听。",
  "每日一个新词": "今天记 1 个新词或新概念，写下意思 + 使用场景，当天找机会在对话里用一次。",
  "练好开场 30 秒": "今天开会 / 发言 / 录视频 / 发语音前，设计一个 30 秒的钩子开场（问题 / 故事 / 数字），先练一遍再说。",
  "诚实的不确定": "今天遇到不确定的事，直接说『我确认后答复你』，并给出具体时间点，别硬撑。",
  "邮件标题三要素": "今天发任何一条重要消息或邮件，标题或首行写清『动作 + 对象 + 时间』。",
  "情绪与事实分开": "今天表达情绪时说『我感到…，因为…（事实）』，至少 1 次，比如跟伴侣或同事。",
  "一二三列举": "今天说话时用『第一、第二、第三』列举至少 1 次，哪怕只是安排买菜清单。",
  "戒掉模糊词": "今天全天留意『大概 / 可能 / 应该 / 还行』，一冒出来就重说一遍确定版。",
  "忍住插话": "今天和人聊天时，全程等对方说完（停 2 秒）再开口，一次都不打断。",
  "画图讲流程": "今天把一件要做的事画成流程图（纸上或手机备忘录），然后按图向一个人讲一遍。",
  "结尾给下一步": "今天每次讲完一件事，补一句『接下来谁做、做什么、什么时候』。",
  "把话语权交出去": "今天讨论时讲完自己的观点，问一句『你觉得呢？』，然后真的听完。",
  "三个万能故事": "今天写下你的『失败故事』（出了什么错 → 学到了什么），练到能 60 秒脱稿讲出来。",
  "放慢放低": "今天说话放慢到平时的 70%，关键句前停 1 秒，可以录音对比一次。",
  "问题→机会": "今天遇到一个麻烦时，在吐槽之前用『这暴露了…的机会』重新说一遍。",
  "一句话总结": "今天在群聊或家人讨论结束后，用一句话总结『结论 + 决定 + 待办』发出去 / 说出来。",
  "只让他记住一句": "今天开口前先写下『希望对方记住的唯一一句』，把它放在开头或结尾说出来。",
  "赞美术语化": "今天真诚地夸一个人，夸到具体动作上（如『你把这个分类分得真清楚』），不要只说『好棒』。",
};
/* 表达方法小贴士（每日一条，按日期轮换） */
const EXPRESS_TIPS_QUOTES = [
  "方法：说观点用『结论+理由』——先讲结果，再补一句为什么，别人不猜重点。",
  "方法：汇报用三段式——结论先行，给 2 个关键数据，最后说下一步。",
  "方法：被提问先停 2 秒再答，脑子里快速过一遍『结论+依据』。",
  "方法：把『我觉得』换成『数据显示 / 他提到』，观点立刻有分量。",
  "方法：听不懂就复述——『你刚说的是…对吗』，误会当场消除。",
  "方法：描述事情用『因为…所以…』，把因果说完整，逻辑就清楚了。",
  "方法：讲故事用四步——背景、冲突、行动、结果，别人更爱听。",
  "方法：把长句拆短，一句话只讲一个意思，多用句号。",
  "方法：把『但是』换成『同时』，先肯定再补充，不激起防御。",
  "方法：用数字说话——『从 5 分钟降到 1 分钟』比『更快』有力。",
  "方法：开口前问自己：我要对方知道什么、做什么？",
  "方法：给建议先说『你说得对，另外…』，意见才进得去。",
  "方法：讲完补一句『接下来谁做、做什么、何时』，沟通才有产出。",
  "方法：介绍自己或项目用 30 秒电梯演讲——我是谁、做什么、解决什么问题、结果。",
  "方法：专业术语翻成大白话——『说白了就是…』，外行也能懂。",
  "方法：列举用『第一、第二、第三』，帮对方搭好框架。",
  "方法：重要事情发消息，标题写清『动作+对象+时间』。",
  "方法：表达情绪时拆开说——『我感到…，因为…（事实）』。",
  "方法：解释抽象概念用类比——『缓存像便签条』，对方秒懂。",
  "方法：写东西先列提纲——中心观点 + 3 个小标题再动笔。",
  "方法：不确定的事说『我确认后答复你』，并给个具体时间点。",
  "方法：开口时看着对方眼睛，讲关键句时别低头。",
  "方法：说话放慢到平时七成，重要句子前停 1 秒。",
  "方法：读一篇文章，合上后用 3 句话概括——讲了什么、依据、结论。",
];
function tipOfDay() {
  const len = EXPRESS_TIPS_QUOTES.length;
  const seed = parseInt(todayStr().replace(/-/g, ""), 10);
  return EXPRESS_TIPS_QUOTES[seed % len];
}
const Express = {
  setup() {
    const today = todayStr();
    const tip = tipOfDay();
    const ROUND = 30; /* 每 30 天一轮 */
    const planStart = computed(() => state.expressStart || "");
    const planDay = computed(() => (planStart.value ? Math.max(1, dayDiff(today, planStart.value) + 1) : 0));
    const roundNo = computed(() => (planDay.value ? Math.floor((planDay.value - 1) / ROUND) + 1 : 0));
    const dayInRound = computed(() => (planDay.value ? (planDay.value - 1) % ROUND + 1 : 0));
    const pct = computed(() => (planDay.value ? Math.round(dayInRound.value / ROUND * 100) : 0));
    const curTip = computed(() => (planDay.value ? EXPRESS_TIPS[(planDay.value - 1) % EXPRESS_TIPS.length] : null));
    const curTask = computed(() => (curTip.value ? (EXPRESS_TASKS[curTip.value.t] || curTip.value.d) : ""));
    const popen = ref(false);
    const left = ref(0);
    const run = ref(false);
    let timer = null;
    function stop() { run.value = false; if (timer) { clearInterval(timer); timer = null; } }
    function start() {
      if (run.value || left.value <= 0) return;
      run.value = true;
      timer = setInterval(() => {
        if (left.value <= 1) { left.value = 0; finish(); }
        else left.value--;
      }, 1000);
    }
    function reset() { stop(); if (curTip.value) left.value = curTip.value.sec; }
    function finish() { stop(); const ENC = ["🎈 训练完成，今天的任务搞定！", "🌟 很棒！又完成一次表达练习", "👏 坚持就有进步，今天也很棒！", "💪 完成！表达力就是这样一点点练出来的", "🎉 好样的！明天继续呀"]; showToast(ENC[Math.floor(Math.random() * ENC.length)]); }
    const mmss = (s) => pad(Math.floor(s / 60)) + ":" + pad(s % 60);
    function begin() { state.expressStart = today; showToast("🎯 计划已开始，今天第 1 天"); }
    function resetPlan() { state.expressStart = ""; popen.value = false; stop(); showToast("已重置训练计划"); }
    function openPlan() { if (!curTip.value) return; popen.value = !popen.value; if (popen.value) { left.value = curTip.value.sec; stop(); } }
    function addTodo() {
      if (!curTip.value) return;
      state.tasks.push({ id: uid(), title: "🎯 表达训练 · 第" + planDay.value + "天 · " + curTip.value.t, note: curTask.value + "（⏱ " + curTip.value.sec + "s）", due: today, priority: "普通", done: false, createdAt: Date.now() });
      showToast("已加入今天的日程管理待办 ✅");
    }
    onUnmounted(stop);
    return { today, tip, ROUND, planStart, planDay, roundNo, dayInRound, pct, curTip, curTask, popen, left, run, start, reset, finish, mmss, begin, resetPlan, openPlan, addTodo };
  },
  template: `
  <div>
    <div class="module-head">
      <div><div class="module-title"><span class="mt-ico"><img :src="iconFor('express')"></span>表达能力</div><div class="module-desc">每 30 天一轮训练计划，每天练一个</div></div>
    </div>

    <div class="card plan-card" style="margin-bottom:14px">
      <div class="plan-head">
        <div class="plan-title">🎯 训练计划 · 每 30 天一轮</div>
        <button v-if="planStart" class="btn sm gray" @click="resetPlan">重置计划</button>
      </div>
      <template v-if="!planStart">
        <div style="font-size:13px;color:var(--text-soft);line-height:1.7">还没开始？点下面按钮启动：从今天起每天安排 1 个具体的表达训练任务（对谁说、说什么、怎么做都写清楚），每 30 天为一轮、练完还能一键加入「日程管理」日历待办打卡。</div>
        <button class="btn" style="margin-top:10px" @click="begin">🚀 开始训练计划</button>
      </template>
      <template v-else>
        <div class="plan-day">第 {{roundNo}} 轮 · 第 {{dayInRound}} / {{ROUND}} 天 · {{curTip.t}}</div>
        <div class="plan-bar"><div class="plan-fill" :style="{width:pct+'%'}"></div></div>
        <div class="plan-prog">本轮进度 {{pct}}% · 已坚持 {{planDay}} 天</div>
        <div class="plan-tip">
          <div class="expr-title">📌 今天具体做：<span style="font-weight:400;font-size:13px">（⏱ {{curTip.sec}}s）</span></div>
          <div class="plan-task">{{curTask}}</div>
          <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
            <button class="btn sm green" @click="addTodo">➕ 安排到今天待办</button>
            <button class="btn sm" @click="openPlan">{{popen?'收起':'▶ 展开方法'}}</button>
          </div>
          <div v-if="popen" class="train-box">
            <div class="tb-sec"><div class="tb-label">💡 为什么有效</div><div class="tb-body">{{curTip.why}}</div></div>
            <div class="tb-sec"><div class="tb-label">✍️ 怎么练</div>
              <div class="tb-body"><div v-for="(s,si) in curTip.how" :key="si" class="tb-step"><span class="tb-num">{{si+1}}</span>{{s}}</div></div>
            </div>
            <div class="tb-sec"><div class="tb-label">🎙 示例</div><div class="tb-ex">{{curTip.ex}}</div></div>
            <div class="train-timer">
              <div class="tt-num">{{mmss(left)}}</div>
              <div class="tt-ops">
                <button class="btn sm" @click="start">{{run?'⏸ 暂停':'▶ 开始'}}</button>
                <button class="btn sm gray" @click="reset">重置</button>
                <button class="btn sm green" @click="finish">✓ 完成</button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div class="card tip-card" style="margin-bottom:14px">
      <div class="tip-title">💡 小贴士</div>
      <div class="tip-text">「{{tip}}」</div>
      <div class="tip-foot">{{today}} · 明天自动换新</div>
    </div>
  </div>`,
};

/* =========================================================
   组件：前额叶训练（每日舒尔特方格 + 保护前额叶小贴士）
   ========================================================= */
const BRAIN_TIPS = [
  "每天睡够 7-8 小时：前额叶在深睡时整理记忆，缺觉第二天决策力和自控力明显下降。",
  "别硬扛多任务：大脑不是并行处理器，一次只做一件事，前额叶最省电、最耐用。",
  "每天 10 分钟冥想：专注呼吸能增厚前额叶皮层，提升自控和专注的『肌肉』。",
  "每周 3 次有氧运动：跑步、快走能增加脑血流量，前额叶是最大受益者。",
  "少刷碎片短视频：频繁切换注意力会透支前额叶，每天设一段『无手机』时间。",
  "控制饮酒：酒精直接抑制前额叶功能，长期过量会加速它的衰退。",
  "保持深度社交：和人认真聊天、辩论，是前额叶天然的日常训练场。",
  "别熬夜硬撑：连续缺觉会削弱冲动控制，容易暴躁、乱花钱、乱做决定。",
  "护住头部：骑车戴头盔、运动防撞击，脑外伤是前额叶的隐形杀手。",
  "三餐规律、少吃精制糖：血糖大起大落时，前额叶容易『断电』犯迷糊。",
  "压力大时先做 4-6 呼吸：吸气 4 秒、呼气 6 秒，几次就能让前额叶恢复冷静。",
  "每天做一件『难而慢』的事：读长文、学新技能，别让大脑只走老路。",
];
function brainTipOfDay() {
  const seed = parseInt(todayStr().replace(/-/g, ""), 10);
  return BRAIN_TIPS[seed % BRAIN_TIPS.length];
}
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const Brain = {
  setup() {
    const today = todayStr();
    const tip = brainTipOfDay();
    const SIZES = [{ n: 4, label: "简单 1-16" }, { n: 5, label: "标准 1-25" }, { n: 6, label: "挑战 1-36" }];
    const size = ref(5);
    const cells = ref([]);
    const seq = ref(1);
    const started = ref(false);
    const done = ref(false);
    const wrong = ref(-1);
    const elapsed = ref(0);
    const score = ref("");
    const recommended = ref(false);
    let startTs = 0, timer = null;
    const best = computed(() => state.brainBest);
    /* 各难度参考基准（毫秒）与评分线（秒→等级） */
    const BASE_MS = { 4: 25000, 5: 40000, 6: 60000 };
    const GRADE = { 4: [[16, "S"], [22, "A"], [30, "B"], [40, "C"]], 5: [[28, "S"], [38, "A"], [52, "B"], [70, "C"]], 6: [[45, "S"], [60, "A"], [80, "B"], [110, "C"]] };
    const gradeOf = (sz, sec) => { const t = GRADE[sz] || GRADE[5]; for (const [lim, g] of t) { if (sec <= lim) return g; } return "D"; };
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    /* 按上次操作速度自动推荐难度（第二天进入带出） */
    const last = state.brainLast;
    if (last && last.ms && BASE_MS[last.size]) {
      const base = BASE_MS[last.size];
      let rec = last.size;
      if (last.ms < base * 0.75 && rec < 6) rec++;
      else if (last.ms > base * 1.3 && rec > 4) rec--;
      if (rec !== last.size) { size.value = rec; recommended.value = true; }
    }
    function build() {
      const nums = [...Array(size.value * size.value)].map((_, i) => i + 1);
      const rnd = mulberry32(parseInt(today.replace(/-/g, ""), 10) + size.value);
      for (let i = nums.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [nums[i], nums[j]] = [nums[j], nums[i]]; }
      cells.value = nums.map((n) => ({ n, hit: false }));
      seq.value = 1; done.value = false; started.value = false; elapsed.value = 0; wrong.value = -1;
      stop();
    }
    function start() {
      if (done.value) return;
      if (!started.value) { started.value = true; startTs = Date.now(); timer = setInterval(() => { elapsed.value = (Date.now() - startTs) / 1000; }, 100); }
    }
    function click(c) {
      if (done.value || !started.value || c.hit) return;
      if (c.n === seq.value) {
        c.hit = true; seq.value++;
        if (seq.value > size.value * size.value) finish();
      } else {
        wrong.value = c.n;
        setTimeout(() => { if (wrong.value === c.n) wrong.value = -1; }, 320);
      }
    }
    function finish() {
      stop(); done.value = true;
      const ms = Date.now() - startTs; elapsed.value = ms / 1000;
      score.value = gradeOf(size.value, elapsed.value);
      state.brainLast = { date: today, size: size.value, ms };
      if (state.brainBest == null || ms < state.brainBest) { state.brainBest = ms; showToast("🏆 新纪录！评分 " + score.value + " · " + (ms / 1000).toFixed(1) + " 秒"); }
      else showToast("🎉 评分 " + score.value + " · 用时 " + (ms / 1000).toFixed(1) + " 秒");
    }
    onUnmounted(stop);
    build();
    return { today, tip, SIZES, size, cells, seq, started, done, wrong, elapsed, score, recommended, best, build, start, click };
  },
  template: `
  <div>
    <div class="module-head">
      <div><div class="module-title"><span class="mt-ico"><img :src="iconFor('brain')"></span>前额叶训练</div><div class="module-desc">每日一局脑力游戏 · {{today}}</div></div>
    </div>

    <div class="card" style="margin-bottom:14px">
      <div style="font-weight:700;margin-bottom:4px">🎯 今日游戏 · 舒尔特方格</div>
      <div style="font-size:12.5px;color:var(--text-soft);margin-bottom:10px">按 1、2、3…顺序依次点数字，越快越好。布局每天固定、第二天自动换新，可以反复挑战自己的纪录。</div>
      <div class="brain-seg">
        <button v-for="s in SIZES" :key="s.n" class="chip" :class="{active:size===s.n}" @click="size=s.n;build();recommended=false">{{s.label}}</button>
      </div>
      <div v-if="recommended" style="font-size:12px;color:var(--warn);margin:6px 0 0">✨ 已按上次成绩自动推荐难度（可手动切换）</div>
      <div class="brain-top">
        <div class="brain-next">下一个 <b>{{seq<=size*size?seq:'✓'}}</b></div>
        <div class="brain-time">⏱ {{elapsed.toFixed(1)}} 秒</div>
        <div v-if="best" class="brain-best">🏆 历史最佳 {{(best/1000).toFixed(1)}} 秒</div>
      </div>
      <div class="brain-grid" :style="{gridTemplateColumns:'repeat('+size+',1fr)'}">
        <button v-for="c in cells" :key="c.n" class="brain-cell" :class="{hit:c.hit, wrong:c.n===wrong}" @click="click(c)">{{c.hit?'✓':c.n}}</button>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
        <button v-if="!started&&!done" class="btn" @click="start">▶ 开始</button>
        <button v-if="started&&!done" class="btn" style="opacity:.5" disabled>▶ 进行中…</button>
        <button v-if="done" class="btn" @click="build">🔄 再玩一局</button>
        <button class="btn gray" @click="build">重新布局</button>
      </div>
      <div v-if="done" class="brain-done">🎯 本局评分 <b style="font-size:24px">{{score}}</b> · 用时 {{elapsed.toFixed(1)}} 秒 · {{size}}×{{size}} 方格{{best===state.brainBest?' · 🏆 刷新纪录！':''}}</div>
    </div>

    <div class="card tip-card">
      <div class="tip-title">💡 保护前额叶 · 每日提醒</div>
      <div class="tip-text">{{tip}}</div>
      <div class="tip-foot">{{today}} · 明天自动换新</div>
    </div>
  </div>`,
};

/* =========================================================
   根组件
   ========================================================= */
const App = {
  components: { Dashboard, Tasks, Memo, Plants, Sport, Finance, Anniv, Baby, Express, Brain },
  setup() {
    const current = ref("home");
    const menuOpen = ref(false); // 移动端抽屉菜单
    const nav = [
      { key: "home", ico: "home", name: "首页" },
      { key: "tasks", ico: "tasks", name: "日程管理" },
      { key: "memo", ico: "memo", name: "备忘录" },
      { key: "anniv", ico: "anniv", name: "纪念日" },
      { key: "finance", ico: "finance", name: "理财管理" },
      { key: "sport", ico: "sport", name: "减脂管理" },
      { key: "plants", ico: "plants", name: "我的植物" },
      { key: "baby", ico: "baby", name: "宝宝养育" },
      { key: "express", ico: "express", name: "表达能力" },
      { key: "brain", ico: "brain", name: "前额叶训练" },
    ];
    const compMap = { home: "dashboard", tasks: "tasks", memo: "memo", plants: "plants", sport: "sport", finance: "finance", anniv: "anniv", baby: "baby", express: "express", brain: "brain" };
    const badges = computed(() => ({ tasks: state.tasks.filter((t) => !t.done && (!t.due || t.due < todayStr()) ? false : !t.done).length, plants: state.plants.filter((p) => (p.lastWater ? dayDiff(addDays(p.lastWater, plantWaterDays(p)), todayStr()) : 0) <= 0 || (p.lastFertilize ? dayDiff(addDays(p.lastFertilize, p.fertilizeInterval || 30), todayStr()) : 0) <= 0).length }));
    const todayLabel = todayStr() + " 周" + "日一二三四五六"[new Date().getDay()];
    function goto(k) { current.value = k; menuOpen.value = false; }
    function toggleMenu() { menuOpen.value = !menuOpen.value; }

    /* ---------- 移动端悬浮头像气泡（可拖动，不占页面留白） ---------- */
    const menuPos = reactive({ x: 8, y: 6 });
    let drag = null;
    function menuDown(e) {
      drag = { startX: e.clientX, startY: e.clientY, ox: menuPos.x, oy: menuPos.y, moved: false };
      window.addEventListener("pointermove", menuMove);
      window.addEventListener("pointerup", menuUp);
      e.preventDefault();
    }
    function menuMove(e) {
      if (!drag) return;
      const dx = e.clientX - drag.startX, dy = e.clientY - drag.startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.moved = true;
      if (drag.moved) {
        const w = window.innerWidth, h = window.innerHeight;
        menuPos.x = Math.max(2, Math.min(w - 44, drag.ox + dx));
        menuPos.y = Math.max(2, Math.min(h - 60, drag.oy + dy));
      }
    }
    function menuUp() {
      window.removeEventListener("pointermove", menuMove);
      window.removeEventListener("pointerup", menuUp);
      if (drag && !drag.moved) toggleMenu();
      drag = null;
    }
    const fileInput = ref(null);
    function doExport() {
      const data = {};
      KEYS.forEach((k) => (data[k] = state[k]));
      data._exportedAt = new Date().toISOString();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "生活工作台备份_" + todayStr() + ".json"; a.click();
      showToast("已导出备份");
    }
    function doImport(e) {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => { try { const data = JSON.parse(r.result); Object.keys(data).forEach((k) => { if (k !== "_exportedAt" && state[k] !== undefined) state[k] = data[k]; }); syncPlanTasks(); showToast("导入成功"); } catch (err) { showToast("文件格式不对"); } };
      r.readAsText(f); e.target.value = "";
    }
    function triggerImport() { if (fileInput.value) fileInput.value.click(); }

    /* ---------- 账号登录 / 同步 ---------- */
    const authForm = reactive({ show: false, mode: "login", email: "", password: "", busy: false });
    const pwForm = reactive({ show: false, next: "", busy: false });
    function openLogin() { Object.assign(authForm, { show: true, mode: "login", email: "", password: "", busy: false }); }
    function openRegister() { Object.assign(authForm, { show: true, mode: "register", email: "", password: "", busy: false }); }
    async function submitAuth() {
      if (authForm.busy) return;
      const acc = authForm.email.trim();
      if (!acc) return showToast("请输入账号或邮箱");
      if (acc.length < 2) return showToast("账号至少 2 个字符");
      if (authForm.password.length < 6) return showToast("密码至少 6 位");
      authForm.busy = true;
      try {
        const u = authForm.mode === "register" ? await authRegister(acc, authForm.password) : await authLogin(acc, authForm.password);
        authForm.show = false;
        showToast(authForm.mode === "register" ? "注册成功，正在同步…" : "欢迎回来，" + u.username + "，正在同步…");
        /* 登录/注册成功 → 自动同步（先上传本地数据，再拉取云端合并） */
        try { await syncPush(); } catch(e) { /* 首次注册可能云端无数据，忽略 */ }
        try { await syncPull(); } catch(e) { /* 云端可能暂无数据 */ }
        showToast(authForm.mode === "register" ? "注册成功，数据已同步！" : "欢迎，" + u.username + "！数据已同步");
      } catch (e) { showToast(e.message); }
      authForm.busy = false;
    }
    async function submitPw() {
      if (pwForm.busy) return;
      if (pwForm.next.length < 6) return showToast("新密码至少 6 位");
      pwForm.busy = true;
      try { await authChangePw(pwForm.next); pwForm.show = false; showToast("密码已修改（如邮箱有确认链接请点击完成）"); }
      catch (e) { showToast(e.message); }
      pwForm.busy = false;
    }
    async function doSyncPush() {
      try { await syncPush(); showToast("已上传到云端"); }
      catch (e) { showToast(e.message); }
    }
    async function doSyncPull() {
      try { await syncPull(); showToast("已从云端拉取"); }
      catch (e) { showToast(e.message); }
    }
    function logout() { authLogout(); showToast("已退出登录"); }
    const accOpen = ref(false);

    /* 页面加载时：如果有 refresh_token → 自动恢复 session + 同步数据 */
    onMounted(async () => {
      if (!authState.refreshToken || !AUTH_ENABLED) return;
      try {
        await refreshToken(); // 刷新 access_token
        /* 自动同步：先上传本地最新数据，再拉取云端合并 */
        try { await syncPush(); } catch(e) { /* 忽略 */ }
        try { await syncPull(); } catch(e) { /* 云端可能暂无数据，首次使用正常 */ }
      } catch(e) {
        /* refresh 失败（token 被撤销等）→ 清除过期登录态 */
        authLogout();
      }
    });

    return { current, nav, compMap, badges, todayLabel, goto, toggleMenu, menuOpen, menuPos, menuDown, iconSvg, iconFor, DOG_SVG, fileInput, doExport, doImport, triggerImport, authState, authForm, pwForm, accOpen, openLogin, openRegister, submitAuth, submitPw, doSyncPush, doSyncPull, logout, AUTH_ENABLED };
  },
  template: `
  <div class="app">
    <div class="menu-mask" v-if="menuOpen" @click="toggleMenu"></div>
    <aside class="sidebar" :class="{open:menuOpen}">
      <div class="brand"><div class="brand-logo"><img src="icons/helloKitty.png" alt="Hello Kitty"></div><div class="brand-text"><div class="brand-title">一瓶生活记录</div><div class="brand-sub">{{todayLabel}}</div></div></div>
      <nav class="nav">
        <button class="nav-item" v-for="n in nav" :key="n.key" :class="{active:current===n.key}" @click="goto(n.key)">
          <span class="nav-ico"><img :src="iconFor(n.ico)" :alt="n.name"></span><span class="nav-name">{{n.name}}</span>
          <span v-if="(n.key==='tasks'&&badges.tasks) || (n.key==='plants'&&badges.plants)" class="badge">{{n.key==='tasks'?badges.tasks:badges.plants}}</span>
        </button>
      </nav>
      <div class="sidebar-foot">
        <div class="acc-box" v-if="AUTH_ENABLED">
          <button class="acc-main" @click="accOpen=!accOpen">
            <template v-if="!authState.user">👤 账号与数据 <span class="acc-caret">{{accOpen?'▲':'▼'}}</span></template>
            <template v-else>👤 {{authState.user.username}} <span class="acc-caret">{{accOpen?'▲':'▼'}}</span></template>
          </button>
          <div v-if="accOpen" class="acc-btns">
            <template v-if="!authState.user">
              <button class="btn-ghost" @click="openLogin">🔑 登录</button>
              <button class="btn-ghost" @click="openRegister">✨ 注册</button>
            </template>
            <template v-else>
              <button class="btn-ghost" @click="doSyncPush">⬆️ 上传</button>
              <button class="btn-ghost" @click="doSyncPull">⬇️ 拉取</button>
              <button class="btn-ghost" @click="pwForm.show=true">🔒 改密</button>
              <button class="btn-ghost" @click="logout">🚪 退出</button>
            </template>
            <button class="btn-ghost" @click="doExport">💾 导出备份</button>
            <button class="btn-ghost" @click="triggerImport">📥 导入备份</button>
          </div>
        </div>
        <button v-if="!AUTH_ENABLED" class="btn-ghost" @click="doExport">⬇️ 导出备份</button>
        <button v-if="!AUTH_ENABLED" class="btn-ghost" @click="triggerImport">⬆️ 导入备份</button>
        <input ref="fileInput" type="file" accept="application/json" hidden @change="doImport">
      </div>
    </aside>
    <main class="main">
      <button class="menu-btn" :class="{open:menuOpen}" :style="{left:menuPos.x+'px', top:menuPos.y+'px'}" @pointerdown="menuDown"><span><img src="icons/helloKitty_trans.png" alt="Hello Kitty"></span></button>
      <component :is="compMap[current]" @goto="goto"></component>
    </main>

    <!-- 登录 / 注册弹窗（登录功能停用时不显示） -->
    <div class="modal-mask" v-if="AUTH_ENABLED && authForm.show" @click.self="authForm.show=false">
      <div class="modal">
        <div class="modal-head"><span>{{authForm.mode==='register'?'注册账号':'账号登录'}}</span><button class="modal-close" @click="authForm.show=false">✕</button></div>
        <div class="modal-body">
          <div class="field"><label>账号 / 邮箱</label><input class="input" v-model="authForm.email" placeholder="输入账号或邮箱" @keyup.enter="submitAuth"></div>
          <div class="field"><label>密码</label><input class="input" type="password" v-model="authForm.password" placeholder="至少 6 位" @keyup.enter="submitAuth"></div>
          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button class="btn gray" @click="authForm.mode = authForm.mode==='register' ? 'login' : 'register'">{{authForm.mode==='register'?'← 已有账号去登录':'注册新账号 →'}}</button>
            <button class="btn" @click="submitAuth" :disabled="authForm.busy">{{authForm.busy ? '处理中…' : (authForm.mode==='register' ? '注册' : '登录')}}</button>
          </div>
          <div class="acc-tip">登录后可在多台设备间同步数据（上传/拉取）</div>
        </div>
      </div>
    </div>

    <!-- 修改密码弹窗（登录功能停用时不显示） -->
    <div class="modal-mask" v-if="AUTH_ENABLED && pwForm.show" @click.self="pwForm.show=false">
      <div class="modal">
        <div class="modal-head"><span>修改密码</span><button class="modal-close" @click="pwForm.show=false">✕</button></div>
        <div class="modal-body">
          <div class="field"><label>新密码</label><input class="input" type="password" v-model="pwForm.next" placeholder="至少 6 位" @keyup.enter="submitPw"></div>
          <div style="text-align:right"><button class="btn" @click="submitPw" :disabled="pwForm.busy">{{pwForm.busy ? '处理中…' : '确认修改'}}</button></div>
        </div>
      </div>
    </div>

    <div class="toast" v-if="toastMsg">{{toastMsg}}</div>
  </div>`,
};

/* ---------- 启动 ---------- */
loadAll();
seedIfEmpty();
ensureSportActs();
syncPlanTasks();
watch(state, saveAll, { deep: true });
saveAll();
/* 云端账号同步已移除，纯本地使用 */

const app = createApp(App);
const G = app.config.globalProperties;
G.state = state; G.fmtDate = fmtDate; G.fmtDateTime = fmtDateTime; G.iconSvg = iconSvg; G.iconFor = iconFor;
G.dayDiff = dayDiff; G.addDays = addDays; G.todayStr = todayStr; G.toastMsg = toastMsg;
app.component("dashboard", Dashboard);
app.component("tasks", Tasks);
app.component("memo", Memo);
app.component("plants", Plants);
app.component("sport", Sport);
app.component("finance", Finance);
app.component("anniv", Anniv);
app.component("baby", Baby);
app.component("express", Express);
app.component("brain", Brain);

app.mount("#app");
