document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.diagnostic-card')
    const placeholder = document.getElementById('placeholder-detalle')
    const content = document.getElementById('contenido-detalle')
    const backButton = document.getElementById('btn-back-mobile')

    if (!cards.length || !placeholder || !content) return

    const setText = (id, value, fallback = 'No registrado') => {
        const element = document.getElementById(id)
        if (element) element.textContent = value || fallback
    }

    const clearSelection = () => {
        cards.forEach((card) => {
            card.classList.remove('border-indigo-500', 'bg-indigo-50/30', 'shadow-md')
        })
        content.classList.add('hidden')
        placeholder.classList.remove('hidden')
    }

    cards.forEach((card) => {
        card.addEventListener('click', () => {
            cards.forEach((item) => {
                item.classList.remove('border-indigo-500', 'bg-indigo-50/30', 'shadow-md')
            })
            card.classList.add('border-indigo-500', 'bg-indigo-50/30', 'shadow-md')

            setText('det-titulo', card.dataset.diagnostico, 'Diagnóstico sin título')
            setText('det-fecha', card.dataset.fecha, 'Sin fecha')
            setText('det-medico', card.dataset.medico, 'Dr. No asignado')
            setText('det-sintomas-val', card.dataset.sintomas, 'No registrados')
            setText('det-temp', card.dataset.temperatura ? `${card.dataset.temperatura} °C` : '', '—')
            setText('det-presion', card.dataset.presion, '—')
            setText('det-frecuencia', card.dataset.frecuencia ? `${card.dataset.frecuencia} lpm` : '', '—')
            setText('det-peso', card.dataset.peso ? `${card.dataset.peso} kg` : '', '—')
            setText('det-diag-completo', card.dataset.diagnostico, 'No registrado')
            setText('det-tratamiento', card.dataset.tratamiento, 'Ninguno')
            setText('det-prescripcion', card.dataset.prescripcion, 'No registrada')
            setText('det-observaciones', card.dataset.observaciones, 'Sin notas adicionales')

            placeholder.classList.add('hidden')
            content.classList.remove('hidden')
        })
    })

    backButton?.addEventListener('click', clearSelection)
})
