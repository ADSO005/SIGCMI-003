// Limita el código OTP a seis dígitos numéricos mientras se escribe o pega.
const otpInput = document.getElementById("codigo");

otpInput.addEventListener("input", () => {
  otpInput.value = otpInput.value.replace(/\D/g, "").slice(0, 6);
});
