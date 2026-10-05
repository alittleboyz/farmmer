/* ==========================================================
   FARMMER ADMIN - SHARED ACCESS
   File: dashboard/admin/admin-access.js
   ========================================================== */

(() => {
  "use strict";

  const state = {
    uid: "",
    username: "",
    isAdmin: false,
    role: "client",
    siteIds: [],
    permissions: {}
  };


  /* ==========================================================
     NORMALIZE
     ========================================================== */

  function normalizeIds(values) {
    if (!Array.isArray(values)) {
      return [];
    }

    return [
      ...new Set(
        values
          .map(value => String(value || "").trim())
          .filter(Boolean)
      )
    ];
  }


  /* ==========================================================
     SET CURRENT ACCESS
     ========================================================== */

  function setAdminAccess(data = {}) {

    state.uid =
      String(data.uid || "");

    state.username =
      String(data.username || "");

    state.isAdmin =
      data.isAdmin === true;

    state.role =
      String(
        data.role ||
        (state.isAdmin ? "admin" : "client")
      );

    state.siteIds =
      normalizeIds(data.siteIds);

    state.permissions =
      data.permissions &&
      typeof data.permissions === "object"
        ? { ...data.permissions }
        : {};


    window.dispatchEvent(
      new CustomEvent(
        "admin-access-ready",
        {
          detail: getAdminAccess()
        }
      )
    );
  }


  /* ==========================================================
     GET CURRENT ACCESS
     ========================================================== */

  function getAdminAccess() {
    return {
      uid: state.uid,
      username: state.username,
      isAdmin: state.isAdmin,
      role: state.role,
      siteIds: [...state.siteIds],
      permissions: {
        ...state.permissions
      }
    };
  }


  /* ==========================================================
     SITE ACCESS
     ========================================================== */

  function canAccessSite(siteId) {

    const id =
      String(siteId || "").trim();

    if (!id) {
      return false;
    }

    if (state.isAdmin) {
      return true;
    }

    return state.siteIds.includes(id);
  }


  /* ==========================================================
     PERMISSION
     ========================================================== */

  function hasAdminPermission(permission) {

    const key =
      String(permission || "").trim();

    if (!key) {
      return false;
    }

    if (state.isAdmin) {
      return true;
    }

    return state.permissions[key] === true;
  }


  /* ==========================================================
     PUBLIC API
     ========================================================== */

  window.setAdminAccess =
    setAdminAccess;

  window.getAdminAccess =
    getAdminAccess;

  window.canAccessSite =
    canAccessSite;

  window.hasAdminPermission =
    hasAdminPermission;

})();
