// Formato en tiempo real de los formularios del sistema:
//  - Nombres y apellidos: cada palabra empieza con mayúscula ("juan pérez" => "Juan Pérez").
//  - Correos: siempre en minúscula y sin espacios.
//  - Fechas: el año se limita a cuatro dígitos.
// Se aplica a cualquier campo con esos nombres, aunque se cree después (modales, etc.).
// Para excluir un campo: data-sin-formato.
(() => {
    if (window.__formulariosActivo) return;
    window.__formulariosActivo = true;

    const CAMPOS_NOMBRE = new Set(["nombres", "apellidos", "contactoNombres", "contactoApellidos"]);
    const CAMPOS_CORREO = new Set(["correo", "email", "contactoCorreo"]);
    const FECHA_MAXIMA = "9999-12-31";

    // Misma regla que el servidor (utils/formatoTexto.js). Se conserva un espacio final mientras se escribe.
    const capitalizar = (valor) => valor
        .replace(/\s+/g, " ")
        .replace(/^ /, "")
        .toLocaleLowerCase("es-CO")
        .replace(/(^|[\s'-])(\p{L})/gu, (_, separador, letra) => `${separador}${letra.toLocaleUpperCase("es-CO")}`);

    const minuscula = (valor) => valor.replace(/\s+/g, "").toLowerCase();

    const formatoDe = (campo) => {
        if (campo.hasAttribute("data-sin-formato")) return null;
        if (campo.type === "email" || CAMPOS_CORREO.has(campo.name)) return minuscula;
        if (CAMPOS_NOMBRE.has(campo.name)) return capitalizar;
        return null;
    };

    // Cambia el valor sin que el cursor salte al final. Los campos type="email" no dejan leer el
    // cursor: para ellos el texto ya llega en minúscula desde "beforeinput" (ver más abajo).
    function reemplazarValor(campo, nuevo) {
        const cursor = campo.selectionStart;
        const longitudAntes = campo.value.length;
        campo.value = nuevo;
        if (cursor !== null) {
            const posicion = Math.max(0, Math.min(nuevo.length, cursor + (nuevo.length - longitudAntes)));
            campo.setSelectionRange(posicion, posicion);
        }
    }

    // Correos: lo que se escribe o se pega se convierte antes de entrar al campo, así el cursor no se mueve
    // aunque se edite en medio del texto.
    document.addEventListener("beforeinput", (evento) => {
        const campo = evento.target;
        if (!(campo instanceof HTMLInputElement) || evento.isComposing || formatoDe(campo) !== minuscula) return;
        if (!["insertText", "insertFromPaste", "insertFromDrop"].includes(evento.inputType)) return;

        const original = evento.data ?? evento.dataTransfer?.getData("text/plain") ?? "";
        const convertido = minuscula(original);
        if (!original || convertido === original) return;

        evento.preventDefault();
        if (convertido) document.execCommand("insertText", false, convertido);
    });

    document.addEventListener("input", (evento) => {
        const campo = evento.target;
        if (!(campo instanceof HTMLInputElement) || evento.isComposing) return;

        if (campo.type === "date") {
            // El navegador acepta años de hasta 6 dígitos: se recorta a 4.
            const exceso = /^(\d{4})\d+(-.*)$/.exec(campo.value);
            if (exceso) campo.value = exceso[1] + exceso[2];
            return;
        }

        const formato = formatoDe(campo);
        if (!formato) return;
        const nuevo = formato(campo.value);
        if (nuevo !== campo.value) reemplazarValor(campo, nuevo);
    });

    // Al salir del campo se quitan los espacios sobrantes de los nombres.
    document.addEventListener("focusout", (evento) => {
        const campo = evento.target;
        if (!(campo instanceof HTMLInputElement) || formatoDe(campo) !== capitalizar) return;
        const limpio = campo.value.trim();
        if (limpio !== campo.value) campo.value = limpio;
    });

    // Fechas: tope de año 9999 salvo que el campo ya tenga un máximo menor.
    const limitarFecha = (campo) => {
        if (!campo.max || campo.max > FECHA_MAXIMA) campo.max = FECHA_MAXIMA;
    };
    const limitarFechas = () => document.querySelectorAll('input[type="date"]').forEach(limitarFecha);

    document.addEventListener("focusin", (evento) => {
        if (evento.target instanceof HTMLInputElement && evento.target.type === "date") limitarFecha(evento.target);
    });
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", limitarFechas);
    else limitarFechas();
})();
