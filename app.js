const boton = document.getElementById("btnAnalizar");
const resultado = document.getElementById("resultado");

// Cambia esto si tu servidor corre en otro puerto
const SERVIDOR = "http://localhost:3000";

boton.addEventListener("click", async function () {
  const enlace = document.getElementById("url").value.trim();

  if (!enlace) {
    resultado.innerHTML = "⚠️ Por favor, ingresá un enlace.";
    return;
  }

  // Mostrar spinner mientras carga
  resultado.innerHTML = '<div class="loading"></div>';
  boton.disabled = true;

  try {
    const response = await fetch(`${SERVIDOR}/analizar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: enlace }),
    });

    if (!response.ok) {
      const err = await response.json();
      resultado.innerHTML = `❌ Error: ${err.error || "Respuesta inválida del servidor."}`;
      return;
    }

    const data = await response.json();
    mostrarResultado(data);

  } catch (err) {
    resultado.innerHTML = `
      <div class="alerta rojo">
        ❌ No se pudo conectar con el servidor.<br>
        <small>Asegurate de que el servidor esté corriendo con <code>node server.js</code></small>
      </div>`;
  } finally {
    boton.disabled = false;
  }
});

function mostrarResultado(data) {
  const colores = { BAJO: "verde", MEDIO: "amarillo", ALTO: "rojo" };
  const iconos  = { BAJO: "✅", MEDIO: "⚠️", ALTO: "❌" };
  const color   = colores[data.nivel] || "verde";
  const icono   = iconos[data.nivel]  || "✅";

  let html = `
    <div class="resultado-header ${color}">
      <span class="nivel-icono">${icono}</span>
      <div>
        <strong>Nivel de riesgo: ${data.nivel}</strong><br>
        <small>Puntaje: ${data.puntaje} pts</small>
      </div>
    </div>
    <p class="recomendacion">${data.recomendacion}</p>

    <div class="meta">
      <span><strong>Dominio:</strong> ${data.dominio}</span>
      <span><strong>Protocolo:</strong> ${data.protocolo}</span>
      <span><strong>Ruta:</strong> ${data.ruta || "/"}</span>
      ${data.titulo ? `<span><strong>Título:</strong> ${data.titulo}</span>` : ""}
      ${data.httpStatus ? `<span><strong>HTTP Status:</strong> ${data.httpStatus}</span>` : ""}
    </div>`;

  // Puntos positivos
  if (data.positivos && data.positivos.length > 0) {
    html += `<div class="seccion"><h3>✅ Aspectos positivos</h3><ul>`;
    data.positivos.forEach(p => {
      html += `<li class="item-positivo">${p}</li>`;
    });
    html += `</ul></div>`;
  }

  // Hallazgos / alertas
  if (data.hallazgos && data.hallazgos.length > 0) {
    html += `<div class="seccion"><h3>⚠️ Alertas detectadas</h3><ul>`;
    data.hallazgos.forEach(h => {
      html += `
        <li class="item-alerta">
          <strong>${h.tipo.replace(/_/g, " ").toUpperCase()}</strong><br>
          ${h.detalle}<br>
          <em>${h.consecuencia}</em>
        </li>`;
    });
    html += `</ul></div>`;
  } else {
    html += `<p class="sin-alertas">No se detectaron alertas en el contenido de la página.</p>`;
  }

  // Error de descarga (si el servidor no pudo acceder a la página)
  if (data.error) {
    html += `<div class="alerta amarillo">⚠️ ${data.error}</div>`;
  }

  resultado.innerHTML = html;
}