// Nombres y apellidos: cada palabra con la primera letra en mayúscula y el resto en minúscula.
// "jUAN  carlos pérez-gómez" => "Juan Carlos Pérez-Gómez"
export const capitalizarNombre = (valor) => typeof valor === "string"
    ? valor.trim().replace(/\s+/g, " ").normalize("NFC").toLocaleLowerCase("es-CO")
        .replace(/(^|[\s'-])(\p{L})/gu, (_, separador, letra) => `${separador}${letra.toLocaleUpperCase("es-CO")}`)
    : "";

export const normalizarCorreo = (valor) => typeof valor === "string"
    ? valor.replace(/\s+/g, "").toLowerCase()
    : "";
