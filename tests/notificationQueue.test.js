import test from 'node:test';
import assert from 'node:assert/strict';
import { reminderType } from '../services/paciente/appointmentReminders.js';
import { sendDiagnosisNotificationEmail } from '../services/emailService.js';

test('recordatorios respetan ventanas de Bogotá y rechazan horas inválidas', () => {
    const now = new Date('2026-11-27T12:00:00Z');
    assert.equal(reminderType('2026-11-28', '07:00:00', now), 'recordatorio_24h');
    assert.equal(reminderType('2026-11-27', '08:00:00', now), 'recordatorio_1h');
    assert.equal(reminderType('2026-11-27', '07:00:00', now), null);
    assert.equal(reminderType('2026-11-28', '07:01:00', now), null);
    assert.equal(reminderType('2026-11-27', '24:10:00', now), null);
});

test('aviso de diagnóstico usa enlace y no incluye contenido clínico', async () => {
    const originalFetch = globalThis.fetch;
    const originals = { key: process.env.RESEND_API_KEY, from: process.env.EMAIL_FROM, base: process.env.BACKEND_URL, name: process.env.NAME_EMAIL };
    try {
        process.env.RESEND_API_KEY = 'test-key'; process.env.EMAIL_FROM = 'test@example.invalid';
        process.env.BACKEND_URL = 'https://example.invalid'; delete process.env.NAME_EMAIL;
        let sent;
        globalThis.fetch = async (_, options) => { sent = { ...options, body: JSON.parse(options.body) }; return { ok: true }; };
        await sendDiagnosisNotificationEmail({ nombres: 'Ana', apellidos: 'Prueba', correo: 'patient@example.invalid', diagnostico: 'DATO_CLINICO_PRIVADO' }, 'diagnostico-1');
        assert.equal(sent.headers['Idempotency-Key'], 'diagnostico-1');
        assert.match(sent.body.html, /https:\/\/example\.invalid\/paciente\/historial-diagnosticos/);
        assert.doesNotMatch(JSON.stringify(sent.body), /DATO_CLINICO_PRIVADO/);
    } finally {
        globalThis.fetch = originalFetch;
        for (const [key, value] of Object.entries({ RESEND_API_KEY: originals.key, EMAIL_FROM: originals.from, BACKEND_URL: originals.base, NAME_EMAIL: originals.name })) {
            if (value === undefined) delete process.env[key]; else process.env[key] = value;
        }
    }
});
