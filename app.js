let boton = document.getElementById("btnAnalizar");
let resultado = document.getElementById("resultado");

boton.addEventListener("click", function () {

    let enlace = document.getElementById("url").value;

    if (enlace === "") {

        resultado.innerHTML = " Por favor, ingresa un enlace.";

    } else if (enlace.startsWith("https://")) {

        resultado.innerHTML =
            " El enlace parece seguro.<br>" +
            "Utiliza HTTPS, que es un protocolo más seguro para navegar.";

    } else if (enlace.startsWith("http://")) {

        resultado.innerHTML =
            " Ten cuidado con este enlace.<br>" +
            "Utiliza HTTP en lugar de HTTPS.";

    } else {

        resultado.innerHTML =
            " El enlace no parece válido.<br>" +
            "Verifica que esté escrito correctamente.";

    }

});