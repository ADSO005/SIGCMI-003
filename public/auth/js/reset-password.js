const passwordInput = document.getElementById("password");
const confirmationInput = document.getElementById("password_confirmation");
const passwordForm = passwordInput?.form;
const strengthBar = document.getElementById("passwordStrengthBar");
const strengthText = document.getElementById("passwordStrengthText");
const matchBar = document.getElementById("passwordMatchBar");
const matchText = document.getElementById("passwordMatchText");

// Requisitos usados para medir la seguridad de la contraseña en pantalla.
const passwordRules = [
  (value) => value.length >= 8 && value.length <= 16,
  (value) => /[A-Z]/.test(value),
  (value) => /[a-z]/.test(value),
  (value) => /[0-9]/.test(value),
  (value) => /[^A-Za-z0-9]/.test(value)
];
const strengthColors = ["bg-slate-300", "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-lime-500", "bg-emerald-500"];
const passwordPolicyMessage = "La contraseña debe tener entre 8 y 16 caracteres e incluir mayúscula, minúscula, número y símbolo.";

// Actualiza la validez del campo y la barra de seguridad.
const updatePasswordFeedback = () => {
  const password = passwordInput.value;
  const score = passwordRules.filter((rule) => rule(password)).length;

  passwordInput.setCustomValidity(password.length === 0 || score === passwordRules.length ? "" : passwordPolicyMessage);
  strengthBar.className = `h-full rounded-full transition-all duration-300 ${strengthColors[score]}`;
  strengthBar.style.width = `${score * 20}%`;
  strengthText.textContent = password.length === 0
    ? "Escribe una contraseña para ver su nivel."
    : `${score === 5 ? "Segura" : "Incompleta"} · ${score}/5 requisitos`;

  updatePasswordMatch();
};

// Compara la contraseña con su confirmación y actualiza la barra correspondiente.
const updatePasswordMatch = () => {
  const confirmation = confirmationInput.value;
  const matches = confirmation.length > 0 && confirmation === passwordInput.value;
  const mismatch = confirmation.length > 0 && !matches;

  confirmationInput.setCustomValidity(mismatch ? "Las contraseñas no coinciden." : "");
  matchBar.style.width = confirmation.length > 0 ? "100%" : "0%";
  matchBar.className = `h-full rounded-full transition-all duration-300 ${matches ? "bg-emerald-500" : mismatch ? "bg-red-500" : "bg-slate-300"}`;
  matchText.textContent = matches
    ? "Las contraseñas coinciden."
    : mismatch
      ? "Las contraseñas no coinciden."
      : "Confirma la contraseña para comprobar que coincida.";
};

passwordInput.addEventListener("input", updatePasswordFeedback);
confirmationInput.addEventListener("input", updatePasswordMatch);

// Permite alternar entre mostrar y ocultar cada campo de contraseña.
document.querySelectorAll("[data-password-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.passwordToggle);
    const visible = input.type === "password";
    const eyeIcon = button.querySelector(".eye-icon");
    const eyeSlashIcon = button.querySelector(".eye-slash-icon");

    input.type = visible ? "text" : "password";
    button.setAttribute("aria-pressed", String(visible));
    button.setAttribute("aria-label", visible ? "Ocultar contraseña" : "Mostrar contraseña");
    button.title = visible ? "Ocultar contraseña" : "Mostrar contraseña";
    eyeIcon.classList.toggle("hidden", visible);
    eyeSlashIcon.classList.toggle("hidden", !visible);
  });
});

passwordForm.addEventListener("submit", (event) => {
  updatePasswordFeedback();
  if (!passwordForm.reportValidity()) event.preventDefault();
});

updatePasswordFeedback();

// Retira el mensaje de error después de unos segundos.
setTimeout(() => {
  document.getElementById("mensajeError")?.remove();
}, 5000);
