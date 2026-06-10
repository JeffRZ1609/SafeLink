let boton = document.getElementById("btnAnalizar");
let resultado = document.getElementById("resultado");

boton.addEventListener("click", function () {

    let enlace = document.getElementById("url").value.trim();


    const regex =
    /^(https?):\/\/([^\/]+)(\/.*)?$/i;

    const match = enlace.match(regex);

    if (enlace === "") {

        resultado.innerHTML = " Por favor, ingrese un enlace.";

    } else if (enlace.startsWith("https://")) {

        let protocolo = match[1];
        let dominio = match[2];
        let ruta = match[3] || "/";

        resultado.innerHTML =
            " El enlace parece seguro.<br>" +
            "Utiliza HTTPS, que es un protocolo más seguro para navegar." +

            "<br><strong>Protocolo:</strong>" + protocolo +
            "<br><strong>Dominio</strong>" + dominio +
            "<br><strong>Ruta:</strong>" + ruta;

    } else if (enlace.startsWith("http://")) {
        
        let protocolo = match[1];
        let dominio = match[2];
        let ruta = match[3] || "/";


        resultado.innerHTML =
            " Ten cuidado con este enlace.<br>" +
            "Utiliza HTTP en lugar de HTTPS." +

            "<br><strong>Protocolo:</strong>" + protocolo +
            "<br><strong>Dominio</strong>" + dominio +
            "<br><strong>Ruta:</strong>" + ruta;


    } else {

        resultado.innerHTML =
            " El enlace no parece válido.<br>" +
            "Verifique que esté escrito correctamente.";

    }

});