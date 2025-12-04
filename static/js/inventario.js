/* =======================================================
   INVENTARIO — FoodPOS (modal unificado)
   ======================================================= */

/* ---------- Helpers ---------- */
const $  = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function hiddenId(form){ return form.querySelector('input[name="id"]'); }
function fmtMoney(v){ return `$${Number(v || 0).toFixed(2)}`; }

/* =======================================================
   MODAL
   ======================================================= */
function abrirModalInv() {
  $("#modalInv").classList.remove("hidden");
}

function cerrarModalInv() {
  $("#modalInv").classList.add("hidden");
  limpiarForm();
}

/* Cerrar modal en backdrop o botón */
document.addEventListener("click", (e) => {
  if (e.target.id === "closeInvModal") cerrarModalInv();
  if (e.target.id === "cancelInv") cerrarModalInv();
  if (e.target.classList.contains("modal__backdrop")) cerrarModalInv();
});

/* =======================================================
   FORM RESET
   ======================================================= */
function limpiarForm() {
  const f = $("#prodForm");
  hiddenId(f).value = "";
  f.nombre.value = "";
  f.precio.value = "";
  f.stock.value = "";
  f.activo.checked = true;

  $("#formMsg").textContent = "";
  $("#invModalTitle").textContent = "Nuevo producto";
}

/* =======================================================
   TABLA / LISTADO
   ======================================================= */
async function cargarTabla(q = "") {
  $("#tablaMsg").textContent = "";

  const url = q ? `/api/productos?q=${encodeURIComponent(q)}` : "/api/productos";

  let r, j;
  try {
    r = await fetch(url);
    j = await r.json();
  } catch {
    $("#tablaMsg").textContent = "Error de red";
    return;
  }

  if (!r.ok) {
    $("#tablaMsg").textContent = j?.msg || "Error al listar productos";
    return;
  }

  const tbody = $("#tabla tbody");
  tbody.innerHTML = "";

  (j.items || []).forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td data-label="ID">${p.id}</td>
      <td data-label="Nombre">${p.nombre}</td>
      <td data-label="Precio">${fmtMoney(p.precio)}</td>
      <td data-label="Stock">${p.stock}</td>
      <td data-label="Activo">${p.activo ? "Sí" : "No"}</td>
      <td data-label="Acciones">
        <div class="btn-group">
          <button class="secondary" data-editar="${p.id}">Editar</button>
          <button class="ghost" data-toggle="${p.id}">
            ${p.activo ? "Desactivar" : "Activar"}
          </button>
          <button class="danger" data-borrar="${p.id}">Borrar</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (!j.items?.length) {
    $("#tablaMsg").textContent = "Sin resultados.";
  }
}

/* =======================================================
   CONFIRMAR ELIMINACIÓN
   ======================================================= */
let productoEliminar = null;  // Variable para almacenar el producto a eliminar

/* ------------ ACCIONES DE ELIMINACIÓN ------------ */
$("#tabla").addEventListener("click", async (e) => {
  const b = e.target.closest("button");
  if (!b) return;

  const id = b.dataset.borrar;

  /* -------- ELIMINAR -------- */
  if (b.dataset.borrar) {
    // Muestra el modal de confirmación de eliminación
    productoEliminar = id;  // Guardamos el ID del producto a eliminar
    $("#modalEliminar").classList.remove("hidden");
    $("#modalEliminar").setAttribute("aria-hidden", "false");
  }
});

/* ------------ CERRAR MODAL DE CONFIRMACIÓN ------------ */
document.getElementById("closeEliminarModal").addEventListener("click", () => {
  $("#modalEliminar").classList.add("hidden");
  $("#modalEliminar").setAttribute("aria-hidden", "true");
});

/* ------------ CONFIRMAR ELIMINACIÓN ------------ */
document.getElementById("confirmEliminar").addEventListener("click", async () => {
  if (!productoEliminar) return;

  // Eliminar el producto desde la API
  try {
    const r = await fetch(`/api/productos/${productoEliminar}`, { method: "DELETE" });
    const j = await r.json();

    if (!r.ok || !(j?.ok)) {
      Swal.fire({
        title: 'Error!',
        text: 'No se pudo eliminar el producto.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    } else {
      // Mostrar la alerta de éxito usando SweetAlert2
      Swal.fire({
        title: '¡Eliminado!',
        text: 'El producto ha sido eliminado con éxito.',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });

      cargarTabla($("#buscar").value.trim());  // Recarga la tabla
    }
  } catch {
    Swal.fire({
      title: 'Error!',
      text: 'Error de red al intentar eliminar el producto.',
      icon: 'error',
      confirmButtonText: 'Aceptar'
    });
  }

  // Cerrar el modal de eliminación
  $("#modalEliminar").classList.add("hidden");
  $("#modalEliminar").setAttribute("aria-hidden", "true");
});

/* =======================================================
   INIT
   ======================================================= */
document.addEventListener("DOMContentLoaded", () => {

  cargarTabla();

  /* ------------ BUSQUEDA ------------ */
  $("#btnBuscar").addEventListener("click", () => {
    cargarTabla($("#buscar").value.trim());
  });

  $("#btnLimpiar").addEventListener("click", () => {
    $("#buscar").value = "";
    cargarTabla();
  });

  /* ------------ NUEVO PRODUCTO ------------ */
  $("#btnNuevo").addEventListener("click", () => {
    limpiarForm();
    abrirModalInv();
  });

  /* ------------ ACCIONES DE TABLA ------------ */
  $("#tabla").addEventListener("click", async (e) => {
    const b = e.target.closest("button");
    if (!b) return;

    const id = b.dataset.editar || b.dataset.toggle || b.dataset.borrar;

    /* -------- EDITAR -------- */
    if (b.dataset.editar) {
      const tr = b.closest("tr");
      const tds = tr.children;
      const f = $("#prodForm");

      hiddenId(f).value = id;  // Establece el ID del producto
      f.nombre.value = tds[1].textContent.trim();  // Asigna el nombre del producto
      f.precio.value = tds[2].textContent.replace("$", "").trim();  // Asigna el precio del producto
      f.stock.value = tds[3].textContent.trim();  // Asigna el stock del producto
      f.activo.checked = (tds[4].textContent.trim() === "Sí");  // Asigna el estado de "activo"

      $("#invModalTitle").textContent = `Editar producto #${id}`;  // Cambia el título del modal
      abrirModalInv();  // Muestra el modal
      return;
    }

    /* -------- TOGGLE (ACTIVAR / DESACTIVAR) -------- */
    if (b.dataset.toggle) {
      try {
        const r = await fetch(`/api/productos/${id}/toggle`, { method: "PATCH" });
        const j = await r.json().catch(() => null);
        if (!r.ok || !(j?.ok)) return alert(j?.msg || "No se pudo cambiar estado");
        cargarTabla($("#buscar").value.trim());
      } catch {
        alert("Error de red");
      }
      return;
    }

    /* -------- BORRAR -------- */
    if (b.dataset.borrar) {
      // Ya no usamos `confirm()`, ahora usamos el modal personalizado
      return;
    }
  });

  /* ------------ GUARDAR PRODUCTO ------------ */
  $("#prodForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const f = e.currentTarget;
    const id = hiddenId(f).value;  // Obtener el ID del producto

    // Verificar que el campo nombre no esté vacío
    if (!f.nombre.value.trim()) {
      $("#formMsg").textContent = "El nombre es requerido";  // Mensaje de error si el nombre está vacío
      return;
    }

    // Construir el payload con los valores del formulario
    const payload = {
      nombre: f.nombre.value.trim(),
      precio: f.precio.value.trim(),
      stock:  f.stock.value.trim(),
      activo: f.activo.checked
    };

    const url = id ? `/api/productos/${id}` : `/api/productos`;  // Usamos PUT si hay ID, si no, POST
    const method = id ? "PUT" : "POST";  // Si tiene ID, actualizamos (PUT), si no, creamos (POST)

    try {
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const j = await r.json();

      if (!r.ok || !(j?.ok)) {
        $("#formMsg").textContent = j?.msg || "No se pudo guardar";  // Muestra un error si no se pudo guardar
        return;
      }

      cerrarModalInv();  // Cierra el modal
      cargarTabla($("#buscar").value.trim());  // Recarga la tabla de productos

    } catch {
      $("#formMsg").textContent = "Error de red";  // Muestra un error si ocurre un problema de red
    }
  });

});
