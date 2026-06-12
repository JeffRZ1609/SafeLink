//parte de backend//
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

async function obtenerHTML(url) {
  const response = await axios.get(url, {
    timeout: 8000,
    maxRedirects: 5,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
    },
    validateStatus: () => true,
  });
  return {
    html: response.data,
    status: response.status,
    finalUrl: response.request?.res?.responseUrl || url,
    contentType: response.headers["content-type"] || "",
  };
}

function detectarFormularios($) {
  const hallazgos = [];
  $('input[type="password"]').each((_, el) => {
    const form = $(el).closest("form");
    const action = form.attr("action") || "(sin action)";
    hallazgos.push({
      tipo: "password_input",
      detalle: `Campo de contraseña detectado. Formulario envía a: ${action}`,
      consecuencia: "Posible robo de credenciales.",
      peso: 30,
    });
  });
  return hallazgos;
}

function detectarDescargas($) {
  const extensiones = [".exe", ".zip", ".rar", ".bat", ".scr", ".msi", ".dmg", ".apk", ".sh"];
  const hallazgos = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const ext = extensiones.find((e) => href.toLowerCase().includes(e));
    if (ext) {
      hallazgos.push({
        tipo: "descarga_sospechosa",
        detalle: `Enlace de descarga detectado: ${href.slice(0, 80)}`,
        consecuencia: `Posible instalación de malware (${ext}).`,
        peso: 25,
      });
    }
  });
  return hallazgos;
}

function detectarPopups($, scriptTexto) {
  const hallazgos = [];
  const patrones = [/window\.open\s*\(/g, /showModalDialog\s*\(/g];
  patrones.forEach((patron) => {
    const coincidencias = scriptTexto.match(patron) || [];
    if (coincidencias.length > 0) {
      hallazgos.push({
        tipo: "popup",
        detalle: `Se detectaron ${coincidencias.length} llamada(s) a window.open().`,
        consecuencia: "Publicidad invasiva o redirecciones forzadas.",
        peso: 15,
      });
    }
  });
  return hallazgos;
}

function detectarRedirecciones($, scriptTexto) {
  const hallazgos = [];

  $('meta[http-equiv="refresh"]').each((_, el) => {
    const content = $(el).attr("content") || "";
    hallazgos.push({
      tipo: "meta_refresh",
      detalle: `Meta refresh detectado: ${content.slice(0, 60)}`,
      consecuencia: "Redirección automática sin consentimiento.",
      peso: 20,
    });
  });

  const patronesRedir = [
    /location\.href\s*=/g,
    /location\.replace\s*\(/g,
    /location\.assign\s*\(/g,
    /window\.location\s*=/g,
  ];
  let totalRedir = 0;
  patronesRedir.forEach((p) => {
    totalRedir += (scriptTexto.match(p) || []).length;
  });
  if (totalRedir > 0) {
    hallazgos.push({
      tipo: "js_redirect",
      detalle: `${totalRedir} redirección(es) por JavaScript detectadas.`,
      consecuencia: "El sitio puede llevarte a otra página sin avisarte.",
      peso: 20,
    });
  }

  return hallazgos;
}

function detectarIframes($) {
  const hallazgos = [];
  $("iframe").each((_, el) => {
    const src = $(el).attr("src") || "(sin src)";
    const esOculto =
      $(el).attr("width") === "0" ||
      $(el).attr("height") === "0" ||
      ($(el).attr("style") || "").includes("display:none") ||
      ($(el).attr("style") || "").includes("visibility:hidden");

    hallazgos.push({
      tipo: esOculto ? "iframe_oculto" : "iframe",
      detalle: `iframe ${esOculto ? "OCULTO" : "visible"} → src: ${src.slice(0, 80)}`,
      consecuencia: esOculto
        ? "Iframe oculto: posible rastreo o contenido malicioso."
        : "Iframe visible: contenido externo incrustado.",
      peso: esOculto ? 25 : 5,
    });
  });
  return hallazgos;
}

function detectarScriptsSospechosos($, scriptTexto) {
  const hallazgos = [];
  const patrones = [
    { regex: /\beval\s*\(/g,              nombre: "eval()",            peso: 35, consecuencia: "Ejecución de código arbitrario." },
    { regex: /document\.write\s*\(/g,     nombre: "document.write()",  peso: 20, consecuencia: "Inyección dinámica de contenido." },
    { regex: /setTimeout\s*\(\s*["'`]/g,  nombre: "setTimeout(string)",peso: 25, consecuencia: "Ejecución de código como string (inseguro)." },
    { regex: /atob\s*\(/g,                nombre: "atob()",            peso: 20, consecuencia: "Decodificación base64, posible ofuscación." },
    { regex: /unescape\s*\(/g,            nombre: "unescape()",        peso: 20, consecuencia: "Desofuscación de código sospechoso." },
    { regex: /fromCharCode\s*\(/g,        nombre: "fromCharCode()",    peso: 20, consecuencia: "Construcción de strings ofuscados." },
  ];

  patrones.forEach(({ regex, nombre, peso, consecuencia }) => {
    const cantidad = (scriptTexto.match(regex) || []).length;
    if (cantidad > 0) {
      hallazgos.push({
        tipo: "script_sospechoso",
        detalle: `${cantidad} uso(s) de ${nombre} detectados.`,
        consecuencia,
        peso,
      });
    }
  });

  return hallazgos;
}

function analizarURL(urlStr) {
  const hallazgos = [];
  const acortadores = ["bit.ly", "tinyurl.com", "t.co", "cutt.ly", "ow.ly", "is.gd", "goo.gl"];

  let parsedURL;
  try {
    parsedURL = new URL(urlStr);
  } catch {
    return hallazgos;
  }

  const dominio = parsedURL.hostname.toLowerCase();

  if (parsedURL.protocol === "http:") {
    hallazgos.push({
      tipo: "http",
      detalle: "El sitio usa HTTP en lugar de HTTPS.",
      consecuencia: "La comunicación no está cifrada. Riesgo de interceptación.",
      peso: 30,
    });
  }

  if (acortadores.some((a) => dominio.includes(a))) {
    hallazgos.push({
      tipo: "url_acortada",
      detalle: `URL acortada detectada (${dominio}). El destino real está oculto.`,
      consecuencia: "No podés saber a dónde te lleva realmente.",
      peso: 20,
    });
  }

  const marcas = ["paypal", "google", "facebook", "microsoft", "apple", "amazon", "netflix", "banco"];
  marcas.forEach((marca) => {
    if (dominio.includes(marca) && !dominio.endsWith(`.${marca}.com`) && dominio !== `${marca}.com` && dominio !== `www.${marca}.com`) {
      hallazgos.push({
        tipo: "dominio_enganoso",
        detalle: `El dominio "${dominio}" podría estar imitando a "${marca}".`,
        consecuencia: "Posible sitio de phishing que suplanta una marca conocida.",
        peso: 40,
      });
    }
  });

  const partes = dominio.split(".");
  if (partes.length > 4) {
    hallazgos.push({
      tipo: "subdominio_excesivo",
      detalle: `Dominio con ${partes.length} niveles: ${dominio}`,
      consecuencia: "Estructura de dominio inusual, común en phishing.",
      peso: 20,
    });
  }

  return hallazgos;
}

function calcularNivel(hallazgos) {
  const puntaje = hallazgos.reduce((acc, h) => acc + (h.peso || 0), 0);
  if (puntaje < 40) return { nivel: "BAJO",  puntaje, color: "verde"    };
  if (puntaje < 80) return { nivel: "MEDIO", puntaje, color: "amarillo" };
  return              { nivel: "ALTO",  puntaje, color: "rojo"      };
}

function generarRecomendacion(nivel) {
  if (nivel === "BAJO")  return "✓ Se recomienda acceder al sitio.";
  if (nivel === "MEDIO") return "⚠ Se recomienda actuar con precaución.";
  return "❌ No se recomienda acceder al sitio.";
}

function generarPositivos(urlStr, hallazgos) {
  const positivos = [];
  try {
    const u = new URL(urlStr);
    if (u.protocol === "https:") positivos.push("Usa HTTPS (conexión cifrada).");
  } catch {}
  const tipos = hallazgos.map((h) => h.tipo);
  if (!tipos.includes("dominio_enganoso"))    positivos.push("El dominio no parece imitar marcas conocidas.");
  if (!tipos.includes("script_sospechoso"))   positivos.push("No se detectaron scripts ofuscados.");
  if (!tipos.includes("iframe_oculto"))       positivos.push("No hay iframes ocultos.");
  if (!tipos.includes("descarga_sospechosa")) positivos.push("Sin enlaces de descarga sospechosos.");
  return positivos;
}

app.post("/analizar", async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "URL requerida." });
  }

  let parsedURL;
  try {
    parsedURL = new URL(url.startsWith("http") ? url : "https://" + url);
  } catch {
    return res.status(400).json({ error: "URL inválida." });
  }

  const informe = {
    url,
    dominio: parsedURL.hostname,
    protocolo: parsedURL.protocol.replace(":", "").toUpperCase(),
    ruta: parsedURL.pathname,
    parametros: parsedURL.search || "Ninguno",
    hallazgos: [],
    positivos: [],
    nivel: "BAJO",
    puntaje: 0,
    recomendacion: "",
    htmlAnalizado: false,
    error: null,
  };

  informe.hallazgos.push(...analizarURL(url));

  try {
    const { html, status, finalUrl } = await obtenerHTML(url);

    if (typeof html === "string" && html.length > 0) {
      informe.htmlAnalizado = true;
      informe.httpStatus = status;
      if (finalUrl !== url) informe.urlFinal = finalUrl;

      const $ = cheerio.load(html);
      informe.titulo = $("title").first().text().trim().slice(0, 80) || "(sin título)";

      const scriptTexto = $("script")
        .map((_, el) => $(el).html() || "")
        .get()
        .join("\n");

      informe.hallazgos.push(
        ...detectarFormularios($),
        ...detectarDescargas($),
        ...detectarPopups($, scriptTexto),
        ...detectarRedirecciones($, scriptTexto),
        ...detectarIframes($),
        ...detectarScriptsSospechosos($, scriptTexto)
      );
    }
  } catch (err) {
    informe.error = `No se pudo descargar la página: ${err.message}`;
  }

  const { nivel, puntaje } = calcularNivel(informe.hallazgos);
  informe.nivel = nivel;
  informe.puntaje = puntaje;
  informe.recomendacion = generarRecomendacion(nivel);
  informe.positivos = generarPositivos(url, informe.hallazgos);

  res.json(informe);
});

app.get("/", (_, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));