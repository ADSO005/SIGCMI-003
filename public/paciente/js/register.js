console.log("Archivo cargado");

setTimeout(() => {

  console.log("5 segundos después");

  console.log(document.getElementById("confirmPassword"));

}, 5000);
// ===============================
// SIGCMI - Registro de Pacientes
// ===============================

// Formulario
const formulario = document.querySelector(".register-form");

// Inputs
const nombres = document.getElementById("nombres");
const apellidos = document.getElementById("apellidos");
const email = document.getElementById("email");
const telefono = document.getElementById("telefono");
const fechaNacimiento = document.getElementById("fechaNacimiento");
const tipoDocumento = document.getElementById("tipoDocumento");
const numeroDocumento = document.getElementById("numeroDocumento");
const departamento = document.getElementById("departamento");
const ciudad = document.getElementById("ciudad");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");

const togglePassword = document.getElementById("togglePassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

const strengthBar = document.getElementById("strengthBar");
const strengthText = document.getElementById("strengthText");

console.log(strengthBar);
console.log(strengthText);

const ruleLength = document.getElementById("ruleLength");
const ruleUpper = document.getElementById("ruleUpper");
const ruleLower = document.getElementById("ruleLower");
const ruleNumber = document.getElementById("ruleNumber");
const ruleSpecial = document.getElementById("ruleSpecial");

// Temporizador para validar correo
let timeoutCorreo;

let timeoutDocumento;
// ===============================
// Estado de las validaciones
// ===============================

const estadoFormulario = {

  nombres: false,
  apellidos: false,
  email: false,
  telefono: false,
  fechaNacimiento: false,
  tipoDocumento: false,
  numeroDocumento: false,
  departamento: false,
  ciudad: false,
  password: false,
  confirmPassword: false

};
// ===============================
// Expresiones regulares
// ===============================

const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
const soloNumeros = /^[0-9]+$/;
const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const passwordSegura =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,20}$/;

// ===============================
// Funciones auxiliares
// ===============================

function mostrarError(input, mensaje) {

  input.classList.remove("input-success");
  input.classList.add("input-error");

  const grupo = input.closest(".form-group");

  let error = grupo.querySelector(".form-error");

  if (!error) {

    error = document.createElement("span");
    error.className = "form-error";

    grupo.appendChild(error);

  }

  error.textContent = mensaje;

  // No mostrar iconos en los campos de contraseña
  if (
    input.id === "password" ||
    input.id === "confirmPassword"
  ) {
    return;
  }

  let icono = grupo.querySelector(".validation-icon");

  if (!icono) {

    icono = document.createElement("i");
    grupo.querySelector(".input-wrapper").appendChild(icono);

  }

  icono.className = "validation-icon fa-solid fa-circle-xmark";

}

function mostrarExito(input) {

  input.classList.remove("input-error");
  input.classList.add("input-success");

  const grupo = input.closest(".form-group");

  const error = grupo.querySelector(".form-error");

  if (error) {

    error.textContent = "";

  }

  // No mostrar iconos en los campos de contraseña
  if (
    input.id === "password" ||
    input.id === "confirmPassword"
  ) {
    return;
  }

  let icono = grupo.querySelector(".validation-icon");

  if (!icono) {

    icono = document.createElement("i");

    grupo.querySelector(".input-wrapper").appendChild(icono);

  }

  icono.className =
    "validation-icon fa-solid fa-circle-check";

}

// ===============================
// Validar Nombres
// ===============================

function validarNombres() {

  return validarCampoTexto(
    nombres,
    "Nombres",
    2,
    50
  );

}
function validarApellidos() {

  return validarCampoTexto(
    apellidos,
    "Apellidos",
    2,
    50
  );

}

// ===============================
// Validar Correo Electrónico
// ===============================

function validarEmail() {

  // Eliminar espacios y convertir a minúsculas
  email.value = email.value.trim();
  email.value = email.value.toLowerCase();

  const valor = email.value;

  if (valor === "") {

    mostrarError(email, "El correo electrónico es obligatorio.");
    estadoFormulario.email = false;
    return false;

  }

  if (valor.length > 100) {

    mostrarError(email, "El correo no puede superar los 100 caracteres.");
    estadoFormulario.email = false;
    return false;

  }

  if (!correoValido.test(valor)) {

    mostrarError(email, "Ingrese un correo electrónico válido.");
    estadoFormulario.email = false;
    return false;

  }

  mostrarExito(email);

  estadoFormulario.email = true;

  return true;

}


// ===============================
// Validar Teléfono
// ===============================

function validarTelefono() {

  const valor = telefono.value.trim();

  if (valor === "") {

    mostrarError(telefono, "El teléfono es obligatorio.");
    estadoFormulario.telefono = false;
    return false;

  }

  if (!soloNumeros.test(valor)) {

    mostrarError(telefono, "Solo se permiten números.");
    estadoFormulario.telefono = false;
    return false;

  }

  if (valor.length !== 10) {

    mostrarError(telefono, "El teléfono debe tener 10 dígitos.");
    estadoFormulario.telefono = false;
    return false;

  }

  if (!valor.startsWith("3")) {

    mostrarError(telefono, "Debe iniciar con el número 3.");
    estadoFormulario.telefono = false;
    return false;

  }

  mostrarExito(telefono);

  estadoFormulario.telefono = true;

  return true;

}

// ===============================
// Validar Fecha de Nacimiento
// ===============================

function validarFechaNacimiento() {

  const valor = fechaNacimiento.value;

  if (valor === "") {

    mostrarError(fechaNacimiento, "La fecha de nacimiento es obligatoria.");
    estadoFormulario.fechaNacimiento = false;
    return false;

  }

  const hoy = new Date();
  const fecha = new Date(valor);

  if (fecha > hoy) {

    mostrarError(fechaNacimiento, "La fecha no puede ser futura.");
    estadoFormulario.fechaNacimiento = false;
    return false;

  }

  let edad = hoy.getFullYear() - fecha.getFullYear();

  const mes = hoy.getMonth() - fecha.getMonth();

  if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {

    edad--;

  }

  if (edad < 18) {

    mostrarError(fechaNacimiento, "Debes ser mayor de 18 años.");
    estadoFormulario.fechaNacimiento = false;
    return false;

  }

  if (edad > 120) {

    mostrarError(fechaNacimiento, "Ingrese una fecha válida.");
    estadoFormulario.fechaNacimiento = false;
    return false;

  }

  mostrarExito(fechaNacimiento);

  estadoFormulario.fechaNacimiento = true;

  return true;

}

// ===============================
// Validar Tipo de Documento
// ===============================

function validarTipoDocumento() {

  const tiposValidos = ["CC", "CE", "TI", "PA"];

  if (!tiposValidos.includes(tipoDocumento.value)) {

    mostrarError(tipoDocumento, "Seleccione un tipo de documento válido.");

    estadoFormulario.tipoDocumento = false;

    return false;

  }

  mostrarExito(tipoDocumento);

  estadoFormulario.tipoDocumento = true;

  return true;

}

// ===============================
// Validar Número de Documento
// ===============================

function validarNumeroDocumento() {

  const valor = numeroDocumento.value.trim();

  if (valor === "") {

    mostrarError(numeroDocumento, "El número de documento es obligatorio.");

    estadoFormulario.numeroDocumento = false;

    return false;

  }

  if (!soloNumeros.test(valor)) {

    mostrarError(numeroDocumento, "Solo se permiten números.");

    estadoFormulario.numeroDocumento = false;

    return false;

  }

  if (valor.length < 6 || valor.length > 15) {

    mostrarError(numeroDocumento, "Debe tener entre 6 y 15 dígitos.");

    estadoFormulario.numeroDocumento = false;

    return false;

  }

  mostrarExito(numeroDocumento);

  estadoFormulario.numeroDocumento = true;

  return true;

}



// ===============================
// Validar Ciudad
// ===============================

function validarCiudad() {

  return validarCampoTexto(
    ciudad,
    "Ciudad",
    2,
    50
  );

}


// ===============================
// Validar Contraseña
// ===============================

function validarPassword() {

  const valor = password.value;

  if (valor === "") {

    mostrarError(password, "La contraseña es obligatoria.");
    estadoFormulario.password = false;
    return false;

  }

  if (valor.length < 8) {

    mostrarError(password, "Debe tener mínimo 8 caracteres.");
    estadoFormulario.password = false;
    return false;

  }

  if (valor.length > 20) {

    mostrarError(password, "Máximo 20 caracteres.");
    estadoFormulario.password = false;
    return false;

  }

  if (!passwordSegura.test(valor)) {

    mostrarError(
      password,
      "Debe contener mayúscula, minúscula, número y carácter especial."
    );

    estadoFormulario.password = false;

    return false;

  }

  mostrarExito(password);

  estadoFormulario.password = true;

  return true;

}


// ===============================
// Validar Confirmar Contraseña
// ===============================

function validarConfirmPassword() {

  console.log("Validando confirmación...");
  const valor = confirmPassword.value;

  if (valor === "") {

    mostrarError(confirmPassword, "Debe confirmar la contraseña.");

    estadoFormulario.confirmPassword = false;

    return false;

  }

  if (valor !== password.value) {

    mostrarError(confirmPassword, "Las contraseñas no coinciden.");

    estadoFormulario.confirmPassword = false;

    return false;

  }

  mostrarExito(confirmPassword);

  estadoFormulario.confirmPassword = true;

  return true;

}


// ===============================
// Solo letras
// ===============================

function permitirSoloLetras(evento) {

  const tecla = evento.key;

  // Permitir teclas de control
  const teclasPermitidas = [
    "Backspace",
    "Delete",
    "ArrowLeft",
    "ArrowRight",
    "Tab",
    "Home",
    "End"
  ];

  if (teclasPermitidas.includes(tecla)) {
    return;
  }

  // Solo letras, espacios, tildes y ñ
  if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]$/.test(tecla)) {
    evento.preventDefault();
  }

}

// ===============================
// Solo números
// ===============================

function permitirSoloNumeros(evento) {

  const tecla = evento.key;

  const teclasPermitidas = [
    "Backspace",
    "Delete",
    "ArrowLeft",
    "ArrowRight",
    "Tab",
    "Home",
    "End"
  ];

  if (teclasPermitidas.includes(tecla)) {
    return;
  }

  if (!/^[0-9]$/.test(tecla)) {
    evento.preventDefault();
  }

}

function limpiarSoloLetras(input) {

  input.value = input.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, "");

}


function eliminarEspacios(input) {

  input.value = input.value.replace(/\s/g, "");

}

function limpiarSoloNumeros(input, maximo) {

  input.value = input.value.replace(/\D/g, "");

  input.value = input.value.substring(0, maximo);

}

// ===============================
// Validar campos de texto
// ===============================

function validarCampoTexto(input, nombreCampo, minimo, maximo) {

  const valor = input.value.trim();

  if (valor === "") {
    mostrarError(input, `El campo ${nombreCampo} es obligatorio.`);
    estadoFormulario[input.id] = false;
    return false;
  }

  if (valor.length < minimo) {
    mostrarError(input, `Debe tener mínimo ${minimo} caracteres.`);
    estadoFormulario[input.id] = false;
    return false;
  }

  if (valor.length > maximo) {
    mostrarError(input, `Máximo ${maximo} caracteres.`);
    estadoFormulario[input.id] = false;
    return false;
  }

  if (!soloLetras.test(valor)) {
    mostrarError(input, `Solo se permiten letras.`);
    estadoFormulario[input.id] = false;
    return false;
  }

  mostrarExito(input);

  estadoFormulario[input.id] = true;

  return true;

}

// ===============================
// Eventos
// ===============================

nombres.addEventListener("input", () => {

  limpiarSoloLetras(nombres);

  validarNombres();

});

nombres.addEventListener("blur", validarNombres);

nombres.addEventListener("keydown", permitirSoloLetras);

// ===============================
// Apellidos
// ===============================

apellidos.addEventListener("keydown", permitirSoloLetras);

apellidos.addEventListener("input", () => {

  limpiarSoloLetras(apellidos);

  validarApellidos();

});

apellidos.addEventListener("blur", validarApellidos);


// ===============================
// Correo Electrónico
// ===============================

email.addEventListener("input", () => {

  eliminarEspacios(email);

  validarEmail();

  clearTimeout(timeoutCorreo);

  timeoutCorreo = setTimeout(() => {

    verificarCorreo();

  }, 700);

});

email.addEventListener("paste", () => {

  setTimeout(() => {

    eliminarEspacios(email);
    validarEmail();

  }, 0);

});

email.addEventListener("blur", () => {

  clearTimeout(timeoutCorreo);

  verificarCorreo();

});


// ===============================
// Teléfono
// ===============================


telefono.addEventListener("input", () => {

  limpiarSoloNumeros(telefono, 10);

  validarTelefono();

});

telefono.addEventListener("paste", () => {

  setTimeout(() => {

    limpiarSoloNumeros(telefono, 10);

    validarTelefono();

  }, 0);

});

telefono.addEventListener("keydown", permitirSoloNumeros);

telefono.addEventListener("blur", validarTelefono);

// ===============================
// Fecha de Nacimiento
// ===============================

fechaNacimiento.addEventListener("change", validarFechaNacimiento);

fechaNacimiento.addEventListener("blur", validarFechaNacimiento);

// ===============================
// Tipo de Documento
// ===============================

tipoDocumento.addEventListener("change", validarTipoDocumento);

// ===============================
// Número de Documento
// ===============================

numeroDocumento.addEventListener("keydown", permitirSoloNumeros);

numeroDocumento.addEventListener("input", () => {

  limpiarSoloNumeros(numeroDocumento, 15);

  validarNumeroDocumento();

  clearTimeout(timeoutDocumento);

  timeoutDocumento = setTimeout(() => {

    verificarDocumento();

  }, 700);

});

numeroDocumento.addEventListener("paste", () => {

  setTimeout(() => {

    limpiarSoloNumeros(numeroDocumento, 15);

    validarNumeroDocumento();

  }, 0);

});

numeroDocumento.addEventListener("blur", () => {

  clearTimeout(timeoutDocumento);

  verificarDocumento();

});

// ===============================
// Validar Departamento
// ===============================

function validarDepartamento() {

  return validarCampoTexto(
    departamento,
    "Departamento",
    3,
    50
  );

}

// ===============================
// Ciudad
// ===============================

ciudad.addEventListener("keydown", permitirSoloLetras);

ciudad.addEventListener("input", () => {

  limpiarSoloLetras(ciudad);

  validarCiudad();

});

ciudad.addEventListener("blur", validarCiudad);



// ===============================
// Depaartamento
// ===============================

departamento.addEventListener("keydown", permitirSoloLetras);

departamento.addEventListener("input", () => {

  limpiarSoloLetras(departamento);

  validarDepartamento();

});

ciudad.addEventListener("blur", validarDepartamento);

// ===============================
// Contraseña
// ===============================

password.addEventListener("input", () => {

  actualizarFortalezaPassword();

  validarPassword();

  if (confirmPassword.value !== "") {

    validarConfirmPassword();

  }

});

password.addEventListener("blur", validarPassword);

// ===============================
// Confirmar Contraseña
// ===============================
confirmPassword.addEventListener("input", validarConfirmPassword);


confirmPassword.addEventListener("blur", validarConfirmPassword);


// ===============================
// Envío del formulario
// ===============================
formulario.addEventListener("submit", (e) => {

  e.preventDefault();

  validarNombres();
  validarApellidos();
  validarEmail();
  validarTelefono();
  validarFechaNacimiento();
  validarTipoDocumento();
  validarNumeroDocumento();
  validarDepartamento();
  validarCiudad();
  validarPassword();
  validarConfirmPassword();

  const formularioValido = Object.values(estadoFormulario).every(valor => valor);

  if (!formularioValido) {

    const primerError = document.querySelector(".input-error");

    if (primerError) {

      primerError.focus();

      primerError.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

    }

    return;

  }

  formulario.submit();

});

// ===============================
// Mostrar/Ocultar contraseña
// ===============================

togglePassword.addEventListener("click", () => {
  console.log("CLICK OJO");

  if (password.type === "password") {

    password.type = "text";

    togglePassword.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';

  } else {

    password.type = "password";

    togglePassword.innerHTML = '<i class="fa-solid fa-eye"></i>';

  }

});


toggleConfirmPassword.addEventListener("click", () => {

  if (confirmPassword.type === "password") {

    confirmPassword.type = "text";

    toggleConfirmPassword.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';

  } else {

    confirmPassword.type = "password";

    toggleConfirmPassword.innerHTML = '<i class="fa-solid fa-eye"></i>';

  }

});

// ===============================
// Actualizar regla de contraseña
// ===============================

function actualizarRegla(elemento, cumple) {

  const icono = elemento.querySelector("i");

  if (cumple) {

    elemento.style.color = "#16a34a";

    icono.className = "fa-solid fa-circle-check";

    icono.style.color = "#22c55e";

  } else {

    elemento.style.color = "#dc2626";

    icono.className = "fa-solid fa-circle-xmark";

    icono.style.color = "#ef4444";

  }

}

// ===============================
// Fortaleza de contraseña
// ===============================

function actualizarFortalezaPassword() {

  const valor = password.value;

  let puntos = 0;

  const tieneLongitud = valor.length >= 8;
  const tieneMayuscula = /[A-Z]/.test(valor);
  const tieneMinuscula = /[a-z]/.test(valor);
  const tieneNumero = /\d/.test(valor);
  const tieneEspecial = /[@$!%*?&.#_-]/.test(valor);

  actualizarRegla(ruleLength, tieneLongitud);
  actualizarRegla(ruleUpper, tieneMayuscula);
  actualizarRegla(ruleLower, tieneMinuscula);
  actualizarRegla(ruleNumber, tieneNumero);
  actualizarRegla(ruleSpecial, tieneEspecial);

  if (tieneLongitud) puntos++;
  if (tieneMayuscula) puntos++;
  if (tieneMinuscula) puntos++;
  if (tieneNumero) puntos++;
  if (tieneEspecial) puntos++;

  switch (puntos) {

    case 0:
    case 1:

      strengthBar.style.width = "20%";
      strengthBar.style.background = "#ef4444";
      strengthText.textContent = "Muy débil";

      break;

    case 2:

      strengthBar.style.width = "40%";
      strengthBar.style.background = "#f97316";
      strengthText.textContent = "Débil";

      break;

    case 3:

      strengthBar.style.width = "60%";
      strengthBar.style.background = "#eab308";
      strengthText.textContent = "Media";

      break;

    case 4:

      strengthBar.style.width = "80%";
      strengthBar.style.background = "#22c55e";
      strengthText.textContent = "Fuerte";

      break;

    case 5:

      strengthBar.style.width = "100%";
      strengthBar.style.background = "#16a34a";
      strengthText.textContent = "Muy fuerte";

      break;

  }

}

// ===============================
// Verificar correo en la BD
// ===============================

async function verificarCorreo() {

  const valor = email.value.trim().toLowerCase();

  // Primero validar el formato del correo
  if (!validarEmail()) {
    return;
  }

  try {

    const respuesta = await fetch(`/auth/check-email?email=${encodeURIComponent(valor)}`);

    const datos = await respuesta.json();

    if (datos.existe) {

      mostrarError(email, "Este correo ya está registrado.");

      estadoFormulario.email = false;

    } else {

      mostrarExito(email);

      estadoFormulario.email = true;

    }

  } catch (error) {

    console.error(error);

  }

}

// ===============================
// Verificar documento en la BD
// ===============================

async function verificarDocumento() {

  const valor = numeroDocumento.value.trim();

  if (!validarNumeroDocumento()) {
    return;
  }

  try {

    const respuesta = await fetch(
      `/auth/check-document?documento=${encodeURIComponent(valor)}`
    );

    const datos = await respuesta.json();

    if (datos.existe) {

      mostrarError(
        numeroDocumento,
        "Este número de documento ya está registrado."
      );

      estadoFormulario.numeroDocumento = false;

    } else {

      mostrarExito(numeroDocumento);

      estadoFormulario.numeroDocumento = true;

    }

  } catch (error) {

    console.error(error);

  }

}