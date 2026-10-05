/* FARM ADMIN V2 - shared physical-page helpers only */
export const FARM_PAGES = Object.freeze({
  vault: "./vault.html",
  transaction: "./transaction.html",
  history: "./history.html",
  notice: "./notice.html",
  login: "./login.html"
});
export function go(page){
  const url = FARM_PAGES[page];
  if(url) location.href = url;
}
export function currentPage(){
  const f=(location.pathname.split("/").pop()||"vault.html").toLowerCase();
  if(f==="transaction.html") return "transaction";
  if(f==="history.html") return "history";
  if(f==="notice.html") return "notice";
  if(f==="login.html") return "login";
  return "vault";
}
