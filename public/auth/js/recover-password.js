// Retira los mensajes temporales del formulario de recuperación.
setTimeout(() => {
  document.getElementById("mensajeError")?.remove();
  document.getElementById("mensajeExito")?.remove();
}, 4000);
