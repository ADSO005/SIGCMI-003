// Oculta los avisos del inicio de sesión después de unos segundos.
setTimeout(() => {
  document.getElementById("mensajeError")?.remove();
  document.getElementById("mensajeExito")?.remove();
}, 4000);
