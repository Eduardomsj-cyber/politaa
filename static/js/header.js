document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("menuBtn");
  const nav = document.getElementById("mainnav");
  if (btn && nav) {
    btn.addEventListener("click", () => {
      btn.classList.toggle("open");
      nav.classList.toggle("open");
    });
  }
  // marca el link activo
  const here = location.pathname.replace(/\/+$/,'');
  document.querySelectorAll(".mainnav .navlink").forEach(a=>{
    const href = a.getAttribute("href") || "";
    if (href && here === href.replace(/\/+$/,'')) a.classList.add("active");
  });
});
