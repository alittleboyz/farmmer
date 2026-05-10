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
  const username = $("username").value.trim().toLowerCase();
  const password = $("password").value;
 const turnstileToken = window.turnstileToken || "";

if(!turnstileToken){
  toast("Please complete Turnstile verification.");
  return;
}
  // ✅ START spinner
  setLoading(true);

  // ✅ kalau validation fail, STOP spinner juga
  if(username.length < 3){
    setLoading(false);
    toast("Username terlalu pendek.");
    return;
  }
  if(password.length < 6){
    setLoading(false);
    toast("Password minimum 6 karakter.");
    return;
  }

  const email = toEmail(username);

  try{
    await setPersistence(auth, browserLocalPersistence);

const cred = await signInWithEmailAndPassword(auth, email, password);

await ensureProfile(cred.user.uid, username);

location.replace("../admin/");
  }catch(e){
    console.error(e);
    toast(authMsg(e));
    setLoading(false); // ✅ STOP spinner bila gagal
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
    btn.classList.add("loading");
    btn.disabled = true;
    txt.textContent = "Logging in...";
  }else{
    btn.classList.remove("loading");
    btn.disabled = false;
    txt.textContent = "Login";
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

  turnstileId = window.turnstile.render("#turnstileWidget", {
    sitekey: "0x4AAAAAADMYm_QXydQu476r",
    theme: getTurnstileTheme(),

    callback: function(token){
      window.turnstileToken = token;
    },

    "expired-callback": function(){
      window.turnstileToken = "";
    },

    "error-callback": function(){
      window.turnstileToken = "";
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
