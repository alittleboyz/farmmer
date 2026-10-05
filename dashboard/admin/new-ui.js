// ============================================================
// FARM ADMIN - SHARED UI
// File: dashboard/admin/new-ui.js
// ============================================================

const baseMenuItems = [
  {
    file: "index.html",
    name: "Dashboard",
    permission: "dashboard.show"
  },
  {
    file: "vault.html",
    name: "Vault",
    permission: "vault.show"
  },
  {
    file: "history.html",
    name: "History Vault",
    permission: "history.show"
  },
  {
    file: "transaction.html",
    name: "Transaction",
    permission: "transaction.show"
  },
  {
    file: "notices.html",
    name: "Notices",
    permission: "notices.show"
  },

  // ===== SUPERADMIN ONLY =====
  {
    file: "sites.html",
    name: "Site Management",
    superadminOnly: true
  },
  {
    file: "auth-users.html",
    name: "Admin Users",
    superadminOnly: true
  }
];


// ============================================================
// CURRENT UI USER
// Sementara.
// Nanti admin.js / Firebase akan update data ini.
// ============================================================

const adminUIState = {
  uid: "",
  username: "Admin",
  role: "superadmin",
  permissions: {},
  sites: [],
  owners: [],
  currentSiteId: "",
  selectedOwnerUid: ""
};

// ============================================================
// HELPERS
// ============================================================

function getCurrentPage(){
  let page = window.location.pathname.split("/").pop();

  if(!page){
    page = "index.html";
  }

  return page.toLowerCase();
}


function isSuperAdmin(){
  return adminUIState.role === "superadmin";
}


function getPermissionValue(obj, path){
  if(!obj || !path) return false;

  return path.split(".").reduce((current, key)=>{
    if(
      current &&
      Object.prototype.hasOwnProperty.call(current, key)
    ){
      return current[key];
    }

    return undefined;
  }, obj);
}


function hasPermission(permission){

  // Superadmin bypass semua UI permission
  if(isSuperAdmin()){
    return true;
  }

  if(!permission){
    return true;
  }

  return getPermissionValue(
    adminUIState.permissions,
    permission
  ) === true;
}


function canShowMenu(item){

  if(item.superadminOnly){
    return isSuperAdmin();
  }

  return hasPermission(item.permission);
}


// ============================================================
// ICON
// ============================================================

function menuIcon(file){

  const icons = {

    "index.html": `
      <svg viewBox="0 0 24 24">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
      </svg>
    `,

    "vault.html": `
      <svg viewBox="0 0 24 24">
        <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 14H4V8h16v10zm-3-2h2v-2h-2v2z"/>
      </svg>
    `,

    "history.html": `
      <svg viewBox="0 0 24 24">
        <path d="M13 3a9 9 0 1 0 8.95 10H20a7 7 0 1 1-2.05-4.95L15 11h7V4l-2.63 2.63A8.96 8.96 0 0 0 13 3zm-1 5v5l4.25 2.52.75-1.23-3.5-2.08V8H12z"/>
      </svg>
    `,

    "transaction.html": `
      <svg viewBox="0 0 24 24">
        <path d="M7 7h11l-3.5-3.5L16 2l6 6-6 6-1.5-1.5L18 9H7V7zm10 10H6l3.5 3.5L8 22l-6-6 6-6 1.5 1.5L6 15h11v2z"/>
      </svg>
    `,

    "notices.html": `
      <svg viewBox="0 0 24 24">
        <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm6-6v-5a6 6 0 0 0-5-5.91V4a1 1 0 1 0-2 0v1.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2z"/>
      </svg>
    `,

    "sites.html": `
      <svg viewBox="0 0 24 24">
        <path d="M3 3h8v8H3V3zm10 0h8v5h-8V3zM3 13h8v8H3v-8zm10-3h8v11h-8V10z"/>
      </svg>
    `,

    "auth-users.html": `
      <svg viewBox="0 0 24 24">
        <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
      </svg>
    `
  };

  return icons[file] || "";
}


// ============================================================
// BUILD NAVIGATION
// ============================================================

function buildAdminNavigation(){

  const nav = document.getElementById("sharedAdminNav");

  if(!nav){
    return;
  }

  nav.innerHTML = "";

  const currentPage = getCurrentPage();

  baseMenuItems.forEach(item=>{

    if(!canShowMenu(item)){
      return;
    }

    const a = document.createElement("a");

    a.href = `./${item.file}`;
    a.className = "sharedNavItem";

    if(currentPage === item.file.toLowerCase()){
      a.classList.add("active");
    }

    a.innerHTML = `
      <span class="sharedNavIcon">
        ${menuIcon(item.file)}
      </span>

      <span class="sharedNavText">
        ${item.name}
      </span>
    `;

    nav.appendChild(a);
  });
}


// ============================================================
// MOBILE MENU
// ============================================================

function openSharedMenu(){

  document.body.classList.add(
    "shared-admin-menu-open"
  );
}


function closeSharedMenu(){

  document.body.classList.remove(
    "shared-admin-menu-open"
  );
}


function bindMobileMenu(){

  const openBtn =
    document.getElementById("sharedMenuBtn");

  const closeBtn =
    document.getElementById("sharedMenuClose");

  const overlay =
    document.getElementById("sharedMenuOverlay");

  openBtn?.addEventListener(
    "click",
    openSharedMenu
  );

  closeBtn?.addEventListener(
    "click",
    closeSharedMenu
  );

  overlay?.addEventListener(
    "click",
    closeSharedMenu
  );
}


// ============================================================
// USER UI
// ============================================================

function renderSharedUser(){

  const username =
    document.getElementById("sharedUsername");

  const role =
    document.getElementById("sharedRole");

  if(username){
    username.textContent =
      adminUIState.username || "Admin";
  }

  if(role){

    if(adminUIState.role === "superadmin"){
      role.textContent = "Super Admin";
    }

    else if(adminUIState.role === "site_admin"){
      role.textContent = "Site Admin";
    }

    else{
      role.textContent = "User";
    }
  }
}


// ============================================================
// SITE SELECTOR
// ============================================================

function renderSharedSites(){

  const wrap =
    document.getElementById("sharedSiteWrap");

  const select =
    document.getElementById("sharedSiteSelector");

  if(!wrap || !select){
    return;
  }

  select.innerHTML = "";

  if(isSuperAdmin()){

    const all =
      document.createElement("option");

    all.value = "";
    all.textContent = "All Sites";

    select.appendChild(all);
  }

  adminUIState.sites.forEach(site=>{

    const option =
      document.createElement("option");

    if(typeof site === "string"){

      option.value = site;
      option.textContent = site;

    }else{

      option.value = site.id || "";
      option.textContent =
        site.name || site.id || "Site";
    }

    select.appendChild(option);
  });

  select.value =
    adminUIState.currentSiteId || "";

  select.onchange = ()=>{

    adminUIState.currentSiteId =
      select.value;

    window.dispatchEvent(
      new CustomEvent(
        "admin-site-change",
        {
          detail: {
            siteId:
              adminUIState.currentSiteId
          }
        }
      )
    );
  };
}


// ============================================================
// OWNER SELECTOR
// ============================================================

function renderSharedOwner(){

  const wrap =
    document.getElementById("sharedOwnerWrap");

  const select =
    document.getElementById("sharedOwnerSelector");

  if(!wrap || !select){
    return;
  }

  // Site Admin tak boleh pilih owner
  if(!isSuperAdmin()){
    wrap.classList.add("hide");
    return;
  }

  wrap.classList.remove("hide");

  select.innerHTML = "";

  // Superadmin boleh lihat semua Site Admin
  const all =
    document.createElement("option");

  all.value = "";
  all.textContent = "All Site Admins";

  select.appendChild(all);

  adminUIState.owners.forEach(owner=>{

    const option =
      document.createElement("option");

    if(typeof owner === "string"){

      option.value = owner;
      option.textContent = owner;

    }else{

      option.value = owner.uid || "";
      option.textContent =
        owner.username || owner.uid || "Site Admin";
    }

    select.appendChild(option);
  });

  select.value =
    adminUIState.selectedOwnerUid || "";

  select.onchange = ()=>{

    adminUIState.selectedOwnerUid =
      select.value || "";

    window.dispatchEvent(
      new CustomEvent(
        "admin-owner-change",
        {
          detail: {
            ownerUid:
              adminUIState.selectedOwnerUid
          }
        }
      )
    );
  };
}


// ============================================================
// PUBLIC UPDATE FUNCTION
// Nanti admin.js boleh panggil ini selepas Firebase load.
// ============================================================

window.setAdminUIContext = function(data = {}){

  if(data.uid !== undefined){
    adminUIState.uid = data.uid;
  }

  if(data.username !== undefined){
    adminUIState.username = data.username;
  }

  if(data.role !== undefined){
    adminUIState.role = data.role;
  }

  if(data.permissions !== undefined){
    adminUIState.permissions =
      data.permissions || {};
  }

  if(data.sites !== undefined){
    adminUIState.sites =
      Array.isArray(data.sites)
        ? data.sites
        : [];
  }
  
if(data.owners !== undefined){
  adminUIState.owners =
    Array.isArray(data.owners)
      ? data.owners
      : [];
}
  if(data.currentSiteId !== undefined){
    adminUIState.currentSiteId =
      data.currentSiteId || "";
  }

  if(data.selectedOwnerUid !== undefined){
    adminUIState.selectedOwnerUid =
      data.selectedOwnerUid || "";
  }

  buildAdminNavigation();
  renderSharedUser();
  renderSharedSites();
  renderSharedOwner();
};


// ============================================================
// INIT
// ============================================================

function initSharedAdminUI(){

  buildAdminNavigation();

  renderSharedUser();

  renderSharedSites();

  renderSharedOwner();

  bindMobileMenu();
}


if(document.readyState === "loading"){

  document.addEventListener(
    "DOMContentLoaded",
    initSharedAdminUI
  );

}else{

  initSharedAdminUI();
}
