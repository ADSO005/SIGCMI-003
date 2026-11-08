const obtenerLimitesCalendarioCitas = () => {
    const hoy = new Date()
    const fechaMinima = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1)
    const ultimoDiaMesSiguiente = new Date(hoy.getFullYear(), hoy.getMonth() + 2, 0).getDate()
    const fechaMaxima = new Date(hoy.getFullYear(), hoy.getMonth() + 1, Math.min(hoy.getDate(), ultimoDiaMesSiguiente))
    const fechaLocal = (fecha) => {
        const desplazada = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000)
        return desplazada.toISOString().slice(0, 10)
    }
    return { min: fechaLocal(fechaMinima), max: fechaLocal(fechaMaxima) }
}

const cargarHorasDisponiblesCita = async (medicoId, fecha, campoHora, citaId = '') => {
    if (!campoHora) return

    const solicitud = String(Number(campoHora.dataset.solicitud || 0) + 1)
    campoHora.dataset.solicitud = solicitud
    campoHora.replaceChildren(new Option('Seleccionar hora', ''))
    if (!medicoId || !fecha) return

    campoHora.add(new Option('Consultando horarios…', ''))
    try {
        const parametros = new URLSearchParams({ medicoId, fecha })
        if (citaId) parametros.set('citaId', citaId)
        const respuesta = await fetch(`/paciente/citas/horarios-disponibles?${parametros}`)
        const resultado = await respuesta.json()
        if (campoHora.dataset.solicitud !== solicitud) return
        campoHora.replaceChildren(new Option('Seleccionar hora', ''))
        if (!respuesta.ok || !resultado.ok) throw new Error(resultado.mensaje || 'No fue posible consultar los horarios.')
        resultado.horas.forEach((hora) => campoHora.add(new Option(hora, hora)))
        if (!resultado.horas.length) campoHora.add(new Option(resultado.mensaje || 'No hay horarios disponibles', ''))
    } catch (error) {
        if (campoHora.dataset.solicitud !== solicitud) return
        campoHora.replaceChildren(new Option('Seleccionar hora', ''), new Option(error.message, ''))
    }
}

const crearMenuHorasDesplegable = (select) => {
    if (!select || select.dataset.menuPersonalizado === 'true') return

    const contenedor = document.createElement('div')
    contenedor.className = 'relative w-full'
    select.parentNode.insertBefore(contenedor, select)
    contenedor.appendChild(select)

    const boton = document.createElement('button')
    boton.type = 'button'
    boton.className = `${select.className} flex cursor-pointer items-center justify-between text-left`
    boton.setAttribute('aria-haspopup', 'listbox')
    boton.setAttribute('aria-expanded', 'false')
    boton.setAttribute('aria-label', 'Seleccionar hora')

    const textoBoton = document.createElement('span')
    const flecha = document.createElement('span')
    flecha.textContent = '⌄'
    boton.append(textoBoton, flecha)

    select.style.position = 'absolute'
    select.style.width = '1px'
    select.style.height = '1px'
    select.style.opacity = '0'
    select.style.pointerEvents = 'none'
    select.style.left = '0'
    select.style.top = '0'
    select.setAttribute('aria-hidden', 'true')
    contenedor.appendChild(boton)
    select.dataset.menuPersonalizado = 'true'

    const menu = document.createElement('div')
    menu.setAttribute('role', 'listbox')
    menu.hidden = true
    Object.assign(menu.style, {
        position: 'fixed',
        zIndex: '1000',
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '1px',
        padding: '2px',
        overflowY: 'auto',
        background: '#fff',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        boxShadow: '0 8px 20px rgba(15, 23, 42, 0.18)'
    })
    document.body.appendChild(menu)

    const actualizarBoton = () => {
        textoBoton.textContent = select.selectedOptions[0]?.textContent?.trim() || 'Seleccionar hora'
    }

    const renderizarOpciones = () => {
        menu.replaceChildren()
        for (const opcion of select.options) {
            if (opcion.hidden) continue
            if (opcion.value === '' && opcion.textContent.trim() === 'Seleccionar hora') continue
            const elemento = document.createElement('button')
            elemento.type = 'button'
            elemento.setAttribute('role', 'option')
            elemento.setAttribute('aria-selected', String(opcion.selected))
            elemento.textContent = opcion.textContent.trim()
            Object.assign(elemento.style, {
                display: 'block',
                width: '100%',
                padding: '2px 4px',
                border: '0',
                borderRadius: '4px',
                background: opcion.selected ? '#e0e7ff' : '#fff',
                color: '#1e293b',
                textAlign: 'left',
                fontSize: '13px',
                lineHeight: '18px',
                cursor: opcion.disabled ? 'default' : 'pointer'
            })
            if (!opcion.value) elemento.style.gridColumn = '1 / -1'
            elemento.disabled = opcion.disabled || (
                opcion.value === '' && opcion.textContent.trim() !== 'Seleccionar hora'
            )
            elemento.addEventListener('mouseenter', () => {
                if (!elemento.disabled) elemento.style.background = '#eef2ff'
            })
            elemento.addEventListener('mouseleave', () => {
                elemento.style.background = opcion.selected ? '#e0e7ff' : '#fff'
            })
            elemento.addEventListener('click', () => {
                select.value = opcion.value
                select.dispatchEvent(new Event('change', { bubbles: true }))
                boton.classList.remove('border-red-500', 'ring-2', 'ring-red-200')
                actualizarBoton()
                cerrarMenu()
                boton.focus()
            })
            menu.appendChild(elemento)
        }
    }

    const posicionarMenu = () => {
        const rectangulo = boton.getBoundingClientRect()
        const ancho = Math.max(rectangulo.width, 180)
        Object.assign(menu.style, {
            top: `${rectangulo.bottom}px`,
            left: `${Math.max(8, Math.min(rectangulo.left, window.innerWidth - ancho - 8))}px`,
            width: `${Math.min(ancho, window.innerWidth - 16)}px`,
            maxHeight: `${Math.max(48, window.innerHeight - rectangulo.bottom - 8)}px`
        })
    }

    const cerrarMenu = () => {
        menu.hidden = true
        boton.setAttribute('aria-expanded', 'false')
    }

    const abrirMenu = () => {
        renderizarOpciones()
        posicionarMenu()
        menu.hidden = false
        boton.setAttribute('aria-expanded', 'true')
    }

    boton.addEventListener('click', () => {
        if (menu.hidden) abrirMenu()
        else cerrarMenu()
    })
    boton.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape') cerrarMenu()
    })
    select.addEventListener('change', actualizarBoton)
    select.addEventListener('invalid', (evento) => {
        evento.preventDefault()
        boton.classList.add('border-red-500', 'ring-2', 'ring-red-200')
        boton.focus()
    })
    document.addEventListener('pointerdown', (evento) => {
        if (!menu.contains(evento.target) && !boton.contains(evento.target)) cerrarMenu()
    })
    window.addEventListener('resize', () => {
        if (!menu.hidden) posicionarMenu()
    })
    window.addEventListener('scroll', cerrarMenu, true)

    new MutationObserver(() => {
        actualizarBoton()
        if (!menu.hidden) renderizarOpciones()
    }).observe(select, { childList: true })

    actualizarBoton()
}

document.addEventListener('DOMContentLoaded', () => {
    crearMenuHorasDesplegable(document.getElementById('horaCita'))
    crearMenuHorasDesplegable(document.getElementById('horaReprogramar'))
})

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modalNuevaCita')
    const abrir = document.getElementById('btnNuevaCita')
    const cerrar = document.getElementById('cerrarModalCita')
    const cancelar = document.getElementById('cancelarModalCita')
    const formulario = document.getElementById('formNuevaCita')
    const campoFecha = document.getElementById('fechaCita')
    const campoHora = document.getElementById('horaCita')
    const campoEspecialidad = document.getElementById('especialidadCita')
    const campoMedico = document.getElementById('medicoCita')

    if (!modal) return

    const actualizarHoras = () => cargarHorasDisponiblesCita(campoMedico?.value, campoFecha?.value, campoHora)
    campoFecha?.addEventListener('change', actualizarHoras)
    campoMedico?.addEventListener('change', actualizarHoras)

    const abrirModal = () => {
        modal.classList.remove('hidden')
        modal.classList.add('flex')
        if (campoFecha) {
            const limites = obtenerLimitesCalendarioCitas()
            campoFecha.min = limites.min
            campoFecha.max = limites.max
        }
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

    const filtrarMedicos = (especialidad, medico, valorSeleccionado = '') => {
        if (!especialidad || !medico) return
        const idEspecialidad = especialidad.value
        const opciones = [...medico.querySelectorAll('option[data-especialidad]')]
        opciones.forEach((opcion) => { opcion.hidden = opcion.dataset.especialidad !== idEspecialidad })
        const opcionActual = medico.selectedOptions[0]
        if (!opcionActual || opcionActual.dataset.especialidad !== idEspecialidad) medico.value = ''
        if (valorSeleccionado && medico.querySelector(`option[value="${CSS.escape(valorSeleccionado)}"]`)) {
            medico.value = valorSeleccionado
        }
    }
    campoEspecialidad?.addEventListener('change', () => {
        filtrarMedicos(campoEspecialidad, campoMedico)
        actualizarHoras()
    })
    filtrarMedicos(campoEspecialidad, campoMedico)
})

//- CONTROL DEL MODAL DE REPROGRAMACIÓN
document.addEventListener('DOMContentLoaded', () => {
    const modalReprogramar = document.getElementById('modalReprogramarCita')
    const formularioReprogramar = document.getElementById('formReprogramarCita')
    const campoIdCita = document.getElementById('idCitaReprogramar')
    const campoFechaReprogramar = document.getElementById('fechaReprogramar')
    const botonCerrarReprogramar = document.getElementById('cerrarModalReprogramar')
    const botonCancelarReprogramar = document.getElementById('cancelarModalReprogramar')
    const campoHoraReprogramar = document.getElementById('horaReprogramar')
    const campoEspecialidadReprogramar = document.getElementById('especialidadReprogramar')
    const campoMedicoReprogramar = document.getElementById('medicoReprogramar')

    if (!modalReprogramar) return

    const actualizarHorasReprogramacion = () => cargarHorasDisponiblesCita(
        campoMedicoReprogramar?.value,
        campoFechaReprogramar?.value,
        campoHoraReprogramar,
        campoIdCita?.value
    )
    campoFechaReprogramar?.addEventListener('change', actualizarHorasReprogramacion)
    campoMedicoReprogramar?.addEventListener('change', actualizarHorasReprogramacion)

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
        if (campoEspecialidadReprogramar) {
            campoEspecialidadReprogramar.value = enlaceReprogramar.dataset.especialidad || ''
            campoEspecialidadReprogramar.dispatchEvent(new Event('change'))
        }
        if (campoMedicoReprogramar) {
            campoMedicoReprogramar.value = enlaceReprogramar.dataset.medico || ''
        }
        if (campoFechaReprogramar) {
            const limites = obtenerLimitesCalendarioCitas()
            campoFechaReprogramar.min = limites.min
            campoFechaReprogramar.max = limites.max
        }
        actualizarHorasReprogramacion()

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

    const filtrarMedicosReprogramar = () => {
        if (!campoEspecialidadReprogramar || !campoMedicoReprogramar) return
        const especialidad = campoEspecialidadReprogramar.value
        ;[...campoMedicoReprogramar.querySelectorAll('option[data-especialidad]')].forEach((opcion) => {
            opcion.hidden = opcion.dataset.especialidad !== especialidad
        })
        const seleccionado = campoMedicoReprogramar.selectedOptions[0]
        if (seleccionado?.dataset.especialidad !== especialidad) campoMedicoReprogramar.value = ''
    }
    campoEspecialidadReprogramar?.addEventListener('change', () => {
        filtrarMedicosReprogramar()
        actualizarHorasReprogramacion()
    })
    filtrarMedicosReprogramar()
})

//- COLAPSAR EL SIDEBAR DEL DASHBOARD
document.addEventListener('DOMContentLoaded', () => {
    window.lucide?.createIcons()

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

    sidebar.style.width = '16rem'
    sidebar.setAttribute('aria-label', 'Menú lateral expandido')
    sidebarToggle.setAttribute('aria-expanded', 'true')
    sidebarToggle.title = 'Contraer menú'
    enlacesNavegacion.forEach((enlace) => {
        const etiqueta = enlace.querySelector('.sidebar-text')
        if (etiqueta) enlace.title = etiqueta.textContent.trim()
    })

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

//- VERIFICACIÓN POR CORREO ANTES DE CREAR O REPROGRAMAR UNA CITA
document.addEventListener('DOMContentLoaded', () => {
    const formularioNueva = document.getElementById('formNuevaCita')
    const formularioReprogramar = document.getElementById('formReprogramarCita')
    const modalCodigo = document.getElementById('modalCodigoCita')
    const formularioCodigo = document.getElementById('formCodigoCita')
    const campoCodigo = document.getElementById('codigoCitaIdentidad')
    const descripcionCodigo = document.getElementById('descripcionCodigoCita')
    const errorCodigo = document.getElementById('errorCodigoCita')
    const aviso = document.getElementById('avisoAccionCita')

    if (!modalCodigo || !formularioCodigo) return

    const mostrarErrorCodigo = (mensaje) => {
        errorCodigo.textContent = mensaje
        errorCodigo.classList.remove('hidden')
    }

    const mostrarAviso = (mensaje, exito = false) => {
        aviso.textContent = mensaje
        aviso.classList.remove('hidden', 'bg-red-700', 'bg-green-700')
        aviso.classList.add(exito ? 'bg-green-700' : 'bg-red-700', 'text-white')
        window.setTimeout(() => aviso.classList.add('hidden'), 5000)
    }

    const abrirModalCodigo = (correo) => {
        descripcionCodigo.textContent = `Enviamos un código de 6 dígitos a ${correo}. Ingrésalo para continuar.`
        errorCodigo.textContent = ''
        errorCodigo.classList.add('hidden')
        campoCodigo.value = ''
        modalCodigo.classList.remove('hidden')
        modalCodigo.classList.add('flex')
        campoCodigo.focus()
    }

    const enviarSolicitud = async (formulario, accion) => {
        const datos = new FormData(formulario)
        const solicitud = {
            accion,
            fecha: datos.get('fecha'),
            hora: datos.get('hora'),
            especialidadId: datos.get('especialidad'),
            medicoId: datos.get('medico'),
            citaId: datos.get('citaId')
        }
        const boton = formulario.querySelector('button[type="submit"]')
        const textoOriginal = boton?.textContent
        if (boton) {
            boton.disabled = true
            boton.textContent = 'Enviando código…'
        }

        try {
            const respuesta = await fetch('/paciente/citas/codigo/solicitar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(solicitud)
            })
            const resultado = await respuesta.json()
            if (!respuesta.ok || !resultado.ok) throw new Error(resultado.mensaje || 'No se pudo enviar el código.')
            abrirModalCodigo(resultado.correo)
        } catch (error) {
            mostrarAviso(error.message || 'No se pudo enviar el código. Inténtalo nuevamente.')
        } finally {
            if (boton) {
                boton.disabled = false
                boton.textContent = textoOriginal
            }
        }
    }

    formularioNueva?.addEventListener('submit', (evento) => {
        evento.preventDefault()
        enviarSolicitud(formularioNueva, 'nueva')
    })
    formularioReprogramar?.addEventListener('submit', (evento) => {
        evento.preventDefault()
        enviarSolicitud(formularioReprogramar, 'reprogramacion')
    })

    formularioCodigo.addEventListener('submit', async (evento) => {
        evento.preventDefault()
        const boton = formularioCodigo.querySelector('button[type="submit"]')
        if (boton) boton.disabled = true

        try {
            const respuesta = await fetch('/paciente/citas/codigo/verificar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo: campoCodigo.value.trim() })
            })
            const resultado = await respuesta.json()
            if (!respuesta.ok || !resultado.ok) throw new Error(resultado.mensaje || 'El código no pudo validarse.')

            mostrarAviso(resultado.mensaje || 'La cita quedó actualizada.', true)
            window.setTimeout(() => window.location.assign('/paciente/dashboard'), 700)
        } catch (error) {
            mostrarErrorCodigo(error.message || 'No fue posible validar el código.')
            campoCodigo.focus()
        } finally {
            if (boton) boton.disabled = false
        }
    })

    document.getElementById('cancelarCodigoCita')?.addEventListener('click', async () => {
        modalCodigo.classList.add('hidden')
        modalCodigo.classList.remove('flex')
        await fetch('/paciente/citas/codigo/cancelar', { method: 'POST' }).catch(() => {})
    })
})
