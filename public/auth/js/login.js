// Permite mostrar u ocultar la contraseña ingresada.
const passwordInput = document.getElementById("password");
const togglePasswordButton = document.getElementById("togglePassword");

togglePasswordButton?.addEventListener("click", () => {
  if (!passwordInput) return;

  const showPassword = passwordInput.type === "password";
  const eyeIcon = togglePasswordButton.querySelector(".eye-icon");
  const eyeSlashIcon = togglePasswordButton.querySelector(".eye-slash-icon");
  passwordInput.type = showPassword ? "text" : "password";
  togglePasswordButton.setAttribute("aria-pressed", String(showPassword));
  togglePasswordButton.setAttribute(
    "aria-label",
    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
  );
  togglePasswordButton.title = showPassword ? "Ocultar contraseña" : "Mostrar contraseña";
  eyeIcon?.classList.toggle("hidden", !showPassword);
  eyeSlashIcon?.classList.toggle("hidden", showPassword);
});
