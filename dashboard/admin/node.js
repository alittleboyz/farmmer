  import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signOut,
  EmailAuthProvider, reauthenticateWithCredential, updatePassword
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getDatabase, ref, get, set, push, update, remove, onValue,
  serverTimestamp, query, orderByChild, limitToLast, runTransaction
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// === CONFIG KAU ===
const firebaseConfig = {
  apiKey: "AIzaSyBAUxwnpWvSfih5EHY9Uy_9ABrym0Hd9iI",
  authDomain: "farmmer-888.firebaseapp.com",
  databaseURL: "https://farmmer-888-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "farmmer-888",
  storageBucket: "farmmer-888.firebasestorage.app",
  messagingSenderId: "100054260667",
  appId: "1:100054260667:web:f71a14baec71f89a8b829e"
};
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getDatabase(app);

  const $ = (id)=>document.getElementById(id);
  async function ensureFinanceSeed(user){
  if(!user) return;

  const uid = user.uid;
  const username = (user.email || "user").split("@")[0];

  const balRef = ref(db, "finance/balance/main");
  const balSnap = await get(balRef);

  // kalau dah ada, stop
  if(balSnap.exists()) return;

  // create ikut validate rules kau
  await set(balRef, {
    amount: 0,
    updatedAtMs: Date.now(),
    byUid: uid,
    byUser: username
  });

  // optional: create ledger root biar nampak folder
  const ledRef = ref(db, "finance/ledger/main");
  const ledSnap = await get(ledRef);
  if(!ledSnap.exists()){
    await set(ledRef, {});
  }
}
  function setSelectAndSync(selectId, value){
  const el = document.getElementById(selectId);
  if(!el) return;

  el.value = value;
  el.dispatchEvent(new Event("change", { bubbles:true }));
  el.dispatchEvent(new Event("input",  { bubbles:true }));
}
  function vaultRefOpen(){
  return ref(db, "vaults/open");
}
function vaultRefHist(){
  return ref(db, "vaults/history");
}
  // ===== CUSTOM SELECT BUILDER =====
function initCustomSelects(root=document){
  const selects = Array.from(root.querySelectorAll("select.js-custom-select"));
  selects.forEach(sel => makeCustomSelect(sel));
}

function makeCustomSelect(selectEl){
  if(selectEl.dataset.csBuilt === "1") return;
  selectEl.dataset.csBuilt = "1";
  selectEl.classList.add("native-select");

  const wrap = document.createElement("div");
  wrap.className = "cs";
  wrap.tabIndex = 0;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "cs__btn";

  const value = document.createElement("span");
  value.className = "cs__value";

  const arrow = document.createElement("span");
  arrow.className = "cs__arrow";
  arrow.textContent = "▾";

  btn.appendChild(value);
  btn.appendChild(arrow);

  const menu = document.createElement("div");
  menu.className = "cs__menu";

  function renderValue(){
    const opt = selectEl.options[selectEl.selectedIndex];
    value.textContent = opt ? opt.textContent : "Select...";
  }

  function rebuildOptions(){
    menu.innerHTML = "";
    Array.from(selectEl.options).forEach((o, idx)=>{
      const item = document.createElement("div");
      item.className = "cs__opt";
      item.setAttribute("role","option");
      item.dataset.value = o.value;
      item.dataset.index = String(idx);
      item.textContent = o.textContent;
      item.setAttribute("aria-selected", o.selected ? "true":"false");
      item.addEventListener("click", ()=>{
        
        selectEl.selectedIndex = idx;
        renderValue();
        
        menu.querySelectorAll(".cs__opt").forEach(x=>x.setAttribute("aria-selected","false"));
        item.setAttribute("aria-selected","true");
    
        selectEl.dispatchEvent(new Event("change",{bubbles:true}));
        selectEl.dispatchEvent(new Event("input",{bubbles:true}));

        closeAllCustomSelects();
      });

      menu.appendChild(item);
    });
  }

  function open(){
    closeAllCustomSelects();
    wrap.classList.add("open");
  }
  function close(){
    wrap.classList.remove("open");
  }
  function toggle(){
    wrap.classList.contains("open") ? close() : open();
  }

  btn.addEventListener("click", (e)=>{
    e.preventDefault();
    toggle();
  });
  wrap.addEventListener("keydown", (e)=>{
    if(e.key === "Escape") close();
    if(e.key === "Enter" || e.key === " "){
      e.preventDefault();
      toggle();
    }
  });
  selectEl.parentNode.insertBefore(wrap, selectEl);
  wrap.appendChild(btn);
  wrap.appendChild(selectEl);
  wrap.appendChild(menu);
  rebuildOptions();
  renderValue();
  selectEl.addEventListener("change", ()=>{
    menu.querySelectorAll(".cs__opt").forEach(x=>{
      x.setAttribute("aria-selected", x.dataset.value === selectEl.value ? "true":"false");
    });
    renderValue();
  });

  wrap._csRebuild = rebuildOptions;
}

function closeAllCustomSelects(){
  document.querySelectorAll(".cs.open").forEach(x=>x.classList.remove("open"));
}

document.addEventListener("click", (e)=>{
  if(!e.target.closest(".cs")) closeAllCustomSelects();
});

// ===== TOAST UPGRADE (bottom + animate show/hide) =====
let __toastTimer = null;

function toast(message, type = "success", ms = 2600){
  const el = $("toast");
  if(!el) return;

  const svgSuccess = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor"
        d="M9.55 17.25 4.8 12.5l1.4-1.4 3.35 3.35 8.25-8.25 1.4 1.4z"/>
    </svg>
  `;

  const svgError = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor"
        d="m12 10.93 5.719-5.72c.146-.146.339-.219.531-.219.404 0 .75.324.75.749 0 .193-.073.385-.219.532l-5.72 5.719 5.719 5.719c.147.147.22.339.22.531 0 .427-.349.75-.75.75-.192 0-.385-.073-.531-.219l-5.719-5.719-5.719 5.719c-.146.146-.339.219-.531.219-.401 0-.75-.323-.75-.75 0-.192.073-.384.22-.531l5.719-5.719-5.72-5.719c-.146-.147-.219-.339-.219-.532 0-.425.346-.749.75-.749.192 0 .385.073.531.219z"/>
    </svg>
  `;

  const icon = (type === "error") ? svgError : svgSuccess;

  // reset timer
  if(__toastTimer) clearTimeout(__toastTimer);
  __toastTimer = null;

  // set variant class (jgn overwrite show)
  el.className = `toast ${type}`;

  // build UI
  el.innerHTML = `
    <div class="toastCard">
      <div class="toastIcon">${icon}</div>
      <div class="toastMsg">${escapeHtml(String(message || ""))}</div>
      <button class="toastClose" type="button" aria-label="Close">✕</button>
    </div>
  `;

  // show (CSS animate guna .show)
  el.style.display = "block";
  // force reflow supaya transition confirm jalan
  void el.offsetHeight;
  el.classList.add("show");

  const hide = ()=>{
    if(__toastTimer) clearTimeout(__toastTimer);
    __toastTimer = null;

    // animate keluar
    el.classList.remove("show");

    // lepas transition baru clear
    setTimeout(()=>{
      el.style.display = "none";
      el.className = "toast";
      el.innerHTML = "";
    }, 230);
  };

  el.querySelector(".toastClose")?.addEventListener("click", hide, { once:true });

  if(ms && ms > 0){
    __toastTimer = setTimeout(hide, ms);
  }
}
function confirmBox(message, opts = {}){
  const root = document.getElementById("cConfirm");
  const titleEl = document.getElementById("ccTitle");
  const msgEl = document.getElementById("ccMsg");
  const ok = document.getElementById("ccOk");
  const cancel = document.getElementById("ccCancel");

  if(!root || !titleEl || !msgEl || !ok || !cancel){
    return Promise.resolve(window.confirm(message));
  }

  titleEl.textContent = opts.title || "Confirm";
  msgEl.textContent = message || "Are you sure?";

  ok.textContent = opts.okText || "OK";
  cancel.textContent = opts.cancelText || "Cancel";

  // reset class ok button (jaga class btn kau)
  ok.className = "btn " + (opts.okClass || "danger");

  root.style.display = "block";
  void root.offsetHeight;

  return new Promise((resolve)=>{
    const cleanup = ()=>{
      root.style.display = "none";
      ok.onclick = null;
      cancel.onclick = null;
      root.querySelectorAll("[data-cc]").forEach(x=> x.onclick = null);
      document.removeEventListener("keydown", onKey);
    };

    const done = (val)=>{ cleanup(); resolve(val); };

    const onKey = (e)=>{
      if(e.key === "Escape") done(false);
      if(e.key === "Enter") done(true);
    };
    document.addEventListener("keydown", onKey);

    root.querySelectorAll('[data-cc="close"]').forEach(x=>{
      x.onclick = ()=> done(false);
    });

    cancel.onclick = ()=> done(false);
    ok.onclick = ()=> done(true);
  });
}
function promptBox(message, opts = {}){
  const root = document.getElementById("cPrompt");
  const titleEl = document.getElementById("cpTitle");
  const msgEl = document.getElementById("cpMsg");
  const input = document.getElementById("cpInput");
  const ok = document.getElementById("cpOk");
  const cancel = document.getElementById("cpCancel");

  if(!root || !titleEl || !msgEl || !input || !ok || !cancel){
    const v = window.prompt(message, opts.defaultValue || "");
    return Promise.resolve(v);
  }

  titleEl.textContent = opts.title || "Input";
  msgEl.textContent = message || "Enter value";
  input.value = (opts.defaultValue ?? "");
  input.placeholder = opts.placeholder || "Type here...";

  ok.textContent = opts.okText || "Save";
  cancel.textContent = opts.cancelText || "Cancel";
  ok.className = "btn " + (opts.okClass || ""); // ikut style btn kau

  root.style.display = "block";
  void root.offsetHeight;

  // auto focus + select
  setTimeout(()=>{
    input.focus();
    input.select();
  }, 0);

  return new Promise((resolve)=>{
    const cleanup = ()=>{
      root.style.display = "none";
      ok.onclick = null;
      cancel.onclick = null;
      root.querySelectorAll("[data-cp]").forEach(x=> x.onclick = null);
      document.removeEventListener("keydown", onKey);
    };

    const done = (val)=>{ cleanup(); resolve(val); };

    const onKey = (e)=>{
      if(e.key === "Escape") done(null);
      if(e.key === "Enter") done(input.value);
    };
    document.addEventListener("keydown", onKey);

    root.querySelectorAll('[data-cp="close"]').forEach(x=>{
      x.onclick = ()=> done(null);
    });

    cancel.onclick = ()=> done(null);
    ok.onclick = ()=> done(input.value);
  });
}
const sleep = (ms)=> new Promise(r=>setTimeout(r, ms));
const SPINNER_SVG = `
<svg class="btnSpin" viewBox="0 0 24 24" aria-hidden="true">
  <path fill="currentColor" opacity=".28"
    d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8a8 8 0 0 1-8 8z"/>
  <path fill="currentColor"
    d="M20 12a8 8 0 0 0-8-8v2.2A5.8 5.8 0 0 1 17.8 12z"/>
</svg>`;

function setBtnLoading(btn, on, label){
  if(!btn) return;
  if(on){
    if(btn.dataset._busy === "1") return;
    btn.dataset._busy = "1";
    btn.dataset._oldHtml = btn.innerHTML;

    const txt = label || btn.getAttribute("data-loading") || btn.textContent.trim() || "Loading...";
    btn.classList.add("isLoading");
    btn.disabled = true;
    btn.innerHTML = `${SPINNER_SVG}<span>${txt}</span>`;
  }else{
    btn.dataset._busy = "0";
    btn.classList.remove("isLoading");
    btn.disabled = false;
    if(btn.dataset._oldHtml){
      btn.innerHTML = btn.dataset._oldHtml;
      delete btn.dataset._oldHtml;
    }
  }
}

function bindLoadingClick(btnId, handler){
  const btn = document.getElementById(btnId);
  if(!btn) return;

  btn.addEventListener("click", async ()=>{
    if(btn.disabled) return; // elak double click spam

    setBtnLoading(btn, true);
    await sleep(80); // bagi spinner sempat appear

    const MIN_TIME = 800; // minimum loading time
    const start = Date.now();

    try{
      // handler wajib throw kalau gagal
      const msg = await handler(); // boleh return string utk success toast

      // pastikan loading tak terlalu cepat
      const elapsed = Date.now() - start;
      const wait = Math.max(0, MIN_TIME - elapsed);
      if(wait) await sleep(wait);

      setBtnLoading(btn, false);

      // tutup modal jika ada
      const mid = btn.getAttribute("data-close-modal");
      if(mid) closeModal(mid);

      // bagi modal animation habis dulu baru toast
      await sleep(180);

      if(typeof msg === "string" && msg.trim()){
        toast(msg, "success");
      }

    }catch(e){
      console.error(e);

      const elapsed = Date.now() - start;
      const wait = Math.max(0, MIN_TIME - elapsed);
      if(wait) await sleep(wait);

      setBtnLoading(btn, false);

      // ❌ error = modal kekal buka
      toast(e?.message || "Failed", "error");
    }
  });
}

  const fmt = (n)=> (Number(n||0)).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2});
  const fmtDT = (ms)=>{
   if(!ms) return "-";
   const d = new Date(ms);
   const pad = (n)=> String(n).padStart(2,"0");
   const day   = pad(d.getDate());
   const month = pad(d.getMonth() + 1);
   const year  = d.getFullYear();
   const hour  = pad(d.getHours());
   const min   = pad(d.getMinutes());
   const sec   = pad(d.getSeconds());
  return `${day}/${month}/${year} ${hour}:${min}:${sec}`;
 };
// TX TIME (admin lock/unlock)
function toLocalInputValue(ms = Date.now()){
  const d = new Date(ms);
  const pad = (n)=> String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseDatetimeLocalToMs(v){
  const s = String(v||"").trim();
  if(!s) return NaN;
  const ms = Date.parse(s);
  return Number.isFinite(ms) ? ms : NaN;
}

function txSettingRef(kind){
  return ref(db, `settings/txTime/allowManual/${kind}`);
}

function initTxTimeControl({ kind, inputId, toggleId }){
  const input = $(inputId);
  const btn = $(toggleId);
  if(!input) return;

  input.value = toLocalInputValue(Date.now());

  if(btn && !me.isAdmin) btn.style.display = "none";

  onValue(txSettingRef(kind), (snap)=>{
    const allow = snap.exists() ? !!snap.val() : false;
    input.disabled = !allow;

    if(btn && me.isAdmin){
      btn.textContent = allow ? "Lock" : "Unlock";
      btn.dataset.allow = String(allow);
    }
  });

  if(btn && me.isAdmin){
    btn.addEventListener("click", async ()=>{
      await runTransaction(txSettingRef(kind), (cur)=> !cur);
    });
  }
}

async function getAtMsFromControl(kind, inputId){
  const allowSnap = await get(txSettingRef(kind));
  const allow = allowSnap.exists() ? !!allowSnap.val() : false;

  if(!allow) return Date.now();

  const ms = parseDatetimeLocalToMs($(inputId)?.value);
  return Number.isFinite(ms) ? ms : Date.now();
}

function resetTxTimeInput(inputId){
  const input = $(inputId);
  if(input) input.value = toLocalInputValue(Date.now());
}

const startOfDayMs = (d)=> new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0,0,0,0).getTime();
const endOfDayMs   = (d)=> new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23,59,59,999).getTime();

const WEEK_START = 1; // Monday
function startOfWeekMs(d){
  const x = new Date(d);
  const day = x.getDay();
  const diff = (day - WEEK_START + 7) % 7;
  x.setDate(x.getDate() - diff);
  return startOfDayMs(x);
}
function endOfWeekMs(d){
  const s = new Date(startOfWeekMs(d));
  const e = new Date(s);
  e.setDate(e.getDate()+6);
  return endOfDayMs(e);
}
function startOfMonthMs(d){ return new Date(d.getFullYear(), d.getMonth(), 1, 0,0,0,0).getTime(); }
function endOfMonthMs(d){ return new Date(d.getFullYear(), d.getMonth()+1, 0, 23,59,59,999).getTime(); }

function presetRangeMs(key){
  const now = new Date();
  if(key==="today") return { startMs:startOfDayMs(now), endMs:endOfDayMs(now) };
  if(key==="yesterday"){
    const y = new Date(now); y.setDate(y.getDate()-1);
    return { startMs:startOfDayMs(y), endMs:endOfDayMs(y) };
  }
  if(key==="thisWeek")  return { startMs:startOfWeekMs(now), endMs:endOfWeekMs(now) };
  if(key==="lastWeek"){
    const lw = new Date(now); lw.setDate(lw.getDate()-7);
    return { startMs:startOfWeekMs(lw), endMs:endOfWeekMs(lw) };
  }
  if(key==="thisMonth") return { startMs:startOfMonthMs(now), endMs:endOfMonthMs(now) };
  if(key==="lastMonth"){
    const lm = new Date(now.getFullYear(), now.getMonth()-1, 1);
    return { startMs:startOfMonthMs(lm), endMs:endOfMonthMs(lm) };
  }
  return null;
}

function setActivePreset(vaultId, key){
  const g = document.querySelector(`[data-presets="${vaultId}"]`);
  if(!g) return;
  g.querySelectorAll(".pbtn").forEach(b=>{
    b.classList.toggle("active", b.dataset.preset===key);
  });
}
function clearActivePreset(vaultId){
  const g = document.querySelector(`[data-presets="${vaultId}"]`);
  if(!g) return;
  g.querySelectorAll(".pbtn").forEach(b=> b.classList.remove("active"));
}
function clearVaultDateRange(vaultId){
  vaultFilters[vaultId] = "showAll";

  const input = document.querySelector(`.dateRangeInput[data-range="${vaultId}"]`);
  const fp = vaultPickers[vaultId];

  if(fp){
    try{
      fp.clear(false); // jangan trigger perubahan tambahan
      fp.selectedDates = [];
      fp.latestSelectedDateObj = null;
    }catch(_){}
  }

  if(input){
    input.value = "Show All";

    // paksa text kekal, sebab kadang flatpickr clear balik
    requestAnimationFrame(()=>{
      input.value = "Show All";
    });

    setTimeout(()=>{
      input.value = "Show All";
    }, 0);
  }

  clearActivePreset(vaultId);
  resetPaging(vaultId);
  rerenderVaultTbody(vaultId);
}
function ymd(ms){
  const d = new Date(ms);
  const pad = (n)=> String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
// ===== LIVE MONEY FORMAT: 1000 -> 1,000.00 =====
function _stripNum(s){
  return String(s ?? "")
    .replace(/[^\d.]/g, "")
    .replace(/(\..*)\./g, "$1"); // only one dot
}
function moneyFormat(raw){
  if(raw === "" || raw === ".") return "";
  const n = Number(raw);
  if(!Number.isFinite(n)) return "";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function moneyVal(idOrEl){
  const el = (typeof idOrEl === "string") ? $(idOrEl) : idOrEl;
  const raw = _stripNum(el?.value);
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}
function intVal(idOrEl){
  const el = (typeof idOrEl === "string") ? $(idOrEl) : idOrEl;
  const raw = String(el?.value ?? "").replace(/[^\d]/g, "");
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}
function formatMoneyTyping(raw){
  raw = _stripNum(raw);

  if(raw === "") return "";
  if(raw === ".") return "0.";

  // split integer & decimals
  const parts = raw.split(".");
  let intPart = parts[0] || "0";
  let decPart = parts[1] ?? "";

  intPart = intPart.replace(/^0+(?=\d)/, "");
  if(decPart.length > 2) decPart = decPart.slice(0,2);
  intPart = Number(intPart || "0").toLocaleString("en-US");
  if(raw.endsWith(".") && parts.length === 2) return intPart + ".";
  if(decPart.length > 0) return intPart + "." + decPart;

  return intPart;
}

function attachMoney(el){
  if(!el) return;
  el.addEventListener("input", ()=>{
    const start = el.selectionStart || 0;
    const before = el.value;

    el.value = formatMoneyTyping(before);
    el.setSelectionRange(el.value.length, el.value.length);
  });

  el.addEventListener("blur", ()=>{
    const raw = _stripNum(el.value);
    el.value = raw ? moneyFormat(raw) : "";
  });
}
function attachInt(el){
  if(!el) return;
  el.addEventListener("input", ()=>{
    const raw = String(el.value ?? "").replace(/[^\d]/g, "");
    el.value = raw ? Number(raw).toLocaleString("en-US") : "";
  });
}
function formatKgTyping(raw){
  raw = _stripNum(raw);

  if(raw === "") return "";
  if(raw === ".") return "0.";

  const parts = raw.split(".");
  let intPart = parts[0] || "0";
  let decPart = parts[1] ?? "";

  intPart = intPart.replace(/^0+(?=\d)/, "");
  // kalau nak limit decimal kg max 2 (boleh ubah 3 kalau kau mahu)
  if(decPart.length > 2) decPart = decPart.slice(0,2);

  intPart = Number(intPart || "0").toLocaleString("en-US");

  if(raw.endsWith(".") && parts.length === 2) return intPart + ".";
  if(decPart.length > 0) return intPart + "." + decPart;
  return intPart;
}

function attachKg(el){
  if(!el) return;

  // typing: commas + decimal, tak paksa .00
  el.addEventListener("input", ()=>{
    el.value = formatKgTyping(el.value);
    el.setSelectionRange(el.value.length, el.value.length);
  });

  // blur: kemaskan je (still tak paksa .00)
  el.addEventListener("blur", ()=>{
    el.value = formatKgTyping(el.value);
  });
}
  let me = { uid:null, username:null, isAdmin:false };
  let currentBalance = 0;
  const WALLET_ID = "main";
  let buyTotalManual = false;

  // UI state
  let activeView = "open";
  let ctxVaultId = null; 
  let ctxAvailablePig = 0;
  let ctxMissingPig = 0;
  let ctxEdit = null; 
  const vaultFilters = {};   // { [vaultId]: { startMs, endMs } }
  const vaultPickers = {};   // { [vaultId]: flatpickrInstance }
  const vaultTxCache = {}; 
  const vaultTypeFilters = {};
  const vaultTxSearchFilters = {};
  const vaultTxUnsubs = {};
  let vaultSearchTerm = "";
  let openVaultDataCache = {};
  let histVaultDataCache = {};
  // ===== RIGHT DRAWER GLOBAL (ONE-TIME) =====
let btnDrawer = null;
let drawer = null;
let overlay = null;

let drawerWallet = null;
let drawerUsername = null;
let drawerLogoutBtn = null;

let drawerBound = false;
let __scrollY = 0;
// ===== PAGINATION (per vault) =====
const vaultPaging = {}; // { [vaultId]: { page, per } }

function getPaging(vaultId){
  if(!vaultPaging[vaultId]){
    vaultPaging[vaultId] = { page: 1, per: 10 };
  }
  return vaultPaging[vaultId];
}

function resetPaging(vaultId){
  const p = getPaging(vaultId);
  p.page = 1;
}
function syncDrawer(){
  const balEl = document.getElementById("balanceText");
  if(drawerWallet && balEl) drawerWallet.textContent = balEl.textContent.trim();

  const uEl = document.getElementById("usernameText");
  if(drawerUsername && uEl) drawerUsername.textContent = uEl.textContent.trim();
}

function lockScroll(){
  __scrollY = window.scrollY || document.documentElement.scrollTop || 0;
  document.documentElement.classList.add("drawerOpen");
  document.body.classList.add("drawerOpen");
  document.body.style.top = `-${__scrollY}px`;
  const sb = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.paddingRight = sb ? (sb + "px") : "";
  const header = document.querySelector("header");
  if(header) header.style.paddingRight = sb ? (sb + "px") : "";
}

function unlockScroll(){
  document.documentElement.classList.remove("drawerOpen");
  document.body.classList.remove("drawerOpen");
  document.body.style.top = "";
  document.body.style.paddingRight = "";
  const header = document.querySelector("header");
  if(header) header.style.paddingRight = "";
  window.scrollTo(0, __scrollY);
}

function openDrawer(){
  syncDrawer();
  if(overlay) overlay.classList.add("open");
  if(drawer){
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden","false");
  }
  lockScroll();
}

function closeDrawer(){
  if(drawer){
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden","true");
  }
  if(overlay) overlay.classList.remove("open");
  unlockScroll();
}
function openWalletFromAnywhere(){
  try{ closeDrawer(); }catch(_){}
  openModal("mBalance");
}
function toggleDrawer(){
  if(drawer && drawer.classList.contains("open")) closeDrawer();
  else openDrawer();
}

function onOutsideDrawerClick(e){
  if(!drawer || !drawer.classList.contains("open")) return;

  const insideDrawer = drawer.contains(e.target);
  const onBtn = btnDrawer && btnDrawer.contains(e.target);

  // klik luar drawer (dan bukan button) => close
  if(!insideDrawer && !onBtn){
    closeDrawer();
  }
}

function initRightDrawerOnce(){
  if(drawerBound) return;
  drawerBound = true;

  btnDrawer = document.getElementById("btnRightDrawer");
  drawer = document.getElementById("rightDrawer");
  overlay = document.getElementById("rightDrawerOverlay");

  drawerWallet = document.getElementById("drawerWallet");
  drawerUsername = document.getElementById("drawerUsername");
  drawerLogoutBtn = document.getElementById("drawerLogoutBtn");
  const drawerWalletRow = document.getElementById("drawerWalletRow"); 
  if(drawerWalletRow){
  drawerWalletRow.addEventListener("click", (e)=>{
    e.preventDefault();
    e.stopPropagation();
    openWalletFromAnywhere();
  });
}

  if(btnDrawer){
    btnDrawer.addEventListener("click", (e)=>{
      e.preventDefault();
      e.stopPropagation(); // penting: elak click luar trigger
      toggleDrawer();
    });
  }

  if(drawer){
    drawer.addEventListener("click", (e)=> e.stopPropagation());
  }

  if(overlay){
    overlay.addEventListener("click", closeDrawer);
  }

  document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape") closeDrawer();
  });

  // capture = paling power (walaupun ada stopPropagation tempat lain)
  document.addEventListener("click", onOutsideDrawerClick, true);

  // logout button dalam drawer
  if(drawerLogoutBtn){
    drawerLogoutBtn.addEventListener("click", async ()=>{
      try{
        await signOut(auth);
        location.replace("../login/");
      }catch(e){
        console.error(e);
        toast(e?.message || "Logout failed");
      }
    });
  }
}
  // ===== MODAL helper =====
  function openModal(id){ $(id).style.display="flex"; }
function closeModal(id){
  $(id).style.display="none";
  if(id==="mCash" || id==="mBuy" || id==="mMissing" || id==="mSell"){
    ctxEdit = null;
  }
  if(id==="mNewVault") resetTxTimeInput("txTime_newVault");
  if(id==="mCash")    resetTxTimeInput("txTime_cash");
  if(id==="mBuy")     resetTxTimeInput("txTime_buy");
  if(id==="mMissing") resetTxTimeInput("txTime_missing");
  if(id==="mSell")    resetTxTimeInput("txTime_sell");
}
  document.addEventListener("click",(e)=>{
    const t = e.target;
    if(t?.dataset?.close) closeModal(t.dataset.close);
    if(t.classList.contains("modalBack")) t.style.display="none";
  });
// ===== MOBILE KEYBOARD VIEWPORT FIX =====
(function(){
  function setVVH(){
    const h = (window.visualViewport && window.visualViewport.height)
      ? window.visualViewport.height
      : window.innerHeight;
    document.documentElement.style.setProperty("--vvh", h + "px");
  }

  setVVH();
  window.addEventListener("resize", setVVH);
  if(window.visualViewport){
    window.visualViewport.addEventListener("resize", setVVH);
    window.visualViewport.addEventListener("scroll", setVVH);
  }

  // Bila focus input dalam modal, auto scroll bagi field nampak
  document.addEventListener("focusin", (e)=>{
    const el = e.target;
    if(!(el instanceof HTMLElement)) return;
    if(!el.closest(".modal")) return;

    setTimeout(()=>{
      try{
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      }catch(_){}
    }, 150);
  });
})();
// ===== ROLE =====
async function loadRole(uid){
  const r = await get(ref(db, `roles/${uid}`));
  const role = r.exists() ? r.val() : {};
  me.isAdmin = role?.isAdmin === true;
  me.username = role?.username || me.username || "user";
  const rolePill = $("rolePill");
  if(rolePill){
    rolePill.textContent = me.isAdmin ? "Admin" : "Client";
  }
  const usernameText = $("usernameText");
  if(usernameText){
    usernameText.textContent = me.username;
  }
  const btnAddPoint = $("btnAddPoint");
  if(btnAddPoint){
    btnAddPoint.classList.toggle("hide", !me.isAdmin);
  }
}

function wireBalanceListener(){
  const balPath = `finance/balance/${WALLET_ID}`;

  onValue(ref(db, balPath), (snap)=>{
    const v = snap.val() || {};
    currentBalance = Number(v.amount||0);

    const txt = fmt(currentBalance);
    const isNeg = currentBalance < 0;

    const elSmall  = $("balanceText");   // header top
    const elBig    = $("balanceBig");    // modal
    const elDrawer = $("drawerWallet");  //  sidebar drawer

    if(elSmall)  elSmall.textContent  = txt;
    if(elBig)    elBig.textContent    = txt;
    if(elDrawer) elDrawer.textContent = txt;

    // ✅ apply class good/bad untuk semua sekali
    [elSmall, elBig, elDrawer].forEach(el=>{
      if(!el) return;
      el.classList.remove("good","bad");
      el.classList.add(isNeg ? "bad" : "good");
    });

    const upd = $("balanceUpdated");
    if(upd) upd.textContent = v.updatedAtMs ? fmtDT(v.updatedAtMs) : "-";
  });
}
function wireLastLedgerListener(){
  const elDelta = $("balanceDelta");
  const elBefore = $("balanceBefore");
  const elCurrent = $("balanceBig");

  if(!elDelta) return;

  const ledPath = `finance/ledger/${WALLET_ID}`;
  const qy = query(ref(db, ledPath), orderByChild("atMs"), limitToLast(80));

  onValue(qy, (snap)=>{
    if(!snap.exists()){
      elDelta.textContent = fmt(0);
      if(elBefore) elBefore.textContent = fmt(0);
      return;
    }

    const obj = snap.val() || {};
    const arr = Object.entries(obj).sort((a,b)=>
      Number(b[1]?.atMs || 0) - Number(a[1]?.atMs || 0)
    );

    const hit = arr.find(([_, v]) => v?.kind === "add_point");

    if(!hit){
      elDelta.textContent = fmt(0);
      if(elBefore) elBefore.textContent = fmt(0);
      return;
    }

    const last = hit[1] || {};
    const delta = Number(last.delta ?? 0);

    elDelta.textContent = fmt(delta);

    elDelta.classList.remove("good","bad");
    if(delta < 0) elDelta.classList.add("bad");
    else elDelta.classList.add("good");

    // ✅ kira last balance
    const current = Number(
      (elCurrent?.textContent || "0").replace(/[^0-9.-]/g,"")
    );

    const before = current - delta;

if(elBefore){
  elBefore.textContent = fmt(before);
  elBefore.classList.remove("good","bad");

  if(before < 0){
    elBefore.classList.add("bad");
  }else{
    elBefore.classList.add("good");
  }
}
  });
}
async function changeBalance(delta, meta, atMsOverride){
  const now = Number(atMsOverride || Date.now());
  const balAmountRef = ref(db, `finance/balance/${WALLET_ID}/amount`);
  const balMetaRef   = ref(db, `finance/balance/${WALLET_ID}`);

  // 1) atomic update amount
  const txRes = await runTransaction(balAmountRef, (cur)=>{
    const n = Number(cur || 0);
    return n + Number(delta || 0);
  });

  if(!txRes.committed) throw new Error("Balance update cancelled.");

  const newAmount = Number(txRes.snapshot.val() || 0);

  // 2) update meta + ledger (non-atomic ok, sebab amount dah selamat)
  const ledRef  = push(ref(db, `finance/ledger/${WALLET_ID}`));
  const updates = {};

  updates[`finance/balance/${WALLET_ID}`] = {
    amount: newAmount,
    updatedAt: serverTimestamp(),
    updatedAtMs: now,
    byUid: me.uid,
    byUser: me.username
  };

  updates[`finance/ledger/${WALLET_ID}/${ledRef.key}`] = {
    ...(meta||{}),
    delta,
    balanceAfter: newAmount,
    at: serverTimestamp(),
    atMs: now,
    byUid: me.uid,
    byUser: me.username
  };

  await update(ref(db), updates);
}

  // ===== VAULTS =====
async function createVault(title, note, createdAtMs){
  const now = Number(createdAtMs || Date.now());
  const vRef = push(vaultRefOpen());
  await set(vRef, {
    title: String(title||"").trim(),
    note: String(note||"").trim(),
    status: "open",
    createdAt: serverTimestamp(),
    createdAtMs: now,
    createdByUid: me.uid,
    createdBy: me.username,
    summary: { totalCost:0, totalKg:0, totalEkor:0, totalRevenue:0, profit:0 }
  });
}
async function addTx(vaultId, tx, atMsOverride){
  const now = Number(atMsOverride || Date.now());
  const txRef = push(ref(db, `vaults/${activeView==="open" ? "open":"history"}/${vaultId}/transactions`));
  await set(txRef, { ...tx, at: serverTimestamp(), atMs: now, byUid: me.uid, byUser: me.username });
  await recomputeVaultSummary(vaultId, activeView==="open" ? "open":"history");
}

async function recomputeVaultSummary(vaultId, bucket){
  const snap = await get(ref(db, `vaults/${bucket}/${vaultId}/transactions`));
  const txs = snap.exists() ? snap.val() : {};

  let totalCost=0, totalKg=0, totalEkor=0, totalRevenue=0;
  let missingQty = 0;

  let sellKgSum = 0;
  let sellPriceKgWeighted = 0;

  let babyQty = 0;
  let babyTotal = 0;
  let babyPriceSum = 0;

  for(const k of Object.keys(txs)){
    const t = txs[k];

    if(t.kind==="missing"){
      missingQty += Number(t.qty||0);
    }

    if(t.kind==="buy"){
      const tTotal = Number(t.total||0);
      totalCost += tTotal;

      if(t.category === "baby_pig"){
        const q = Number(t.qty||0);
        const p = Number(t.price||0);
        babyQty += q;
        babyTotal += tTotal;
        babyPriceSum += (q * p);
      }
    }

    if(t.kind==="sell"){
      const kg = Number(t.kg||0);
      const pk = Number(t.priceKg||0);

      totalRevenue += Number(t.total||0);
      totalKg += kg;
      totalEkor += Number(t.ekor||0);

      if(kg > 0 && pk > 0){
        sellKgSum += kg;
        sellPriceKgWeighted += (pk * kg);
      }
    }
  } // ✅ INI YANG KAU TAK ADA TADI (tutup for)

  const profit = totalRevenue - totalCost;
  const babyAvgPrice = babyQty > 0 ? (babyPriceSum / babyQty) : 0;
  const avgPriceKg = sellKgSum > 0 ? (sellPriceKgWeighted / sellKgSum) : 0;

  await update(ref(db, `vaults/${bucket}/${vaultId}`), {
    summary: {
      totalCost, totalKg, totalEkor, totalRevenue, profit,
      babyPig: { qty:babyQty, avgPrice:babyAvgPrice, total:babyTotal },
      missing: { qty: missingQty },
      sell: { avgPriceKg },
      availablePig: Math.max(0, babyQty - missingQty - totalEkor)
    },
    updatedAt: serverTimestamp(),
    updatedAtMs: Date.now()
  });
}

  async function closeVault(vaultId){
    // move open -> history (multi update)
    const openSnap = await get(ref(db, `vaults/open/${vaultId}`));
    if(!openSnap.exists()) return;

    const data = openSnap.val();
    const now = Date.now();

    const updates = {};
    updates[`vaults/history/${vaultId}`] = {
      ...data,
      status: "closed",
      closedAt: serverTimestamp(),
      closedAtMs: now,
      closedByUid: me.uid,
      closedBy: me.username
    };
    updates[`vaults/open/${vaultId}`] = null;
    await update(ref(db), updates);
  }
async function uncloseVault(vaultId){
  const histPath = `vaults/history/${vaultId}`;
  const openPath = `vaults/open/${vaultId}`;

  const histSnap = await get(ref(db, histPath));
  if(!histSnap.exists()) return;

  const data = histSnap.val() || {};
  const now = Date.now();

  const { closedAt, closedAtMs, closedBy, closedByUid, ...rest } = data;

  const openData = {
    ...rest,
    status: "open",
    reopenedAt: serverTimestamp(),
    reopenedAtMs: now,
    reopenedByUid: me.uid,
    reopenedBy: me.username,
    updatedAt: serverTimestamp(),
    updatedAtMs: now
  };

  // 🔥 IMPORTANT: multi-location update supaya listener trigger betul
  const updates = {};
  updates[openPath] = openData;
  updates[histPath] = null;

  await update(ref(db), updates);
}
  // ===== RENDER =====
  function setView(v){
    activeView = v;
    $("tabOpen").classList.toggle("active", v==="open");
    $("tabHistory").classList.toggle("active", v==="history");
    $("viewOpen").classList.toggle("hide", v!=="open");
    $("viewHistory").classList.toggle("hide", v!=="history");
  }

function vaultCardHTML(vaultId, v, bucket){
  const s = v.summary || { totalCost:0,totalKg:0,totalEkor:0,totalRevenue:0,profit:0 };
  const bp = (s.babyPig || { qty:0, avgPrice:0, total:0 });

  const missingQty = Number(s.missing?.qty || 0);
  const totalEkor  = Number(s.totalEkor || 0);

  const availablePig = Number(
    s.availablePig ?? Math.max(0, Number(bp.qty||0) - missingQty - totalEkor)
  );

  const avgPriceKg = Number(s.sell?.avgPriceKg || 0);

  const profitVal   = Number(s.profit || 0);
  const profitClass = profitVal >= 0 ? "kpiGood" : "kpiBad";

  const SALES_RATE  = 0.40;
  const salesValue  = profitVal * SALES_RATE;
  const salesClass  = salesValue >= 0 ? "kpiGood" : "kpiBad";
  const createdBy = v?.createdBy || "-";
  const created = v.createdAtMs ? fmtDT(v.createdAtMs) : "-";
  const updated = v.updatedAtMs ? fmtDT(v.updatedAtMs) : "-";
  const closed  = v.closedAtMs  ? fmtDT(v.closedAtMs)  : "-";

  const canEdit = me.isAdmin;
  const isHistory = bucket === "history";
  const ownerUid = v?.createdByUid || null;
  const isOwner = ownerUid && ownerUid === me.uid;
  const canOperateOpen = !isHistory && (me.isAdmin || isOwner);

  return `
    <div class="card" data-vid="${vaultId}" data-bucket="${bucket}">
      <div class="cardHead">
        <div>
          <div class="title">${escapeHtml(v.title || "Untitled Vault")}</div>
          <div class="sub">
            Created: <span class="num">${created}</span>
            ${isHistory ? ` • Closed: <span class="num">${closed}</span>` : ``}
            <br>Updated: <span class="num">${updated}</span>
          </div>
        </div>

        <div class="vaultBtns">
${!isHistory ? `
  ${canOperateOpen ? `
    <button class="btn ghost" data-act="cash" data-id="${vaultId}">Cash Transfer</button>
    <button class="btn ghost" data-act="buy" data-id="${vaultId}">Buy</button>
    <button class="btn ghost" data-act="missing" data-id="${vaultId}">Missing</button>
    <button class="btn ghost" data-act="sell" data-id="${vaultId}">Sell</button>
    <button class="btn danger" data-act="close" data-id="${vaultId}">Closing</button>
  ` : ``}
` : `
  ${canEdit ? `<button class="btn ghost" data-act="histEdit" data-id="${vaultId}">Edit Title</button>` : ``}
`}
        </div>
      </div>

      <div class="cardBody">

        <!-- KPI BUY kiri + SELL kanan -->
        <div class="kpiSplit">

          <!-- LEFT: BUY -->
          <div class="kpiTableCard">
            <div class="kpiTableHead">Total Bought</div>
            <table class="kpiTable">
              <tr><td>Total Cash Out</td><td class="kpiGood" data-kpi="cashOut">0.00</td></tr>
              <tr><td>Total Expenses</td><td class="kpiGood" data-kpi="buyCost">${fmt(s.totalCost)}</td></tr>
              <tr><td>Total Pets</td><td data-kpi="buyQty">${Number((s.babyPig?.qty||0)).toLocaleString()}</td></tr>
              <tr><td>Total Price Quantity</td><td class="kpiGood" data-kpi="buyAvg">${fmt((s.babyPig?.avgPrice||0))}</td></tr>
              <tr><td>Total Price</td><td class="kpiGood" data-kpi="buyTotal">${fmt((s.babyPig?.total||0))}</td></tr>
              <tr><td>Total Feeding</td><td class="kpiGood" data-kpi="feedTotal">0.00</td></tr>
              <tr><td>Total Other</td><td class="kpiGood" data-kpi="otherTotal">0.00</td></tr>
              <tr><td>Total Cash In/Out</td><td class="kpiGood" data-kpi="cashNet">0.00</td></tr>
              <tr><td>Total Profit</td><td class="${salesClass}" data-kpi="sales">${fmt(salesValue)}</td></tr>
            </table>
          </div>

          <!-- RIGHT: SELL -->
          <div class="kpiTableCard">
            <div class="kpiTableHead">Total Sold</div>
            <table class="kpiTable">
              <tr><td>Total Cash In</td><td class="kpiGood" data-kpi="cashIn">0.00</td></tr>
              <tr><td>Total Seller</td><td class="kpiGood" data-kpi="sellRevenue">${fmt(s.totalRevenue)}</td></tr>
              <tr><td>Total Quantity KG</td><td class="kpiGood" data-kpi="sellAvgKg">${fmt((s.sell?.avgPriceKg||0))}</td></tr>
              <tr><td>Total KG</td><td class="kpiGood" data-kpi="sellKg">${fmt(s.totalKg)}</td></tr>
              <tr><td>Total Quantity</td><td class="kpiGood" data-kpi="sellEkor">${Number(s.totalEkor||0).toLocaleString()}</td></tr>
              <tr><td>Total Missing</td><td class="kpiBad" data-kpi="missingQty">${Number(s.missing?.qty||0).toLocaleString()}</td></tr>
              <tr><td>Total Price Missing</td><td class="kpiGood" data-kpi="missingTotal">0.00</td></tr>
              <tr><td>Total Pets Available</td><td class="kpiGood" data-kpi="availablePig">${availablePig.toLocaleString()}</td></tr>
              <tr><td>Total Sales</td><td class="${profitClass}" data-kpi="profit">${fmt(profitVal)}</td></tr>
            </table>
          </div>

        </div>

        <div class="hr"></div>
        <div class="rangeBar" data-rangebar="${vaultId}">
<div class="rangeLeft">
  <input class="dateRangeInput" data-range="${vaultId}" type="text" readonly>

  <select class="js-custom-select" data-typefilter="${vaultId}" style="min-width:160px">
    <option value="all">All Type</option>
    <option value="cash_in">Cash In</option>
    <option value="cash_out">Cash Out</option>
    <option value="buy">Buy</option>
    <option value="missing">Missing</option>
    <option value="sell">Sell</option>
  </select>

  <!-- ✅ NEW -->
<div class="txSearchWrap">
  <input class="txSearchInput"
    type="text"
    placeholder="Search transaction..."
    data-txsearch="${vaultId}">

  <button type="button" class="vaultSearchClear" data-txclear="${vaultId}" aria-label="Clear search">
  <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="m12.002 2.005c5.518 0 9.998 4.48 9.998 9.997 0 5.518-4.48 9.998-9.998 9.998-5.517 0-9.997-4.48-9.997-9.998 0-5.517 4.48-9.997 9.997-9.997zm0 8.933-2.721-2.722c-.146-.146-.339-.219-.531-.219-.404 0-.75.324-.75.749 0 .193.073.384.219.531l2.722 2.722-2.728 2.728c-.147.147-.22.34-.22.531 0 .427.35.75.751.75.192 0 .384-.073.53-.219l2.728-2.728 2.729 2.728c.146.146.338.219.53.219.401 0 .75-.323.75-.75 0-.191-.073-.384-.22-.531l-2.727-2.728 2.717-2.717c.146-.147.219-.338.219-.531 0-.425-.346-.75-.75-.75-.192 0-.385.073-.531.22z"></path>
  </button>
</div>
</div>

  <div class="rangeRight" data-presets="${vaultId}">
    <button class="pbtn" data-preset="today"     data-vid="${vaultId}">Today</button>
    <button class="pbtn" data-preset="yesterday" data-vid="${vaultId}">Yesterday</button>
    <button class="pbtn" data-preset="thisWeek"  data-vid="${vaultId}">This Week</button>
    <button class="pbtn" data-preset="lastWeek"  data-vid="${vaultId}">Last Week</button>
    <button class="pbtn" data-preset="thisMonth" data-vid="${vaultId}">This Month</button>
    <button class="pbtn" data-preset="lastMonth" data-vid="${vaultId}">Last Month</button>
    <button class="pbtn" data-preset="showAll"   data-vid="${vaultId}">Show All</button>
  </div>
</div>

        <div class="tblWrap">
          <table>
            <thead>
              <tr>
                <th style="width:120px">Type</th>
                <th>Transaction</th>
                <th style="width:120px">Quantity</th>
                <th style="width:150px">Price Quantity</th>
                <th style="width:150px">Total Amount</th>
                <th style="width:180px">Date & Time</th>
                <th style="width:180px">Actions</th>
              </tr>
            </thead>
            <tbody data-tbody="${vaultId}">
              <tr><td colspan="7" class="hint">Loading...</td></tr>
            </tbody>
          </table>
        </div>

${(v.note || v.createdBy) ? `<div class="hr"></div>` : ``}

<div class="vaultFooter">
  <div class="vaultFooterLeft">
    ${v.note ? `<div class="hint"><b>Note:</b> ${escapeHtml(v.note)}</div>` : ``}
    <div class="create-vault"><b>Create By:</b> ${escapeHtml(createdBy)}</div>
  </div>

  <div class="vaultFooterRight">
    ${
      (!isHistory)
        ? `
          ${
            (me.isAdmin || isOwner)
              ? `<button class="btn danger" data-act="vaultDel" data-id="${vaultId}" data-b="open">Delete Vault</button>`
              : ``
          }
        `
        : `
          ${(() => {
            const isOwnerUnclose =
              me.isAdmin ||
              (v?.createdByUid && v.createdByUid === me.uid) ||
              (v?.closedByUid && v.closedByUid === me.uid);

            return isOwnerUnclose
              ? `<button class="btn ghost" data-act="vaultUnclose" data-id="${vaultId}">Unclosing</button>`
              : ``;
          })()}
          ${me.isAdmin ? `<button class="btn danger" data-act="vaultDel" data-id="${vaultId}" data-b="history">Delete Vault</button>` : ``}
        `
    }
  </div>
</div>

      </div>
    </div>
  `;
}

function txRowHTML(vaultId, txId, t, bucket){
  const at = t.atMs ? fmtDT(t.atMs) : "-";

  let typeTag = `<span class="tag">TX</span>`;
  if(t.kind==="cash") typeTag = `<span class="tag ${t.direction==="in"?"in":"out"}">${t.direction==="in"?"CASH-IN":"CASH-OUT"}</span>`;
  if(t.kind==="buy")  typeTag = `<span class="tag buy">BUY</span>`;
  if(t.kind==="sell") typeTag = `<span class="tag sell">SELL</span>`;
  if(t.kind==="missing") typeTag = `<span class="tag out">MISSING</span>`;

  // Amount
let amount = Number(t.total || t.amount || 0);
if(t.kind === "cash" && t.direction === "out"){
  amount = -Math.abs(amount);
}
if(t.kind === "missing"){
  amount = -Math.abs(amount);
}
const amountText = fmt(amount);
const amtClass = amount < 0 ? "amtNeg" : "";

  // === NEW: qty (ekor) & unit price column ===
  let qtyEkor = "";
  let unitPrice = "";

  if(t.kind==="buy"){
    qtyEkor = Number(t.qty||0) ? String(Number(t.qty||0).toLocaleString()) : "";
    unitPrice = Number(t.price||0) ? fmt(t.price||0) : "";
  }else if(t.kind==="missing"){
    qtyEkor = Number(t.qty||0) ? String(Number(t.qty||0).toLocaleString()) : "";
    unitPrice = Number(t.price||0) ? fmt(t.price||0) : "";
}else if(t.kind==="sell"){
  qtyEkor = Number(t.ekor||0) ? String(Number(t.ekor||0).toLocaleString()) : "";
  unitPrice = Number(t.priceKg||0) ? fmt(t.priceKg||0) : "";
  }else{
    qtyEkor = "";
    unitPrice = "";
  }

  // Description (dah tak ada "qty @ ...")
  const desc = buildTxDesc(t);

const vaultOwnerUid = window.__vaultOwner?.[vaultId]; // kita isi nanti masa render
const isOwner = (vaultOwnerUid && vaultOwnerUid === me.uid);
const showActions = (bucket === "open")
  ? (me.isAdmin || isOwner)
  : me.isAdmin;

const hasNote = String(t.note||"").trim().length > 0;
let rowClass = "";
if(t.kind === "missing") rowClass += " row-missing";
if(t.kind === "cash" && t.direction === "out") rowClass += " row-cashout";
rowClass = rowClass.trim();
return `
    <tr data-txid="${txId}" class="${rowClass}">
      <td>${typeTag}</td>
      <td>${escapeHtml(desc)}</td>

      <td class="num">${escapeHtml(qtyEkor || "-")}</td>
      <td class="num">${escapeHtml(unitPrice || "-")}</td>

      <td class="num ${amtClass}">${amountText}</td>
      <td class="num">${at}</td>
      <td>
        ${showActions ? `
          <div style="display:flex; gap:8px; justify-content:flex-end; flex-wrap:wrap">
${hasNote ? `
  <button class="btn-view" style="padding:8px 10px"
    data-act="txView"
    data-v="${vaultId}" data-b="${bucket}" data-t="${txId}">
    View
  </button>
` : ``}
            <button class="btn-edit" style="padding:8px 10px"
              data-act="txEdit" data-v="${vaultId}" data-b="${bucket}" data-t="${txId}">
              Edit
            </button>
            <button class="btn-delete" style="padding:8px 10px"
              data-act="txDel" data-v="${vaultId}" data-b="${bucket}" data-t="${txId}">
              Delete
            </button>
          </div>
        ` : `<span class="hint">-</span>`}
      </td>
    </tr>
  `;
}

function buildTxDesc(t){
  if(t.kind==="cash"){
    return t.direction==="in" ? "Cash-In" : "Cash-Out";
  }

  if(t.kind==="buy"){
    return t.category==="baby_pig" ? "Pets"
         : (t.category==="feed" ? "Feeding" : "Other");
  }

  if(t.kind==="missing"){
    return "Missing";
  }

  if(t.kind==="sell"){
    return `${fmt(t.kg||0)} kg`;
  }

  return "Transaction";
}

  function escapeHtml(s){
    return String(s||"").replace(/[&<>"']/g, m => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[m]));
  }
  function txBalanceEffect(t){
  if(!t) return 0;

  if(t.kind === "cash"){
    const amt = Number(t.amount || t.total || 0);
    return (t.direction === "in") ? amt : -amt;
  }

  if(t.kind === "buy"){
    return -Math.abs(Number(t.total || 0));
  }

  if(t.kind === "sell"){
    return Math.abs(Number(t.total || 0));
  }
  return 0;
}
async function adjustBalanceForTxDelete({ bucket, vaultId, txId, txObj }) {
  // txObj boleh pass terus (kalau dah ada), kalau tak kita get dari DB
  let t = txObj;

  if(!t){
    const snap = await get(ref(db, `vaults/${bucket}/${vaultId}/transactions/${txId}`));
    if(!snap.exists()) return;
    t = snap.val();
  }

  const eff = txBalanceEffect(t); // cash/buy/sell effect
  if(eff === 0) return; // missing tak sentuh balance

  // reverse effect bila delete
  const delta = -eff;

  // guna masa tx asal kalau ada (lebih cun dalam ledger)
  const atMs = Number(t.atMs || Date.now());

  await changeBalance(delta, {
    kind: "tx_delete_adjust",
    txKind: t.kind,
    vaultId,
    txId,
    note: "Delete tx rollback"
  }, atMs);
}
function openViewNote(noteText){
  const txt = String(noteText || "").trim();
  $("viewNoteText").textContent = txt ? txt : "No note.";
  openModal("mViewNote");
}
function renderVaultList(targetId, data, bucket){
  const el = $(targetId);
  const entries = Object.entries(data||{});
    window.__vaultOwner = window.__vaultOwner || {};
  for(const [id,v] of entries){
    window.__vaultOwner[id] = v?.createdByUid || null;
  }

  // sort: latest createdAtMs desc
  entries.sort((a,b)=> (Number(b[1]?.createdAtMs||0) - Number(a[1]?.createdAtMs||0)));

  if(entries.length===0){
    el.innerHTML = `<div class="card"><div class="cardBody"><div class="hint">No vault yet.</div></div></div>`;
    return;
  }

  el.innerHTML = entries.map(([id,v]) => vaultCardHTML(id,v,bucket)).join("");
  for(const [id] of entries){
    initVaultDateRangeUI(id);
  }
  for(const [id] of entries){
    const txPath = `vaults/${bucket}/${id}/transactions`;

    // ✅ remove old listener for same vaultId (if exist)
    if(vaultTxUnsubs[id]){
      vaultTxUnsubs[id]();
      delete vaultTxUnsubs[id];
    }

    // ✅ attach new listener + store unsubscribe
    vaultTxUnsubs[id] = onValue(ref(db, txPath), (snap)=>{
      const txs = snap.exists()? snap.val() : {};
      const tbody = document.querySelector(`[data-tbody="${id}"]`);
      if(!tbody) return;

      const rows = Object.entries(txs);
      rows.sort((a,b)=> Number(b[1]?.atMs||0) - Number(a[1]?.atMs||0));

      if(rows.length===0){
      vaultTxCache[id] = { bucket, rows: [] };
      rerenderVaultTbody(id);                
      return;
      }

      vaultTxCache[id] = { bucket, rows };
      rerenderVaultTbody(id);
    });
  }
}
function ensurePagerBar(vaultId){
  const card = document.querySelector(`.card[data-vid="${vaultId}"]`);
  if(!card) return null;

  let bar = card.querySelector(".tblPager");
  if(bar) return bar;

  const tblWrap = card.querySelector(".tblWrap");
  if(!tblWrap) return null;

  bar = document.createElement("div");
  bar.className = "tblPager";

  bar.innerHTML = `
    <div class="tblPagerLeft">
      <span class="hint" data-info="${vaultId}"></span>
      <button class="pbtn" type="button" data-prev="${vaultId}">‹</button>
      <div class="tblPagerPages" data-pages="${vaultId}"></div>
      <button class="pbtn" type="button" data-next="${vaultId}">›</button>
    </div>

    <div class="tblPagerRight">
<div class="customSelect" data-per="${vaultId}" data-drop="up">
  <div class="cs-selected">10 / page</div>
  <div class="cs-options">
    <div data-value="10">10 / page</div>
    <div data-value="20">20 / page</div>
    <div data-value="50">50 / page</div>
    <div data-value="100">100 / page</div>
  </div>
</div>
    </div>
  `;

  tblWrap.insertAdjacentElement("afterend", bar);
  return bar;
}
function buildPageItems(current, total){
  // total kecil: tunjuk semua
  if(total <= 7){
    return Array.from({length: total}, (_,i)=> i+1);
  }

  const items = [];
  const window = 2; // kiri/kanan 2 => akan jadi ... 3 4 5 6 7 ...

  const left  = Math.max(2, current - window);
  const right = Math.min(total - 1, current + window);

  items.push(1);

  if(left > 2) items.push("...");

  for(let i=left; i<=right; i++) items.push(i);

  if(right < total - 1) items.push("...");

  items.push(total);

  return items;
}
// ===== CUSTOM SELECT PORTAL (UPGRADED) =====
let __openCS = null;

function closeCustomSelect(){
  if(!__openCS) return;

  const { cs, menu, placeholder, onDocDown, onResize, onScroll } = __openCS;

  // ✅ arrow rotate off
  const selected = cs.querySelector(".cs-selected");
  if(selected) selected.setAttribute("aria-expanded", "false");

  cs.classList.remove("open");

  // ✅ remove pop animation class
  menu.classList.remove("cs-pop");

  // balikkan menu ke tempat asal
  if(placeholder && placeholder.parentNode){
    placeholder.parentNode.replaceChild(menu, placeholder);
  }

  // ✅ reset style fixed + display
  menu.style.position = "";
  menu.style.left = "";
  menu.style.top = "";
  menu.style.width = "";
  menu.style.zIndex = "";
  menu.style.display = "";
  menu.style.opacity = "";
  menu.style.transform = "";

  // remove listeners
  document.removeEventListener("pointerdown", onDocDown, true);
  window.removeEventListener("resize", onResize);
  window.removeEventListener("scroll", onScroll, true);

  __openCS = null;
}

function openCustomSelect(cs){
  const selected = cs.querySelector(".cs-selected");
  const menu = cs.querySelector(".cs-options");
  if(!selected || !menu) return;

  // kalau open yang sama -> tutup
  if(__openCS?.cs === cs){
    closeCustomSelect();
    return;
  }

  // tutup yang lain dulu
  closeCustomSelect();

  cs.classList.add("open");
  selected.setAttribute("aria-expanded", "true"); // ✅ arrow rotate on terus

  // buat placeholder supaya kita boleh balikkan menu ke tempat asal
  const placeholder = document.createElement("span");
  placeholder.style.display = "none";
  cs.replaceChild(placeholder, menu);
  document.body.appendChild(menu);

  const openUp = cs.dataset.drop === "up";

  // ✅ tampilkan dulu utk measure height (tapi hidden anim state)
  menu.style.display = "block";
  menu.classList.remove("cs-pop");

  // ✅ lock width first (supaya tak berubah masa measure)
  const rect = selected.getBoundingClientRect();
  menu.style.position = "fixed";
  menu.style.left = rect.left + "px";
  menu.style.width = rect.width + "px";
  menu.style.zIndex = "9999999";

  // measure height
  const h = menu.getBoundingClientRect().height;
  const pad = 8;

  let top = openUp ? (rect.top - h - 6) : (rect.bottom + 6);
  top = Math.max(pad, Math.min(top, window.innerHeight - h - pad));
  menu.style.top = top + "px";

  // ✅ IMPORTANT: buat dia "pop dari tombol"
  // start state dekat tombol (opacity 0 + offset kecil)
  menu.style.opacity = "0";
  menu.style.transform = openUp ? "translateY(8px)" : "translateY(-8px)";

  requestAnimationFrame(()=>{
    // animate to final state (css handle)
    menu.classList.add("cs-pop");
    menu.style.opacity = "";
    menu.style.transform = "";
  });

  // reposition bila scroll/resize
  const reposition = ()=>{
    if(!__openCS) return;

    const r = selected.getBoundingClientRect();
    menu.style.left = r.left + "px";
    menu.style.width = r.width + "px";

    const hh = menu.getBoundingClientRect().height;
    let t = openUp ? (r.top - hh - 6) : (r.bottom + 6);
    t = Math.max(pad, Math.min(t, window.innerHeight - hh - pad));
    menu.style.top = t + "px";
  };

  // ✅ pointerdown capture: click luar = close
  const onDocDown = (e)=>{
    // click dalam cs atau menu -> biar (option click akan handle sendiri)
    if(cs.contains(e.target) || menu.contains(e.target)) return;
    closeCustomSelect();
  };

  // ✅ option click: pilih value, then close (arrow terus off)
  const onMenuClick = (e)=>{
    const opt = e.target.closest("[data-value], .cs-option, li, button");
    if(!opt) return;
    // kalau kau ada handler pilih value kat tempat lain, biar jalan,
    // lepas tu close dropdown
    closeCustomSelect();
  };

  const onResize = ()=> reposition();
  const onScroll = ()=> reposition();

  document.addEventListener("pointerdown", onDocDown, true);
  window.addEventListener("resize", onResize);
  window.addEventListener("scroll", onScroll, true);

  // ✅ attach sekali (tak kacau structure asal)
  menu.addEventListener("click", onMenuClick, { once:true });

  __openCS = { cs, menu, placeholder, onDocDown, onResize, onScroll };
}

function bindCustomSelect(cs, vaultId){
  if(!cs || cs.dataset._bound === "1") return;
  cs.dataset._bound = "1";

  const selected = cs.querySelector(".cs-selected");
  const optsWrap = cs.querySelector(".cs-options");
  if(!selected || !optsWrap) return;

  // ✅ Toggle (1 tap open, 1 tap close)
  selected.addEventListener("pointerdown", (e)=>{
    e.preventDefault();
    e.stopPropagation();

    // kalau yang tengah open ialah cs ini -> close
    if(__openCS?.cs === cs){
      closeCustomSelect();
    }else{
      openCustomSelect(cs);
    }
  }, { passive:false });

  // ✅ pilih option
  optsWrap.addEventListener("pointerdown", (e)=>{
    const opt = e.target.closest("[data-value]");
    if(!opt) return;

    e.preventDefault();
    e.stopPropagation();

    const val = Number(opt.dataset.value || 10) || 10;

    const p = getPaging(vaultId);
    p.per = val;
    p.page = 1;

    // update label
    selected.textContent = `${val} / page`;

    // ✅ close portal (guna __openCS)
    closeCustomSelect();

    rerenderVaultTbody(vaultId);
  }, { passive:false });
}
function renderPagerButtons(vaultId, total, totalPages){
  const bar = ensurePagerBar(vaultId);
  if(!bar) return;

  const p = getPaging(vaultId);

  // info text
  const info = bar.querySelector(`[data-info="${vaultId}"]`);
  if(info){
    const start = total ? ((p.page - 1) * p.per + 1) : 0;
    const end   = Math.min(total, (p.page * p.per));
    info.textContent = `${start}-${end} of ${total} items`;
  }

  // ===== prev/next buttons =====
  const btnPrev = bar.querySelector(`[data-prev="${vaultId}"]`);
  const btnNext = bar.querySelector(`[data-next="${vaultId}"]`);

  if(btnPrev && btnPrev.dataset._bound !== "1"){
    btnPrev.dataset._bound = "1";
    btnPrev.addEventListener("click", ()=>{
      const pp = getPaging(vaultId);
      if(pp.page > 1){
        pp.page -= 1;
        rerenderVaultTbody(vaultId);
      }
    });
  }

  if(btnNext && btnNext.dataset._bound !== "1"){
    btnNext.dataset._bound = "1";
    btnNext.addEventListener("click", ()=>{
      const pp = getPaging(vaultId);
      const tp = Math.max(1, Math.ceil((total||0) / pp.per));
      if(pp.page < tp){
        pp.page += 1;
        rerenderVaultTbody(vaultId);
      }
    });
  }

  // disable state
  if(btnPrev) btnPrev.disabled = (p.page <= 1);
  if(btnNext) btnNext.disabled = (p.page >= totalPages);

  // ===== pages buttons + dots =====
  const pagesWrap = bar.querySelector(`[data-pages="${vaultId}"]`);
  if(pagesWrap){
    pagesWrap.innerHTML = "";

    const items = buildPageItems(p.page, totalPages);

    items.forEach(it=>{
      if(it === "..."){
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "pbtn";
        dot.textContent = "...";
        dot.disabled = true;
        dot.style.opacity = ".6";
        pagesWrap.appendChild(dot);
        return;
      }

      const b = document.createElement("button");
      b.type = "button";
      b.className = "pbtn" + (it === p.page ? " active" : "");
      b.textContent = String(it);
      b.addEventListener("click", ()=>{
        const pp = getPaging(vaultId);
        pp.page = it;
        rerenderVaultTbody(vaultId);
      });
      pagesWrap.appendChild(b);
    });
  }

  // ===== per-page customSelect (PORTAL FIX for mobile/overflow) =====
  const cs = bar.querySelector(`.customSelect[data-per="${vaultId}"]`);
  if(cs){
    const selected = cs.querySelector(".cs-selected");
    if(selected){
      // sync label ikut p.per
      selected.textContent = `${p.per} / page`;
    }

    // ✅ bind sekali sahaja (guna pointerdown + position:fixed portal)
    // NOTE: bindCustomSelect mesti wujud (helper function)
    bindCustomSelect(cs, vaultId);
  }
}
function rerenderVaultTbody(vaultId){
  const cache = vaultTxCache[vaultId];
  const tbody = document.querySelector(`[data-tbody="${vaultId}"]`);
  if(!tbody || !cache) return;

  const { bucket, rows } = cache;
 const f = vaultFilters[vaultId];

let use = rows;

// date range filter
if(f && f !== "showAll"){
  use = use.filter(([txId,t])=>{
    const ms = Number(t?.atMs||0);
    return ms >= f.startMs && ms <= f.endMs;
  });
}

const tf = vaultTypeFilters[vaultId] || "all";
if(tf !== "all"){
  use = use.filter(([_, t])=>{
    if(!t) return false;

    if(tf === "cash_in")  return t.kind === "cash" && t.direction === "in";
    if(tf === "cash_out") return t.kind === "cash" && t.direction === "out";

    // buy / missing / sell
    return t.kind === tf;
  });
}
// ✅ SEARCH filter
const q = String(vaultTxSearchFilters[vaultId] || "").trim().toLowerCase();
if(q){
  use = use.filter(([_, t])=>{
    if(!t) return false;

    const desc = buildTxDesc(t); // Cash In / Pets / Feed / Death Pets / "10.00 kg"
    const note = String(t.note||"");
    const kind = String(t.kind||"");
    const dir  = String(t.direction||"");
    const cat  = String(t.category||"");

    const hay = `${desc} ${note} ${kind} ${dir} ${cat}`.toLowerCase();
    return hay.includes(q);
  });
}
  // ✅ IMPORTANT: KPI kena update walaupun table kosong
  updateVaultKpiFromFiltered(vaultId);

// ===== PAGINATION APPLY =====
const p = getPaging(vaultId);
const total = use.length;
const totalPages = Math.max(1, Math.ceil(total / p.per));
if(p.page > totalPages) p.page = totalPages;

// table kosong (lepas filter)
if(total === 0){
  renderPagerButtons(vaultId, 0, 1);
  tbody.innerHTML = `<tr><td colspan="7" class="hint">No transaction in this date range.</td></tr>`;
  return;
}

// slice rows ikut page
const startIdx = (p.page - 1) * p.per;
const pageRows = use.slice(startIdx, startIdx + p.per);

// render pager UI
renderPagerButtons(vaultId, total, totalPages);

// render rows
tbody.innerHTML = pageRows
  .map(([txId,t]) => txRowHTML(vaultId, txId, t, bucket))
  .join("");
}
function bindTxSearchClear(vaultId){
  const input = document.querySelector(`input[data-txsearch="${vaultId}"]`);
  const btn   = document.querySelector(`button[data-txclear="${vaultId}"]`);
  if(!input || !btn) return;

  const sync = ()=>{
    btn.style.display = input.value.trim() ? "inline-flex" : "none";
  };

  // elak double bind bila vault rerender
  if(input.dataset._clearBound === "1"){
    sync();
    return;
  }
  input.dataset._clearBound = "1";

  input.addEventListener("input", sync);

  btn.addEventListener("click", ()=>{
    input.value = "";
    sync();
    input.dispatchEvent(new Event("input", { bubbles:true })); // trigger filter
    input.focus();
  });

  sync();
}
function initVaultDateRangeUI(vaultId){
  const input = document.querySelector(`.dateRangeInput[data-range="${vaultId}"]`);
  if(!input) return;

  // === TYPE FILTER dropdown ===
  const sel = document.querySelector(`select[data-typefilter="${vaultId}"]`);
  if(sel){
    sel.value = vaultTypeFilters[vaultId] || "all";
    sel.onchange = ()=>{
      vaultTypeFilters[vaultId] = sel.value || "all";
      resetPaging(vaultId);
      rerenderVaultTbody(vaultId);
    };
  }
// === TX SEARCH (per vault) ===
const s = document.querySelector(`input[data-txsearch="${vaultId}"]`);
if(s){
  s.value = vaultTxSearchFilters[vaultId] || "";
  s.oninput = ()=>{
    vaultTxSearchFilters[vaultId] = s.value || "";
    resetPaging(vaultId);
    rerenderVaultTbody(vaultId);
  };
   bindTxSearchClear(vaultId);
}
  // === DATE RANGE ===
if(!Object.prototype.hasOwnProperty.call(vaultFilters, vaultId)){
  vaultFilters[vaultId] = presetRangeMs("thisMonth");
}
const def = vaultFilters[vaultId];

  const existing = vaultPickers[vaultId];
if(existing){
  if(existing.input !== input){
    try{ existing.destroy(); }catch(_){}
    delete vaultPickers[vaultId];
  }else{
    input.value = def === "showAll" ? "Show All" : `${ymd(def.startMs)} → ${ymd(def.endMs)}`;
    return;
  }
}

 input.value = def === "showAll" ? "Show All" : `${ymd(def.startMs)} → ${ymd(def.endMs)}`;

vaultPickers[vaultId] = flatpickr(input, {
  mode: "range",
  dateFormat: "Y-m-d",
  showMonths: 2,
  closeOnSelect: false,
  defaultDate: (def && def !== "showAll") ? [new Date(def.startMs), new Date(def.endMs)] : null,

onReady: ()=> {
  if(def === "showAll"){
    input.value = "Show All";
  }else{
    input.value = `${ymd(def.startMs)} → ${ymd(def.endMs)}`;
  }
  clearActivePreset(vaultId);
},

onOpen: ()=> {
  const f = vaultFilters[vaultId];

  if(f === "showAll"){
    input.value = "Show All";
    return;
  }

  if(f && !input.value.trim()){
    input.value = `${ymd(f.startMs)} → ${ymd(f.endMs)}`;
  }
},

    onChange: (dates)=>{
      if(dates.length === 2){
        const startMs = startOfDayMs(dates[0]);
        const endMs   = endOfDayMs(dates[1]);
        vaultFilters[vaultId] = { startMs, endMs };

        input.value = `${ymd(startMs)} → ${ymd(endMs)}`;
        clearActivePreset(vaultId);
        resetPaging(vaultId);
        rerenderVaultTbody(vaultId);
      }
    },

onClose: (dates)=>{
  if(dates.length === 0){
    const f = vaultFilters[vaultId];

    if(f === "showAll"){
      input.value = "Show All";
      requestAnimationFrame(()=>{
        input.value = "Show All";
      });
    }else if(f){
      input.value = `${ymd(f.startMs)} → ${ymd(f.endMs)}`;
    }else{
      input.value = "";
    }
    return;
  }
      if(dates.length === 1){
        const startMs = startOfDayMs(dates[0]);
        const endMs   = endOfDayMs(dates[0]);
        vaultFilters[vaultId] = { startMs, endMs };

        input.value = `${ymd(startMs)} → ${ymd(endMs)}`;
        clearActivePreset(vaultId);
        resetPaging(vaultId);
        rerenderVaultTbody(vaultId);
      }
    }
  });

  // build custom select UI for that card
  const card = document.querySelector(`.card[data-vid="${vaultId}"]`);
  if(card) initCustomSelects(card);
}
function updateVaultKpiFromFiltered(vaultId){
  const cache = vaultTxCache[vaultId];
  if(!cache) return;

  const { rows } = cache; // rows = [[txId, txObj], ...]
const f = vaultFilters[vaultId];

// apply filter
let use = rows;
if(f && f !== "showAll"){
  use = rows.filter(([_,t])=>{
    const ms = Number(t?.atMs||0);
    return ms >= f.startMs && ms <= f.endMs;
  });
}

  // compute KPI from filtered tx
  let buyCost = 0;
  let babyQty = 0, babyTotal = 0, babyPriceSum = 0;
  let feedTotal = 0;
  let otherTotal = 0; 
  let sellRevenue = 0;
  let sellKg = 0;
  let sellEkor = 0;
  let sellKgSum = 0, sellPriceKgWeighted = 0;
  let missingQty = 0;
  let missingTotal = 0;

  // ✅ NEW: cash in/out totals
  let cashIn = 0;
  let cashOut = 0;

  for(const [txId, t] of use){
    if(!t || !t.kind) continue;

    // ✅ cash summary
    if(t.kind === "cash"){
      const amt = Number(t.amount || t.total || 0);
      if(t.direction === "in") cashIn += amt;
      else cashOut += amt;
    }
if(t.kind === "buy"){
  const total = Number(t.total||0);
  buyCost += total;

  if(t.category === "baby_pig"){
    const q = Number(t.qty||0);
    const p = Number(t.price||0);
    babyQty += q;
    babyTotal += total;
    babyPriceSum += (q * p);
  } else if(t.category === "feed"){
    feedTotal += total; 
  } else {
    otherTotal += total;
  }
}

    if(t.kind === "sell"){
      const total = Number(t.total||0);
      const kg = Number(t.kg||0);
      const ekor = Number(t.ekor||0);
      const pk = Number(t.priceKg||0);

      sellRevenue += total;
      sellKg += kg;
      sellEkor += ekor;

      if(kg > 0 && pk > 0){
        sellKgSum += kg;
        sellPriceKgWeighted += (pk * kg);
      }
    }

if(t.kind === "missing"){
  missingQty += Number(t.qty||0);
  missingTotal += Number(t.total || t.amount || 0); // ✅ jumlah harga mati
}
  }

  const profit = sellRevenue - buyCost;
  const SALES_RATE = 0.40;
  const sales = profit * SALES_RATE;

  const buyAvg = babyQty > 0 ? (babyPriceSum / babyQty) : 0;
  const sellAvgKg = sellKgSum > 0 ? (sellPriceKgWeighted / sellKgSum) : 0;

  const availablePig = Math.max(0, babyQty - missingQty - sellEkor);

  // helper: update text in this vault card only
  const card = document.querySelector(`.card[data-vid="${vaultId}"]`);
  if(!card) return;

  const setKpi = (key, text)=>{
    const el = card.querySelector(`[data-kpi="${key}"]`);
    if(el) el.textContent = text;
  };

  // ✅ update CASH IN/OUT
  setKpi("cashIn", fmt(cashIn));

const cashOutEl = card.querySelector(`[data-kpi="cashOut"]`);
if(cashOutEl){
  cashOutEl.textContent = fmt(cashOut);
  cashOutEl.classList.remove("kpiBad");
  cashOutEl.classList.add("kpiGood");
}
  // update BUY
  setKpi("buyCost", fmt(buyCost));
  setKpi("buyQty", babyQty.toLocaleString());
  setKpi("buyAvg", fmt(buyAvg));
  setKpi("buyTotal", fmt(babyTotal));
  setKpi("feedTotal", fmt(feedTotal));
  setKpi("otherTotal", fmt(otherTotal));

  // update PROFIT & SALES + color
  const profitEl = card.querySelector(`[data-kpi="profit"]`);
  if(profitEl){
    profitEl.textContent = fmt(profit);
    profitEl.classList.toggle("kpiGood", profit >= 0);
    profitEl.classList.toggle("kpiBad", profit < 0);
  }

  const salesEl = card.querySelector(`[data-kpi="sales"]`);
  if(salesEl){
    salesEl.textContent = fmt(sales);
    salesEl.classList.toggle("kpiGood", sales >= 0);
    salesEl.classList.toggle("kpiBad", sales < 0);
  }
 // ===== CASH IN/OUT NET =====
const cashNet = cashIn - cashOut;  // duit masuk tolak duit keluar

const cashNetEl = card.querySelector(`[data-kpi="cashNet"]`);
if(cashNetEl){
  cashNetEl.textContent = fmt(cashNet);
  cashNetEl.classList.toggle("kpiGood", cashNet >= 0);
  cashNetEl.classList.toggle("kpiBad",  cashNet < 0);
}
  // update SELL
  setKpi("sellRevenue", fmt(sellRevenue));
  setKpi("sellAvgKg", fmt(sellAvgKg));
  setKpi("sellKg", fmt(sellKg));
  setKpi("sellEkor", sellEkor.toLocaleString());

  // missing & available
const missQtyEl = card.querySelector(`[data-kpi="missingQty"]`);
if(missQtyEl){
  missQtyEl.textContent = missingQty.toLocaleString();
  missQtyEl.classList.toggle("kpiGood", missingQty === 0);
  missQtyEl.classList.toggle("kpiBad",  missingQty > 0);
}

// missing total (0.00 hijau, ada -> merah & negatif)
const missTotalEl = card.querySelector(`[data-kpi="missingTotal"]`);
if(missTotalEl){
  const showVal = (missingTotal > 0) ? -missingTotal : 0; // ✅ negatif bila ada
  missTotalEl.textContent = fmt(showVal);

  missTotalEl.classList.toggle("kpiGood", missingTotal === 0);
  missTotalEl.classList.toggle("kpiBad",  missingTotal > 0);
}

setKpi("availablePig", availablePig.toLocaleString());
}
function vaultMatchesSearch(v, term){
  if(!term) return true;
  const t = term.toLowerCase();
  return (
    String(v.title||"").toLowerCase().includes(t) ||
    String(v.note||"").toLowerCase().includes(t) ||
    String(v.createdBy||"").toLowerCase().includes(t)
  );
}

function filterVaultData(data){
  const out = {};
  for(const [id,v] of Object.entries(data||{})){
    if(vaultMatchesSearch(v, vaultSearchTerm)) out[id]=v;
  }
  return out;
}

function rerenderVaultLists(){
  renderVaultList("viewOpen", filterVaultData(openVaultDataCache), "open");
  renderVaultList("viewHistory", filterVaultData(histVaultDataCache), "history");
  applyLang(getLang());
}
function wireVaultListeners(){
  onValue(query(vaultRefOpen(), orderByChild("createdAtMs"), limitToLast(80)), (snap)=>{
    openVaultDataCache = snap.exists()? snap.val() : {};
    rerenderVaultLists();
  });

  onValue(query(vaultRefHist(), orderByChild("createdAtMs"), limitToLast(120)), (snap)=>{
    histVaultDataCache = snap.exists()? snap.val() : {};
    rerenderVaultLists();
  });
}
 async function assertCanOperateOpenVault(vaultId){
  if(me.isAdmin) return true;
  const s = await get(ref(db, `vaults/open/${vaultId}/createdByUid`));
  const owner = s.exists() ? s.val() : null;
  return owner === me.uid;
}
  // ===== EVENTS =====
 $("btnBalance").addEventListener("click", openWalletFromAnywhere);
// ===== USER DROPDOWN TOGGLE =====
const userDrop = $("userDrop");
const userBtn  = $("btnUser");
const userMenu = $("userMenu");
// ===== CHANGE PASSWORD =====
function openChangePass(){
  if($("cpOld"))  $("cpOld").value  = "";
  if($("cpNew"))  $("cpNew").value  = "";
  if($("cpNew2")) $("cpNew2").value = "";
  if($("cpHint")) $("cpHint").textContent = "";
  openModal("mChangePass");
}

async function doChangePassword(){
  const user = auth.currentUser;
  if(!user || !user.email) throw new Error("No user session.");

  const oldPass = $("cpOld")?.value || "";
  const newPass  = $("cpNew")?.value || "";
  const newPass2 = $("cpNew2")?.value || "";

  if(!oldPass || !newPass || !newPass2) throw new Error("Sila isi semua field.");
  if(newPass.length < 6) throw new Error("Password baru minimum 6 characters.");
  if(newPass !== newPass2) throw new Error("Confirm password tak sama.");

  try{
    const cred = EmailAuthProvider.credential(user.email, oldPass);
    await reauthenticateWithCredential(user, cred);
    await updatePassword(user, newPass);

    $("cpOld").value = "";
    $("cpNew").value = "";
    $("cpNew2").value = "";

    return "Password success change.";
  }catch(e){
    const code = String(e?.code || "");

    if(code === "auth/invalid-login-credentials" || code === "auth/wrong-password"){
      throw new Error("Password lama salah.");
    }
    if(code === "auth/too-many-requests"){
      throw new Error("Terlalu banyak cubaan, cuba lagi nanti.");
    }
    if(code === "auth/requires-recent-login"){
      throw new Error("Sesi dah lama. Sila logout/login semula.");
    }
    if(code === "auth/weak-password"){
      throw new Error("Password baru terlalu lemah (min 6).");
    }

    throw new Error(e?.message || "Failed update password.");
  }
}

// Button dalam dropdown (desktop)
const btnChangePass = $("btnChangePass");
if(btnChangePass){
  btnChangePass.addEventListener("click", ()=>{
    closeUserMenu();
    openChangePass();
  });
}

// Button dalam drawer (mobile sidebar)
const drawerChangePassBtn = $("drawerChangePassBtn");
if(drawerChangePassBtn){
  drawerChangePassBtn.addEventListener("click", ()=>{
    try{ closeDrawer(); }catch(_){}
    openChangePass();
  });
}

// Save dalam modal
const cpSave = $("cpSave");
if(cpSave){
  bindLoadingClick("cpSave", doChangePassword);
}

function closeUserMenu(){
  userDrop.classList.remove("open");
  userBtn.setAttribute("aria-expanded", "false");
}

function toggleUserMenu(){
  const open = userDrop.classList.toggle("open");
  userBtn.setAttribute("aria-expanded", open ? "true" : "false");
}

userBtn.addEventListener("click", (e)=>{
  e.preventDefault();
  toggleUserMenu();
});

// click luar -> close
document.addEventListener("click", (e)=>{
  if(!e.target.closest("#userDrop")) closeUserMenu();
});

// optional: ESC close
document.addEventListener("keydown", (e)=>{
  if(e.key === "Escape") closeUserMenu();
});

// Logout (kekal fungsi asal)
$("btnLogout").addEventListener("click", async ()=>{
  closeUserMenu();
  await signOut(auth);
  location.replace("../login/");
});

  $("tabOpen").addEventListener("click", ()=> setView("open"));
  $("tabHistory").addEventListener("click", ()=> setView("history"));

  $("btnAddPoint").addEventListener("click", ()=>{
    if(!me.isAdmin){ toast("Limited user: tiada akses Add Point."); return; }
    setSelectAndSync("apType", "in"); $("apAmount").value=""; $("apNote").value="";
    openModal("mAddPoint");
  });

  $("btnNewVault").addEventListener("click", ()=>{
    $("nvTitle").value=""; $("nvNote").value="";
    resetTxTimeInput("txTime_newVault");
    openModal("mNewVault");
  });

async function onApSave(){
  if(!me.isAdmin) throw new Error("No access.");
  const type = ($("apType")?.value || "in");
  const amount = moneyVal("apAmount");
  const note = ($("apNote")?.value || "").trim();

  if(amount <= 0){
    throw new Error("Total Amount mesti > 0");
  }
  const delta = (type === "in") ? amount : -amount;
  await changeBalance(delta, { kind:"add_point", direction:type, amount, note });
  $("apAmount").value = "";
  $("apNote").value = "";
  return "Wallet updated.";
}
 bindLoadingClick("apSave", onApSave);
  
async function onNvCreate(){
  const title = $("nvTitle").value.trim();
  const note  = $("nvNote").value.trim();
  if(!title) throw new Error("Title wajib isi.");

  const createdAtMs = await getAtMsFromControl("newVault", "txTime_newVault");
  await createVault(title, note, createdAtMs);

  setView("open");
  return "Vault created.";
}
bindLoadingClick("nvCreate", onNvCreate);

  // table button actions (event delegation)
  document.addEventListener("click", async (e)=>{
    const btn = e.target.closest("[data-act]");
    if(!btn) return;

    const act = btn.dataset.act;
    const vid = btn.dataset.id;

    if(act==="cash"){
      ctxVaultId = vid;
      const vSnap = await get(ref(db, `vaults/open/${vid}`));
      $("cashVaultTitle").textContent = vSnap.exists()? `Vault: ${vSnap.val().title}` : "Vault";
      setSelectAndSync("cashType", "cash_in"); $("cashAmount").value=""; $("cashNote").value="";
      resetTxTimeInput("txTime_cash");
      if(!(await assertCanOperateOpenVault(vid))){
      toast("No access: this vault is not yours.");
      return;
      }
      openModal("mCash");
    }

    if(act==="buy"){
      ctxVaultId = vid;
      const vSnap = await get(ref(db, `vaults/open/${vid}`));
      $("buyVaultTitle").textContent = vSnap.exists()? `Vault: ${vSnap.val().title}` : "Vault";
      setSelectAndSync("buyCat", "baby_pig");
      $("buyQty").value=""; $("buyPrice").value=""; $("buyTotal").value="";
      $("buyNote").value="";
      $("buyBalanceHint").textContent = `Current balance: ${fmt(currentBalance)}`;
      if(!(await assertCanOperateOpenVault(vid))){
      toast("No access: this vault is not yours.");
      return;
      }
      buyTotalManual = false;
      calcBuy();
      openModal("mBuy");
    }
    if(act==="missing"){
  ctxVaultId = vid;
  const vSnap = await get(ref(db, `vaults/open/${vid}`));
  $("missingVaultTitle").textContent = vSnap.exists()? `Vault: ${vSnap.val().title}` : "Vault";

  $("missQty").value="";
  $("missPrice").value="";
  $("missTotal").value="";
  $("missNote").value="";
  if(!(await assertCanOperateOpenVault(vid))){
  toast("No access: this vault is not yours.");
  return;
  }
  openModal("mMissing");
}

if(act==="sell"){
  ctxVaultId = vid;

  const vSnap = await get(ref(db, `vaults/open/${vid}`));
  $("sellVaultTitle").textContent = vSnap.exists() ? `Vault: ${vSnap.val().title}` : "Vault";

  const s = (vSnap.exists() ? (vSnap.val().summary || {}) : {});
  const babyQty  = Number(s.babyPig?.qty || 0);
  const missQty  = Number(s.missing?.qty || 0);
  const soldEkor = Number(s.totalEkor || 0);

  ctxMissingPig = missQty;
  ctxAvailablePig = Math.max(0, babyQty - missQty - soldEkor);

  // ✅ block kalau stok 0
  const sellSaveBtn = $("sellSave");
  if(sellSaveBtn) sellSaveBtn.disabled = (ctxAvailablePig <= 0);

  if(ctxAvailablePig <= 0){
    $("sellEkorHint").textContent = "Available Quantity: 0";
    toast("quantity not available", "error");
    return;
  }

  $("sellMissing").value = String(ctxMissingPig);
  $("sellEkorHint").textContent = `Available Quantity: ${ctxAvailablePig}`;

  $("sellPriceKg").value = "";
  $("sellKg").value = "";
  $("sellEkor").value = "";
  $("sellTotal").value = "";
  $("sellNote").value = "";

  // ✅ reset validation state (ikut CSS)
  $("sellEkor").classList.remove("isBad","isOk");

  if(!(await assertCanOperateOpenVault(vid))){
    toast("No access: this vault is not yours.");
    return;
  }

  openModal("mSell");

  // optional: supaya hint & border selaras bila modal buka
  validateSellEkor();
}

if(act==="close"){
  if(!(await assertCanOperateOpenVault(vid))){
    toast("No access: this vault is not yours.");
    return;
  }

 const yes = await confirmBox("Closing vault? Vault akan dipindah ke History.", {
  title: "Closing Vault",
  okText: "Yes, Close",
  cancelText: "Cancel",
  okClass: "danger"
});
if(!yes) return;

  try{
    await closeVault(vid);
    toast("Vault closed → History.");
  }catch(e){
    console.error(e);
    toast(e?.message || "Failed");
  }
}
    if(act==="txEdit"){
  const vaultId = btn.dataset.v;
  const bucket  = btn.dataset.b;
  const txId    = btn.dataset.t;

  const txSnap = await get(ref(db, `vaults/${bucket}/${vaultId}/transactions/${txId}`));
  if(!txSnap.exists()){ toast("TX not found"); return; }

  const t = txSnap.val();

  ctxVaultId = vaultId;
  ctxEdit = { vaultId, bucket, txId, oldTx: t };

  // Open modal ikut jenis
  if(t.kind==="cash"){
    $("cashVaultTitle").textContent = `Edit Cash • Vault: ${vaultId}`;
    $("cashType").value = (t.direction==="in") ? "cash_in" : "cash_out";
    $("cashAmount").value = String(t.amount ?? t.total ?? "");
    $("cashNote").value = String(t.note||"");
    openModal("mCash");
  }

  if(t.kind==="buy"){
    $("buyVaultTitle").textContent = `Edit Buy • Vault: ${vaultId}`;
    setSelectAndSync("buyCat", t.category || "baby_pig");
    $("buyQty").value = String(t.qty ?? "");
    $("buyPrice").value = String(t.price ?? "");
    $("buyTotal").value = String(t.total ?? "");
    $("buyNote").value = String(t.note||"");
    $("buyBalanceHint").textContent = `Current balance: ${fmt(currentBalance)}`;
    buyTotalManual = false;
    calcBuy();
    openModal("mBuy");
    calcBuy();
  }

  if(t.kind==="missing"){
    $("missingVaultTitle").textContent = `Edit Missing • Vault: ${vaultId}`;
    $("missQty").value = String(t.qty ?? "");
    $("missPrice").value = String(t.price ?? "");
    $("missTotal").value = String(t.total ?? "");
    $("missNote").value = String(t.note||"");
    openModal("mMissing");
    calcMissing();
  }

if(t.kind==="sell"){
  $("sellVaultTitle").textContent = `Edit Sell • Vault: ${vaultId}`;

  const vSnap = await get(ref(db, `vaults/open/${vaultId}`));
  const s = (vSnap.exists() ? (vSnap.val().summary || {}) : {});
  const babyQty  = Number(s.babyPig?.qty || 0);
  const missQty  = Number(s.missing?.qty || 0);
  const soldEkor = Number(s.totalEkor || 0);

  ctxMissingPig = missQty;

  const oldEkor = Number(t.ekor || 0);
  ctxAvailablePig = Math.max(0, babyQty - missQty - soldEkor + oldEkor);

  $("sellMissing").value = String(ctxMissingPig);
  $("sellEkorHint").textContent = `Available Quantity: ${ctxAvailablePig}`;

  $("sellPriceKg").value = String(t.priceKg ?? "");
  $("sellKg").value      = String(t.kg ?? "");
  $("sellEkor").value    = String(t.ekor ?? "");
  $("sellTotal").value   = String(t.total ?? "");
  $("sellNote").value    = String(t.note || "");

  // ✅ reset dulu supaya tak “carry” merah dari sebelum ni
  $("sellEkor").classList.remove("isBad","isOk");

  openModal("mSell");
  calcSell();
  validateSellEkor(); // function ini akan set isOk/isBad ikut value
}

  return;
}
if(act==="txView"){
  const vaultId = btn.dataset.v;
  const bucket  = btn.dataset.b;
  const txId    = btn.dataset.t;

  const snap = await get(ref(db, `vaults/${bucket}/${vaultId}/transactions/${txId}/note`));
  const note = snap.exists() ? String(snap.val() || "") : "";
  openViewNote(note);
  return;
}
if(act==="txDel"){
  const vaultId = btn.dataset.v;
  const bucket  = btn.dataset.b;
  const txId    = btn.dataset.t;

  if(bucket==="history" && !me.isAdmin){
    toast("Limited user: tiada akses delete history.");
    return;
  }
  const yes = await confirmBox("Delete transaction?", {
  title:"Delete",
  okText:"Delete",
  cancelText:"Cancel",
  okClass:"danger"
});
if(!yes) return;

  try{
    const txPath = `vaults/${bucket}/${vaultId}/transactions/${txId}`;

    // 1) ambil tx dulu utk rollback kira delta (sbb lepas remove dah hilang)
    const txSnap = await get(ref(db, txPath));
    if(!txSnap.exists()){ toast("TX not found."); return; }
    const t = txSnap.val();

    // 2) REMOVE dulu — kalau permission denied dia akan throw kat sini
    await remove(ref(db, txPath));

    // 3) recompute dulu
    await recomputeVaultSummary(vaultId, bucket);

    // 4) BARU adjust wallet (open sahaja)
    if(bucket === "open"){
      await adjustBalanceForTxDelete({ bucket, vaultId, txId, txObj: t });
    }

    toast("Deleted.");
  }catch(e){
    console.error(e);
    toast(e?.message || "Failed");
  }
}

if(act==="histEdit"){
  if(!me.isAdmin){ toast("No access."); return; }

  const oldSnap = await get(ref(db, `vaults/history/${vid}/title`));
  const oldTitle = oldSnap.exists() ? String(oldSnap.val() || "") : "";

  const newTitle = await promptBox("New title?", {
    title: "Edit Title",
    defaultValue: oldTitle,
    placeholder: "Enter new vault title...",
    okText: "Save",
    cancelText: "Cancel"
  });

  if(newTitle == null) return;               // cancel / X
  if(!String(newTitle).trim()){ toast("Title wajib isi."); return; }

  try{
    await update(ref(db, `vaults/history/${vid}`), {
      title: String(newTitle).trim(),
      updatedAt: serverTimestamp(),
      updatedAtMs: Date.now()
    });
    toast("Updated title.");
  }catch(e){
    console.error(e);
    toast(e?.message || "Failed");
  }
}
if(act==="vaultDel"){
  const bucket = btn.dataset.b || "open";

  if(bucket==="history" && !me.isAdmin){
    toast("Admin sahaja boleh delete vault history.");
    return;
  }

  const msg = bucket==="history"
    ? "Delete vault HISTORY ini? Semua data akan hilang (tak boleh undo)."
    : "Delete vault ini? Semua transaksi dalam vault akan hilang.";

  const yes = await confirmBox(msg, {
  title:"Delete Vault",
  okText:"Delete",
  cancelText:"Cancel",
  okClass:"danger"
});
if(!yes) return;

  try{
    // 1) ambil semua tx dalam vault
    const txSnap = await get(ref(db, `vaults/${bucket}/${vid}/transactions`));
    const txs = txSnap.exists() ? txSnap.val() : {};

    // 2) kira total effect (cash/buy/sell)
    let sumEff = 0;
    for(const k of Object.keys(txs)){
      sumEff += txBalanceEffect(txs[k]);
    }

    // 3) reverse sekali jalan (lebih kemas)
   if(bucket === "open" && sumEff !== 0){
    await changeBalance(-sumEff, {
      kind:"vault_delete_adjust",
      bucket,
      vaultId: vid,
      note:"Delete vault rollback all tx"
    }, Date.now());
  }

    // 4) delete vault node
    await remove(ref(db, `vaults/${bucket}/${vid}`));

    toast("Vault deleted.");
  }catch(e){
    console.error(e);
    toast("Failed delete vault.");
  }
}
if(act==="vaultUnclose"){
  // ambil data history untuk check owner
  const hs = await get(ref(db, `vaults/history/${vid}`));
  if(!hs.exists()){
    toast("Vault history not found.");
    return;
  }
  const v = hs.val() || {};

  const isOwnerUnclose =
    me.isAdmin ||
    (v.createdByUid && v.createdByUid === me.uid) ||
    (v.closedByUid && v.closedByUid === me.uid);

  if(!isOwnerUnclose){
    toast("You only can unclose vault you created/closed.");
    return;
  }

  const yes = await confirmBox("Unclosing vault ini? Vault akan balik ke Open Vault.", {
  title:"Unclosing",
  okText:"Yes, Unclose",
  cancelText:"Cancel",
  okClass:"ghost"  // atau "primary" kalau ada
});
if(!yes) return;
  try{
    await uncloseVault(vid);
    toast("Vault moved back to Open Vault.");
    setView("open");
  }catch(e){
    console.error(e);
    toast(e?.message || "Failed unclosing.");
  }
}
  });

// CASH SAVE (CREATE + EDIT) — upgraded (no auto close on error)
async function onCashSave(){
  const type = $("cashType").value;
  const amount = moneyVal("cashAmount");
  const note = $("cashNote").value.trim();

  // ❌ validation fail => THROW (modal kekal buka)
  if(amount <= 0) throw new Error("Amount mesti > 0");

  const direction = (type === "cash_in") ? "in" : "out";
  const delta = (direction === "in") ? amount : -amount;

  const newTx = { kind:"cash", direction, amount, total: amount, note };

  // ambil masa sekali sahaja
  const atMs = await getAtMsFromControl("cash", "txTime_cash");

  // ===== EDIT MODE =====
  if(ctxEdit && ctxEdit.txId){
    const old = ctxEdit.oldTx;

    const oldEff = txBalanceEffect(old);
    const newEff = txBalanceEffect(newTx);
    const diff = newEff - oldEff;

    // adjust balance ikut beza
    if(diff !== 0){
      await changeBalance(diff, {
        kind:"tx_edit_adjust",
        txKind:"cash",
        vaultId: ctxEdit.vaultId,
        txId: ctxEdit.txId,
        note:"Edit cash"
      }, atMs);
    }

    await update(ref(db, `vaults/${ctxEdit.bucket}/${ctxEdit.vaultId}/transactions/${ctxEdit.txId}`), {
      ...newTx,
      atMs,
      editedAt: serverTimestamp(),
      editedAtMs: Date.now(),
      editedByUid: me.uid,
      editedBy: me.username
    });

    await recomputeVaultSummary(ctxEdit.vaultId, ctxEdit.bucket);

    ctxEdit = null;

    // ✅ success => return message (toast keluar lepas modal close)
    return "Cash updated.";
  }

  // ===== CREATE MODE =====
  await changeBalance(delta, {
    kind:"cash_transfer",
    direction, amount, note,
    vaultId: ctxVaultId
  }, atMs);

  await addTx(ctxVaultId, newTx, atMs);

  // ✅ success
  return "Cash transfer saved.";
}

bindLoadingClick("cashSave", onCashSave);
// BUY AUTO CALC
function calcBuy(){
  const qty   = intVal("buyQty");
  const price = moneyVal("buyPrice");
  const autoTotal = (qty > 0 && price > 0) ? (qty * price) : 0;

  if(!buyTotalManual){
    $("buyTotal").value = autoTotal ? moneyFormat(String(autoTotal)) : "";
  }
const total  = moneyVal("buyTotal");
const enough = total <= currentBalance;

const el = $("buyTotal");
const hasValue = total > 0;

el.classList.toggle("isBad", hasValue && !enough);
el.classList.toggle("isOk",  hasValue && enough);

  $("buyBalanceHint").textContent = enough
    ? `Balance: ${fmt(currentBalance - total)}`
    : `Insufficient balance: ${fmt(total)} (Balance: ${fmt(currentBalance)})`;
}
["buyQty","buyPrice"].forEach(id=> $(id).addEventListener("input", ()=>{
  buyTotalManual = false;   // bila qty/price berubah -> auto balik
  calcBuy();
}));

$("buyTotal").addEventListener("input", ()=>{
  buyTotalManual = true;    // bila user sentuh total -> jadi manual
  calcBuy();
});

// BUY SAVE (CREATE + EDIT) — upgraded
async function onBuySave(){
  const category = $("buyCat").value;
  const qty   = intVal("buyQty");
  const price = moneyVal("buyPrice");
  const total = moneyVal("buyTotal") || (qty * price);
  const note  = $("buyNote").value.trim();

  // ❌ validation fail → THROW (modal kekal buka)
  if(total <= 0) throw new Error("Total mesti > 0");

  const atMs = await getAtMsFromControl("buy", "txTime_buy"); // manual time
  const newTx = { kind:"buy", category, qty, price, total, note };

  // ===== EDIT MODE =====
  if(ctxEdit && ctxEdit.txId){
    const old = ctxEdit.oldTx;

    const oldEff = txBalanceEffect(old);
    const newEff = txBalanceEffect(newTx);
    const diff = newEff - oldEff; // buy = negatif

    // kalau tambah cost → pastikan cukup balance
    if(diff < 0 && Math.abs(diff) > currentBalance){
      throw new Error("Balance tak cukup untuk edit buy (tambahan cost).");
    }

    // adjust balance ikut beza
    if(diff !== 0){
      await changeBalance(diff, {
        kind:"tx_edit_adjust",
        txKind:"buy",
        vaultId: ctxEdit.vaultId,
        txId: ctxEdit.txId,
        note:"Edit buy"
      }, atMs);
    }

    await update(ref(db, `vaults/${ctxEdit.bucket}/${ctxEdit.vaultId}/transactions/${ctxEdit.txId}`), {
      ...newTx,
      atMs,
      editedAt: serverTimestamp(),
      editedAtMs: Date.now(),
      editedByUid: me.uid,
      editedBy: me.username
    });

    await recomputeVaultSummary(ctxEdit.vaultId, ctxEdit.bucket);

    ctxEdit = null;

    // ✅ success
    return "Buy updated.";
  }

  // ===== CREATE MODE =====
  if(total > currentBalance){
    throw new Error("Modal tak cukup untuk buy.");
  }

  await changeBalance(-total, {
    kind:"buy", category, qty, price, total, note,
    vaultId: ctxVaultId
  }, atMs);

  await addTx(ctxVaultId, newTx, atMs);

  // ✅ success
  return "Buy saved.";
}

bindLoadingClick("buySave", onBuySave);
// MISSING AUTO CALC
function calcMissing(){
  const q = intVal("missQty");
  const p = moneyVal("missPrice");
  const t = q*p;
  $("missTotal").value = t ? moneyFormat(String(t)) : "";
}
["missQty","missPrice"].forEach(id=> $(id).addEventListener("input", calcMissing));

// MISSING SAVE (CREATE + EDIT) — upgraded
async function onMissSave(){
  const qty   = intVal("missQty");
  const price = moneyVal("missPrice");
  const total = qty * price;
  const note  = $("missNote").value.trim();

  // ❌ validation fail → modal kekal buka
  if(qty <= 0 || price <= 0){
    throw new Error("Missing & harga mesti > 0");
  }

  const atMs = await getAtMsFromControl("missing", "txTime_missing"); // manual time
  const newTx = { kind:"missing", qty, price, total, note };

  // ===== EDIT MODE =====
  if(ctxEdit && ctxEdit.txId){
    await update(ref(db, `vaults/${ctxEdit.bucket}/${ctxEdit.vaultId}/transactions/${ctxEdit.txId}`), {
      ...newTx,
      atMs,
      editedAt: serverTimestamp(),
      editedAtMs: Date.now(),
      editedByUid: me.uid,
      editedBy: me.username
    });

    await recomputeVaultSummary(ctxEdit.vaultId, ctxEdit.bucket);

    ctxEdit = null;

    // ✅ success
    return "Missing updated.";
  }

  // ===== CREATE MODE =====
  await addTx(ctxVaultId, newTx, atMs);

  // ✅ success
  return "Missing saved.";
}

bindLoadingClick("missSave", onMissSave);
// SELL AUTO CALC
function calcSell(){
  const priceKg = moneyVal("sellPriceKg");
  const kg = moneyVal("sellKg");
  const total = priceKg * kg;
  $("sellTotal").value = total ? moneyFormat(String(total)) : "";
}
["sellPriceKg","sellKg"].forEach(id=> $(id).addEventListener("input", calcSell));

// SELL SAVE (CREATE + EDIT) — upgraded
async function onSellSave(){
    // ✅ safety: kalau stok 0, walaupun modal terbuka sebab bug/lag
  if(ctxAvailablePig <= 0){
    throw new Error("quantity not available");
  }
  const priceKg = moneyVal("sellPriceKg");
  const kg      = moneyVal("sellKg");
  const ekor    = intVal("sellEkor");
  const total   = moneyVal("sellTotal") || (priceKg * kg);
  const note    = $("sellNote").value.trim();

  // ❌ validation fail → modal kekal buka
  if(total <= 0 || kg <= 0){
    throw new Error("Price/Kg dan Kg mesti isi.");
  }
  if(ekor > ctxAvailablePig){
    $("sellEkor")?.focus();
    throw new Error(`Total ekor tak boleh lebih dari tersedia (${ctxAvailablePig}).`);
  }

  const atMs = await getAtMsFromControl("sell", "txTime_sell"); // manual time
  const newTx = { kind:"sell", priceKg, kg, ekor, total, note };

  // ===== EDIT MODE =====
  if(ctxEdit && ctxEdit.txId){
    const old = ctxEdit.oldTx;

    const oldEff = txBalanceEffect(old);
    const newEff = txBalanceEffect(newTx);
    const diff   = newEff - oldEff;

    // kalau diff negatif (kena tolak balik), check balance cukup
    if(diff < 0 && Math.abs(diff) > currentBalance){
      throw new Error("Balance tak cukup untuk edit sell (kena tolak balik).");
    }

    if(diff !== 0){
      await changeBalance(diff, {
        kind:"tx_edit_adjust",
        txKind:"sell",
        vaultId: ctxEdit.vaultId,
        txId: ctxEdit.txId,
        note:"Edit sell"
      }, atMs);
    }

    await update(ref(db, `vaults/${ctxEdit.bucket}/${ctxEdit.vaultId}/transactions/${ctxEdit.txId}`), {
      ...newTx,
      atMs,
      editedAt: serverTimestamp(),
      editedAtMs: Date.now(),
      editedByUid: me.uid,
      editedBy: me.username
    });

    await recomputeVaultSummary(ctxEdit.vaultId, ctxEdit.bucket);

    ctxEdit = null;

    // ✅ success
    return "Sell updated.";
  }

  // ===== CREATE MODE =====
  await changeBalance(+total, { kind:"sell", priceKg, kg, ekor, total, note, vaultId: ctxVaultId }, atMs);
  await addTx(ctxVaultId, newTx, atMs);

  // ✅ success
  return "Sell saved.";
}

bindLoadingClick("sellSave", onSellSave);
// VALIDATE EKOR INPUT
function validateSellEkor(){
  const el = $("sellEkor");

  // stok 0 memang bad
  if(ctxAvailablePig <= 0){
    $("sellEkorHint").textContent = "Available Quantity: 0";
    el.classList.add("isBad");
    el.classList.remove("isOk");
    return false;
  }

  const ekor = intVal("sellEkor");

  // ✅ kalau kosong / 0, jangan merah lagi (neutral)
  if(!ekor || ekor <= 0){
    el.classList.remove("isBad","isOk");
    $("sellEkorHint").textContent = `Available Quantity: ${ctxAvailablePig}`;
    return false; // belum valid, tapi tak merah
  }

  const ok = ekor <= ctxAvailablePig;

  el.classList.toggle("isBad", !ok);
  el.classList.toggle("isOk", ok);

  $("sellEkorHint").textContent = ok
    ? `Available Quantity: ${ctxAvailablePig}`
    : `Maximal Available: ${ctxAvailablePig} Not Available ${ekor}`;

  return ok;
}
$("sellEkor").addEventListener("input", validateSellEkor);

document.addEventListener("click", (e)=>{
  const btn = e.target.closest(".pbtn[data-preset][data-vid]");
  if(!btn) return;

  const vaultId = btn.dataset.vid;
  const key = btn.dataset.preset;

  // ✅ SHOW ALL
  if(key === "showAll"){
    clearVaultDateRange(vaultId);
    setActivePreset(vaultId, key);
    return;
  }

  const r = presetRangeMs(key);
  if(!r) return;

  vaultFilters[vaultId] = r;
  resetPaging(vaultId);

  const fp = vaultPickers[vaultId];
  if(fp){
    fp.setDate([new Date(r.startMs), new Date(r.endMs)], true);
  }else{
    const input = document.querySelector(`.dateRangeInput[data-range="${vaultId}"]`);
    if(input){
      input.value = `${ymd(r.startMs)} → ${ymd(r.endMs)}`;
    }
    rerenderVaultTbody(vaultId);
  }

  setActivePreset(vaultId, key);
});
  // ===== AUTH BOOT =====
onAuthStateChanged(auth, async (user)=>{
  if(!user){
    location.replace("../login/");
    return;
  }
  try{
    await ensureFinanceSeed(user);
  }catch(err){
    console.error("ensureFinanceSeed error:", err);
  }
  me.uid = user.uid;

  const p = await get(ref(db, `profiles/${me.uid}`));
  me.username = p.exists() ? (p.val().username || "user") : "user";
  $("usernameText").textContent = me.username;

  await loadRole(me.uid);
  initTxTimeControl({ kind:"newVault", inputId:"txTime_newVault", toggleId:"txTimeToggle_newVault" });
  initTxTimeControl({ kind:"cash",    inputId:"txTime_cash",    toggleId:"txTimeToggle_cash" });
  initTxTimeControl({ kind:"buy",     inputId:"txTime_buy",     toggleId:"txTimeToggle_buy" });
  initTxTimeControl({ kind:"missing", inputId:"txTime_missing", toggleId:"txTimeToggle_missing" });
  initTxTimeControl({ kind:"sell",    inputId:"txTime_sell",    toggleId:"txTimeToggle_sell" });

  wireBalanceListener();
  wireLastLedgerListener();
  wireVaultListeners();
  const searchInput = document.getElementById("vaultSearch");
  if(searchInput){
  searchInput.addEventListener("input", e=>{
    vaultSearchTerm = e.target.value.trim();
    rerenderVaultLists();
  });
}
  setView("open");
  initCustomSelects();
    // ===== LIVE FORMAT INPUTS =====
  attachMoney($("apAmount"));
  attachMoney($("cashAmount"));

  attachInt($("buyQty"));
  attachMoney($("buyPrice"));
  attachMoney($("buyTotal"));

  attachMoney($("sellPriceKg"));
  attachKg($("sellKg"));
  attachInt($("sellEkor"));
  attachMoney($("sellTotal"));

  attachInt($("missQty"));
  attachMoney($("missPrice"));
    // 🔄 REFRESH BUTTON
  const btnRefresh = document.getElementById("btnRefresh");
  if(btnRefresh){
    btnRefresh.addEventListener("click", ()=>{
      btnRefresh.classList.add("spinning");
      setTimeout(()=> location.reload(), 250);
    });
  }
initRightDrawerOnce();
function syncHeaderHeightVar(){
  const header = document.querySelector("header");
  if(!header) return;
  const h = Math.round(header.getBoundingClientRect().height || 64);
  document.documentElement.style.setProperty("--headerH", h + "px");
}
syncHeaderHeightVar();
window.addEventListener("resize", syncHeaderHeightVar);
syncDrawer();
  applyLang(getLang());
  toast("Ready.");
});
// ===== SEARCH INPUT UI =====
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("vaultSearch");
  const clearBtn = document.getElementById("clearSearch");
  const searchIcon = document.getElementById("searchIcon");
  if (!searchInput || !clearBtn || !searchIcon) {
    console.warn("Search UI missing element:", { searchInput, clearBtn, searchIcon });
    return;
  }
  function toggleSearchUI() {
    const hasText = searchInput.value.trim().length > 0;
    searchIcon.style.display = hasText ? "none" : "block";
    clearBtn.style.display   = hasText ? "inline-flex" : "none";
  }
  searchInput.addEventListener("input", () => {
    toggleSearchUI();
    // filterVaults(searchInput.value);
  });
  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    toggleSearchUI();
    searchInput.focus();
    searchInput.dispatchEvent(new Event("input", { bubbles: true }));
  });
  toggleSearchUI();
});
document.addEventListener("keydown", function(e){
  if(e.key !== "Escape") return;
  const openModal = document.querySelector(".modalBack[style*='flex'], .modalBack[style*='block']");
  if(openModal){
    openModal.style.display = "none";
  }
});
(function(){
  document.addEventListener("pointerdown", (e)=>{
    const el = e.target.closest("[data-clickfx]");
    if(!el) return;

    // kalau element disabled (button/fieldset)
    if (el.matches("button:disabled, input:disabled, select:disabled, textarea:disabled")) return;

    el.classList.remove("clicked");
    void el.offsetWidth; // restart anim
    el.classList.add("clicked");

    clearTimeout(el.__cfx);
    el.__cfx = setTimeout(()=> el.classList.remove("clicked"), 650);
  }, true);
})();
// ===== i18n (EN/ID) =====
const LANG_KEY = "farm_lang";

function getLang(){
  const v = localStorage.getItem(LANG_KEY);
  return (v === "id" || v === "en") ? v : "en";
}
function setLang(lang){
  if(lang !== "en" && lang !== "id") return;
  localStorage.setItem(LANG_KEY, lang);
  applyLang(lang); // apply terus
}
// ===== LANGUAGE DROPDOWN (OPEN/CLOSE + PICK) =====
function wireLangDropdown(btnId, menuId, wrapId){
  const btn  = document.getElementById(btnId);
  const menu = document.getElementById(menuId);
  const wrap = document.getElementById(wrapId);
  if(!btn || !menu || !wrap) {
    console.warn("Lang dropdown missing:", {btnId, menuId, wrapId});
    return;
  }

  function open(){
    menu.style.display = "block";
    btn.setAttribute("aria-expanded","true");
  }
  function close(){
    menu.style.display = "none";
    btn.setAttribute("aria-expanded","false");
  }
  function toggle(){
    (menu.style.display === "block") ? close() : open();
  }

  // ✅ elak click luar/close lain kacau
  wrap.addEventListener("click", (e)=> e.stopPropagation());
  menu.addEventListener("click", (e)=> e.stopPropagation());

  btn.addEventListener("click", (e)=>{
    e.preventDefault();
    e.stopPropagation();
    toggle();
  });

  // pilih bahasa
  menu.querySelectorAll("[data-lang]").forEach(opt=>{
    opt.addEventListener("click", (e)=>{
      e.preventDefault();
      e.stopPropagation();
      const lang = opt.getAttribute("data-lang");
      setLang(lang);
      close();
    });
  });

  // click luar tutup
  document.addEventListener("click", (e)=>{
    if(!e.target.closest("#"+wrapId)) close();
  });

  // esc tutup
  document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape") close();
  });
}

// INIT sekali sahaja
document.addEventListener("DOMContentLoaded", ()=>{
  wireLangDropdown("btnLangDesktop","langMenuDesktop","langWrapDesktop");
  wireLangDropdown("btnLangDrawer","langMenuDrawer","langWrapDrawer");
});
// ===== AUTO TEXT MAP (exact match) =====
const TEXT_EN_TO_ID = {

  "Language": "Bahasa",
  "Dark Mode": "Mode Gelap",
  "Light Mode": "Mode Terang",
  "Change Password": "Ubah Sandi",
  "Logout": "Keluar",
  "Searching...": "Pencarian...",
  "Search transaction...": "Pencarian transaksi...",
  
  // KPI / Summary
"Total Bought": "Total Beli",
"Total Sold": "Total Jual",
"Total Sales": "Total Penjualan",
"Total Feeding": "Total Harga Makanan",
"Total Pets": "Total Peliharaan",
"Total Expenses": "Total Pengeluaran",
"Total Other": "Total Lainnya",
"Total Cash In": "Total Masuk Tunai",
"Total Cash Out": "Total Keluar Tunai",
"Total Cash In/Out": "Total Tunai Masuk/Keluar",
"Total Price Quantity": "Total Harga Seunit",
"Total Price": "Total Harga",
"Available Quantity": "Unit Tersedia",
    // KPI / Summary
"Total Seller": "Total Hasil Jual",
"Total Quantity KG": "Total Unit KG",
"Total KG": "Total KG",
"Total Missing": "Total Unit Kehilangan",
"Total Price Missing": "Total Harga Kehilangan",
"Total Pets Available": "Total Tersedia Peliharaan",
"Total Profit": "Total Keuntungan",

// Date preset / filter
"Today": "Hari Ini",
"Yesterday": "Kemarin",
"This Week": "Minggu Ini",
"Last Week": "Minggu Lalu",
"This Month": "Bulan Ini",
"Last Month": "Bulan Lalu",
"Show All": "Lihat Semua",
"This Year": "Tahun Ini",
"Last Year": "Tahun Lalu",
"All": "Semua",
"Custom": "Khusus",
"Date Range": "Pilih Tanggal",
"No transaction in this date range.": "Tiada transaksi dalam Tanngal yang di pilih.",
"No vault yet.": "Belum ada vault.",
"Transaction": "Transaksi",
"Actions": "Tindakan",
"Date & Time": "Tanggal & Waktu",
  
  "Open": "Buka",
  "History": "Riwayat",
  "Add Point": "Tambah Poin",
  "New Vault": "Buat Vault",

  "My Wallet": "Dompet Saya",
  "Availabe Balance": "Saldo tersedia",
  "Current Balance": "Saldo saat ini",
  "Update Balance": "Pembaruan Saldo",
  "Last Update": "Pembaruan Terakhir",
  "Close": "Tutup",

  "Cancel": "Batal",
  "Save": "Simpan",
  "Saving...": "Menyimpan...",
  "Creating...": "Membuat...",
  "Create": "Membuat",
  "Unlock": "Buka Kunci",

  "Type": "Jenis",
  "In": "Masuk",
  "Logout": "Keluar",
  "Note": "Catatan",
  "Title": "Judul",
  "Transaction Time": "Waktu Transaksi",

  "Cash Transfer": "Pemindahan Tunai",
  "Cash-In": "Tunai Masuk",
  "Cash-Out": "Tunai Keluar",
  
  "Buy": "Beli",
  "Selling": "Menjual",
  "Total Quantity": "Total Unit",
  "Available Quantity:": "Unit Tersedia",
  "Missing": "Hilang",
  "Quantity Missing": "Unit Kehilangan",
  "Category": "Kategori",
  "Quantity": "Unit",
  "Price Quantity": "Harga Seunit",
  "Total Price": "Total Harga",
  "Total Amount": "Total Jumlah"
};

const TEXT_ID_TO_EN = Object.fromEntries(
  Object.entries(TEXT_EN_TO_ID).map(([en,id]) => [id,en])
);

// ===== APPLY LANG (auto translate all exact strings) =====
function applyLang(lang){
  // A) placeholders
  document.querySelectorAll("[placeholder]").forEach(el=>{
    const p = (el.getAttribute("placeholder") || "").trim();
    if(!p) return;

    if(lang === "id"){
      if(TEXT_EN_TO_ID[p]) el.setAttribute("placeholder", TEXT_EN_TO_ID[p]);
    }else{
      if(TEXT_ID_TO_EN[p]) el.setAttribute("placeholder", TEXT_ID_TO_EN[p]);
    }
  });

  // B) translate text nodes (exact match only)
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node){
        const p = node.parentNode;
        if(!p) return NodeFilter.FILTER_REJECT;
        const tag = (p.tagName || "").toLowerCase();
        if(tag === "script" || tag === "style" || tag === "noscript") return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  let n;
  while((n = walker.nextNode())){
    const raw = n.nodeValue;
    const t = (raw || "").trim();
    if(!t) continue;

    if(lang === "id"){
      if(TEXT_EN_TO_ID[t]) n.nodeValue = raw.replace(t, TEXT_EN_TO_ID[t]);
    }else{
      if(TEXT_ID_TO_EN[t]) n.nodeValue = raw.replace(t, TEXT_ID_TO_EN[t]);
    }
  }

  // C) update badge EN/ID (kalau ada)
  const short = (lang === "id") ? "ID" : "EN";
  const td = document.getElementById("langTextDesktop");
  const tr = document.getElementById("langTextDrawer");
  if(td) td.textContent = short;
  if(tr) tr.textContent = short;

// D) theme label ikut mode semasa + ikut language
const isLight = document.documentElement.classList.contains("theme-light");
const enText = isLight ? "Light Mode" : "Dark Mode";
let show = enText;
if(lang === "id") show = TEXT_EN_TO_ID[enText] || enText;
const themeDesktop = document.getElementById("themeLabelDesktop");
const themeDrawer  = document.getElementById("themeLabelDrawer");
if(themeDesktop) themeDesktop.textContent = show;
if(themeDrawer)  themeDrawer.textContent  = show;
}

// init apply on load
document.addEventListener("DOMContentLoaded", ()=>{
  applyLang(getLang());
});

// sync kalau tab lain tukar
window.addEventListener("storage", (e)=>{
  if(e.key === LANG_KEY) applyLang(getLang());
});
// ===== THEME TOGGLE =====
const THEME_KEY = "farm_theme"; // "dark" | "light"
let _syncingTheme = false;

function applyTheme(theme){
  const isLight = theme === "light";

  document.documentElement.classList.toggle("theme-light", isLight);
  applyLang(getLang());
  const d1 = document.getElementById("themeToggleDesktop");
  const d2 = document.getElementById("themeToggleDrawer");

  _syncingTheme = true;
  try{
    if(d1) d1.checked = !isLight; // checked = dark
    if(d2) d2.checked = !isLight;
  } finally {
    _syncingTheme = false;
  }

  const l1 = document.getElementById("themeLabelDesktop");
  const l2 = document.getElementById("themeLabelDrawer");
}

function loadTheme(){
  const saved = localStorage.getItem(THEME_KEY);
  return (saved === "light" || saved === "dark") ? saved : "dark";
}

function setTheme(theme){
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);

  // ✅ optional notify same-page listeners
  window.dispatchEvent(new CustomEvent("farmThemeChanged", { detail: theme }));
}

function initThemeToggle(){
  applyTheme(loadTheme());

  const desktop = document.getElementById("themeToggleDesktop");
  const drawer  = document.getElementById("themeToggleDrawer");

  function onToggleChange(e){
    if(_syncingTheme) return;
    const isDarkChecked = !!e.target.checked;
    setTheme(isDarkChecked ? "dark" : "light");
  }

  if(desktop) desktop.addEventListener("change", onToggleChange);
  if(drawer)  drawer.addEventListener("change", onToggleChange);
}

document.addEventListener("DOMContentLoaded", initThemeToggle);

// ✅ bila theme berubah dari tab/page lain
window.addEventListener("storage", (e)=>{
  if(e.key !== THEME_KEY) return;
  applyTheme(loadTheme());
});
document.addEventListener("click", (e)=>{
  const select = e.target.closest(".customSelect");

  // tutup semua dropdown kalau klik luar
  if(!select){
    document.querySelectorAll(".customSelect").forEach(s=>{
      s.classList.remove("open");
    });
    return;
  }

  // toggle open
  if(e.target.closest(".cs-selected")){
    select.classList.toggle("open");
    return;
  }

  // pilih option
  const option = e.target.closest(".cs-options div");
  if(option){
    const value = option.dataset.value;
    const vid = select.dataset.per;

    const p = getPaging(vid);
    p.per = Number(value);
    p.page = 1;

    select.querySelector(".cs-selected").textContent = option.textContent;

    select.querySelectorAll(".cs-options div").forEach(o=>{
      o.classList.remove("active");
    });
    option.classList.add("active");

    select.classList.remove("open");

    rerenderVaultTbody(vid);
  }
});
// ===============================
//  DESKTOP MODE TOGGLE (Dropdown + Drawer) - FIXED
// ===============================
(function(){
  const KEY = "farmDesktopMode.v1";

  const vp = document.getElementById("vpMeta") || document.querySelector('meta[name="viewport"]');

  function setDesktop(on){
    // ✅ toggle class (untuk override CSS @media)
    document.documentElement.classList.toggle("forceDesktop", !!on);

    // ✅ viewport desktop sebenar (layout PC, phone auto jadi kecil)
    if(vp){
      vp.setAttribute(
        "content",
        on
          ? "width=1200, initial-scale=1, viewport-fit=cover"
          : "width=device-width, initial-scale=1, viewport-fit=cover"
      );
    }

    // ✅ update label
    const st = document.getElementById("dmState");
    if(st) st.textContent = on ? "ON" : "OFF";
  }

  function isOn(){
    return localStorage.getItem(KEY) === "1";
  }

  function buildBtn(){
    let btn = document.getElementById("btnDesktopMode");
    if(btn) return btn;

    btn = document.createElement("button");
    btn.type = "button";
    btn.id = "btnDesktopMode";
    btn.className = "desktopModeBtn"; // ❌ buang userMenuItem supaya tak clash grid
    btn.innerHTML = `
      <span class="miIcon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M4 5h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-6v2h2v2H8v-2h2v-2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm0 2v9h16V7H4z"/>
        </svg>
      </span>
      <span class="miText">Mode Desktop</span>
      <span class="dmState" id="dmState">OFF</span>
    `;

    btn.addEventListener("click", ()=>{
      const next = !isOn();
      localStorage.setItem(KEY, next ? "1" : "0");
      setDesktop(next);

      // ✅ viewport biasanya apply betul lepas reload
      location.reload();
    });

    return btn;
  }

  function placeBtn(){
    const btn = buildBtn();

    // ✅ pastikan ID slot sama macam HTML kau
    const slotDesktop = document.getElementById("desktopModeSlotDesktop");
    const slotDrawer  = document.getElementById("desktopModeSlotDrawer");

    const isMobile = window.matchMedia("(max-width: 900px)").matches;

    if(isMobile && slotDrawer){
      slotDrawer.replaceChildren(btn);
    }else if(!isMobile && slotDesktop){
      slotDesktop.replaceChildren(btn);
    }

    setDesktop(isOn());
  }

  function init(){
    setDesktop(isOn());
    placeBtn();
    window.addEventListener("resize", placeBtn, {passive:true});
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  }else{
    init();
  }
})();
