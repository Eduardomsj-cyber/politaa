const $  = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

let current    = { id:null };
let productos  = [];
let categorias = [];
let selected   = null;
let clientes   = [];

/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */
const money = n => Number(n || 0).toFixed(2);

async function fetchJSON(url, opts){
  const r = await fetch(url, opts);
  let j;
  try { j = await r.json(); }
  catch { throw new Error(await r.text()); }
  if(!r.ok || j.ok === false) throw new Error(j.msg || `HTTP ${r.status}`);
  return j;
}

/* ---------------------------------------------------------
   Categorías (mejoradas)
--------------------------------------------------------- */
function buildCategorias(items){
  const set = new Set(["Todos"]);

  items.forEach(p=>{
    const n = (p.nombre||"").toLowerCase();

    if(n.includes("whopper") || n.includes("combo") || n.includes("burger"))
      set.add("Hamburguesas");

    if(n.includes("hot"))
      set.add("Hot dogs");

    if(n.includes("burr"))
      set.add("Burritos");

    if(n.includes("taco"))
      set.add("Tacos");

    if(n.includes("torta"))
      set.add("Tortas");

    if(n.includes("refres") || n.includes("bebida") || n.includes("jugo") || n.includes("soda"))
      set.add("Bebidas");

    if(n.includes("postre") || n.includes("helado"))
      set.add("Postres");
  });

  return Array.from(set);
}

/* ---------------------------------------------------------
   UI – Categorías laterales
--------------------------------------------------------- */
function renderCategorias(){
  const cont = $("#catList");
  cont.innerHTML = "";

  categorias.forEach((c,i)=>{
    const btn = document.createElement("button");
    btn.className = "cat-btn" + (i===0 ? " active":"");
    btn.innerHTML = `<span class="cat-ico">🍔</span> ${c}`;
    btn.addEventListener("click", ()=>{
      $$("#catList .cat-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      filterAndPaint();
    });
    cont.appendChild(btn);
  });
}

/* ---------------------------------------------------------
   RENDER GRID (tarjetas estilo BK)
--------------------------------------------------------- */
function renderGrid(list){
  const grid = $("#grid");
  const msg  = $("#gridMsg");
  grid.innerHTML = "";
  msg.textContent = list.length ? "" : "Sin resultados.";

  list.forEach((p, idx)=>{

    const el = document.createElement("div");
    el.className = "card-item";
    el.setAttribute("data-combo", `Combo ${idx+1}`);

    let imagenHTML = "Imagen";
    if(p.imagen){
      imagenHTML = `<img src="${p.imagen}" alt="${p.nombre}">`;
    }

    el.innerHTML = `
      <div class="card-img">${imagenHTML}</div>

      <div class="card-title">${p.nombre}</div>

      <div class="meta">
        <span class="pill">Stock ${p.stock}</span>
      </div>

      <div class="card-line">
        <div class="price">$${money(p.precio)}</div>
        <button class="add-btn" data-id="${p.id}" ${p.stock<=0?'disabled':''}>
          ${p.stock<=0 ? "Agotado" : "Agregar"}
        </button>
      </div>
    `;

    grid.appendChild(el);
  });
}

/* ---------------------------------------------------------
   Filtrado
--------------------------------------------------------- */
function activeCat(){
  const a = $("#catList .cat-btn.active");
  return a ? a.textContent.replace("🍔","").trim() : "Todos";
}

function filterAndPaint(){
  const q = ($("#buscar").value||"").toLowerCase().trim();
  const cat = activeCat();

  let list = productos.filter(p => {
    const n = (p.nombre||"").toLowerCase();
    return n.includes(q);
  });

  if(cat !== "Todos"){
    list = list.filter(p=>{
      const n = p.nombre.toLowerCase();
      if(cat === "Hamburguesas") return n.includes("burg") || n.includes("whop") || n.includes("combo");
      if(cat === "Hot dogs")     return n.includes("hot");
      if(cat === "Burritos")     return n.includes("burr");
      if(cat === "Tacos")        return n.includes("taco");
      if(cat === "Tortas")       return n.includes("torta");
      if(cat === "Bebidas")      return n.includes("refres") || n.includes("bebid") || n.includes("jugo");
      if(cat === "Postres")      return n.includes("postre") || n.includes("helad");
      return true;
    });
  }

  renderGrid(list);
}

/* ---------------------------------------------------------
   Pedido: resumen
--------------------------------------------------------- */
async function getPedido(){
  if(!current.id) return null;
  return await fetchJSON(`/api/pedidos/${current.id}`);
}
async function getSummary(){
  const j = await getPedido();
  if(!j) return null;

  return {
    id: j.pedido.id,
    cliente: j.pedido.cliente || null,
    lineas: (j.lineas||[]).length,
    total: j.pedido.total || 0
  };
}
function setPedidoPill(sum){
  const pill = $("#pedidoPill");
  if(!current.id){
    pill.style.display="none";
    return;
  }
  pill.style.display="inline-flex";

  if(sum){
    pill.textContent =
      `#${sum.id} · ${sum.lineas} línea(s) · $${money(sum.total)}` +
      (sum.cliente? ` · ${sum.cliente}` : "");
  } else {
    pill.textContent = `Pedido #${current.id}`;
  }
}

/* ---------------------------------------------------------
   Modal cantidad
--------------------------------------------------------- */
function openModal(prod){
  selected = prod;
  $("#modalTitle").textContent = "Agregar";
  $("#modalSubtitle").textContent = prod.nombre;
  $("#qtyInput").value = 1;
  $("#qtyModal").classList.remove("hidden");
  $("#qtyModal").setAttribute("aria-hidden","false");
  $("#qtyInput").focus();
}
function closeModal(){
  $("#qtyModal").classList.add("hidden");
  $("#qtyModal").setAttribute("aria-hidden","true");
  selected = null;
}

/* ---------------------------------------------------------
   Drawer
--------------------------------------------------------- */
async function openDrawer(last){
  const sum = await getSummary();
  $("#drawerProd").textContent     = last.nombre;
  $("#drawerQty").textContent      = `Cantidad: ${last.cantidad}`;
  $("#drawerSubtotal").textContent = `$${money(last.cantidad * last.precio)}`;
  $("#drawerPedido").textContent   = `#${current.id}`;
  $("#drawerClienteTxt").textContent = sum?.cliente || "N/A";
  $("#drawerLines").textContent    = sum?.lineas || 0;
  $("#drawerTotal").textContent    = `$${money(sum?.total || 0)}`;
  setPedidoPill(sum);

  const el = $("#afterAdd");
  el.classList.remove("hidden");
  el.setAttribute("aria-hidden","false");
}
function closeDrawer(){
  const el = $("#afterAdd");
  el.classList.add("hidden");
  el.setAttribute("aria-hidden","true");
}

/* ---------------------------------------------------------
   Crear pedido si no existe
--------------------------------------------------------- */
async function ensureOrder(){
  if(current.id) return current.id;
  const r = await fetchJSON("/api/pedidos", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ cliente_id:null })
  });
  current.id = r.pedido_id;
  return current.id;
}

/* ---------------------------------------------------------
   Clientes
--------------------------------------------------------- */
async function loadClientes(q=""){
  const j = await fetchJSON("/api/clientes"+(q?`?q=${encodeURIComponent(q)}`:""));
  clientes = j.items||[];

  const cont = $("#cliList");
  cont.innerHTML = "";

  clientes.forEach(c=>{
    const row = document.createElement("div");
    row.style.cssText =
      "display:flex;justify-content:space-between;align-items:center;padding:6px 8px;border:1px solid var(--border);border-radius:10px;margin-bottom:6px;background:#fff";

    row.innerHTML = `
      <div>
        <strong>${c.nombre}</strong>
        <div class="hint">${c.telefono||""} ${c.email?"· "+c.email:""}</div>
      </div>
      <button data-assign="${c.id}">Asignar</button>
    `;
    cont.appendChild(row);
  });

  if(!clientes.length){
    const p = document.createElement("p");
    p.className="hint";
    p.textContent="Sin resultados.";
    cont.appendChild(p);
  }
}

function openCliModal(){
  $("#cliModal").classList.remove("hidden");
  $("#cliModal").setAttribute("aria-hidden","false");
  $("#cliSearch").value = "";
  loadClientes();
}
function closeCliModal(){
  $("#cliModal").classList.add("hidden");
  $("#cliModal").setAttribute("aria-hidden","true");
}

async function setCliente(cliente_id){
  await ensureOrder();
  await fetchJSON(`/api/pedidos/${current.id}`, {
    method:"PUT",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ cliente_id })
  });
  const sum = await getSummary();
  setPedidoPill(sum);
  $("#drawerClienteTxt").textContent = sum?.cliente || "N/A";
}

/* ---------------------------------------------------------
   BOOT
--------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", async ()=>{

  /* cargar productos */
  try{
    const pj = await fetchJSON("/api/productos");
    productos = (pj.items||[]).filter(p=>p.activo);
    categorias = buildCategorias(productos);
  }catch(e){
    alert("Error al cargar productos: "+e.message);
    return;
  }

  /* sidebar + grid */
  renderCategorias();
  filterAndPaint();

  /* búsqueda */
  $("#buscar").addEventListener("input", filterAndPaint);

  /* click en agregar */
  $("#grid").addEventListener("click", (e)=>{
    const b = e.target.closest("button.add-btn");
    if(!b) return;

    const prod = productos.find(x => String(x.id) === String(b.dataset.id));
    if(!prod){ alert("Producto no encontrado"); return; }

    if(prod.stock <= 0){
      alert("Producto sin stock");
      return;
    }

    openModal(prod);
  });

  /* modal cantidad */
  $$(".quick-qty button").forEach(btn=>{
    btn.addEventListener("click", ()=> $("#qtyInput").value = btn.dataset.q);
  });

  $("#qtyCancel").addEventListener("click", closeModal);
  $("#qtyBackdrop").addEventListener("click", closeModal);

  $("#qtyConfirm").addEventListener("click", async ()=>{
    const cantidad = Math.max(1, Number($("#qtyInput").value || 1));

    try{
      await ensureOrder();
      await fetchJSON(`/api/pedidos/${current.id}/lineas`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ producto_id:selected.id, cantidad })
      });

      const last = {
        nombre: selected.nombre,
        precio: selected.precio,
        cantidad
      };

      closeModal();
      await openDrawer(last);

    }catch(err){
      alert(err.message || "No se pudo agregar");
    }
  });

  /* drawer */
  $("#drawerClose").addEventListener("click", closeDrawer);
  $("#keepShopping").addEventListener("click", closeDrawer);
  $("#drawerClienteBtn").addEventListener("click", ()=>{ 
    closeDrawer();
    openCliModal();
  });

  /* abrir modal cliente */
  $("#btnCliente").addEventListener("click", async ()=>{
    await ensureOrder();
    openCliModal();
  });

  /* cliente modal */
  $("#cliBackdrop").addEventListener("click", closeCliModal);
  $("#cliClose").addEventListener("click", closeCliModal);

  $("#cliSearch").addEventListener("input", e=>{
    loadClientes(e.target.value.trim());
  });

  $("#cliList").addEventListener("click", async (e)=>{
    const b = e.target.closest("button[data-assign]");
    if(!b) return;

    try{
      await setCliente(b.dataset.assign);
      closeCliModal();
    }catch(err){
      alert(err.message || "No se pudo asignar cliente");
    }
  });

  $("#cliCrear").addEventListener("click", async ()=>{
    const nombre   = $("#cliNombre").value.trim();
    const telefono = $("#cliTel").value.trim();
    const email    = $("#cliEmail").value.trim();

    if(!nombre){
      alert("Nombre requerido");
      return;
    }

    try{
      await ensureOrder();
      const j = await fetchJSON("/api/clientes", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ nombre, telefono, email })
      });

      await setCliente(j.id);
      closeCliModal();

    }catch(err){
      alert(err.message || "No se pudo crear cliente");
    }
  });

  /* ESC • cerrar modal/drawer */
  document.addEventListener("keydown", e=>{
    if(e.key === "Escape"){
      if(!$("#qtyModal").classList.contains("hidden")) closeModal();
      else if(!$("#cliModal").classList.contains("hidden")) closeCliModal();
      else if(!$("#afterAdd").classList.contains("hidden")) closeDrawer();
    }
  });

});

/* ---------------------------------------------------------
   RENDER GRID (tarjetas estilo BK)
--------------------------------------------------------- */
function renderGrid(list){
  const grid = $("#grid");
  const msg  = $("#gridMsg");
  grid.innerHTML = "";
  msg.textContent = list.length ? "" : "Sin resultados.";

  list.forEach((p, idx)=>{
    const el = document.createElement("div");
    el.className = "card-item";
    el.setAttribute("data-combo", `Combo ${idx+1}`);

    let imagenHTML = "Imagen";  // Valor por defecto
    if(p.imagen_url){  // Verifica que la URL de la imagen esté presente
      imagenHTML = `<img src="${p.imagen_url}" alt="${p.nombre}">`;
    }

    el.innerHTML = `
      <div class="card-img">${imagenHTML}</div>

      <div class="card-title">${p.nombre}</div>

      <div class="meta">
        <span class="pill">Stock ${p.stock}</span>
      </div>

      <div class="card-line">
        <div class="price">$${money(p.precio)}</div>
        <button class="add-btn" data-id="${p.id}" ${p.stock <= 0 ? 'disabled' : ''}>
          ${p.stock <= 0 ? "Agotado" : "Agregar"}
        </button>
      </div>
    `;

    grid.appendChild(el);
  });
}
