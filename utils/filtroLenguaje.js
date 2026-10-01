// =====================================================
// FILTRO DE LENGUAJE INAPROPIADO
// =====================================================

const palabrasBloqueadas = [
    // Insultos y groserías generales
    "puta",
    "puto",
    "putas",
    "putos",
    "mierda",
    "mierdas",
    "marica",
    "maricas",
    "maricon",
    "maricona",
    "maricones",
    "gonorrea",
    "gonorreas",
    "hijueputa",
    "hijueputas",
    "hijueputo",
    "hijueputos",
    "malparido",
    "malparida",
    "malparidos",
    "malparidas",

    // Insultos
    "imbecil",
    "idiota",
    "estupido",
    "estupida",
    "pendejo",
    "pendeja",
    "tarado",
    "tarada",
    "bruto",
    "bruta",
    "baboso",
    "babosa",
    "payaso",
    "payasa",
    "animal",
    "animales",

    // Groserías colombianas
    "carechimba",
    "carechimbas",
    "caremonda",
    "caremondas",
    "careverga",
    "carevergas",
    "chimba",
    "chimbas",
    "monda",
    "mondas",
    "gonorrea",
    "gonorreas",

    // Términos vulgares
    "verga",
    "vergas",
    "polla",
    "pollas",
    "coño",
    "coños",
    "culo",
    "culos",
    "jopo",
    "jopos",

    // Expresiones
    "jodete",
    "jodido",
    "jodida",
    "joder",
    "chingar",
    "chingada",
    "chingado",
    "chingados",

    // Expresiones compuestas
    "hijo de puta",
    "hijos de puta",
    "vete a la mierda",
    "vete al carajo",
    "vete a la verga",
    "que te jodan"
];


// =====================================================
// SUSTITUCIONES COMUNES
// =====================================================

const sustituciones = {
    "0": "o",
    "1": "i",
    "3": "e",
    "4": "a",
    "5": "s",
    "7": "t",
    "@": "a",
    "$": "s"
};


// =====================================================
// NORMALIZAR TEXTO
// =====================================================

const normalizarTexto = (texto = "") => {

    let resultado = String(texto)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");


    // Sustituir números y símbolos comunes
    resultado = resultado
        .split("")
        .map(caracter =>
            sustituciones[caracter] ?? caracter
        )
        .join("");


    return resultado;
};


// =====================================================
// CREAR VERSIÓN SIN SEPARADORES
// =====================================================

const eliminarSeparadores = (texto) => {

    return texto
        .replace(/[^a-z]/g, "");

};


// =====================================================
// REDUCIR LETRAS REPETIDAS
// =====================================================

const reducirRepeticiones = (texto) => {

    return texto.replace(
        /(.)\1{2,}/g,
        "$1$1"
    );

};


// =====================================================
// COMPROBAR LENGUAJE INAPROPIADO
// =====================================================

export const contieneLenguajeInapropiado = (texto = "") => {

    const original =
        String(texto);

    const normalizado =
        normalizarTexto(original);

    const sinSeparadores =
        eliminarSeparadores(normalizado);

    const sinRepeticiones =
        reducirRepeticiones(sinSeparadores);


    for (const palabra of palabrasBloqueadas) {

        const palabraNormalizada =
            normalizarTexto(palabra);

        const palabraSinSeparadores =
            eliminarSeparadores(
                palabraNormalizada
            );


        // ---------------------------------------------
        // Buscar directamente
        // ---------------------------------------------

        if (
            normalizado.includes(
                palabraNormalizada
            )
        ) {

            return true;
        }


        // ---------------------------------------------
        // Buscar eliminando separadores
        // ---------------------------------------------

        if (
            sinSeparadores.includes(
                palabraSinSeparadores
            )
        ) {

            return true;
        }


        // ---------------------------------------------
        // Buscar ignorando repeticiones
        // ---------------------------------------------

        if (
            sinRepeticiones.includes(
                palabraSinSeparadores
            )
        ) {

            return true;
        }

    }


    return false;

};


// =====================================================
// EXPORTAR LISTA
// =====================================================

export {
    palabrasBloqueadas
};