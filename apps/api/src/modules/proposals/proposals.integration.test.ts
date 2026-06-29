import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, stopTestApp } from '../../test/test-module';

let app: INestApplication;
let http: request.SuperTest<request.Test>;

let menuId: string;
let proposalId: string;

beforeAll(async () => {
  app = await createTestApp();
  http = request(app.getHttpServer()) as any;

  const menu = await http
    .post('/api/menus')
    .send({ name: 'Menú Test Propuestas' })
    .expect(201);

  menuId = menu.body._id;

  const cat = await http
    .post(`/api/menus/${menuId}/categories`)
    .send({ id: 'entrada', label: 'Entrada', maxItems: 2 })
    .expect(201);

  const categoryId = cat.body.categories[0]._id;

  await http
    .post(`/api/menus/${menuId}/categories/${categoryId}/items`)
    .send({ name: 'Ensalada', pricePerPortion: 5000 })
    .expect(201);

  await http
    .post(`/api/menus/${menuId}/categories/${categoryId}/items`)
    .send({ name: 'Sopa', pricePerPortion: 4000 })
    .expect(201);
});

afterAll(async () => {
  await stopTestApp(app);
});

describe('Proposals — State Machine', () => {
  // ── CREATE ────────────────────────────────────────────────────────────

  it('POST /api/proposals — creates proposal with borrador status', async () => {
    const res = await http
      .post('/api/proposals')
      .send({
        menuId,
        clientName: 'Cliente Test',
        eventDate: '2026-12-15',
        guestCount: 50,
        items: [
          { name: 'Ensalada', categoryId: 'entrada', categoryLabel: 'Entrada', pricePerPortion: 5000, quantity: 1 },
          { name: 'Sopa', categoryId: 'entrada', categoryLabel: 'Entrada', pricePerPortion: 4000, quantity: 1 },
        ],
      })
      .expect(201);

    expect(res.body.status).toBe('borrador');
    expect(res.body.pricePerPlate).toBe(9000);
    expect(res.body.totalPrice).toBe(res.body.quotation);
    expect(res.body.token).toBeDefined();
    expect(res.body.items).toHaveLength(2);
    proposalId = res.body._id;
  });

  // ── SEND ──────────────────────────────────────────────────────────────

  it('PATCH /api/proposals/:id/send — transitions to enviado', async () => {
    const res = await http
      .patch(`/api/proposals/${proposalId}/send`)
      .expect(200);

    expect(res.body.status).toBe('enviado');
    expect(new Date(res.body.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('PATCH /api/proposals/:id/send — rejects non-borrador proposals', async () => {
    await http
      .patch(`/api/proposals/${proposalId}/send`)
      .expect(409);
  });

  // ── APPROVE ───────────────────────────────────────────────────────────

  it('PATCH /api/proposals/:id/approve — transitions to aceptado', async () => {
    const res = await http
      .patch(`/api/proposals/${proposalId}/approve`)
      .expect(200);

    expect(res.body.status).toBe('aceptado');
  });

  it('PATCH /api/proposals/:id/approve — rejects already approved', async () => {
    await http
      .patch(`/api/proposals/${proposalId}/approve`)
      .expect(400);
  });

  // ── REJECT ────────────────────────────────────────────────────────────

  it('PATCH /api/proposals/:id/reject — can reject a new proposal', async () => {
    const prop = await http
      .post('/api/proposals')
      .send({
        menuId,
        clientName: 'Cliente Rechazo',
        eventDate: '2026-12-20',
        guestCount: 30,
        items: [{ name: 'Ensalada', categoryId: 'entrada', categoryLabel: 'Entrada', pricePerPortion: 5000, quantity: 1 }],
      })
      .expect(201);

    await http.patch(`/api/proposals/${prop.body._id}/send`).expect(200);

    const res = await http
      .patch(`/api/proposals/${prop.body._id}/reject`)
      .expect(200);

    expect(res.body.status).toBe('rechazado');
  });

  // ── GENERIC STATUS TRANSITION ─────────────────────────────────────────

  it('PATCH /api/proposals/:id/status — enviado → modificado_por_cliente', async () => {
    const prop = await http
      .post('/api/proposals')
      .send({
        menuId,
        clientName: 'Cliente Mod',
        eventDate: '2026-12-25',
        guestCount: 20,
        items: [{ name: 'Ensalada', categoryId: 'entrada', categoryLabel: 'Entrada', pricePerPortion: 5000, quantity: 1 }],
      })
      .expect(201);

    await http.patch(`/api/proposals/${prop.body._id}/send`).expect(200);

    const res = await http
      .patch(`/api/proposals/${prop.body._id}/status`)
      .send({ status: 'modificado_por_cliente', modifiedBy: 'cliente', reason: 'Quiero cambiar la sopa' })
      .expect(200);

    expect(res.body.status).toBe('modificado_por_cliente');
  });

  it('PATCH /api/proposals/:id/status — invalid transition returns 400', async () => {
    const prop = await http
      .post('/api/proposals')
      .send({
        menuId,
        clientName: 'Invalido',
        eventDate: '2026-12-30',
        guestCount: 10,
        items: [{ name: 'Ensalada', categoryId: 'entrada', categoryLabel: 'Entrada', pricePerPortion: 5000, quantity: 1 }],
      })
      .expect(201);

    // borrador → aceptado is invalid
    await http
      .patch(`/api/proposals/${prop.body._id}/status`)
      .send({ status: 'aceptado', modifiedBy: 'cliente' })
      .expect(400);
  });

  // ── EDIT HISTORY ──────────────────────────────────────────────────────

  it('GET /api/proposals/id/:id/history — returns edit history', async () => {
    const prop = await http
      .post('/api/proposals')
      .send({
        menuId,
        clientName: 'Historial Test',
        eventDate: '2026-12-10',
        guestCount: 15,
        items: [{ name: 'Ensalada', categoryId: 'entrada', categoryLabel: 'Entrada', pricePerPortion: 5000, quantity: 1 }],
      })
      .expect(201);

    await http.patch(`/api/proposals/${prop.body._id}/send`).expect(200);

    await http
      .patch(`/api/proposals/${prop.body._id}/status`)
      .send({ status: 'modificado_por_cliente', modifiedBy: 'cliente', reason: 'Cambio de opinión' })
      .expect(200);

    const historyRes = await http
      .get(`/api/proposals/id/${prop.body._id}/history`)
      .expect(200);

    expect(Array.isArray(historyRes.body)).toBe(true);
    expect(historyRes.body.length).toBeGreaterThanOrEqual(2);
    expect(historyRes.body[0].modifiedBy).toBe('chef');
    expect(historyRes.body[1].modifiedBy).toBe('cliente');
    expect(historyRes.body[1].reason).toBe('Cambio de opinión');
  });

  // ── PUBLIC TOKEN LOOKUP MARKS AS VIEWED & EXPIRES ─────────────────────

  it('GET /api/proposals/:token — marks as viewed', async () => {
    const prop = await http
      .post('/api/proposals')
      .send({
        menuId,
        clientName: 'View Test',
        eventDate: '2026-11-01',
        guestCount: 25,
        items: [{ name: 'Ensalada', categoryId: 'entrada', categoryLabel: 'Entrada', pricePerPortion: 5000, quantity: 1 }],
      })
      .expect(201);

    await http.patch(`/api/proposals/${prop.body._id}/send`).expect(200);

    const res = await http.get(`/api/proposals/${prop.body.token}`).expect(200);
    expect(res.body.viewedAt).toBeDefined();
  });
});
