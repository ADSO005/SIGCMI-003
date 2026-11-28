const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')

const codigoSesion = fs.readFileSync(
  path.join(__dirname, '../../public/shared/js/sessionInactivity.js'),
  'utf8'
)

class ElementoSimulado {
  constructor(id) {
    this.id = id
    this.open = false
    this.disabled = false
    this.textContent = ''
    this.isConnected = true
    this.eventos = new Map()
    this.envios = 0
  }

  addEventListener(tipo, manejador) {
    const manejadores = this.eventos.get(tipo) || []
    manejadores.push(manejador)
    this.eventos.set(tipo, manejadores)
  }

  emitir(tipo, evento = {}) {
    for (const manejador of this.eventos.get(tipo) || []) manejador(evento)
  }

  focus() {
    this.contexto.document.activeElement = this
  }

  showModal() {
    this.open = true
  }

  close() {
    this.open = false
  }

  click() {
    this.emitir('click', { preventDefault() {} })
  }

  requestSubmit() {
    this.emitir('submit', { preventDefault() {} })
    this.envios += 1
  }

  submit() {
    this.envios += 1
  }
}

function crearPaginaSimulada() {
  let ahora = 0
  let siguienteId = 0
  const temporizadores = new Map()
  const eventosDocumento = new Map()
  const eventosVentana = new Map()
  const nombres = [
    'sessionInactivityDialog',
    'sessionLogoutDialog',
    'sessionLogoutForm',
    'continueSessionButton',
    'exitSessionButton',
    'cancelSessionLogout',
    'confirmSessionLogout',
    'logoutTrigger'
  ]
  const elementos = Object.fromEntries(nombres.map((id) => [id, new ElementoSimulado(id)]))
  const contador = new ElementoSimulado('countdown')
  const document = {
    readyState: 'complete',
    visibilityState: 'visible',
    body: { dataset: {} },
    activeElement: elementos.logoutTrigger,
    getElementById(id) {
      return elementos[id] || null
    },
    querySelector(selector) {
      return selector === '[data-session-countdown]' ? contador : null
    },
    querySelectorAll(selector) {
      return selector === '[data-session-logout-trigger]' ? [elementos.logoutTrigger] : []
    },
    addEventListener(tipo, manejador) {
      const manejadores = eventosDocumento.get(tipo) || []
      manejadores.push(manejador)
      eventosDocumento.set(tipo, manejadores)
    },
    emitir(tipo, evento = {}) {
      for (const manejador of eventosDocumento.get(tipo) || []) manejador(evento)
    }
  }

  for (const elemento of Object.values(elementos)) elemento.contexto = { document }

  const window = {
    __sessionInactivityInitialized: false,
    setTimeout(manejador, demora) {
      const id = ++siguienteId
      temporizadores.set(id, { id, momento: ahora + Math.max(0, demora), manejador })
      return id
    },
    clearTimeout(id) {
      temporizadores.delete(id)
    },
    addEventListener(tipo, manejador) {
      const manejadores = eventosVentana.get(tipo) || []
      manejadores.push(manejador)
      eventosVentana.set(tipo, manejadores)
    },
    emitir(tipo, evento = {}) {
      for (const manejador of eventosVentana.get(tipo) || []) manejador(evento)
    },
    avanzar(duracion) {
      const destino = ahora + duracion
      let iteraciones = 0
      while (true) {
        const pendiente = [...temporizadores.values()]
          .filter((temporizador) => temporizador.momento <= destino)
          .sort((a, b) => a.momento - b.momento)[0]
        if (!pendiente) break
        if (++iteraciones > 1000) throw new Error('Demasiados ciclos de temporizadores simulados')
        ahora = pendiente.momento
        temporizadores.delete(pendiente.id)
        pendiente.manejador()
      }
      ahora = destino
    },
    saltar(duracion) {
      ahora += duracion
    }
  }

  class FechaSimulada extends Date {
    static now() {
      return ahora
    }
  }

  vm.runInNewContext(codigoSesion, { window, document, HTMLElement: ElementoSimulado, Date: FechaSimulada })

  return { document, elementos, contador, window }
}

test('muestra el aviso a los diez minutos, cuenta 60 segundos y permite continuar', () => {
  const pagina = crearPaginaSimulada()
  const { elementos, contador, window } = pagina

  window.avanzar(10 * 60 * 1000 - 1)
  assert.equal(elementos.sessionInactivityDialog.open, false)

  window.avanzar(1)
  assert.equal(elementos.sessionInactivityDialog.open, true)
  assert.equal(contador.textContent, '60')

  window.avanzar(1000)
  assert.equal(contador.textContent, '59')

  elementos.continueSessionButton.click()
  assert.equal(elementos.sessionInactivityDialog.open, false)

  window.avanzar(10 * 60 * 1000 - 1)
  assert.equal(elementos.sessionInactivityDialog.open, false)
  window.avanzar(1)
  assert.equal(elementos.sessionInactivityDialog.open, true)
})

test('la actividad de teclado reinicia el periodo de diez minutos', () => {
  const { document, elementos, window } = crearPaginaSimulada()

  window.avanzar(9 * 60 * 1000)
  document.emitir('keydown')
  window.avanzar(9 * 60 * 1000)
  assert.equal(elementos.sessionInactivityDialog.open, false)

  window.avanzar(60 * 1000)
  assert.equal(elementos.sessionInactivityDialog.open, true)
})

test('mouse, clics, formularios, touch y scroll reinician el periodo de inactividad', () => {
  const eventosDocumento = ['pointermove', 'pointerdown', 'click', 'input', 'change', 'touchstart']
  const eventosVentana = ['scroll']

  for (const tipo of [...eventosDocumento, ...eventosVentana]) {
    const { document, elementos, window } = crearPaginaSimulada()
    window.avanzar(9 * 60 * 1000)

    if (eventosVentana.includes(tipo)) window.emitir(tipo)
    else document.emitir(tipo)

    window.avanzar(9 * 60 * 1000)
    assert.equal(elementos.sessionInactivityDialog.open, false, `No reinició con ${tipo}`)
    window.avanzar(60 * 1000)
    assert.equal(elementos.sessionInactivityDialog.open, true, `No venció tras ${tipo}`)
  }
})

test('Salir conserva la cuenta regresiva y el vencimiento envía un solo POST', () => {
  const { elementos, contador, window } = crearPaginaSimulada()

  window.avanzar(10 * 60 * 1000)
  window.avanzar(7000)
  assert.equal(contador.textContent, '53')

  elementos.exitSessionButton.click()
  assert.equal(elementos.sessionInactivityDialog.open, false)
  assert.equal(elementos.sessionLogoutDialog.open, true)

  window.avanzar(10000)
  assert.equal(contador.textContent, '43')

  elementos.cancelSessionLogout.click()
  assert.equal(elementos.sessionLogoutDialog.open, false)
  assert.equal(elementos.sessionInactivityDialog.open, true)
  assert.equal(contador.textContent, '43')

  window.avanzar(43000)
  assert.equal(elementos.sessionLogoutForm.envios, 1)
  assert.equal(elementos.sessionInactivityDialog.open, false)
  assert.equal(elementos.sessionLogoutDialog.open, false)

  window.avanzar(5000)
  assert.equal(elementos.sessionLogoutForm.envios, 1)
})

test('el cierre manual no muestra el aviso y cancelar devuelve el foco al disparador', () => {
  const { document, elementos } = crearPaginaSimulada()

  elementos.logoutTrigger.click()
  assert.equal(elementos.sessionLogoutDialog.open, true)
  assert.equal(elementos.sessionInactivityDialog.open, false)

  elementos.cancelSessionLogout.click()
  assert.equal(elementos.sessionLogoutDialog.open, false)
  assert.equal(document.activeElement, elementos.logoutTrigger)
})

test('la cuenta regresiva sigue corriendo mientras la confirmación de salida está abierta', () => {
  const { elementos, window } = crearPaginaSimulada()

  window.avanzar(10 * 60 * 1000)
  elementos.exitSessionButton.click()
  assert.equal(elementos.sessionLogoutDialog.open, true)

  window.avanzar(60 * 1000)
  assert.equal(elementos.sessionLogoutForm.envios, 1)
  assert.equal(elementos.sessionLogoutDialog.open, false)
})

test('al volver a una pestaña suspendida usa el vencimiento real y no concede otros 60 segundos', () => {
  const { document, elementos, window } = crearPaginaSimulada()

  window.saltar(11 * 60 * 1000)
  document.visibilityState = 'visible'
  document.emitir('visibilitychange')

  assert.equal(elementos.sessionLogoutForm.envios, 1)
  assert.equal(elementos.sessionInactivityDialog.open, false)
})
