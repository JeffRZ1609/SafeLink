let boton = document.getElementById("btnAnalizar");
let resultado = document.getElementById("resultado");

boton.addEventListener("click", async function () {

    let enlace = document.getElementById("url").value.trim();

    const regex =
        /^(https?):\/\/([^\/]+)(\/.*)?$/i;

    const match = enlace.match(regex);

    if (enlace !== "" && !match) {

        resultado.innerHTML =
            "El enlace no parece valido.<br>";

        return;
    }

    let positivos = "";
    let alertas = "";
    let informacionBackend = "";

    const acortadores = [
        "bit.ly",
        "tinyurl.com",
        "t.co",
        "cutt.ly",
        "ow.ly",
        "is.gd"
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
        "cuenta"
    ];

    if (enlace === "") {

        resultado.innerHTML =
            "Por favor, ingrese un enlace.";

        return;
    }

    // CONEXIÓN CON EL BACKEND

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

        informacionBackend =

            "<hr>" +

            "<strong>Análisis de la pagina:</strong><br>" +

            "<strong>Título:</strong> " + datos.titulo +

            "<br><strong>Tamaño HTML:</strong> " + datos.longitudHTML;

    }

    catch (error) {

        informacionBackend =

            "<hr>" +

            "No fue posible obtener información desde el servidor.";

    }


    if (enlace.startsWith("https://")) {

        let protocolo = match[1];
        let dominio = match[2];
        let ruta = match[3] || "/";

        positivos += "✓ Utiliza HTTPS<br>";

        if (acortadores.includes(dominio)) {

            alertas +=
                "URL acortada detectada.<br>" +
                "El destino real del enlace está oculto.<br>";
        }

        if (regexIP.test(dominio)) {

            alertas +=
                "Se detectó una dirección IP en lugar de un dominio.<br>" +
                "Algunos sitios maliciosos utilizan direcciones IP para ocultar su verdadera identidad.<br><br>";
        }

        for (let palabra of palabrasPhishing) {

            if (enlace.toLowerCase().includes(palabra)) {

                alertas +=
                    "El enlace contiene palabras frecuentes utilizadas en links para phishing.<br><br>";

                break;
            }

        }

        resultado.innerHTML =

            "El enlace parece seguro.<br>" +
            "Utiliza HTTPS, que es un protocolo más seguro para navegar." +

            "<br><strong>Protocolo:</strong> " + protocolo +
            "<br><strong>Dominio:</strong> " + dominio +
            "<br><strong>Ruta:</strong> " + ruta +
            "<br><br>" + alertas +

            informacionBackend;

    }

    else if (enlace.startsWith("http://")) {

        let protocolo = match[1];
        let dominio = match[2];
        let ruta = match[3] || "/";

        alertas +=
            "Utiliza HTTP en lugar de HTTPS.<br>";

        if (acortadores.includes(dominio)) {

            alertas +=
                "URL acortada detectada.<br>" +
                "El destino real del enlace está oculto.<br>";
        }

        if (regexIP.test(dominio)) {

            alertas +=
                "Se detectó una dirección IP en lugar de un dominio.<br>" +
                "Algunos sitios maliciosos utilizan direcciones IP para ocultar su verdadera identidad.<br><br>";
        }

        for (let palabra of palabrasPhishing) {

            if (enlace.toLowerCase().includes(palabra)) {

                alertas +=
                    "El enlace contiene palabras frecuentes utilizadas en links para phishing.<br><br>";

                break;
            }

        }

        resultado.innerHTML =

            "<strong>Alertas:</strong><br>" +
            alertas +

            "<br><strong>Protocolo:</strong> " + protocolo +
            "<br><strong>Dominio:</strong> " + dominio +
            "<br><strong>Ruta:</strong> " + ruta +

            informacionBackend;

    }

    else {

        resultado.innerHTML =
            "El enlace no parece válido.<br>" +
            "Verifique que esté escrito correctamente.";

    }

});