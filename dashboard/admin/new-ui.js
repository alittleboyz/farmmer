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

      siteOptions =
        Array.isArray(options)
          ? options.map(option => ({
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

      const allowed =
        new Set(
          siteOptions.map(
            option => option.value
          )
        );

      currentSites =
        currentSites.filter(
          value =>
            allowed.has(value)
        );

      saveSites(currentSites);

      renderValue();
      renderOptions();
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

    /*
     * Kalau project Farmmer sudah menyediakan
     * window.getAdminSites(), kita gunakan data itu.
     */
    if (
      typeof window.getAdminSites ===
      "function"
    ) {

      try {

        const sites =
          await window.getAdminSites(false);

        options =
          Array.isArray(sites)
            ? sites.map(site => ({
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
            : [];
      }
      catch (error) {

        console.error(
          "[new-ui] Failed loading sites:",
          error
        );
      }
    }

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
  }

  /* ==========================================================
     INIT
     ========================================================== */

  function initAdminNewUI() {

    document
      .querySelectorAll(
        "[data-admin-site-selector]"
      )
      .forEach(target => {
        createAdminSiteSelector(
          target
        );
      });

    loadAdminSites();
  }

  window.createAdminSiteSelector =
    createAdminSiteSelector;

  window.loadAdminSites =
    loadAdminSites;

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
