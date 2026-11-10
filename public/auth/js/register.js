const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const departmentSelect = document.getElementById("departamento");
const citySelect = document.getElementById("ciudad");
const departmentStatus = document.getElementById("departamentoEstado");
const cityStatus = document.getElementById("ciudadEstado");
const retryDepartmentsButton = document.getElementById("reintentarDepartamentos");
const retryCitiesButton = document.getElementById("reintentarCiudades");
const strengthBar = document.getElementById("passwordStrengthBar");
const strengthText = document.getElementById("passwordStrengthText");
const matchBar = document.getElementById("confirmPasswordMatchBar");
const matchText = document.getElementById("confirmPasswordMatchText");
const strengthLevels = ["Muy débil", "Débil", "En progreso", "Casi segura", "Segura"];
const registerForm = document.querySelector(".register-form");
const birthDateInput = document.getElementById("fechaNacimiento");
const documentTypeSelect = document.getElementById("tipoDocumento");
const documentNumberInput = document.getElementById("numeroDocumento");
const personNameInputs = ["nombres", "apellidos"]
  .map((id) => document.getElementById(id))
  .filter(Boolean);

const formatPersonName = (value) => value.trim().normalize("NFC")
  .toLocaleLowerCase("es-CO")
  .replace(/(^|[\s'-])(\p{L})/gu, (_, separator, letter) => `${separator}${letter.toLocaleUpperCase("es-CO")}`);

const normalizePersonNames = () => {
  personNameInputs.forEach((input) => {
    input.value = formatPersonName(input.value);
  });
};

personNameInputs.forEach((input) => input.addEventListener("blur", () => {
  input.value = formatPersonName(input.value);
}));

registerForm.addEventListener("submit", normalizePersonNames);

// Aplica el formato y el límite adecuados al tipo de documento elegido.
const validateDocumentNumber = () => {
  const documentType = documentTypeSelect.value;
  const maxLength = documentType === "CC" ? 10 : documentType === "CE" ? 7 : 30;
  const documentNumber = documentNumberInput.value.trim();
  const isNumericDocument = documentType === "PA" || /^\d+$/.test(documentNumber);
  const isWithinLimit = documentNumber.length <= maxLength;

  documentNumberInput.maxLength = maxLength;
  documentNumberInput.inputMode = documentType === "PA" ? "text" : "numeric";
  documentNumberInput.placeholder = documentType === "PA" ? "Número de pasaporte" : "Número de documento";
  documentNumberInput.setCustomValidity(!documentNumber || (isNumericDocument && isWithinLimit)
    ? ""
    : documentType === "PA"
      ? "El pasaporte no puede superar 30 caracteres."
      : `Ingresa solo números (máximo ${maxLength} dígitos).`);
};

documentTypeSelect.addEventListener("change", validateDocumentNumber);
documentNumberInput.addEventListener("input", validateDocumentNumber);
validateDocumentNumber();

// Impide enviar una fecha que no cumpla la edad mínima del registro.
const validateBirthDate = () => {
  const isAdultDate = birthDateInput.value && birthDateInput.value <= birthDateInput.max;
  birthDateInput.setCustomValidity(isAdultDate ? "" : "Debes tener al menos 18 años para crear una cuenta.");
};

birthDateInput.addEventListener("input", validateBirthDate);
birthDateInput.addEventListener("change", validateBirthDate);
validateBirthDate();

registerForm.addEventListener("submit", (event) => {
  validateBirthDate();
  if (!registerForm.reportValidity()) event.preventDefault();
});

// Lleva el foco al campo asociado cuando se selecciona un error del resumen.
document.querySelectorAll('.form-error a[href^="#"]').forEach((link) => {
  link.addEventListener("click", () => {
    const target = document.querySelector(link.getAttribute("href"));
    target?.focus();
  });
});

const firstErrorLink = document.querySelector('.form-error a[href^="#"]');
if (firstErrorLink) {
  document.querySelector(firstErrorLink.getAttribute("href"))?.focus();
}

// Actualiza la validez y el indicador visual de seguridad de la contraseña.
const updatePasswordFeedback = () => {
  const password = passwordInput.value;
  const rules = {
    length: password.length >= 8 && password.length <= 16,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password)
  };
  const score = Object.values(rules).filter(Boolean).length;
  const colors = ["bg-slate-300", "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-lime-500", "bg-emerald-500"];

  passwordInput.setCustomValidity(score === 5 || password.length === 0
    ? ""
    : "La contraseña debe tener entre 8 y 16 caracteres e incluir mayúscula, minúscula, número y símbolo.");

  strengthBar.className = `h-full rounded-full transition-all duration-300 ${colors[score]}`;
  strengthBar.style.width = `${score * 20}%`;
  strengthText.textContent = password ? `${strengthLevels[Math.max(0, score - 1)]} · ${score}/5 requisitos` : "Escribe una contraseña para ver su nivel.";
  updatePasswordMatch();
};

// Comprueba que la contraseña y su confirmación coincidan.
const updatePasswordMatch = () => {
  const confirmation = confirmPasswordInput.value;
  const matches = confirmation.length > 0 && confirmation === passwordInput.value;
  const hasMismatch = confirmation.length > 0 && !matches;
  confirmPasswordInput.setCustomValidity(hasMismatch ? "Las contraseñas no coinciden." : "");

  matchBar.style.width = confirmation ? "100%" : "0%";
  matchBar.className = `h-full rounded-full transition-all duration-300 ${matches ? "bg-emerald-500" : hasMismatch ? "bg-red-500" : "bg-slate-300"}`;
  matchText.textContent = matches
    ? "¡Coinciden!"
    : hasMismatch
      ? "Las contraseñas todavía no coinciden."
      : "Confirma la contraseña para comprobar que coincida.";
};

let cityRequestNumber = 0;

// Reemplaza las opciones de un desplegable por un mensaje de estado.
const setSelectMessage = (select, message) => {
  select.replaceChildren(new Option(message, ""));
};

// Consulta y carga los municipios disponibles para el departamento elegido.
const loadCities = async (departmentId, selectedCity = "") => {
  const requestNumber = ++cityRequestNumber;
  citySelect.disabled = true;
  setSelectMessage(citySelect, "Cargando municipios...");
  cityStatus.textContent = "";
  cityStatus.className = "text-xs text-slate-500";
  retryCitiesButton.classList.add("hidden");

  try {
    const cities = departmentId === "bogota-dc"
      ? [{ name: "Bogotá, D.C." }]
      : await fetch(`https://api-colombia.com/api/v1/Department/${encodeURIComponent(departmentId)}/cities`)
        .then((response) => {
          if (!response.ok) throw new Error("No se pudo consultar la lista de municipios.");
          return response.json();
        });

    if (requestNumber !== cityRequestNumber) return;

    const orderedCities = cities
      .filter((city) => city && typeof city.name === "string")
      .sort((a, b) => a.name.localeCompare(b.name, "es"));

    if (!orderedCities.length) {
      setSelectMessage(citySelect, "No hay municipios disponibles");
      cityStatus.textContent = "No se encontraron municipios para este departamento.";
      return;
    }

    setSelectMessage(citySelect, "Selecciona un municipio");
    orderedCities.forEach((city) => citySelect.add(new Option(city.name, city.name)));
    citySelect.disabled = false;
    if (selectedCity) citySelect.value = selectedCity;
    retryCitiesButton.classList.add("hidden");
  } catch {
    if (requestNumber !== cityRequestNumber) return;
    setSelectMessage(citySelect, "No se pudo cargar la lista");
    cityStatus.textContent = "No se pudo cargar la lista. Revisa tu conexión e inténtalo de nuevo.";
    cityStatus.className = "text-xs text-red-600";
    retryCitiesButton.classList.remove("hidden");
  }
};

// Consulta los departamentos y restaura las selecciones previas si existen.
const loadDepartments = async () => {
  const selectedDepartment = departmentSelect.dataset.selected;
  departmentSelect.disabled = true;
  departmentStatus.textContent = "Cargando departamentos...";
  retryDepartmentsButton.classList.add("hidden");

  try {
    const response = await fetch("https://api-colombia.com/api/v1/Department");
    if (!response.ok) throw new Error("No se pudo consultar la lista de departamentos.");
    const departments = await response.json();
    const orderedDepartments = departments
      .filter((department) => department && department.id && department.name && department.name !== "Bogotá, D.C.")
      .sort((a, b) => a.name.localeCompare(b.name, "es"));

    setSelectMessage(departmentSelect, "Selecciona un departamento");
    orderedDepartments.forEach((department) => {
      const option = new Option(department.name, department.name);
      option.dataset.departmentId = String(department.id);
      departmentSelect.add(option);
    });

    const bogotaOption = new Option("Bogotá, D.C.", "Bogotá, D.C.");
    bogotaOption.dataset.departmentId = "bogota-dc";
    departmentSelect.add(bogotaOption);
    departmentSelect.disabled = false;

    if (selectedDepartment) departmentSelect.value = selectedDepartment;
    departmentStatus.textContent = `${orderedDepartments.length + 1} departamentos y distrito capital disponibles.`;
    retryDepartmentsButton.classList.add("hidden");

    if (departmentSelect.value) {
      await loadCities(departmentSelect.selectedOptions[0].dataset.departmentId, citySelect.dataset.selected);
    }
  } catch {
    setSelectMessage(departmentSelect, "No se pudo cargar la lista");
    departmentStatus.textContent = "No se pudo cargar la lista. Revisa tu conexión e inténtalo de nuevo.";
    retryDepartmentsButton.classList.remove("hidden");
  }
};

departmentSelect.addEventListener("change", () => {
  if (!departmentSelect.value) {
    citySelect.disabled = true;
    setSelectMessage(citySelect, "Selecciona primero un departamento");
    cityStatus.textContent = "";
    return;
  }

  loadCities(departmentSelect.selectedOptions[0].dataset.departmentId);
});

retryDepartmentsButton.addEventListener("click", loadDepartments);
retryCitiesButton.addEventListener("click", () => {
  if (departmentSelect.value) loadCities(departmentSelect.selectedOptions[0].dataset.departmentId);
});

passwordInput.addEventListener("input", updatePasswordFeedback);
confirmPasswordInput.addEventListener("input", updatePasswordMatch);
loadDepartments();

// Permite mostrar u ocultar los campos de contraseña.
document.querySelectorAll("[data-password-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.passwordToggle);
    const visible = input.type === "password";
    const icon = button.querySelector("i");

    input.type = visible ? "text" : "password";
    button.setAttribute("aria-pressed", String(visible));
    button.setAttribute("aria-label", visible ? "Ocultar contraseña" : "Mostrar contraseña");
    button.title = visible ? "Ocultar contraseña" : "Mostrar contraseña";
    icon.classList.toggle("fa-eye", !visible);
    icon.classList.toggle("fa-eye-slash", visible);
  });
});

updatePasswordFeedback();

// Oculta los mensajes de resultado del registro después de unos segundos.
setTimeout(() => {
  document.getElementById("mensajeError")?.remove();
  document.getElementById("mensajeExito")?.remove();
}, 9000);
