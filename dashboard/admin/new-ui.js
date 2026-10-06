/* ==========================================================
   FARMMER ADMIN - SHARED NEW UI
   File: dashboard/admin/new-ui.js
   ========================================================== */

(() => {
  "use strict";

  const STORAGE_KEY = "farmmerAdminSelectedSites";

  let currentSites = [];
  let siteOptions = [];

  /* ==========================================================
     HELPERS
     ========================================================== */

  function normalizeSites(values) {
    return Array.isArray(values)
      ? values
          .map(value => String(value).trim())
          .filter(Boolean)
      : [];
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function loadSavedSites() {
    try {
      const saved =
        JSON.parse(
          localStorage.getItem(STORAGE_KEY) || "[]"
        );

      return normalizeSites(saved);
    }
    catch (error) {
      console.warn(
        "[new-ui] Failed reading selected sites:",
        error
      );

      return [];
    }
  }

  function saveSites(values) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(values)
      );
    }
    catch (error) {
      console.warn(
        "[new-ui] Failed saving selected sites:",
        error
      );
    }
  }

  /* ==========================================================
     PUBLIC SITE STATE
     ========================================================== */

  currentSites = loadSavedSites();

  window.getAdminSelectedSites = function () {
    return [...currentSites];
  };

  window.getAdminActiveSite = function () {
    return currentSites[0] || "";
  };

  window.isAdminAllSites = function () {
    return currentSites.length === 0;
  };

  /* ==========================================================
     CREATE SITE SELECTOR
     ========================================================== */

  function createAdminSiteSelector(target) {

    if (!target) {
      return null;
    }

    if (target._adminSiteSelector) {
      return target._adminSiteSelector;
    }

    target.classList.add(
      "admin-site-selector"
    );

    target.innerHTML = `
      <div class="site-select-control">

        <div class="site-select-values">
          <span class="site-select-placeholder">
            Select Site
          </span>
        </div>

        <button
          class="site-select-arrow"
          type="button"
          aria-label="Open site selector"
          aria-expanded="false"
        >
          <svg
            viewBox="0 0 1024 1024"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3.1-12.7-6.5-12.7z"
            />
          </svg>
        </button>

      </div>

      <div class="site-select-panel"></div>
    `;

    const control =
      target.querySelector(
        ".site-select-control"
      );

    const valuesBox =
      target.querySelector(
        ".site-select-values"
      );

    const arrow =
      target.querySelector(
        ".site-select-arrow"
      );

    const panel =
      target.querySelector(
        ".site-select-panel"
      );

    /* ========================================================
       RENDER CURRENT VALUE
       ======================================================== */

    function renderValue() {

      const selected =
        currentSites
          .map(value => {
            return siteOptions.find(
              option =>
                String(option.value) ===
                String(value)
            );
          })
          .filter(Boolean);

      if (!selected.length) {

        valuesBox.innerHTML = `
          <span class="site-select-placeholder">
            Select Site
          </span>
        `;

        target.classList.remove(
          "has-value"
        );

        return;
      }

      const first = selected[0];

      let html = `
        <span class="site-select-chip">
          <span class="site-select-chip-text">
            ${escapeHTML(first.label)}
          </span>

          <button
            type="button"
            class="site-select-chip-remove"
            data-remove-site="${escapeHTML(first.value)}"
            aria-label="Remove ${escapeHTML(first.label)}"
          >
            ×
          </button>
        </span>
      `;

      if (selected.length > 1) {
        html += `
          <span class="site-select-more">
            +${selected.length - 1}
          </span>
        `;
      }

      valuesBox.innerHTML = html;

      target.classList.add(
        "has-value"
      );

      valuesBox
        .querySelectorAll(
          "[data-remove-site]"
        )
        .forEach(button => {

          button.addEventListener(
            "click",
            event => {

              event.stopPropagation();

              const value =
                button.dataset.removeSite;

              setValue(
                currentSites.filter(
                  site =>
                    String(site) !==
                    String(value)
                )
              );
            }
          );
        });
    }

    /* ========================================================
       RENDER OPTIONS
       ======================================================== */

    function renderOptions() {

      if (!siteOptions.length) {

        panel.innerHTML = `
          <div class="site-select-empty">
            No site available
          </div>
        `;

        return;
      }

      panel.innerHTML =
        siteOptions
          .map(option => {

            const checked =
              currentSites.includes(
                String(option.value)
              );

            return `
              <button
                type="button"
                class="site-select-option ${
                  checked ? "selected" : ""
                }"
                data-site-value="${escapeHTML(option.value)}"
              >
                <span class="site-select-check">
                  ${checked ? "✓" : ""}
                </span>

                <span class="site-select-option-label">
                  ${escapeHTML(option.label)}
                </span>
              </button>
            `;
          })
          .join("");

      panel
        .querySelectorAll(
          "[data-site-value]"
        )
        .forEach(button => {

          button.addEventListener(
            "click",
            event => {

              event.stopPropagation();

              const value =
                String(
                  button.dataset.siteValue
                );

              const next =
                [...currentSites];

              const index =
                next.indexOf(value);

              if (index === -1) {
                next.push(value);
              }
              else {
                next.splice(index, 1);
              }

              setValue(next);
            }
          );
        });
    }

    /* ========================================================
       OPEN / CLOSE
       ======================================================== */

    function open() {

      target.classList.add("open");

      arrow.setAttribute(
        "aria-expanded",
        "true"
      );
    }

    function close() {

      target.classList.remove("open");

      arrow.setAttribute(
        "aria-expanded",
        "false"
      );
    }

    function toggle() {

      if (
        target.classList.contains("open")
      ) {
        close();
      }
      else {
        open();
      }
    }

    /* ========================================================
       SET VALUE
       ======================================================== */

    function setValue(
      values,
      dispatch = true
    ) {

      const allowed =
        new Set(
          siteOptions.map(
            option =>
              String(option.value)
          )
        );

      currentSites =
        normalizeSites(values)
          .filter(value =>
            allowed.has(value)
          );

      saveSites(currentSites);

      renderValue();
      renderOptions();

      if (dispatch) {

        window.dispatchEvent(
          new CustomEvent(
            "admin-site-change",
            {
              detail: {
                siteIds:
                  [...currentSites],

                siteId:
                  currentSites[0] || "",

                allSites:
                  currentSites.length === 0
              }
            }
          )
        );
      }
    }

    /* ========================================================
       SET OPTIONS
       ======================================================== */

function setOptions(options) {

  const nextOptions =
    Array.isArray(options)
      ? options
          .map(option => ({
            value:
              String(
                option.value ??
                option.id ??
                ""
              ),

            label:
              String(
                option.label ??
                option.name ??
                option.value ??
                option.id ??
                ""
              )
          }))
          .filter(
            option =>
              option.value
          )
      : [];


  /*
   * Site belum ready.
   * Jangan buang saved selection.
   */
  if (!nextOptions.length) {

    siteOptions = [];

    renderOptions();

    return;
  }


  siteOptions = nextOptions;


  /*
   * Validate saved site hanya selepas
   * options benar-benar tersedia.
   */
  const allowed =
    new Set(
      siteOptions.map(
        option =>
          String(option.value)
      )
    );


  currentSites =
    currentSites.filter(
      value =>
        allowed.has(
          String(value)
        )
    );


  saveSites(currentSites);

  renderValue();
  renderOptions();
  target.classList.add(
    "site-selector-ready"
  );
}
    /* ========================================================
       EVENTS
       ======================================================== */

    control.addEventListener(
      "click",
      event => {

        if (
          event.target.closest(
            ".site-select-chip-remove"
          )
        ) {
          return;
        }

        toggle();
      }
    );

    document.addEventListener(
      "click",
      event => {

        if (
          !target.contains(
            event.target
          )
        ) {
          close();
        }
      }
    );

    document.addEventListener(
      "keydown",
      event => {

        if (event.key === "Escape") {
          close();
        }
      }
    );

    const api = {
      open,
      close,

      getValue() {
        return [...currentSites];
      },

      setValue,

      setOptions
    };

    target._adminSiteSelector = api;

    renderValue();
    renderOptions();

    return api;
  }

  /* ==========================================================
     LOAD SITE LIST
     ========================================================== */

async function loadAdminSites() {

  let options = [];


  /* ========================================================
     GET ADMIN SITES BELUM READY
     ======================================================== */

  if (
    typeof window.getAdminSites !==
    "function"
  ) {

    return false;
  }


  /* ========================================================
     LOAD SITE LIST
     ======================================================== */

  try {

    const sites =
      await window.getAdminSites(false);


    options =
      Array.isArray(sites)
        ? sites
            .map(site => ({
              value:
                String(
                  site.value ??
                  site.id ??
                  ""
                ),

              label:
                String(
                  site.label ??
                  site.name ??
                  site.value ??
                  site.id ??
                  ""
                )
            }))
            .filter(
              option =>
                option.value
            )
        : [];

  }
  catch (error) {

    console.error(
      "[new-ui] Failed loading sites:",
      error
    );

    return false;
  }


  /* ========================================================
     SITE LIST MASIH KOSONG
     Jangan reset saved selection
     ======================================================== */

  if (!options.length) {

    return false;
  }


  /* ========================================================
     APPLY OPTIONS KE SELECTOR
     ======================================================== */

  document
    .querySelectorAll(
      "[data-admin-site-selector]"
    )
    .forEach(target => {

      const selector =
        createAdminSiteSelector(
          target
        );

      selector?.setOptions(
        options
      );

    });


  return true;
}
/* ==========================================================
   SHARED ADMIN HEADER - FINAL OWNER
   ========================================================== */

function createSharedAdminHeader(target) {
  if (!target || target.dataset.sharedHeaderReady === "1") return;

  const activePage = target.dataset.activePage || "vault";
  const active = page => activePage === page ? "active" : "";

  target.innerHTML = `
    <div class="headerSiteSelector" data-admin-site-selector></div>

    <div class="tabs headerTabs">

      <a class="tab ${active("vault")}" href="./index.html?tab=vault">
        <svg class="tabIcon" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M13 9V3h8v6zM3 13V3h8v10zm10 8V11h8v10zM3 21v-6h8v6z"/>
        </svg>
        <span>Vault</span>
      </a>

      <a class="tab ${active("transaction")}" href="./index.html?tab=transaction">
        <svg class="tabIcon" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M7 16.462l1.526-.723c1.792-.81 2.851-.344 4.349.232 1.716.661 2.365.883 3.077 1.164 1.278.506.688 2.177-.592 1.838-.778-.206-2.812-.795-3.38-.931-.64-.154-.93.602-.323.818 1.106.393 2.663.79 3.494 1.007.831.218 1.295-.145 1.881-.611.906-.72 2.968-2.909 2.968-2.909.842-.799 1.991-.135 1.991.72 0 .23-.083.474-.276.707-2.328 2.793-3.06 3.642-4.568 5.226-.623.655-1.342.974-2.204.974-.442 0-.922-.084-1.443-.25-1.825-.581-4.172-1.313-6.5-1.6v-5.662zm-1 6.538h-4v-8h4v8zm15-11.497l-6.5 3.468v-7.215l6.5-3.345v7.092zm-7.5-3.771v7.216l-6.458-3.445v-7.133l6.458 3.362zm-3.408-5.589l6.526 3.398-2.596 1.336-6.451-3.359 2.521-1.375zm10.381 1.415l-2.766 1.423-6.558-3.415 2.872-1.566 6.452 3.558z"/>
        </svg>
        <span>Transaction</span>
      </a>

      <a class="tab ${active("history")}" href="./index.html?tab=history">
        <svg class="tabIcon" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M5.673 0a.7.7 0 0 1 .7.7v1.309h7.517v-1.3a.7.7 0 0 1 1.4 0v1.3H18a2 2 0 0 1 2 1.999v13.993A2 2 0 0 1 18 20H2a2 2 0 0 1-2-1.999V4.008a2 2 0 0 1 2-1.999h2.973V.699a.7.7 0 0 1 .7-.699M1.4 7.742v10.259a.6.6 0 0 0 .6.6h16a.6.6 0 0 0 .6-.6V7.756zm5.267 6.877v1.666H5v-1.666zm4.166 0v1.666H9.167v-1.666zm4.167 0v1.666h-1.667v-1.666zm-8.333-3.977v1.666H5v-1.666zm4.166 0v1.666H9.167v-1.666zm4.167 0v1.666h-1.667v-1.666zM4.973 3.408H2a.6.6 0 0 0-.6.6v2.335l17.2.014V4.008a.6.6 0 0 0-.6-.6h-2.71v.929a.7.7 0 0 1-1.4 0v-.929H6.373v.92a.7.7 0 0 1-1.4 0z"/>
        </svg>
        <span>History Vault</span>
      </a>

      <a class="tab ${active("notes")}" href="./index.html?tab=notes">
        <svg class="tabIcon" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M17 7H7v1h10V7zm0 2H7v1h10V9zm-4 2H7v1h6v-1zm6-9H5a2 2 0 0 0-2 2v16l4-4h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/>
        </svg>
        <span>Notes</span>
      </a>

      <a class="tab ${active("site-management")}" href="./site-management.html">
        <span>Site Management</span>
      </a>
    </div>

    <div class="right">

      <div id="indoClock" class="indoClock">--</div>

      <button class="btn-modal walletBtn" id="btnBalance" type="button" data-clickfx>
        <span class="walletIcon">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M5 19V5zm0 2q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v2.5h-2V5H5v14h14v-2.5h2V19q0 .825-.587 1.413T19 21zm8-4q-.825 0-1.412-.587T11 15V9q0-.825.588-1.412T13 7h7q.825 0 1.413.588T22 9v6q0 .825-.587 1.413T20 17zm7-2V9h-7v6zm-4-1.5q.625 0 1.063-.437T17.5 12t-.437-1.062T16 10.5t-1.062.438T14.5 12t.438 1.063T16 13.5"/>
          </svg>
        </span>
        <span class="num" id="balanceText">0.00</span>
      </button>

      <div class="userDrop" id="userDrop">

        <button class="btn-user" id="btnUser" type="button"
                aria-haspopup="menu" aria-expanded="false" data-clickfx>
          <span class="userIcon">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 12a4 4 0 1 0-4-4a4 4 0 0 0 4 4zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z"/>
            </svg>
          </span>
          <span id="usernameText">...</span>
        </button>

        <div class="userMenu" id="userMenu" role="menu">

          <div class="userMenuItem themeRow">
            <span class="miText" id="themeLabelDesktop">Dark Mode</span>
            <label class="switch">
              <input id="themeToggleDesktop" type="checkbox">
              <span class="slider"></span>
            </label>
          </div>

          <div id="desktopModeSlotDesktop"></div>

          <button class="userMenuItem" id="btnChangePass" type="button">
            <span class="miIcon">🔒</span>
            <span class="miText">Change Password</span>
          </button>

          <button class="userMenuItem" id="btnChange2ndPass" type="button">
            <span class="miIcon">🛡</span>
            <span class="miText">Change 2nd Password</span>
          </button>

          <div class="langWrap" id="langWrapDesktop">
            <button class="userMenuItem" id="btnLangDesktop" type="button">
              <span class="miIcon">文</span>
              <span class="miText">Language</span>
              <span class="langRight" id="langTextDesktop">EN</span>
            </button>

            <div class="langMenu" id="langMenuDesktop">
              <button type="button" class="langOpt" data-lang="en">English</button>
              <button type="button" class="langOpt" data-lang="id">Indonesia</button>
            </div>
          </div>

          <button class="userMenuItem" id="btnLogout" type="button">
            <span class="miIcon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M3 21V3h9v2H5v14h7v2zm13-4l-1.375-1.45l2.55-2.55H9v-2h8.175l-2.55-2.55L16 7l5 5z"/>
              </svg>
            </span>
            <span class="miText">Logout</span>
          </button>

        </div>
      </div>

      <button id="btnRefresh" class="iconBtn" type="button" title="Refresh">
        <svg class="icoRefresh" viewBox="0 0 24 24" width="18" height="18">
          <path fill="currentColor" d="m21.897 13.404.008-.057c.024-.178.044-.357.058-.537.024-.302-.189-.811-.749-.811-.391 0-.715.3-.747.69-.645 4.36-4.24 7.811-8.469 7.811-3.037 0-5.704-1.597-7.206-3.995l1.991-.005a.75.75 0 000-1.5H2.75a.75.75 0 00-.75.75v4.049a.75.75 0 001.5 0l.003-2.525C5.268 20.11 8.414 22 11.998 22c5.042 0 9.217-3.741 9.899-8.596zM2.123 10.43C2.877 5.654 7.013 2 11.997 2c3.584 0 6.73 1.89 8.495 4.726l.003-2.525a.75.75 0 011.5 0V8.25a.75.75 0 01-.75.75h-4.033a.75.75 0 010-1.5l1.991-.005C17.701 5.097 15.034 3.5 11.997 3.5c-4.173 0-7.646 3.014-8.362 6.982-.049.271-.085.547-.107.827a.75.75 0 01-1.405-.879z"/>
        </svg>
      </button>

      <button id="btnRightDrawer"
              class="iconBtn rightDrawerBtn"
              type="button"
              title="Menu">
        <svg viewBox="64 64 896 896" width="18" height="18">
          <path fill="currentColor" d="M408 442h480c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H408c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8zm-8 204c0 4.4 3.6 8 8 8h480c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H408c-4.4 0-8 3.6-8 8v56zm504-486H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zm0 632H120c-4.4 0-8 3.6-8 8v56c0 4.4-3.6 8-8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8z"/>
        </svg>
      </button>

    </div>

    <div id="rightDrawerOverlay" class="drawerOverlay"></div>

    <aside id="rightDrawer" class="rightDrawer" aria-hidden="true">
      <div class="rightDrawerBody">

        <div class="btn-modal drawerThemeRow">
          <span id="themeLabelDrawer">Dark Mode</span>
          <label class="switch">
            <input id="themeToggleDrawer" type="checkbox">
            <span class="slider"></span>
          </label>
        </div>

        <div id="desktopModeSlotDrawer"></div>

        <div class="btn-modal" id="drawerWalletRow">
          <span class="walletIcon">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M5 19V5zm0 2q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v2.5h-2V5H5v14h14v-2.5h2V19q0 .825-.587 1.413T19 21z"/>
            </svg>
          </span>
          <span id="drawerWallet">0.00</span>
          <span></span>
        </div>

        <div class="btn-user" id="drawerUserRow">
          <span class="userIcon">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 12a4 4 0 1 0-4-4a4 4 0 0 0 4 4zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z"/>
            </svg>
          </span>
          <span id="drawerUsername">...</span>
          <span></span>
        </div>

        <button id="drawerChangePassBtn" class="userMenuItem" type="button">
          <span>🔒</span>
          <span class="miText">Change Password</span>
          <span></span>
        </button>

        <button id="drawerChange2ndPassBtn" class="userMenuItem" type="button">
          <span>🛡</span>
          <span class="miText">Change 2nd Password</span>
          <span></span>
        </button>

        <div class="langWrap" id="langWrapDrawer">
          <button class="userMenuItem" id="btnLangDrawer" type="button">
            <span>文</span>
            <span class="miText">Language</span>
            <span id="langTextDrawer">EN</span>
          </button>

          <div class="langMenu" id="langMenuDrawer">
            <button type="button" class="langOpt" data-lang="en">English</button>
            <button type="button" class="langOpt" data-lang="id">Indonesia</button>
          </div>
        </div>

        <button id="drawerLogoutBtn" class="userMenuItem" type="button">
          <span class="miIcon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M3 21V3h9v2H5v14h7v2zm13-4l-1.375-1.45l2.55-2.55H9v-2h8.175l-2.55-2.55L16 7l5 5z"/>
            </svg>
          </span>
          <span class="miText">Logout</span>
          <span></span>
        </button>

      </div>
    </aside>
  `;

  target.dataset.sharedHeaderReady = "1";

  initSharedHeaderFunctions();
}


/* ==========================================================
   SHARED HEADER FUNCTIONS
   ========================================================== */

function initSharedHeaderFunctions() {

  const $ = id => document.getElementById(id);

  /* CLOCK */
  function updateClock() {
    const el = $("indoClock");
    if (!el) return;

    const now = new Date();

    const time = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kuala_Lumpur",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(now);

    const date = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kuala_Lumpur",
      day: "2-digit",
      month: "short"
    }).format(now);

    el.innerHTML =
      `<span class="clockCity">Kuala Lumpur:</span>` +
      `<span class="clockTime">${time}</span>` +
      `<span class="clockDate">${date}</span>`;
  }

  updateClock();
  setInterval(updateClock, 1000);


  /* USER DROPDOWN */
  const userDrop = $("userDrop");
  const btnUser = $("btnUser");
  const userMenu = $("userMenu");

  function closeUserMenu() {
    userDrop?.classList.remove("open");
    btnUser?.setAttribute("aria-expanded", "false");
  }

  btnUser?.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();

    const open = !userDrop.classList.contains("open");

    userDrop.classList.toggle("open", open);
    btnUser.setAttribute("aria-expanded", String(open));
  });

  document.addEventListener("click", e => {
    if (userDrop && !userDrop.contains(e.target)) {
      closeUserMenu();
    }
  });


  /* THEME */
  const THEME_KEY = "farm_theme";

  function applyTheme(theme) {
    const light = theme === "light";

    document.documentElement.classList.toggle(
      "theme-light",
      light
    );

    const desktop = $("themeToggleDesktop");
    const drawer = $("themeToggleDrawer");

    if (desktop) desktop.checked = !light;
    if (drawer) drawer.checked = !light;

    const text = light ? "Light Mode" : "Dark Mode";

    if ($("themeLabelDesktop"))
      $("themeLabelDesktop").textContent = text;

    if ($("themeLabelDrawer"))
      $("themeLabelDrawer").textContent = text;
  }

  const savedTheme =
    localStorage.getItem(THEME_KEY) || "dark";

  applyTheme(savedTheme);

  [$("themeToggleDesktop"), $("themeToggleDrawer")]
    .filter(Boolean)
    .forEach(toggle => {
      toggle.addEventListener("change", e => {
        const theme = e.target.checked ? "dark" : "light";
        localStorage.setItem(THEME_KEY, theme);
        applyTheme(theme);
      });
    });


  /* DESKTOP MODE */
  const DESKTOP_KEY = "farmDesktopMode.v1";

  function applyDesktopMode(on) {
    document.documentElement.classList.toggle(
      "forceDesktop",
      on
    );

    const viewport =
      document.querySelector('meta[name="viewport"]');

    viewport?.setAttribute(
      "content",
      on
        ? "width=1200, initial-scale=1, viewport-fit=cover"
        : "width=device-width, initial-scale=1, viewport-fit=cover"
    );
  }

  function createDesktopButton() {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "desktopModeBtn";

    const on =
      localStorage.getItem(DESKTOP_KEY) === "1";

    button.innerHTML = `
      <span class="miIcon">▣</span>
      <span class="miText">Mode Desktop</span>
      <span class="dmState">${on ? "ON" : "OFF"}</span>
    `;

    button.addEventListener("click", () => {
      const next =
        localStorage.getItem(DESKTOP_KEY) !== "1";

      localStorage.setItem(
        DESKTOP_KEY,
        next ? "1" : "0"
      );

      location.reload();
    });

    return button;
  }

  const desktopModeOn =
    localStorage.getItem(DESKTOP_KEY) === "1";

  applyDesktopMode(desktopModeOn);

  function placeDesktopButton() {
    const desktop = $("desktopModeSlotDesktop");
    const drawer = $("desktopModeSlotDrawer");

    if (!desktop || !drawer) return;

    desktop.replaceChildren();
    drawer.replaceChildren();

    if (
      window.matchMedia("(max-width:900px)").matches &&
      !desktopModeOn
    ) {
      drawer.appendChild(createDesktopButton());
    } else {
      desktop.appendChild(createDesktopButton());
    }
  }

  placeDesktopButton();


  /* LANGUAGE */
  const LANG_KEY = "farm_lang";

  function applyLanguage(lang) {
    localStorage.setItem(LANG_KEY, lang);

    if ($("langTextDesktop"))
      $("langTextDesktop").textContent =
        lang.toUpperCase();

    if ($("langTextDrawer"))
      $("langTextDrawer").textContent =
        lang.toUpperCase();

    document.documentElement.lang =
      lang === "id" ? "id" : "en";
  }

  function bindLanguage(buttonId, menuId) {
    const button = $(buttonId);
    const menu = $(menuId);

    if (!button || !menu) return;

    button.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();

      menu.classList.toggle("open");
    });

    menu.querySelectorAll("[data-lang]")
      .forEach(option => {
        option.addEventListener("click", e => {
          e.stopPropagation();

          applyLanguage(option.dataset.lang || "en");
          menu.classList.remove("open");
        });
      });
  }

  applyLanguage(
    localStorage.getItem(LANG_KEY) || "en"
  );

  bindLanguage("btnLangDesktop", "langMenuDesktop");
  bindLanguage("btnLangDrawer", "langMenuDrawer");


  /* DRAWER */
  const drawer = $("rightDrawer");
  const overlay = $("rightDrawerOverlay");
  const drawerButton = $("btnRightDrawer");

  let scrollY = 0;

  function syncDrawer() {
    if ($("drawerWallet") && $("balanceText"))
      $("drawerWallet").textContent =
        $("balanceText").textContent;

    if ($("drawerUsername") && $("usernameText"))
      $("drawerUsername").textContent =
        $("usernameText").textContent;
  }

  function openDrawer() {
    syncDrawer();

    scrollY = window.scrollY || 0;

    drawer?.classList.add("open");
    overlay?.classList.add("open");

    drawer?.setAttribute("aria-hidden", "false");

    document.documentElement.classList.add("drawerOpen");
    document.body.classList.add("drawerOpen");
  }

  function closeDrawer() {
    drawer?.classList.remove("open");
    overlay?.classList.remove("open");

    drawer?.setAttribute("aria-hidden", "true");

    document.documentElement.classList.remove("drawerOpen");
    document.body.classList.remove("drawerOpen");

    window.scrollTo(0, scrollY);
  }

  drawerButton?.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();

    drawer?.classList.contains("open")
      ? closeDrawer()
      : openDrawer();
  });

  overlay?.addEventListener("click", closeDrawer);

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      closeDrawer();
      closeUserMenu();
    }
  });


  /* REFRESH */
  $("btnRefresh")?.addEventListener("click", () => {
    location.reload();
  });


  /* WALLET */
  function openWallet() {
    closeDrawer();

    window.dispatchEvent(
      new CustomEvent("admin-open-wallet")
    );

    /* Dashboard lama masih boleh guna modal sendiri */
    const modal = $("mBalance");

    if (modal) {
      modal.style.display = "flex";
    }
  }

  $("btnBalance")?.addEventListener("click", openWallet);
  $("drawerWalletRow")?.addEventListener("click", openWallet);


  /* PASSWORD ACTIONS */
  function passwordAction(type) {
    closeUserMenu();
    closeDrawer();

    window.dispatchEvent(
      new CustomEvent(type)
    );
  }

  $("btnChangePass")?.addEventListener(
    "click",
    () => passwordAction("admin-change-password")
  );

  $("drawerChangePassBtn")?.addEventListener(
    "click",
    () => passwordAction("admin-change-password")
  );

  $("btnChange2ndPass")?.addEventListener(
    "click",
    () => passwordAction("admin-change-second-password")
  );

  $("drawerChange2ndPassBtn")?.addEventListener(
    "click",
    () => passwordAction("admin-change-second-password")
  );


  /* LOGOUT */
  async function logout() {
    closeUserMenu();
    closeDrawer();

    if (
      window.AdminCore &&
      typeof window.AdminCore.logout === "function"
    ) {
      await window.AdminCore.logout();
      return;
    }

    window.dispatchEvent(
      new CustomEvent("admin-logout")
    );
  }

  $("btnLogout")?.addEventListener("click", logout);
  $("drawerLogoutBtn")?.addEventListener("click", logout);


  /* CLICK FX */
  document.querySelectorAll("[data-clickfx]")
    .forEach(element => {
      element.addEventListener("click", () => {
        element.classList.remove("clicked");
        void element.offsetWidth;
        element.classList.add("clicked");

        setTimeout(
          () => element.classList.remove("clicked"),
          600
        );
      });
    });


  /* PUBLIC */
  window.openSharedAdminDrawer = openDrawer;
  window.closeSharedAdminDrawer = closeDrawer;
  window.setSharedAdminWallet = value => {
    if ($("balanceText"))
      $("balanceText").textContent = String(value ?? "0.00");

    syncDrawer();
  };

  window.setSharedAdminUsername = value => {
    if ($("usernameText"))
      $("usernameText").textContent = String(value ?? "");

    syncDrawer();
  };
}
/* ==========================================================
   INIT SHARED ADMIN HEADERS
   ========================================================== */

function initSharedAdminHeaders() {

  document
    .querySelectorAll(
      "[data-admin-header]"
    )
    .forEach(target => {

      createSharedAdminHeader(target);

    });

}
  /* ==========================================================
     INIT
     ========================================================== */

async function initAdminNewUI() {
  initSharedAdminHeaders();
   
  document
    .querySelectorAll(
      "[data-admin-site-selector]"
    )
    .forEach(target => {

      createAdminSiteSelector(
        target
      );

    });


  /*
   * Cuba load terus.
   */
  await loadAdminSites();

  let retryCount = 0;

  const retryTimer =
    setInterval(
      async () => {

        retryCount += 1;

        if (
          typeof window.getAdminSites ===
          "function"
        ) {

          await loadAdminSites();

          clearInterval(
            retryTimer
          );

          return;
        }

        /*
         * Stop selepas ±10 saat.
         */
        if (retryCount >= 20) {

          clearInterval(
            retryTimer
          );

          console.warn(
            "[new-ui] getAdminSites was not available after retry."
          );
        }

      },
      500
    );
}

  window.createAdminSiteSelector =
    createAdminSiteSelector;

  window.loadAdminSites =
    loadAdminSites;
window.createSharedAdminHeader =
  createSharedAdminHeader;

window.initSharedAdminHeaders =
  initSharedAdminHeaders;
  window.initAdminNewUI =
    initAdminNewUI;

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initAdminNewUI
    );
  }
  else {
    initAdminNewUI();
  }

})();
