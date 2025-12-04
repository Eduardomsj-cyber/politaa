document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const msg = document.getElementById("msg");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";

    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(data)
      });

      // Intenta JSON; si no, muestra el texto del error
      let j;
      try {
        j = await r.json();
      } catch {
        const t = await r.text();
        msg.textContent = `Error ${r.status}: ${t.slice(0,120)}`;
        return;
      }

      if (!r.ok || !j.ok) {
        msg.textContent = j.msg || `Error ${r.status}`;
        return;
      }
      location.href = "/";
    } catch (err) {
      msg.textContent = "No se pudo contactar al servidor";
    }
  });
});

