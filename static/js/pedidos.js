/* ================== Helpers ================== */
const $  = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const state = {
  currentId: null,
  cacheClientes: [],
  cacheProductos: []
};

async function fetchJSON(url, opts) {
  const r = await fetch(url, opts);
  let j;
  try { j = await r.json(); }
  catch { throw new Error(await r.text()); }
  if (!r.ok || j.ok === false) throw new Error(j.msg || `HTTP ${r.status}`);
  return j;
}

function money(n) { return `$${Number(n || 0).toFixed(2)}`; }
function toast(txt, el = null) {
  const p = el || $("#msg") || $("#topMsg");
  if (p) { p.textContent = txt; setTimeout(()=>{ if(p.textContent===txt) p.textContent=""; }, 3000); }
}

/* ================== MODAL ================== */
function abrirModal() {
  $("#modalEditor").classList.add("active");
}

function cerrarModal() {
  $("#modalEditor").classList.remove("active");
  $("#editorModalBody").innerHTML = "";
  state.currentId = null;
}

document.addEventListener("click", e => {
  if (e.target.id === "btnCerrarModal") cerrarModal();
});

/* ================== Clientes ================== */
async function cargarClientes() {
  const sel = $("#clienteSel");
  sel.innerHTML = `<option value="">-- cliente opcional --</option>`;
  try {
    const j = await fetchJSON("/api/clientes");
    state.cacheClientes = j.items || [];
    state.cacheClientes.forEach(c => {
      const o = document.createElement("option");
      o.value = c.id;
      o.textContent = c.nombre;
      sel.appendChild(o);
    });
  } catch (e) {
    $("#topMsg").textContent = "No se pudo cargar clientes: " + e.message;
  }
}

/* ================== Productos ================== */
async function cargarProductos() {
  const sel = $("#editorModalBody #prodSel") || $("#prodSel");
  if (!sel) return;
  sel.innerHTML = "";
  try {
    const j = await fetchJSON("/api/productos");
    state.cacheProductos = (j.items || []).filter(p => p.activo);
    state.cacheProductos.forEach(p => {
      const o = document.createElement("option");
      o.value = p.id;
      o.textContent = `${p.nombre} (${money(p.precio)})`;
      o.dataset.precio = p.precio;
      sel.appendChild(o);
    });
  } catch (e) {
    toast("No se pudo cargar productos: " + e.message, $("#topMsg"));
  }
}

/* ================== Lista de pedidos ================== */
async function cargarPedidosLista() {
  const tbody = $("#tablaPedidos tbody");
  tbody.innerHTML = "";
  $("#topMsg").textContent = "";

  const estado = $("#fEstado").value || "";
  let items = [];

  try {
    const url = estado ? `/api/pedidos?estado=${encodeURIComponent(estado)}` : "/api/pedidos";
    const j = await fetchJSON(url);
    items = j.items || [];
  } catch (e) {
    $("#topMsg").textContent = "No se pudo listar pedidos: " + e.message;
    return;
  }

  const clienteSel = $("#clienteSel").value;
  if (clienteSel) {
    const nombreCliente = (state.cacheClientes.find(c => String(c.id) === String(clienteSel)) || {}).nombre;
    items = items.filter(p => (p.cliente || "") === (nombreCliente || ""));
  }

  if (!items.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="6" style="opacity:.7">Sin pedidos.</td>`;
    tbody.appendChild(tr);
    return;
  }

  items.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.cliente || "—"}</td>
      <td>${p.estado}</td>
      <td>${money(p.total)}</td>
      <td>${p.fecha || ""}</td>
      <td><button class="secondary" data-abrir="${p.id}">Abrir</button></td>
    `;
    tbody.appendChild(tr);
  });
}

/* ================== Render líneas ================== */
function renderLineas(list) {
  const tb = $("#editorModalBody #tablaLineas tbody");
  tb.innerHTML = "";
  list.forEach(l => {
    const tr = document.createElement("tr");
    tr.innerHTML = ` 
      <td>${l.nombre}</td>
      <td>${money(l.precio)}</td>
      <td><input type="number" min="1" value="${l.cantidad}" data-linea="${l.id}" style="width:88px;text-align:center"></td>
      <td>${money(l.subtotal)}</td>
      <td>
        <button class="secondary" data-guardar="${l.id}">Guardar</button>
        <button class="danger" data-borrar="${l.id}">Quitar</button>
      </td>
    `;
    tb.appendChild(tr);
  });
}

/* ================== Cargar pedido ================== */
async function cargarPedido(id) {
  try {
    const j = await fetchJSON(`/api/pedidos/${id}`);
    const ped = j.pedido;

    $("#pedidoInfoModal").textContent =
      `Pedido #${ped.id} — Cliente: ${ped.cliente || "N/A"} — Estado: ${ped.estado}`;

    $("#editorModalBody").innerHTML = $("#editor").innerHTML;

    renderLineas(j.lineas || []);
    $("#editorModalBody #total").textContent =
      Number(ped.total || 0).toFixed(2);

    await cargarProductos();

    abrirModal();
  } catch (e) {
    toast("No se pudo cargar el pedido: " + e.message, $("#topMsg"));
  }
}

/* ================== Eventos ================== */
document.addEventListener("DOMContentLoaded", async () => {
  await cargarClientes();
  await cargarPedidosLista();

  /* === Nuevo pedido === */
  $("#btnNuevo").addEventListener("click", async () => {
    try {
      const cliente_id = $("#clienteSel").value || null;
      const j = await fetchJSON("/api/pedidos", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ cliente_id })
      });
      state.currentId = j.pedido_id;
      await cargarPedido(state.currentId);
      await cargarPedidosLista();
    } catch (e) {
      $("#topMsg").textContent = "No se pudo crear el pedido: " + e.message;
    }
  });

  /* === Abrir pedido === */
  $("#tablaPedidos").addEventListener("click", async (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const id = b.dataset.abrir;
    if (!id) return;
    state.currentId = id;
    await cargarPedido(id);
  });

  /* === Filtros === */
  $("#clienteSel").addEventListener("change", cargarPedidosLista);
  $("#fEstado").addEventListener("change", cargarPedidosLista);
  $("#btnRefrescarPedidos").addEventListener("click", cargarPedidosLista);

  /* === Agregar línea === */
  document.addEventListener("click", async e => {
    if (!e.target.matches("#editorModalBody #btnAgregar")) return;

    const msg = $("#editorModalBody #msg");
    msg.textContent = "";

    try {
      const producto_id = $("#editorModalBody #prodSel").value;
      const cantidad = Math.max(1, Number($("#editorModalBody #cantInp").value || 1));

      await fetchJSON(`/api/pedidos/${state.currentId}/lineas`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ producto_id, cantidad })
      });

      await cargarPedido(state.currentId);

    } catch (e) {
      msg.textContent = e.message;
    }
  });

  /* === Guardar / Borrar línea === */
  document.addEventListener("click", async e => {
    const b = e.target.closest("button");
    if (!b) return;

    const linea_id = b.dataset.guardar || b.dataset.borrar;
    if (!linea_id) return;

    const msg = $("#editorModalBody #msg");

    try {
      if (b.hasAttribute("data-guardar")) {
        const input = document.querySelector(`#editorModalBody input[data-linea="${linea_id}"]`);
        const cantidad = Math.max(1, Number(input.value));
        const precioTxt = input.closest("tr").children[1].textContent.replace("$","").trim();
        const precio = Number(precioTxt);

        await fetchJSON(`/api/pedidos/${state.currentId}/lineas/${linea_id}`, {
          method: "PUT",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ precio, cantidad })
        });

      } else if (b.hasAttribute("data-borrar")) {
        await fetchJSON(`/api/pedidos/${state.currentId}/lineas/${linea_id}`, {
          method:"DELETE"
        });
      }

      await cargarPedido(state.currentId);

    } catch (e2) {
      msg.textContent = e2.message;
    }
  });

/* ================== Pagar ================== */
document.addEventListener("click", async e => {
  if (!e.target.matches("#editorModalBody #btnPagar")) return;

  const msg = $("#editorModalBody #msg");

  try {
    const metodo = $("#editorModalBody #metodo").value;
    const monto = Number($("#editorModalBody #monto").value || 0);
    const total = Number($("#editorModalBody #total").textContent || 0);

    // Verificar si el monto es suficiente
    if (monto < total) {
      msg.textContent = "El monto ingresado es insuficiente para cubrir el total del pedido.";
      return;  // Detener si el monto es insuficiente
    }

    // Calcular el cambio
    const cambio = monto - total;

    // Mostrar el monto pagado
    $("#montoPagado").textContent = `Monto Pagado: ${money(monto)}`;

    // Mostrar el cambio y mantenerlo visible
    $("#cambio").textContent = `Cambio: ${money(cambio)}`;

    // Registrar el pago
    await fetchJSON(`/api/pedidos/${state.currentId}/pagos`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ metodo, monto })
    });

    toast("Pago registrado");
    await cargarPedido(state.currentId);
    await cargarPedidosLista();

  } catch (e) {
    msg.textContent = e.message;
  }
});

});
// Calcular el cambio
const cambio = monto - total;

// Mostrar el cambio en el HTML
$("#cambio").textContent = `Cambio: ${money(cambio)}`;
$("#cambio").style.display = 'block'; // Mostrar el cambio
