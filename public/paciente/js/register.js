document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.register-form');
  const password = document.getElementById('password');
  const confirmPassword = document.getElementById('confirmPassword');

  if (!form) return;

  function markInvalid(input, message) {
    input.classList.add('form-input--error');
    let error = input.closest('.form-group').querySelector('.form-error');
    if (!error) {
      error = document.createElement('span');
      error.className = 'form-error';
      input.closest('.form-group').appendChild(error);
    }
    error.textContent = message;
  }

  function clearInvalid(input) {
    input.classList.remove('form-input--error');
    const error = input.closest('.form-group').querySelector('.form-error');
    if (error) error.textContent = '';
  }

  confirmPassword.addEventListener('input', () => {
    if (password.value && confirmPassword.value && password.value !== confirmPassword.value) {
      markInvalid(confirmPassword, 'Las contraseñas no coinciden');
    } else {
      clearInvalid(confirmPassword);
    }
  });

  form.addEventListener('submit', (e) => {
    if (password.value !== confirmPassword.value) {
      e.preventDefault();
      markInvalid(confirmPassword, 'Las contraseñas no coinciden');
      confirmPassword.focus();
    }
  });
});
