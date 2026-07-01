import { describe, it, expect } from 'vitest';
import { assertValidTransition, TRANSITIONS } from './proposals.state-machine';

describe('State Machine — respuesta_parcial', () => {
  // ── VALID TRANSITIONS INTO respuesta_parcial ──────────────────────────

  it('allows enviado → respuesta_parcial', () => {
    expect(() => assertValidTransition('enviado', 'respuesta_parcial')).not.toThrow();
  });

  it('allows modificado_por_chef → respuesta_parcial', () => {
    expect(() => assertValidTransition('modificado_por_chef', 'respuesta_parcial')).not.toThrow();
  });

  // ── VALID TRANSITIONS OUT OF respuesta_parcial ─────────────────────────

  it('allows respuesta_parcial → modificado_por_chef', () => {
    expect(() => assertValidTransition('respuesta_parcial', 'modificado_por_chef')).not.toThrow();
  });

  it('allows respuesta_parcial → aceptado', () => {
    expect(() => assertValidTransition('respuesta_parcial', 'aceptado')).not.toThrow();
  });

  it('allows respuesta_parcial → rechazado', () => {
    expect(() => assertValidTransition('respuesta_parcial', 'rechazado')).not.toThrow();
  });

  it('allows respuesta_parcial → expirado', () => {
    expect(() => assertValidTransition('respuesta_parcial', 'expirado')).not.toThrow();
  });

  // ── INVALID TRANSITIONS INTO respuesta_parcial ─────────────────────────

  it('rejects borrador → respuesta_parcial', () => {
    expect(() => assertValidTransition('borrador', 'respuesta_parcial')).toThrow();
  });

  it('rejects modificado_por_cliente → respuesta_parcial', () => {
    expect(() => assertValidTransition('modificado_por_cliente', 'respuesta_parcial')).toThrow();
  });

  it('rejects aceptado → respuesta_parcial', () => {
    expect(() => assertValidTransition('aceptado', 'respuesta_parcial')).toThrow();
  });

  it('rejects rechazado → respuesta_parcial', () => {
    expect(() => assertValidTransition('rechazado', 'respuesta_parcial')).toThrow();
  });

  it('rejects expirado → respuesta_parcial', () => {
    expect(() => assertValidTransition('expirado', 'respuesta_parcial')).toThrow();
  });

  // ── INVALID TRANSITIONS OUT OF respuesta_parcial ───────────────────────

  it('rejects respuesta_parcial → borrador', () => {
    expect(() => assertValidTransition('respuesta_parcial', 'borrador')).toThrow();
  });

  it('rejects respuesta_parcial → enviado', () => {
    expect(() => assertValidTransition('respuesta_parcial', 'enviado')).toThrow();
  });

  it('rejects respuesta_parcial → modificado_por_cliente', () => {
    expect(() => assertValidTransition('respuesta_parcial', 'modificado_por_cliente')).toThrow();
  });

  it('rejects respuesta_parcial → respuesta_parcial (self-loop)', () => {
    expect(() => assertValidTransition('respuesta_parcial', 'respuesta_parcial')).toThrow();
  });

  // ── VERIFY TRANSITIONS TABLE ───────────────────────────────────────────

  it('respuesta_parcial key exists in TRANSITIONS', () => {
    expect(TRANSITIONS.respuesta_parcial).toBeDefined();
    expect(TRANSITIONS.respuesta_parcial).toEqual(['modificado_por_chef', 'aceptado', 'rechazado', 'expirado']);
  });
});
