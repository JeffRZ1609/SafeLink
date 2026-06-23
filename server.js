// Librerias

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const cheerio = require("cheerio");
const fs = require("fs");


// Implementacion de Express

const app = express();
const PORT = 3000;
let dominiosLegitimos = new Set();


// Middlewares

app.use(cors());
app.use(express.json());


// Cargar lista de dominios legitimos desde el archivo CSV

const lineas = fs.readFileSync("top-1m.csv", "utf8").split("\n");

for (let linea of lineas) {

    const partes = linea.split(",");

    if (partes.length >= 2) {

        dominiosLegitimos.add(
            partes[1].trim().toLowerCase()
        );

    }

}


// Ruta Principal

app.get("/", (req, res) => {

    res.send("Servidor de SafeLink funcionando correctamente.");

});


// Analisis de enlaces

app.post("/analizar", async (req, res) => {

    try {

        const url = req.body.url;

        const urlObj = new URL(url);

        let dominio = urlObj.hostname
            .replace("www.", "")
            .toLowerCase();

        let dominioLegitimo =
            dominiosLegitimos.has(dominio);

        const acortadores = [
            "bit.ly",
            "tinyurl.com",
            "t.co",
            "cutt.ly",
            "ow.ly",
            "is.gd",
            "shorturl.at"
        ];

        let esAcortador =
            acortadores.includes(dominio);

        const respuesta = await axios.get(url);

        const urlFinal =
            respuesta.request.res.responseUrl || url;

        const dominioFinal =
            new URL(urlFinal).hostname
                .replace("www.", "")
                .toLowerCase();

        let dominioFinalLegitimo =
            dominiosLegitimos.has(dominioFinal);

        const html = respuesta.data;

        let muestraHTML = html.substring(0, 500);

        const $ = cheerio.load(html);

        const titulo = $("title").text();

        let formularios = $("form").length;

        let inputs = $("input").length;

        let camposPassword =
            $('input[type="password"]').length;

        let botonesSubmit =
            $('button[type="submit"]').length;

        let inputsSubmit =
            $('input[type="submit"]').length;

        let botonesEnviar =
            botonesSubmit + inputsSubmit;

        let cantidadIframes =
            $("iframe").length;

        let scriptsExternos =
            $('script[src]').length;

        let imagenes =
            $("img").length;

        let videos =
            $("video").length;

        let audios =
            $("audio").length;

        let metaRefresh =
            $('meta[http-equiv="refresh"]').length;

        let redireccionesJavaScript = 0;

        let totalEnlaces =
            $("a").length;

        let extensionesDescarga = [
            ".pdf",
            ".zip",
            ".rar",
            ".docx",
            ".exe",
            ".apk",
            ".msi",
            ".iso"
        ];

        let extensionesPeligrosas = [
            ".exe",
            ".apk",
            ".msi",
            ".iso",
            ".zip",
            ".rar"
        ];

        let archivosDescargables = 0;

        let archivosEjecutables = 0;

        let extensionesEncontradas = [];

        $("a").each((_, element) => {

            const href =
                $(element).attr("href");

            if (!href) return;

            const hrefLower =
                href.toLowerCase();

            for (let extension of extensionesDescarga) {

                if (hrefLower.endsWith(extension)) {

                    archivosDescargables++;

                    if (!extensionesEncontradas.includes(extension)) {

                        extensionesEncontradas.push(extension);

                    }

                    if (extensionesPeligrosas.includes(extension)) {

                        archivosEjecutables++;

                    }

                    break;

                }

            }

        });

        $("script").each((_, element) => {

            const contenidoScript =
                $(element).html();

            if (!contenidoScript) return;

            if (
                contenidoScript.includes("window.location") ||
                contenidoScript.includes("location.href") ||
                contenidoScript.includes("location.replace")
            ) {

                redireccionesJavaScript++;

            }

        });


        // Analisis inteligente

        let nivelRiesgo = "Bajo";

        let puntosRiesgo = 0;

        let resumenAnalisis = [];

        let consecuencias = [];


        // dominio reconocido y sin elementos realmente delicados

        if (
            dominioFinalLegitimo &&
            !esAcortador &&
            camposPassword === 0 &&
            archivosEjecutables === 0 &&
            metaRefresh === 0
        ) {

            resumenAnalisis.push(
                "El dominio final aparece como reconocido y no se detectaron señales importantes de riesgo."
            );

        }


        //  dominio no reconocido, pero sin comportamiento peligroso

        if (
            !dominioFinalLegitimo &&
            !esAcortador &&
            camposPassword === 0 &&
            archivosEjecutables === 0 &&
            metaRefresh === 0
        ) {

            resumenAnalisis.push(
                "El dominio final no aparece como reconocido, pero no se detectaron señales fuertes de peligro."
            );

            resumenAnalisis.push(
                "Esto puede pasar con páginas nuevas o poco populares, por lo que se recomienda verificar el origen antes de confiar completamente."
            );

        }


        //  acortadores

        if (esAcortador) {

            puntosRiesgo += 4;

            resumenAnalisis.push(
                "El enlace utiliza un acortador de URL. Aunque el acortador sea conocido, puede ocultar el destino real del enlace."
            );

            consecuencias.push(
                "El usuario podría ser redirigido a una página falsa o no esperada."
            );

        }


        // redireccion hacia otro dominio

        if (dominio !== dominioFinal) {

            resumenAnalisis.push(
                "El enlace redirige hacia otro dominio diferente al que aparece inicialmente."
            );

            if (!dominioFinalLegitimo) {

                puntosRiesgo += 3;

                resumenAnalisis.push(
                    "El dominio final de la redirección no aparece como reconocido."
                );

                consecuencias.push(
                    "Esto puede causar estafas de diferentes tipos."
                );

            }

        }


        //contraseñas

        if (camposPassword > 0 && dominioFinalLegitimo) {

            resumenAnalisis.push(
                "La página solicita contraseña, pero el dominio final aparece como reconocido."
            );

        }

        if (camposPassword > 0 && !dominioFinalLegitimo) {

            puntosRiesgo += 4;

            resumenAnalisis.push(
                "La página solicita contraseña en un dominio que no aparece como reconocido."
            );

            consecuencias.push(
                "Podrían robar credenciales o acceder a cuentas personales."
            );

        }


        // descargas

        if (archivosDescargables > 0 && archivosEjecutables === 0) {

            resumenAnalisis.push(
                "La página contiene archivos descargables, pero no se detectaron archivos ejecutables o instaladores."
            );

        }

        if (archivosEjecutables > 0 && dominioFinalLegitimo) {

            resumenAnalisis.push(
                "La página ofrece archivos ejecutables o comprimidos. Aunque el dominio sea reconocido, se recomienda descargar solo si el usuario confía en la fuente."
            );

        }

        if (archivosEjecutables > 0 && !dominioFinalLegitimo) {

            puntosRiesgo += 4;

            resumenAnalisis.push(
                "La página ofrece archivos ejecutables o comprimidos desde un dominio no reconocido."
            );

            consecuencias.push(
                "El dispositivo podría descargar archivos maliciosos."
            );

        }


        // Meta Refresh

        if (metaRefresh > 0 && dominioFinalLegitimo) {

            resumenAnalisis.push(
                "Se detectó una redirección Meta Refresh, pero el dominio final aparece como reconocido."
            );

        }

        if (metaRefresh > 0 && !dominioFinalLegitimo) {

            puntosRiesgo += 3;

            resumenAnalisis.push(
                "Se detectó una redirección automática Meta Refresh en un dominio no reconocido."
            );

            consecuencias.push(
                "El usuario podría ser enviado a otra página sin darse cuenta."
            );

        }


        // elementos normales en páginas modernas

        if (
            dominioFinalLegitimo &&
            (scriptsExternos > 0 || redireccionesJavaScript > 0 || cantidadIframes > 0)
        ) {

            resumenAnalisis.push(
                "Se detectaron scripts, redirecciones internas o contenido incrustado, elementos comunes en sitios modernos."
            );

        }

        if (
            !dominioFinalLegitimo &&
            scriptsExternos > 10
        ) {

            resumenAnalisis.push(
                "La página carga varios scripts externos. Esto no es necesariamente peligroso, pero en dominios no reconocidos conviene revisarlo con precaución."
            );

        }

        if (
            !dominioFinalLegitimo &&
            cantidadIframes > 0
        ) {

            resumenAnalisis.push(
                "La página incrusta contenido externo mediante iframes. Esto puede ser normal, pero también puede usarse para mostrar contenido de terceros."
            );

        }


        // Sistema de nivel de riesgo

        if (puntosRiesgo >= 7) {

            nivelRiesgo = "Alto";

        } else if (puntosRiesgo >= 4) {

            nivelRiesgo = "Medio";

        } else {

            nivelRiesgo = "Bajo";

        }


        res.json({
            mensaje: "HTML obtenido correctamente.",
            longitudHTML: html.length,
            htmlRecibido: muestraHTML,
            titulo: titulo,
            formularios: formularios,
            inputs: inputs,
            camposPassword: camposPassword,
            botonesEnviar: botonesEnviar,
            totalEnlaces: totalEnlaces,
            archivosDescargables: archivosDescargables,
            archivosEjecutables: archivosEjecutables,
            extensionesEncontradas: extensionesEncontradas,
            cantidadIframes: cantidadIframes,
            scriptsExternos: scriptsExternos,
            metaRefresh: metaRefresh,
            redireccionesJavaScript: redireccionesJavaScript,
            imagenes: imagenes,
            videos: videos,
            audios: audios,
            dominio: dominio,
            esLegitimo: dominioLegitimo,
            urlFinal: urlFinal,
            dominioFinal: dominioFinal,
            dominioFinalLegitimo: dominioFinalLegitimo,
            nivelRiesgo: nivelRiesgo,
            puntosRiesgo: puntosRiesgo,
            resumenAnalisis: resumenAnalisis,
            consecuencias: consecuencias
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            mensaje: "No fue posible acceder a la página."
        });

    }

});


// Servidor

app.listen(PORT, "0.0.0.0", () => {

    console.log(`Servidor ejecutándose en http://0.0.0.0:${PORT}`);

});