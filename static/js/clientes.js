const $ = (sel) => document.querySelector(sel);

let clienteIdEliminar = null;

// Limpiar formulario
function limpiarForm() {
  const f = $("#clienteForm");
  f.id.value = "";
  f.nombre.value = "";
  f.telefono.value = "";
  f.email.value = "";
  $("#cancelCliente").style.display = "none";
  $("#formMsg").textContent = "";
}

// Cargar tabla de clientes
async function cargarTabla(q="") {
  $("#tablaMsg").textContent = "";
  const url = q ? `/api/clientes?q=${encodeURIComponent(q)}` : "/api/clientes";
  const r = await fetch(url);
  if (!r.ok) { $("#tablaMsg").textContent = "Error al listar clientes"; return; }
  const j = await r.json();
  const tbody = $("#tabla tbody");
  tbody.innerHTML = "";
  (j.items || []).forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
  <td data-label="ID"><span>${c.id}</span></td>
  <td data-label="Nombre"><span>${c.nombre || ""}</span></td>
  <td data-label="Teléfono"><span>${c.telefono || ""}</span></td>
  <td data-label="Email"><span>${c.email || ""}</span></td>
  <td data-label="Acciones">
     <div class="cliente-actions">
      <button class="btn-client" data-editar="${c.id}">Editar</button>
      <button class="btn-client btn-client--danger" data-borrar="${c.id}">Borrar</button>
    </div>
  </td>`;

    tbody.appendChild(tr);
  });
}

// Lógica cuando la página está lista
document.addEventListener("DOMContentLoaded", () => {
  cargarTabla();

  // Funcionalidad de búsqueda
  $("#btnBuscar").addEventListener("click", () => {
    cargarTabla($("#buscar").value.trim());
  });

  // Funcionalidad de limpiar búsqueda
  $("#btnLimpiar").addEventListener("click", () => {
    $("#buscar").value = "";
    cargarTabla();
  });

  // Funcionalidad de agregar nuevo cliente (Abrir el modal de cliente)
  $("#btnNuevoCliente").addEventListener("click", () => {
    limpiarForm();
    abrirModalCliente();
  });

  // Funcionalidad de editar o borrar clientes
  $("#tabla").addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const id = btn.getAttribute("data-editar") || btn.getAttribute("data-borrar");
    if (btn.hasAttribute("data-editar")) {
      // Cargar fila al formulario
      const fila = btn.closest("tr").children;
      const f = $("#clienteForm");
      f.id.value = id;
      f.nombre.value = fila[1].textContent;
      f.telefono.value = fila[2].textContent;
      f.email.value = fila[3].textContent;
      $("#cancelCliente").style.display = "inline-block";
      abrirModalCliente();
    } else if (btn.hasAttribute("data-borrar")) {
      clienteIdEliminar = id;
      abrirModalEliminar();
    }
  });

  // Función para cancelar edición
  $("#cancelCliente").addEventListener("click", limpiarForm);

  // Función para guardar cliente (Nuevo o Editar)
  $("#clienteForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.currentTarget;
    const payload = {
      nombre: f.nombre.value.trim(),
      telefono: f.telefono.value.trim(),
      email: f.email.value.trim(),
    };
    let r, j;
    try {
      if (f.id.value) {
        // Actualizar cliente existente
        r = await fetch(`/api/clientes/${f.id.value}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Crear nuevo cliente
        r = await fetch(`/api/clientes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      j = await r.json();
    } catch {
      $("#formMsg").textContent = "Error de red";
      return;
    }
    if (!r.ok || !j.ok) {
      $("#formMsg").textContent = j.msg || "No se pudo guardar";
      return;
    }
    limpiarForm();
    cargarTabla($("#buscar").value.trim());
  });

  // Función para cancelar la eliminación
  $("#cancelEliminar").addEventListener("click", () => {
    cerrarModalEliminar();
  });

  // Función para confirmar eliminación
  $("#confirmEliminar").addEventListener("click", async () => {
    if (clienteIdEliminar) {
      const r = await fetch(`/api/clientes/${clienteIdEliminar}`, { method: "DELETE" });
      const j = await r.json().catch(() => ({ ok: false }));
      if (!r.ok || !j.ok) { alert(j.msg || "No se pudo borrar"); return; }
      cargarTabla($("#buscar").value.trim());
      cerrarModalEliminar();
    }
  });
});

// Función para abrir el modal de cliente
function abrirModalCliente() {
  $("#modalCliente").classList.remove("hidden");
  $("#modalCliente").setAttribute("aria-hidden", "false");
}

// Función para cerrar el modal de cliente (con la tacha)
function cerrarModalCliente() {
  $("#modalCliente").classList.add("hidden");
  $("#modalCliente").setAttribute("aria-hidden", "true");
}

// Función para abrir el modal de eliminación
function abrirModalEliminar() {
  $("#modalEliminar").classList.remove("hidden");
  $("#modalEliminar").setAttribute("aria-hidden", "false");
}

// Función para cerrar el modal de eliminación
function cerrarModalEliminar() {
  $("#modalEliminar").classList.add("hidden");
  $("#modalEliminar").setAttribute("aria-hidden", "true");
}

// Función para cerrar todos los modales con la tacha (añadido para generalizar la funcionalidad)
document.querySelectorAll(".modal-close").forEach(button => {
  button.addEventListener("click", () => {
    const modal = button.closest(".modal");
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  });
});
