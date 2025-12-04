const $ = s=>document.querySelector(s);

async function fetchJSON(url){
  const r = await fetch(url);
  let j; try{ j = await r.json(); }catch{ throw new Error(await r.text()); }
  if(!r.ok || j.ok===false) throw new Error(j.msg||`HTTP ${r.status}`);
  return j;
}

function qs(){
  const d = $("#desde").value, h = $("#hasta").value;
  const params = new URLSearchParams();
  if(d) params.set("desde", d);
  if(h) params.set("hasta", h);
  return params.toString();
}

async function verPedidos(){
  $("#msg").textContent = "";
  const estado = $("#filtroEstado").value;
  const q = qs();
  const url = `/api/historial/pedidos?${q}${q?'&':''}${estado?`estado=${estado}`:''}`;
  const j = await fetchJSON(url);
  const thead = $("#tabla thead"), tbody = $("#tabla tbody");
  thead.innerHTML = `<tr>
    <th>ID</th><th>Fecha</th><th>Cliente</th><th>Estado</th><th>Total</th>
  </tr>`;
  tbody.innerHTML = "";
  (j.items||[]).forEach(p=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.fecha}</td>
      <td>${p.cliente||"—"}</td>
      <td>${p.estado}</td>
      <td>$${Number(p.total).toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function verPagos(){
  $("#msg").textContent = "";
  const q = qs();
  const url = `/api/historial/pagos?${q}`;
  const j = await fetchJSON(url);
  const thead = $("#tabla thead"), tbody = $("#tabla tbody");
  thead.innerHTML = `<tr>
    <th>ID</th><th>Fecha</th><th>Pedido</th><th>Cliente</th><th>Método</th><th>Monto</th>
  </tr>`;
  tbody.innerHTML = "";
  (j.items||[]).forEach(pg=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${pg.id}</td>
      <td>${pg.fecha}</td>
      <td>#${pg.pedido_id}</td>
      <td>${pg.cliente||"—"}</td>
      <td>${pg.metodo}</td>
      <td>$${Number(pg.monto).toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.addEventListener("DOMContentLoaded", ()=>{
  $("#btnPedidos").addEventListener("click", verPedidos);
  $("#btnPagos").addEventListener("click", verPagos);
});
