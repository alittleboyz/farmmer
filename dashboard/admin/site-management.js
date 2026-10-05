/* ==========================================================
   FARMMER ADMIN - SITE MANAGEMENT
   File: dashboard/admin/site-management.js
   ========================================================== */

const btnCreateSite =
  document.getElementById("btnCreateSite");

const siteRows =
  document.getElementById("siteRows");


/* ==========================================================
   ESCAPE HTML
   ========================================================== */

function escapeHtml(value){

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* ==========================================================
   MONEY
   ========================================================== */

function formatMoney(value){

  const number =
    Number(value || 0);

  return number.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

}


/* ==========================================================
   LOADING
   ========================================================== */

function renderLoading(){

  if(!siteRows) return;

  siteRows.innerHTML = `
    <tr>
      <td colspan="5" class="muted">
        Loading sites...
      </td>
    </tr>
  `;

}


/* ==========================================================
   EMPTY
   ========================================================== */

function renderEmpty(){

  if(!siteRows) return;

  siteRows.innerHTML = `
    <tr>
      <td colspan="5" class="muted">
        No sites created yet.
      </td>
    </tr>
  `;

}


/* ==========================================================
   ERROR
   ========================================================== */

function renderError(message){

  if(!siteRows) return;

  siteRows.innerHTML = `
    <tr>
      <td colspan="5">
        Failed loading sites:
        ${escapeHtml(message || "Unknown error")}
      </td>
    </tr>
  `;

}


/* ==========================================================
   RENDER SITE ROWS
   ========================================================== */

function renderSites(sites){

  if(!siteRows) return;

  if(!Array.isArray(sites) || !sites.length){

    renderEmpty();
    return;

  }


  siteRows.innerHTML =
    sites.map(site => {

      const siteId =
        String(
          site.id ||
          site.value ||
          ""
        );

      const siteName =
        String(
          site.name ||
          site.label ||
          siteId
        );

      const adminName =
        String(
          site.adminUsername ||
          site.adminName ||
          "-"
        );

      const wallet =
        Number(
          site.walletBalance ??
          site.balance ??
          0
        );

      const active =
        site.active !== false;


      return `
        <tr>

          <td>
            <strong>
              ${escapeHtml(siteName)}
            </strong>

            <div class="muted">
              ${escapeHtml(siteId)}
            </div>
          </td>


          <td>
            ${escapeHtml(adminName)}
          </td>


          <td>
            ${formatMoney(wallet)}
          </td>


          <td>
            ${active ? "Active" : "Inactive"}
          </td>


          <td>

            <button
              type="button"
              class="btn"
              data-site-action="view"
              data-site-id="${escapeHtml(siteId)}"
            >
              View
            </button>

          </td>

        </tr>
      `;

    }).join("");

}


/* ==========================================================
   HEADER USER INFO
   ========================================================== */

async function renderHeaderAdmin(){

  const admin =
    await window.AdminCore.getCurrentAdmin();

  if(!admin) return;


  const usernameText =
    document.getElementById("usernameText");

  if(!usernameText) return;


  const superadmin =
    await window.AdminCore.isSuperadmin();


  usernameText.textContent =
    superadmin
      ? "Superadmin"
      : (admin.username || "Site Admin");

}


/* ==========================================================
   LOAD SITES
   ========================================================== */

async function loadSites(){

  renderLoading();

  try{

    const sites =
      await window.AdminCore.getSites();

    renderSites(sites);

  }catch(error){

    console.error(
      "[site-management] loadSites error:",
      error
    );

    renderError(error?.message);

  }

}


/* ==========================================================
   CREATE SITE
   Belum kita hidupkan.
   ========================================================== */

if(btnCreateSite){

  btnCreateSite.addEventListener(
    "click",
    ()=>{

      console.log(
        "[site-management] Create Site clicked"
      );

    }
  );

}


/* ==========================================================
   TABLE ACTIONS
   ========================================================== */

if(siteRows){

  siteRows.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-site-action]"
        );

      if(!button) return;


      const action =
        button.dataset.siteAction;

      const siteId =
        button.dataset.siteId;


      if(action === "view"){

        console.log(
          "[site-management] View site:",
          siteId
        );

      }

    }
  );

}


/* ==========================================================
   INIT
   ========================================================== */

async function init(){

  try{

    await window.AdminCore.waitForAuth();

    await renderHeaderAdmin();

    await loadSites();

  }catch(error){

    console.error(
      "[site-management] init error:",
      error
    );

    renderError(
      error?.message ||
      "Failed initializing Site Management."
    );

  }

}


init();
