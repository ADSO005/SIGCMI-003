// Lleva el foco al resultado para que también se anuncie a usuarios de teclado o lector de pantalla.
const confirmationMessage = document.getElementById("mensajeConfirmacion");

confirmationMessage?.setAttribute("tabindex", "-1");
confirmationMessage?.focus({ preventScroll: true });
