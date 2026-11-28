(() => {
  const inicializarControlSesion = () => {
    if (window.__sessionInactivityInitialized) return

    const modalInactividad = document.getElementById('sessionInactivityDialog')
    const modalCierre = document.getElementById('sessionLogoutDialog')
    const formularioCierre = document.getElementById('sessionLogoutForm')
    const botonContinuar = document.getElementById('continueSessionButton')
    const botonSalir = document.getElementById('exitSessionButton')
    const botonCancelarCierre = document.getElementById('cancelSessionLogout')
    const botonConfirmarCierre = document.getElementById('confirmSessionLogout')
    const contador = document.querySelector('[data-session-countdown]')
    const disparadoresCierre = document.querySelectorAll('[data-session-logout-trigger]')

    if (
      !modalInactividad || !modalCierre || !formularioCierre || !botonContinuar
      || !botonSalir || !botonCancelarCierre || !botonConfirmarCierre || !contador
    ) return

    window.__sessionInactivityInitialized = true

    const leerDuracion = (valor, predeterminado) => {
      const numero = Number(valor)
      return Number.isFinite(numero) && numero > 0 ? numero : predeterminado
    }

    const tiempoInactividad = leerDuracion(document.body.dataset.idleTimeout, 10 * 60 * 1000)
    const tiempoAviso = leerDuracion(document.body.dataset.warningTimeout, 60 * 1000)
    let fechaLimiteInactividad = Date.now() + tiempoInactividad
    let fechaLimiteCierre = null
    let temporizador = null
    let elementoEnfocadoAntesDelAviso = null
    let disparadorCierreActual = null
    let envioIniciado = false
    let ultimoMovimiento = 0

    const enfocar = (elemento) => {
      if (elemento instanceof HTMLElement && elemento.isConnected) elemento.focus()
    }

    const abrirModal = (modal, elementoInicial) => {
      if (!modal.open) modal.showModal()
      elementoInicial?.focus()
    }

    const actualizarContador = () => {
      if (fechaLimiteCierre === null) return tiempoAviso
      const restante = Math.max(0, Math.ceil((fechaLimiteCierre - Date.now()) / 1000))
      contador.textContent = String(restante)
      return restante
    }

    const cerrarSesion = () => {
      if (envioIniciado) return
      envioIniciado = true
      window.clearTimeout(temporizador)
      if (modalInactividad.open) modalInactividad.close()
      if (modalCierre.open) modalCierre.close()
      botonContinuar.disabled = true
      botonSalir.disabled = true
      botonCancelarCierre.disabled = true
      botonConfirmarCierre.disabled = true

      if (typeof formularioCierre.requestSubmit === 'function') formularioCierre.requestSubmit()
      else formularioCierre.submit()
    }

    const mostrarAviso = () => {
      if (fechaLimiteCierre === null) {
        fechaLimiteCierre = fechaLimiteInactividad + tiempoAviso
        elementoEnfocadoAntesDelAviso = modalCierre.open
          ? disparadorCierreActual
          : document.activeElement
      }

      actualizarContador()
      if (fechaLimiteCierre <= Date.now()) {
        cerrarSesion()
        return
      }
      if (!modalCierre.open) abrirModal(modalInactividad, botonContinuar)
    }

    const revisarTemporizadores = () => {
      window.clearTimeout(temporizador)
      if (envioIniciado) return

      const ahora = Date.now()
      if (fechaLimiteCierre !== null) {
        const restante = fechaLimiteCierre - ahora
        actualizarContador()
        if (restante <= 0) {
          cerrarSesion()
          return
        }

        temporizador = window.setTimeout(revisarTemporizadores, Math.min(1000, restante))
        return
      }

      const restante = fechaLimiteInactividad - ahora
      if (restante <= 0) {
        mostrarAviso()
        temporizador = window.setTimeout(revisarTemporizadores, Math.min(1000, tiempoAviso))
        return
      }

      temporizador = window.setTimeout(revisarTemporizadores, restante)
    }

    const continuarSesion = () => {
      if (envioIniciado) return
      fechaLimiteCierre = null
      fechaLimiteInactividad = Date.now() + tiempoInactividad
      contador.textContent = String(Math.ceil(tiempoAviso / 1000))
      if (modalInactividad.open) modalInactividad.close()
      revisarTemporizadores()
      enfocar(elementoEnfocadoAntesDelAviso)
      elementoEnfocadoAntesDelAviso = null
    }

    const abrirConfirmacionCierre = (disparador) => {
      if (envioIniciado) return
      disparadorCierreActual = disparador || document.activeElement
      if (modalInactividad.open) modalInactividad.close()
      abrirModal(modalCierre, botonCancelarCierre)
      revisarTemporizadores()
    }

    const cancelarConfirmacionCierre = () => {
      if (envioIniciado) return
      if (modalCierre.open) modalCierre.close()

      if (fechaLimiteCierre !== null) {
        if (fechaLimiteCierre <= Date.now()) {
          cerrarSesion()
          return
        }
        abrirModal(modalInactividad, botonSalir)
      } else {
        enfocar(disparadorCierreActual)
      }

      disparadorCierreActual = null
      revisarTemporizadores()
    }

    const registrarActividad = () => {
      if (envioIniciado || modalInactividad.open || modalCierre.open || fechaLimiteCierre !== null) return
      fechaLimiteInactividad = Date.now() + tiempoInactividad
      revisarTemporizadores()
    }

    botonContinuar.addEventListener('click', continuarSesion)
    botonSalir.addEventListener('click', () => abrirConfirmacionCierre(botonSalir))
    botonCancelarCierre.addEventListener('click', cancelarConfirmacionCierre)

    disparadoresCierre.forEach((disparador) => {
      disparador.addEventListener('click', (evento) => {
        evento.preventDefault()
        abrirConfirmacionCierre(disparador)
      })
    })

    formularioCierre.addEventListener('submit', () => {
      if (envioIniciado) return
      envioIniciado = true
      window.clearTimeout(temporizador)
      botonConfirmarCierre.disabled = true
      botonCancelarCierre.disabled = true
      if (modalInactividad.open) modalInactividad.close()
      if (modalCierre.open) modalCierre.close()
    })

    modalInactividad.addEventListener('cancel', (evento) => evento.preventDefault())
    modalCierre.addEventListener('cancel', (evento) => {
      evento.preventDefault()
      cancelarConfirmacionCierre()
    })

    const registrarMovimiento = () => {
      const ahora = Date.now()
      if (ahora - ultimoMovimiento < 1000) return
      ultimoMovimiento = ahora
      registrarActividad()
    }

    document.addEventListener('pointermove', registrarMovimiento, { passive: true })
    ;['pointerdown', 'keydown', 'click', 'input', 'change', 'touchstart'].forEach((evento) => {
      document.addEventListener(evento, registrarActividad, { passive: true, capture: true })
    })
    window.addEventListener('scroll', registrarActividad, { passive: true, capture: true })
    document.addEventListener('visibilitychange', revisarTemporizadores)

    revisarTemporizadores()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarControlSesion, { once: true })
  } else {
    inicializarControlSesion()
  }
})()
