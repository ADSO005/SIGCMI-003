// Búsqueda tolerante: ignora mayúsculas, tildes, la ñ y los signos o caracteres especiales.
// "jose" encuentra "José", "munoz" encuentra "Muñoz" y "test med 001" encuentra "TEST-MED-001".
// Uso: Busqueda.coincide(texto, campo1, campo2, ...). Con el texto vacío todo coincide.
(() => {
    if (window.Busqueda) return;

    // Quita tildes y diacríticos, pasa a minúsculas y cambia cualquier signo por un espacio.
    const normalizar = (valor) => String(valor ?? "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();

    const compacto = (texto) => texto.replace(/ /g, "");

    // Cada palabra escrita debe aparecer (en cualquier orden) en alguno de los campos.
    // Además se compara sin espacios, para que "123456" encuentre "123.456" o "123 456".
    function coincide(consulta, ...campos) {
        const buscada = normalizar(consulta);
        if (!buscada) return true;

        const contenido = normalizar(campos.join(" "));
        return buscada.split(" ").every((palabra) => contenido.includes(palabra))
            || compacto(contenido).includes(compacto(buscada));
    }

    window.Busqueda = { normalizar, coincide };
})();
