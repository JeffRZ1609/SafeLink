let boton = document.getElementById("btnAnalizar");
let resultado = document.getElementById("resultado");

boton.addEventListener("click", function () {

    let enlace = document.getElementById("url").value.trim();


    const regex =
        /^(https?):\/\/([^\/]+)(\/.*)?$/i;

    const match = enlace.match(regex);

    if (enlace !== "" && !match) {

        resultado.innerHTML =
            "El enlace no parece valido.<br>"

        return;
    }

    let positivos = "";
    let alertas ="";

     const acortadores = [
        "bit.ly",
        "tinyurl.com",
        "t.co",
        "cutt.ly",
        "ow.ly",
        "is.gd"
    ];


    if (enlace === "") {

        resultado.innerHTML = " Por favor, ingrese un enlace.";

    } else if (enlace.startsWith("https://")) {

        let protocolo = match[1];
        let dominio = match[2];
        let ruta = match[3] || "/";

        positivos += "✓ Utiliza HTTPS<br>";

        if (acortadores.includes(dominio)) {

            alertas +=
                "URL acortada detectada.<br>" +
                "El destino real del enlace está oculto.<br>";
        }

        resultado.innerHTML =

            " El enlace parece seguro.<br>" +
            "Utiliza HTTPS, que es un protocolo más seguro para navegar." +

            "<br><strong>Protocolo:</strong>" + protocolo +
            "<br><strong>Dominio</strong>" + dominio +
            "<br><strong>Ruta:</strong>" + ruta +
            "<br><br>" + alertas;

    } else if (enlace.startsWith("http://")) {

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


        resultado.innerHTML =

            "<strong>Alertas:</strong><br>" +
            alertas +   


            "<br><strong>Protocolo:</strong>" + protocolo +
            "<br><strong>Dominio</strong>" + dominio +
            "<br><strong>Ruta:</strong>" + ruta;


    } else {

        resultado.innerHTML =
            " El enlace no parece válido.<br>" +
            "Verifique que esté escrito correctamente.";

    }

});