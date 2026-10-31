document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modalNuevaCita')
    const abrir = document.getElementById('btnNuevaCita')
    const cerrar = document.getElementById('cerrarModalCita')
    const cancelar = document.getElementById('cancelarModalCita')
    const formulario = document.getElementById('formNuevaCita')
    const campoFecha = document.getElementById('fechaCita')

    if (!modal) return

    const hoyLocal = () => {
        const ahora = new Date()
        const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000)
        return local.toISOString().slice(0, 10)
    }

    const abrirModal = () => {
        modal.classList.remove('hidden')
        modal.classList.add('flex')
        if (campoFecha) campoFecha.min = hoyLocal()
        cerrar?.focus()
    }

    const cerrarModal = () => {
        modal.classList.add('hidden')
        modal.classList.remove('flex')
        abrir?.focus()
    }

    abrir?.addEventListener('click', abrirModal)
    cerrar?.addEventListener('click', cerrarModal)
    cancelar?.addEventListener('click', cerrarModal)

    modal.addEventListener('click', (evento) => {
        if (evento.target === modal) cerrarModal()
    })

    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape' && !modal.classList.contains('hidden')) cerrarModal()
    })

    formulario?.addEventListener('submit', (evento) => {
        evento.preventDefault()
    })
})

//- CONTROL DEL MODAL DE REPROGRAMACIÓN
document.addEventListener('DOMContentLoaded', () => {
    const modalReprogramar = document.getElementById('modalReprogramarCita')
    const formularioReprogramar = document.getElementById('formReprogramarCita')
    const campoIdCita = document.getElementById('idCitaReprogramar')
    const campoFechaReprogramar = document.getElementById('fechaReprogramar')
    const botonCerrarReprogramar = document.getElementById('cerrarModalReprogramar')
    const botonCancelarReprogramar = document.getElementById('cancelarModalReprogramar')

    if (!modalReprogramar) return

    const fechaLocalHoy = () => {
        const ahora = new Date()
        const fechaLocal = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000)
        return fechaLocal.toISOString().slice(0, 10)
    }

    const cerrarModalReprogramar = () => {
        modalReprogramar.classList.add('hidden')
        modalReprogramar.classList.remove('flex')
    }

    // Intercepta los enlaces de reprogramación que ya están en dashboard.pug.
    document.addEventListener('click', (evento) => {
        const objetivo = evento.target
        const enlaceReprogramar =
            objetivo instanceof Element
                ? objetivo.closest('a[href*="/paciente/citas/reprogramar/"]')
                : null

        if (!enlaceReprogramar) return

        evento.preventDefault()
        const idCita = new URL(enlaceReprogramar.href).pathname.split('/').pop()

        if (campoIdCita) campoIdCita.value = idCita
        if (campoFechaReprogramar) campoFechaReprogramar.min = fechaLocalHoy()

        modalReprogramar.classList.remove('hidden')
        modalReprogramar.classList.add('flex')
    })

    botonCerrarReprogramar?.addEventListener('click', cerrarModalReprogramar)
    botonCancelarReprogramar?.addEventListener('click', cerrarModalReprogramar)

    modalReprogramar.addEventListener('click', (evento) => {
        if (evento.target === modalReprogramar) cerrarModalReprogramar()
    })

    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape' && !modalReprogramar.classList.contains('hidden')) {
            cerrarModalReprogramar()
        }
    })

    formularioReprogramar?.addEventListener('submit', (evento) => {
        evento.preventDefault()
    })
})

//- COLAPSAR EL SIDEBAR DEL DASHBOARD
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar')
    const sidebarToggle = document.getElementById('toggleSidebar')

    if (!sidebar || !sidebarToggle) return

    const textosSidebar = sidebar.querySelectorAll('.sidebar-text')
    const enlacesNavegacion = sidebar.querySelectorAll('nav a')
    const resumenPerfil = sidebar.querySelector('.p-4.border-b.flex.items-center.gap-3')
    const botonCerrarSesion = sidebar.querySelector('form button')
    const encabezadoSidebar = sidebar.querySelector(
        '.flex.items-center.justify-between.p-4.border-b'
    )
    let sidebarColapsado = false

    const alternarSidebar = () => {
        sidebarColapsado = !sidebarColapsado
        sidebar.style.width = sidebarColapsado ? '5rem' : '16rem'
        sidebar.setAttribute(
            'aria-label',
            sidebarColapsado ? 'Menú lateral contraído' : 'Menú lateral expandido'
        )
        sidebarToggle.setAttribute('aria-expanded', String(!sidebarColapsado))
        sidebarToggle.title = sidebarColapsado ? 'Expandir menú' : 'Contraer menú'

        textosSidebar.forEach((texto) => {
            texto.classList.toggle('hidden', sidebarColapsado)
        })

        enlacesNavegacion.forEach((enlace) => {
            const etiqueta = enlace.querySelector('.sidebar-text')
            if (etiqueta) enlace.title = etiqueta.textContent.trim()
            enlace.classList.toggle('justify-center', sidebarColapsado)
            enlace.classList.toggle('gap-0', sidebarColapsado)
            enlace.classList.toggle('px-0', sidebarColapsado)
        })

        resumenPerfil?.classList.toggle('justify-center', sidebarColapsado)
        encabezadoSidebar?.classList.toggle('justify-center', sidebarColapsado)
        botonCerrarSesion?.classList.toggle('justify-center', sidebarColapsado)
        botonCerrarSesion?.classList.toggle('gap-0', sidebarColapsado)
        botonCerrarSesion?.classList.toggle('px-0', sidebarColapsado)
    }

    sidebarToggle.addEventListener('click', alternarSidebar)
})

//- CONFIRMAR CIERRE DE SESIÓN
document.addEventListener('DOMContentLoaded', () => {
    const modalCerrarSesion = document.getElementById('modalConfirmarCerrarSesion')
    const formularioCerrarSesion = document.getElementById('formCerrarSesion')
    const botonAbrir = document.getElementById('btnAbrirConfirmacionCerrarSesion')
    const botonCancelar = document.getElementById('btnCancelarCerrarSesion')
    const botonConfirmar = document.getElementById('btnConfirmarCerrarSesion')

    if (!modalCerrarSesion || !formularioCerrarSesion || !botonAbrir) return

    const abrirModalCerrarSesion = () => {
        modalCerrarSesion.classList.remove('hidden')
        modalCerrarSesion.classList.add('flex')
        botonCancelar?.focus()
    }

    const cerrarModalCerrarSesion = () => {
        modalCerrarSesion.classList.add('hidden')
        modalCerrarSesion.classList.remove('flex')
        botonAbrir.focus()
    }

    botonAbrir.addEventListener('click', abrirModalCerrarSesion)
    botonCancelar?.addEventListener('click', cerrarModalCerrarSesion)
    botonConfirmar?.addEventListener('click', () => formularioCerrarSesion.submit())

    modalCerrarSesion.addEventListener('click', (evento) => {
        if (evento.target === modalCerrarSesion) cerrarModalCerrarSesion()
    })

    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape' && !modalCerrarSesion.classList.contains('hidden')) {
            cerrarModalCerrarSesion()
        }
    })
})
