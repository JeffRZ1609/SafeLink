let boton = document.getElementById("btnAnalizar");
let resultado = document.getElementById("resultado");

boton.addEventListener("click", async function () {

    let enlace = document.getElementById("url").value.trim();

    const regex =
        /^(https?):\/\/([^\/]+)(\/.*)?$/i;

    const match = enlace.match(regex);

    if (enlace === "") {

        resultado.innerHTML =
            "Por favor, ingrese un enlace.";

        return;
    }

    if (!match) {

        resultado.innerHTML =
            "El enlace no parece válido.<br>" +
            "Verifique que incluya http:// o https://";

        return;
    }

    let protocolo = match[1];
    let dominio = match[2];
    let ruta = match[3] || "/";

    let alertas = "";
    let informacionBackend = "";
    let nivelRiesgo = "";

    const acortadores = [
        "bit.ly",
        "tinyurl.com",
        "t.co",
        "cutt.ly",
        "ow.ly",
        "is.gd",
        "shorturl.at"
    ];

    const regexIP =
        /^(\d{1,3}\.){3}\d{1,3}$/;

    const palabrasPhishing = [
        "login",
        "verify",
        "secure",
        "update",
        "password",
        "bank",
        "gift",
        "premio",
        "cuenta",
        "beneficio",
        "saldo",
        "registre",
        "registrar",
        "mastercard",
        "visa",
        "tarjeta",
        "banco",
        "habilitado",
        "nacional",
        "bono",
        "subsidio"
    ];

    let dominioLimpio =
        dominio.replace("www.", "").toLowerCase();

    let esAcortador =
        acortadores.includes(dominioLimpio);

    let tienePalabrasPhishing = false;

    if (protocolo === "http") {

        alertas +=
            "• El enlace utiliza HTTP en lugar de HTTPS. La información enviada podría no estar cifrada.<br>";

    }

    if (esAcortador) {

        alertas +=
            "• Se detectó una URL acortada. El destino real del enlace esta oculto.<br>";

    }

    if (regexIP.test(dominio)) {

        alertas +=
            "• Se detectó una dirección IP en lugar de un dominio. Esto puede ocultar la identidad real del sitio.<br>";

    }

    for (let palabra of palabrasPhishing) {

        if (enlace.toLowerCase().includes(palabra)) {

            tienePalabrasPhishing = true;

            alertas +=
                "• El enlace contiene palabras utilizadas frecuentemente en intentos de phishing.<br>";

            break;
        }

    }

    try {

        const respuesta = await fetch("http://localhost:3000/analizar", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                url: enlace
            })

        });

        const datos = await respuesta.json();

        nivelRiesgo =
            datos.nivelRiesgo || "No determinado";

        informacionBackend =

            "<hr>" +

            "<strong>Análisis de la página:</strong><br>";

        if (datos.titulo) {

            informacionBackend +=

                "<br><strong>Título:</strong> " +

                datos.titulo;

        }

        informacionBackend +=

            "<br><strong>Dominio analizado:</strong> " +

            datos.dominio;

        if (datos.esLegitimo) {

            informacionBackend +=

                "<br><strong>Estado del dominio:</strong> Reconocido.";

        }

        else {

            informacionBackend +=

                "<br><strong>Estado del dominio:</strong> No reconocido.";

        }

        if (
            datos.urlFinal &&
            datos.urlFinal !== enlace
        ) {

            informacionBackend +=

                "<br><br><strong>URL final:</strong> " +

                datos.urlFinal +

                "<br><strong>Dominio final:</strong> " +

                datos.dominioFinal;

            if (datos.dominioFinalLegitimo) {

                informacionBackend +=

                    "<br><strong>Estado del dominio final:</strong> Reconocido.";

            }

            else {

                informacionBackend +=

                    "<br><strong>Estado del dominio final:</strong> No reconocido.";

            }

        }

        if (datos.nivelRiesgo) {

            informacionBackend +=

                "<br><br><strong>Nivel de riesgo:</strong> " +

                datos.nivelRiesgo;

        }

        if (
            datos.resumenAnalisis &&
            datos.resumenAnalisis.length > 0
        ) {

            informacionBackend +=

                "<br><br><strong>Resumen:</strong><br>";

            for (let resumen of datos.resumenAnalisis) {

                informacionBackend +=

                    "• " + resumen + "<br>";

            }

        }

        if (alertas !== "") {

            informacionBackend +=

                "<br><strong>Alertas del enlace:</strong><br>" +

                alertas;

        }

        if (
            datos.consecuencias &&
            datos.consecuencias.length > 0
        ) {

            informacionBackend +=

                "<br><strong>Posibles consecuencias:</strong><br>";

            for (let consecuencia of datos.consecuencias) {

                informacionBackend +=

                    "• " + consecuencia + "<br>";

            }

        }

        let detallesTecnicos = "";

        if (
            datos.camposPassword > 0 &&
            !datos.dominioFinalLegitimo
        ) {

            detallesTecnicos +=

                "• Campos de contraseña en dominio no reconocido: " +

                datos.camposPassword +

                "<br>";

        }

        if (
            datos.archivosEjecutables > 0
        ) {

            detallesTecnicos +=

                "• Archivos ejecutables o comprimidos detectados: " +

                datos.archivosEjecutables +

                " (" +

                datos.extensionesEncontradas.join(", ") +

                ")<br>";

        }

        if (
            datos.metaRefresh > 0 &&
            !datos.dominioFinalLegitimo
        ) {

            detallesTecnicos +=

                "• Redirección automática Meta Refresh en dominio no reconocido: " +

                datos.metaRefresh +

                "<br>";

        }

        if (
            datos.redireccionesJavaScript > 0 &&
            !datos.dominioFinalLegitimo
        ) {

            detallesTecnicos +=

                "• Redirecciones por JavaScript en dominio no reconocido: " +

                datos.redireccionesJavaScript +

                "<br>";

        }

        if (
            datos.cantidadIframes > 0 &&
            !datos.dominioFinalLegitimo
        ) {

            detallesTecnicos +=

                "• Iframes detectados en dominio no reconocido: " +

                datos.cantidadIframes +

                "<br>";

        }

        if (
            datos.scriptsExternos > 10 &&
            !datos.dominioFinalLegitimo
        ) {

            detallesTecnicos +=

                "• Varios scripts externos en dominio no reconocido: " +

                datos.scriptsExternos +

                "<br>";

        }

        if (detallesTecnicos !== "") {

            informacionBackend +=

                "<br><strong>Detalles técnicos relevantes:</strong><br>" +

                detallesTecnicos;

        }

    }

    catch (error) {

        nivelRiesgo =
            "No determinado";

        informacionBackend =

            "<hr>" +

            "No fue posible obtener información desde el servidor.";

    }

    let resultadoPrincipal = "";

    if (
        nivelRiesgo === "Alto" ||
        esAcortador ||
        regexIP.test(dominio) ||
        tienePalabrasPhishing
    ) {

        resultadoPrincipal =
            "Resultado: el enlace presenta señales sospechosas. Se recomienda no abrirlo sin verificar su origen.";

    }

    else if (nivelRiesgo === "Medio") {

        resultadoPrincipal =
            "Resultado: se recomienda precaución antes de abrir este enlace.";

    }

    else if (nivelRiesgo === "Bajo") {

        resultadoPrincipal =
            "Resultado: el enlace parece de bajo riesgo según el análisis realizado.";

    }

    else {

        resultadoPrincipal =
            "Resultado: no fue posible determinar completamente el nivel de riesgo.";

    }

    resultado.innerHTML =

        "<strong>" + resultadoPrincipal + "</strong>" +

        "<br><br><strong>Protocolo:</strong> " + protocolo +

        "<br><strong>Dominio:</strong> " + dominio +

        "<br><strong>Ruta:</strong> " + ruta +

        informacionBackend;

});