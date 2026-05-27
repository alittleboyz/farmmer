  import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth, setPersistence, browserLocalPersistence,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
  import { getDatabase, ref, get, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

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
function setLoginHead(mode){
  const icon = $("loginHeadIcon");
  const title = $("loginHeadTitle");
  const sub = $("loginHeadSub");
  if(!icon || !title || !sub) return;

  if(mode === "step2"){
    icon.innerHTML = `
      <svg viewBox="0 0 1024 1024" aria-hidden="true">
        <path fill="currentColor" d="M866.9 169.9L527.1 54.1C523 52.7 517.5 52 512 52s-11 .7-15.1 2.1L157.1 169.9c-8.3 2.8-15.1 12.4-15.1 21.2v482.4c0 8.8 5.7 20.4 12.6 25.9L499.3 968c3.5 2.7 8 4.1 12.6 4.1s9.2-1.4 12.6-4.1l344.7-268.6c6.9-5.4 12.6-17 12.6-25.9V191.1c.2-8.8-6.6-18.3-14.9-21.2zM810 654.3L512 886.5 214 654.3V226.7l298-101.6 298 101.6v427.6zm-405.8-201c-3-4.1-7.8-6.6-13-6.6H336c-6.5 0-10.3 7.4-6.5 12.7l126.4 174a16.1 16.1 0 0026 0l212.6-292.7c3.8-5.3 0-12.7-6.5-12.7h-55.2c-5.1 0-10 2.5-13 6.6L468.9 542.4l-64.7-89.1z"/>
      </svg>
    `;
    title.textContent = "Two-Factor Authentication";
    sub.textContent = "Enter your 6 digit 2nd password to continue.";
  }else{
    icon.innerHTML = `
      <svg viewBox="64 64 896 896" aria-hidden="true">
        <path fill="currentColor" d="M832 464h-68V240c0-70.7-57.3-128-128-128H388c-70.7 0-128 57.3-128 128v224h-68c-17.7 0-32 14.3-32 32v384c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V496c0-17.7-14.3-32-32-32zM332 240c0-30.9 25.1-56 56-56h248c30.9 0 56 25.1 56 56v224H332V240zm460 600H232V536h560v304zM484 701v53c0 4.4 3.6 8 8 8h40c4.4 0 8-3.6 8-8v-53a48.01 48.01 0 10-56 0z"/>
      </svg>
    `;
    title.textContent = "Log in";
    sub.textContent = "Welcome back! Please sign in to continue.";
  }
}
let pendingUser = null;
let pendingUsername = "";

function showPageLoading(text = "Please wait while fetching..."){
  const el = $("pageLoading");
  if(!el) return;

  const textEl = el.querySelector(".loading-text");
  if(textEl) textEl.textContent = text;

  el.classList.remove("hide");
  el.classList.add("show");
}

function hidePageLoading(){
  const el = $("pageLoading");
  if(!el) return;

  el.classList.remove("show");
  el.classList.add("hide");
}

$("btnLogin").disabled = true;
  const toast = (msg)=>{
    const el = $("toast");
    el.textContent = msg;
    el.style.display = "block";
    clearTimeout(window.__t);
    window.__t = setTimeout(()=> el.style.display="none", 2800);
  };

  const ADMIN_USERNAMES = new Set(["farm88"]); // tambah kalau perlu

  function toEmail(username){
    return `${String(username||"").trim().toLowerCase()}@farm.local`;
  }

  async function ensureProfile(uid, username){
    const pRef = ref(db, `profiles/${uid}`);
    const snap = await get(pRef);
    if(!snap.exists()){
      await set(pRef, {
        username,
        createdAt: serverTimestamp()
      });
    }
    // set role (simple)
    const isAdmin = ADMIN_USERNAMES.has(username);
    const roleRef = ref(db, `roles/${uid}`);
    const rSnap = await get(roleRef);
    if(!rSnap.exists()){
      await set(roleRef, { isAdmin, username, updatedAt: serverTimestamp() });
    }
  }
function clearFieldErrors(){
  document.querySelectorAll(".inputWrap").forEach(w=>{
    w.classList.remove("hasError");
  });

  document.querySelectorAll(".fieldError").forEach(e=>{
    e.textContent = "";
    e.style.display = "none";
  });

  $("pinWrap")?.classList.remove("hasError");

  if($("pinError")){
    $("pinError").textContent = "";
    $("pinError").classList.remove("show");
  }
}

function setInputError(inputId, errorId, msg){
  const input = $(inputId);
  const wrap = input?.closest(".inputWrap");
  const err = $(errorId);

  wrap?.classList.add("hasError");

  if(err){
    err.textContent = msg;
    err.style.display = "block";
  }
}

function setPinError(msg){
  $("pinWrap")?.classList.add("hasError");

  if($("pinError")){
    $("pinError").textContent = msg;
    $("pinError").classList.add("show");
  }
}
// ✅ Convert Firebase auth error -> mesej toast sendiri
function authMsg(err){
  const code = String(err?.code || "");

  if(code === "auth/user-not-found") return "User tidak wujud. Sila hubungi admin.";
  if(code === "auth/invalid-login-credentials") return "Username atau password salah.";
  if(code === "auth/wrong-password") return "Password salah.";
  if(code === "auth/too-many-requests") return "Terlalu banyak cubaan. Cuba lagi nanti.";
  if(code === "auth/network-request-failed") return "Network error. Check internet.";
  if(code === "auth/invalid-email") return "Username tak valid.";
  return "Login gagal. Sila cuba lagi.";
}
async function doLogin(){
  clearFieldErrors();
  const username = $("username").value.trim().toLowerCase();
  const password = $("password").value;
 const turnstileToken = window.turnstileToken || "";

if(!turnstileToken){
  toast("Please complete Turnstile verification.");
  return;
}
  // ✅ START spinner
  setLoading(true);
  showPageLoading("Please wait while fetching...");
  // ✅ kalau validation fail, STOP spinner juga
if(username.length < 3){
  setLoading(false);
  hidePageLoading();

  setInputError(
    "username",
    "usernameError",
    "Username does not exist."
  );

  return;
}

if(password.length < 6){
  setLoading(false);
  hidePageLoading();

  setInputError(
    "password",
    "passwordError",
    "Password does not exist."
  );

  return;
}

  const email = toEmail(username);

  try{
    await setPersistence(auth, browserLocalPersistence);

const cred = await signInWithEmailAndPassword(auth, email, password);

await ensureProfile(cred.user.uid, username);

pendingUser = cred.user;
pendingUsername = username;

$("secondUsername").textContent = username;

$("loginStep1").classList.add("hide");
$("loginStep2").classList.remove("hide");
setLoginHead("step2");

setLoading(false);
hidePageLoading();

document.querySelector(".pinInput")?.focus();
}catch(e){
  console.error(e);

  const code = String(e?.code || "");

  if(
    code === "auth/user-not-found" ||
    code === "auth/invalid-email"
  ){

    setInputError(
      "username",
      "usernameError",
      "Username does not exist."
    );

  }else{

    setInputError(
      "password",
      "passwordError",
      "Password does not exist."
    );

  }

  setLoading(false);
  hidePageLoading();
}
}

// ✅ click login
$("btnLogin").addEventListener("click", doLogin);
["username","password"].forEach(id=>{
  const el = $(id);
  if(!el) return;

  el.addEventListener("keydown", (e)=>{
    if(e.key === "Enter"){
      e.preventDefault();

      if($("btnLogin")?.disabled) return;

      doLogin();
    }
  });

  el.addEventListener("input", ()=>{
    clearFieldErrors();
  });
});
  
});
const toggle = $("togglePass");
const passInput = $("password");
const eyePath = document.getElementById("eyePath");

const eyeOpen = `M11.885 14.988l3.104-3.098.011.11c0 1.654-1.346 3-3 3l-.115-.012zm8.048-8.032l-3.274 3.268c.212.554.341 1.149.341 1.776 0 2.757-2.243 5-5 5-.631 0-1.229-.13-1.785-.344l-2.377 2.372c1.276.588 2.671.972 4.177.972 7.733 0 11.985-8.449 11.985-8.449s-1.415-2.478-4.067-4.595zm1.431-3.536l-18.619 18.58-1.382-1.422 3.455-3.447c-3.022-2.45-4.818-5.58-4.818-5.58s4.446-7.551 12.015-7.551c1.825 0 3.456.426 4.886 1.075l3.081-3.075 1.382 1.42zm-13.751 10.922l1.519-1.515c-.077-.264-.132-.538-.132-.827 0-1.654 1.346-3 3-3 .291 0 .567.055 .833.134l1.518-1.515c-.704-.382-1.496-.619-2.351-.619-2.757 0-5 2.243-5 5 0 .852.235 1.641.613 2.342z`;

const eyeClosed = `M15 12c0 1.654-1.346 3-3 3s-3-1.346-3-3 1.346-3 3-3 3 1.346 3 3zm9-.449s-4.252 8.449-11.985 8.449c-7.18 0-12.015-8.449-12.015-8.449s4.446-7.551 12.015-7.551c7.694 0 11.985 7.551 11.985 7.551zm-7 .449c0-2.757-2.243-5-5-5s-5 2.243-5 5 2.243 5 5 5 5-2.243 5-5z`;

toggle.addEventListener("click", ()=>{
  if(passInput.type === "password"){
    passInput.type = "text";
    eyePath.setAttribute("d", eyeClosed);
  }else{
    passInput.type = "password";
    eyePath.setAttribute("d", eyeOpen);
  }
});
function setLoading(on){
  const btn = $("btnLogin");
  const txt = $("btnText");

  if(on){
    // ✅ tukar text
    if(txt) txt.textContent = "Logging in...";

    // ❌ jangan add spinner/loading class lagi
    btn.classList.remove("loading");

    // ✅ disable button
    btn.disabled = true;

  }else{
    // ✅ balik normal
    if(txt) txt.textContent = "Login";

    // ❌ pastikan spinner tak muncul
    btn.classList.remove("loading");

    btn.disabled = false;
  }
}
// ===== THEME SYNC (LOGIN) =====
const THEME_KEY = "farm_theme"; // sama macam admin
function loadTheme(){
  const saved = localStorage.getItem(THEME_KEY);
  return (saved === "light" || saved === "dark") ? saved : "dark";
}
function applyTheme(theme){
  document.documentElement.classList.toggle("theme-light", theme === "light");
}
applyTheme(loadTheme());

window.addEventListener("load", () => {
  setTimeout(() => {
    hidePageLoading();
  }, 500);
});
// ikut perubahan dari tab/page lain (admin toggle)
window.addEventListener("storage", (e)=>{
  if(e.key !== THEME_KEY) return;

  applyTheme(loadTheme());

  if(window.turnstile){
    renderTurnstile();
  }
});
// ===== CLOUDFLARE TURNSTILE =====
let turnstileId = null;

function getTurnstileTheme(){
  const currentTheme = loadTheme();

  // login light => turnstile dark
  // login dark  => turnstile light
  return currentTheme === "light" ? "dark" : "light";
}

function renderTurnstile(){
  const box = document.getElementById("turnstileWidget");
  if(!box || !window.turnstile) return;

  box.innerHTML = "";
  window.turnstileToken = "";

  // 🔥 disable button masa verify
  $("btnLogin").disabled = true;

  turnstileId = window.turnstile.render("#turnstileWidget", {
    sitekey: "0x4AAAAAADMYm_QXydQu476r",
    theme: getTurnstileTheme(),

    callback: function(token){
      window.turnstileToken = token;

      // ✅ enable bila success
      $("btnLogin").disabled = false;
    },

    "expired-callback": function(){
      window.turnstileToken = "";

      // ❌ disable balik kalau expired
      $("btnLogin").disabled = true;
    },

    "error-callback": function(){
      window.turnstileToken = "";

      // ❌ disable kalau error
      $("btnLogin").disabled = true;

      toast("Turnstile error. Please try again.");
    }
  });
}

function waitTurnstileReady(){
  const timer = setInterval(() => {
    if(window.turnstile){
      clearInterval(timer);
      renderTurnstile();
    }
  }, 100);
}

waitTurnstileReady();
function getPinValue(){
  return Array.from(document.querySelectorAll(".pinInput"))
    .map(i => i.value.trim())
    .join("");
}

function clearPin(){
  document.querySelectorAll(".pinInput").forEach(i => i.value = "");
  document.querySelector(".pinInput")?.focus();
}

async function verifySecondPassword(){
  const pin = getPinValue();

if(pin.length !== 6){
  setPinError("2nd password does not exist.");
  return;
}

  if(!pendingUser){
    toast("Session expired. Please login again.");
    return;
  }

  showPageLoading("Please wait while fetching...");

  try{
    const snap = await get(ref(db, `profiles/${pendingUser.uid}/secondPassword`));
    const savedPin = snap.exists() ? String(snap.val()) : "";

if(!savedPin){
  hidePageLoading();
  setPinError("2nd password does not exist.");
  return;
}

if(pin !== savedPin){
  hidePageLoading();
  clearPin();
  setPinError("2nd password does not exist.");
  return;
}

    location.replace("../admin/");
  }catch(e){
    console.error(e);
    hidePageLoading();
    toast("Failed verify 2nd password.");
  }
}

$("btnVerify2nd")?.addEventListener("click", verifySecondPassword);

$("btnBackLogin")?.addEventListener("click", async ()=>{
  pendingUser = null;
  pendingUsername = "";

$("loginStep2").classList.add("hide");
$("loginStep1").classList.remove("hide");
setLoginHead("step1");

clearPin();
});

document.querySelectorAll(".pinInput").forEach((input, index, arr)=>{
  input.addEventListener("input", ()=>{
    $("pinWrap")?.classList.remove("hasError");
    $("pinError")?.classList.remove("show");
    input.value = input.value.replace(/\D/g, "").slice(0,1);

    if(input.value && arr[index + 1]){
      arr[index + 1].focus();
    }

    if(getPinValue().length === 6){
      verifySecondPassword();
    }
  });

  input.addEventListener("keydown", (e)=>{
    if(e.key === "Backspace" && !input.value && arr[index - 1]){
      arr[index - 1].focus();
    }

    if(e.key === "Enter"){
      e.preventDefault();
      verifySecondPassword();
    }
  });
});
