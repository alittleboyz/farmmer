import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
  getDatabase,
  ref,
  get,
  set,
  push,
  update,
  remove,
  onValue,
  serverTimestamp,
  query,
  orderByChild,
  limitToLast
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";


const c = {
  apiKey: "AIzaSyBAUxwnpWvSfih5EHY9Uy_9ABrym0Hd9iI",
  authDomain: "farmmer-888.firebaseapp.com",
  databaseURL: "https://farmmer-888-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "farmmer-888",
  storageBucket: "farmmer-888.firebasestorage.app",
  messagingSenderId: "100054260667",
  appId: "1:100054260667:web:f71a14baec71f89a8b829e"
};


export const app = initializeApp(c);

export const auth = getAuth(app);

export const db = getDatabase(app);


export {
  ref,
  get,
  set,
  push,
  update,
  remove,
  onValue,
  serverTimestamp,
  query,
  orderByChild,
  limitToLast,
  signOut,
  signInWithEmailAndPassword
};


export const me = {
  uid: null,
  username: "",
  isAdmin: false
};


export const $ = x => document.getElementById(x);


export const esc = s =>
  String(s ?? "").replace(
    /[&<>"']/g,
    c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c])
  );


export const fmt = n =>
  Number(n || 0).toLocaleString(
    "en-MY",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );


export const dt = n =>
  n
    ? new Date(+n).toLocaleString("en-MY")
    : "-";


export const ready = new Promise(r =>
  onAuthStateChanged(auth, async u => {

    if (!u) {
      location.replace("./login.html");
      return;
    }

    me.uid = u.uid;

    let s = await get(
      ref(db, `profiles/${u.uid}`)
    );

    let p = s.exists()
      ? s.val()
      : {};

    me.username =
      p.username ||
      u.email ||
      "User";

    me.isAdmin = !!(
      p.isAdmin ||
      p.role === "admin"
    );

    document
      .querySelectorAll("[data-user]")
      .forEach(e => {
        e.textContent = me.username;
      });

    r(me);
  })
);


export function nav(p) {

  document
    .querySelectorAll(".tab[data-page]")
    .forEach(a =>
      a.classList.toggle(
        "active",
        a.dataset.page === p
      )
    );

  $("logout")?.addEventListener(
    "click",
    async () => {

      await signOut(auth);

      location.replace("./login.html");
    }
  );
}


export async function recompute(id, b) {

  let s = await get(
    ref(
      db,
      `vaults/${b}/${id}/transactions`
    )
  );

  let x = s.exists()
    ? s.val()
    : {};

  let cost = 0;
  let kg = 0;
  let ek = 0;
  let rev = 0;
  let miss = 0;
  let bq = 0;
  let btotal = 0;
  let bps = 0;


  Object.values(x).forEach(t => {

    if (t.kind === "missing") {
      miss += +t.qty || 0;
    }


    if (t.kind === "buy") {

      cost += +t.total || 0;

      if (t.category === "baby_pig") {

        bq += +t.qty || 0;

        btotal += +t.total || 0;

        bps +=
          (+t.qty || 0) *
          (+t.price || 0);
      }
    }


    if (t.kind === "sell") {

      rev += +t.total || 0;

      kg += +t.kg || 0;

      ek += +t.ekor || 0;
    }
  });


  await update(
    ref(
      db,
      `vaults/${b}/${id}/summary`
    ),
    {
      totalCost: cost,

      totalKg: kg,

      totalEkor: ek,

      totalRevenue: rev,

      profit: rev - cost,

      babyPig: {
        qty: bq,
        avgPrice: bq
          ? bps / bq
          : 0,
        total: btotal
      },

      missing: {
        qty: miss
      },

      availablePig: Math.max(
        0,
        bq - miss - ek
      )
    }
  );
}
