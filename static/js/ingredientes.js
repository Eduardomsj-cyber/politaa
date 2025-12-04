const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

async function fetchJSON(url, opts){
  const r = await fetch(url, opts);
  let j; try{ j = await r.json(); }catch{ throw new Error(await r.text()); }
  if(!r.ok || j.ok===false) throw new Error(j.msg || `HTTP ${r.status}`);
  return j;
}

function pintar(items){
  const tb = $("#tabla tbody");
  tb.innerHTML = "";
  (items||[]).forEach(x=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td data-label="ID">${x.id}</td>
      <td data-label="Nombre">${x.nombre}</td>
      <td data-label="Unidad">${x.unidad||'pz'}</td>
      <td data-label="Acciones" class="btn-group">
        <button data-editar="${x.id}">Editar</button>
        <button class="secondary" data-borrar="${x.id}">Borrar</button>
      </td>`;
    tb.appendChild(tr);
  });
}

async function cargar(q=""){
  const j = await fetchJSON(`/api/ingredientes${q?`?q=${encodeURIComponent(q)}`:''}`);
  pintar(j.items);
}

document.addEventListener("DOMContentLoaded", async ()=>{
  const form = $("#ingForm");
  const msg = $("#msg");
  const cancel = $("#cancelEdit");

  await cargar();

  $("#btnBuscar").addEventListener("click", ()=> cargar($("#buscar").value.trim()));
  $("#btnLimpiar").addEventListener("click", ()=>{ $("#buscar").value=""; cargar(); });

  form.addEventListener("submit", async (e)=>{
    e.preventDefault(); msg.textContent = "";
    const id = form.id.value.trim();
    const payload = {
      nombre: form.nombre.value.trim(),
      unidad: form.unidad.value.trim() || "pz",
    };
    try{
      if(!payload.nombre){ msg.textContent="Nombre requerido"; return; }
      if(id){
        await fetchJSON(`/api/ingredientes/${id}`, {
          method:"PUT", headers:{"Content-Type":"application/json"},
          body: JSON.stringify(payload)
        });
      }else{
        await fetchJSON(`/api/ingredientes`, {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify(payload)
        });
      }
      form.reset(); form.id.value=""; form.unidad.value="pz"; cancel.style.display="none";
      await cargar();
      msg.textContent = "Guardado";
    }catch(e){ msg.textContent = e.message; }
  });

  cancel.addEventListener("click", ()=>{
    form.reset(); form.id.value=""; form.unidad.value="pz";
    cancel.style.display="none"; msg.textContent="";
  });

  $("#tabla").addEventListener("click", async (e)=>{
    const b = e.target.closest("button"); if(!b) return;
    msg.textContent = "";
    const id = b.getAttribute("data-editar") || b.getAttribute("data-borrar");
    if(b.hasAttribute("data-editar")){
      const tr = b.closest("tr");
      form.id.value = id;
      form.nombre.value = tr.children[1].textContent.trim();
      form.unidad.value = tr.children[2].textContent.trim() || "pz";
      cancel.style.display="inline-flex";
      window.scrollTo({top:0, behavior:"smooth"});
    }else if(b.hasAttribute("data-borrar")){
      if(!confirm("¿Borrar ingrediente?")) return;
      try{
        await fetchJSON(`/api/ingredientes/${id}`, { method:"DELETE" });
        await cargar(); msg.textContent="Borrado";
      }catch(e){ msg.textContent = e.message; }
    }
  });
});
