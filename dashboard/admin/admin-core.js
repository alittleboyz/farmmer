/* ==========================================================
   FARMMER ADMIN - SHARED ADMIN CORE
   File: dashboard/admin/admin-core.js
   ========================================================== */

import { initializeApp, getApps, getApp }
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
  getDatabase,
  ref,
  get
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";


/* ==========================================================
   FIREBASE CONFIG
   ========================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyBAUxwnpWvSfih5EHY9Uy_9ABrym0Hd9iI",
  authDomain: "farmmer-888.firebaseapp.com",
  databaseURL:
    "https://farmmer-888-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "farmmer-888",
  storageBucket: "farmmer-888.firebasestorage.app",
  messagingSenderId: "100054260667",
  appId: "1:100054260667:web:f71a14baec71f89a8b829e"
};


/* ==========================================================
   FIREBASE
   Elak initialize app dua kali.
   ========================================================== */

const app =
  getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getDatabase(app);


/* ==========================================================
   CURRENT ADMIN STATE
   ========================================================== */

let currentUser = null;
let currentProfile = null;
let currentRole = null;


/* ==========================================================
   LOAD ADMIN ACCESS
   ========================================================== */

async function loadCurrentAdmin(user){

  if(!user){
    currentUser = null;
    currentProfile = null;
    currentRole = null;
    return null;
  }

  const uid = user.uid;

  const [profileSnap, roleSnap] = await Promise.all([
    get(ref(db, `profiles/${uid}`)),
    get(ref(db, `roles/${uid}`))
  ]);

  currentUser = user;

  currentProfile =
    profileSnap.exists()
      ? profileSnap.val()
      : {};

  currentRole =
    roleSnap.exists()
      ? roleSnap.val()
      : null;


  return {
    user: currentUser,
    profile: currentProfile,
    role: currentRole
  };
}


/* ==========================================================
   WAIT UNTIL AUTH READY
   ========================================================== */

let authReadyPromise = null;

function waitForAuth(){

  if(authReadyPromise){
    return authReadyPromise;
  }

  authReadyPromise = new Promise((resolve)=>{

    const unsubscribe =
      onAuthStateChanged(auth, async user => {

        unsubscribe();

        if(!user){

          location.replace("../login/");
          resolve(null);
          return;

        }

        try{

          const admin =
            await loadCurrentAdmin(user);

          resolve(admin);

        }catch(error){

          console.error(
            "[admin-core] Failed loading admin:",
            error
          );

          resolve(null);

        }

      });

  });

  return authReadyPromise;
}


/* ==========================================================
   GET CURRENT ADMIN
   ========================================================== */

async function getCurrentAdmin(){

  await waitForAuth();

  if(!currentUser){
    return null;
  }

  return {
    uid: currentUser.uid,

    email:
      currentUser.email || "",

    username:
      currentProfile?.username ||
      currentUser.email?.split("@")[0] ||
      "Admin",

    profile:
      currentProfile || {},

    role:
      currentRole
  };
}


/* ==========================================================
   ROLE HELPERS
   ========================================================== */

async function isSuperadmin(){

  const admin =
    await getCurrentAdmin();

  if(!admin){
    return false;
  }

  /*
    Support structure lama dahulu.

    Nanti bila kita migrate:
    role = "superadmin"
  */

  return (
    admin.role === "superadmin" ||
    admin.role === "admin" ||
    admin.role?.role === "superadmin" ||
    admin.role?.role === "admin"
  );
}


/* ==========================================================
   GET SITES

   Structure baru nanti:

   sites/
      ab88/
         name: "AB88"
         active: true

      aa123/
         name: "AA123"
         active: true
   ========================================================== */

async function getSites(){

  await waitForAuth();

  const snap =
    await get(ref(db, "sites"));

  if(!snap.exists()){
    return [];
  }

  const data = snap.val() || {};

  return Object.entries(data)
    .map(([id, site]) => ({

      id,

      value: id,

      name:
        site?.name ||
        id,

      label:
        site?.name ||
        id,

      active:
        site?.active !== false,

      ...(site || {})

    }))
    .sort((a,b)=>
      String(a.label)
        .localeCompare(String(b.label))
    );
}


/* ==========================================================
   NEW UI SITE SELECTOR BRIDGE
   ========================================================== */

window.getAdminSites =
async function(){

  try{

    const sites =
      await getSites();

    return sites.map(site => ({
      value: site.id,
      label: site.name || site.id
    }));

  }catch(error){

    console.error(
      "[admin-core] getAdminSites error:",
      error
    );

    return [];

  }

};


/* ==========================================================
   LOGOUT
   ========================================================== */

async function logout(){

  try{

    localStorage.removeItem(
      "farm_session_expires_at"
    );

    await signOut(auth);

  }finally{

    location.replace("../login/");

  }

}


/* ==========================================================
   PUBLIC API
   ========================================================== */

window.AdminCore = {

  app,
  auth,
  db,

  waitForAuth,
  getCurrentAdmin,

  isSuperadmin,

  getSites,

  logout

};


/* ==========================================================
   READY EVENT
   ========================================================== */

waitForAuth()
  .then(admin => {

    window.dispatchEvent(
      new CustomEvent(
        "admin-core-ready",
        {
          detail: admin
        }
      )
    );

  })
  .catch(error => {

    console.error(
      "[admin-core] init error:",
      error
    );

  });
