document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.diagnostic-card')
    const placeholder = document.getElementById('placeholder-detalle')
    const content = document.getElementById('contenido-detalle')
    const backButton = document.getElementById('btn-back-mobile')
    const leftPanel = document.querySelector('#lista-diagnosticos')?.parentElement
    const grid = leftPanel?.parentElement
    const rightPanel = grid?.children[1]

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
        rightPanel?.classList.remove('hidden')
        grid?.classList.remove('lg:grid-cols-1')
        grid?.classList.add('lg:grid-cols-2')
        cards.forEach(setArrowState)
    }

    const setArrowState = (card, collapsed = false) => {
        const arrow = card.querySelector('.diagnostic-arrow')
        const path = arrow?.querySelector('path')
        if (!arrow || !path) return
        path.setAttribute('d', collapsed
            ? 'M15.75 4.5L8.25 12l7.5 7.5'
            : 'M8.25 4.5l7.5 7.5-7.5 7.5')
        arrow.setAttribute('aria-label', collapsed ? 'Ocultar detalle del diagnóstico' : 'Ver detalle del diagnóstico')
    }

    const showDetail = () => {
        rightPanel?.classList.remove('hidden')
        grid?.classList.remove('lg:grid-cols-1')
        grid?.classList.add('lg:grid-cols-2')
        content.classList.remove('hidden')
        placeholder.classList.add('hidden')
    }

    const collapseDetail = () => {
        rightPanel?.classList.add('hidden')
        grid?.classList.remove('lg:grid-cols-2')
        grid?.classList.add('lg:grid-cols-1')
        cards.forEach((card) => setArrowState(card))
    }

    const selectCard = (card) => {
            cards.forEach((item) => {
                item.classList.remove('border-indigo-500', 'bg-indigo-50/30', 'shadow-md')
                setArrowState(item)
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

            showDetail()
            setArrowState(card, true)
    }

    cards.forEach((card) => {
        card.addEventListener('click', (event) => {
            const flecha = event.target.closest('.diagnostic-arrow')
            if (flecha && card.contains(flecha)) {
                event.stopPropagation()
                if (card.classList.contains('border-indigo-500')) {
                    if (rightPanel?.classList.contains('hidden')) {
                        showDetail()
                        setArrowState(card, true)
                    }
                    else collapseDetail()
                } else {
                    selectCard(card)
                }
                return
            }

            selectCard(card)
        })
    })

    backButton?.addEventListener('click', clearSelection)
})
