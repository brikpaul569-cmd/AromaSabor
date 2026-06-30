import { BadRequestException } from '@nestjs/common';

export const TRANSITIONS: Record<string, string[]> = {
  borrador: ['enviado'],
  enviado: ['modificado_por_cliente', 'modificado_por_chef', 'respuesta_parcial', 'aceptado', 'rechazado', 'expirado'],
  modificado_por_cliente: ['modificado_por_chef', 'aceptado', 'rechazado', 'expirado'],
  modificado_por_chef: ['modificado_por_cliente', 'respuesta_parcial', 'aceptado', 'rechazado', 'expirado'],
  respuesta_parcial: ['modificado_por_chef', 'aceptado', 'rechazado', 'expirado'],
  aceptado: [],
  rechazado: [],
  expirado: [],
};

export function assertValidTransition(from: string, to: string): void {
  const allowed = TRANSITIONS[from];
  if (!allowed) throw new BadRequestException(`Unknown status: "${from}"`);
  if (!allowed.includes(to)) {
    throw new BadRequestException(
      `Invalid transition: cannot go from "${from}" to "${to}". Allowed: ${allowed.join(', ') || 'none'}`,
    );
  }
}
