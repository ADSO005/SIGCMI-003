const PASSWORD_POLICY_MESSAGE = "La contraseña debe tener entre 8 y 16 caracteres e incluir mayúscula, minúscula, número y símbolo.";

const getPasswordPolicyError = (password) => {
  const isValid = typeof password === "string" &&
    password.length >= 8 && password.length <= 16 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  return isValid ? null : PASSWORD_POLICY_MESSAGE;
};

export { getPasswordPolicyError, PASSWORD_POLICY_MESSAGE };
