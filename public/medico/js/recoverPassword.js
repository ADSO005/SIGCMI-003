
//- Script para abrir/cerrar
  const openModalBtn = document.getElementById('openModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');
  const modal = document.getElementById('recoverModal');

  const toggleModal = () => modal.classList.toggle('hidden');

  if(openModalBtn) openModalBtn.addEventListener('click', toggleModal);
  if(closeModalBtn) closeModalBtn.addEventListener('click', toggleModal);
  if(cancelModalBtn) cancelModalBtn.addEventListener('click', toggleModal);