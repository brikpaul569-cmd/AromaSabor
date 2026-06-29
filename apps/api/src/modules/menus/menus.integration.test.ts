import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, stopTestApp } from '../../test/test-module';

let app: INestApplication;
let http: request.SuperTest<request.Test>;

beforeAll(async () => {
  app = await createTestApp();
  http = request(app.getHttpServer()) as any;
});

afterAll(async () => {
  await stopTestApp(app);
});

describe('Menus — Integration', () => {
  let menuId: string;
  let categoryId: string;
  let itemId: string;

  // ── CREATE MENU ──────────────────────────────────────────────────────

  it('POST /api/menus — creates a menu with empty categories', async () => {
    const res = await http
      .post('/api/menus')
      .send({ name: 'Menú Ejecutivo' })
      .expect(201);

    expect(res.body._id).toBeDefined();
    expect(res.body.name).toBe('Menú Ejecutivo');
    expect(res.body.slug).toBe('menu-ejecutivo');
    expect(res.body.categories).toEqual([]);
    expect(res.body.isActive).toBe(false);
    menuId = res.body._id;
  });

  it('POST /api/menus — generates unique slug on duplicate name', async () => {
    const res = await http
      .post('/api/menus')
      .send({ name: 'Menú Ejecutivo' })
      .expect(201);

    expect(res.body.slug).toMatch(/^menu-ejecutivo-/);
  });

  // ── PUBLIC GET ENDPOINTS ─────────────────────────────────────────────

  it('GET /api/menus — returns all menus (public)', async () => {
    const res = await http.get('/api/menus').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('GET /api/menus/:id — returns single menu (public)', async () => {
    const res = await http.get(`/api/menus/${menuId}`).expect(200);
    expect(res.body._id).toBe(menuId);
    expect(res.body.name).toBe('Menú Ejecutivo');
  });

  it('GET /api/menus/:id — returns 404 for invalid ObjectId', async () => {
    await http.get('/api/menus/000000000000000000000000').expect(404);
  });

  // ── CATEGORY CRUD ────────────────────────────────────────────────────

  it('POST /api/menus/:id/categories — adds a category', async () => {
    const res = await http
      .post(`/api/menus/${menuId}/categories`)
      .send({ id: 'entrada', label: 'Entrada', maxItems: 2 })
      .expect(201);

    expect(res.body.categories).toHaveLength(1);
    expect(res.body.categories[0].id).toBe('entrada');
    expect(res.body.categories[0].label).toBe('Entrada');
    expect(res.body.categories[0].maxItems).toBe(2);
    expect(res.body.categories[0].items).toEqual([]);
    expect(res.body.categories[0]._id).toBeDefined();
    categoryId = res.body.categories[0]._id;
  });

  it('POST /api/menus/:id/categories — adds a second category', async () => {
    const res = await http
      .post(`/api/menus/${menuId}/categories`)
      .send({ id: 'postre', label: 'Postre', maxItems: 1 })
      .expect(201);

    expect(res.body.categories).toHaveLength(2);
  });

  it('PATCH /api/menus/:id/categories/:catId — updates category label and maxItems', async () => {
    const res = await http
      .patch(`/api/menus/${menuId}/categories/${categoryId}`)
      .send({ label: 'Entradas', maxItems: 3 })
      .expect(200);

    const cat = res.body.categories.find((c: any) => c._id === categoryId);
    expect(cat.label).toBe('Entradas');
    expect(cat.maxItems).toBe(3);
  });

  it('PATCH /api/menus/:id/categories/:catId — returns 404 for invalid category', async () => {
    await http
      .patch(`/api/menus/${menuId}/categories/000000000000000000000000`)
      .send({ label: 'Nope' })
      .expect(404);
  });

  it('DELETE /api/menus/:id/categories/:catId — removes the second category', async () => {
    const res = await http.get(`/api/menus/${menuId}`).expect(200);
    const secondId = res.body.categories[1]._id;

    const del = await http
      .delete(`/api/menus/${menuId}/categories/${secondId}`)
      .expect(200);

    expect(del.body.categories).toHaveLength(1);
  });

  // ── ITEM CRUD ────────────────────────────────────────────────────────

  it('POST /api/menus/:id/categories/:catId/items — adds an item', async () => {
    const res = await http
      .post(`/api/menus/${menuId}/categories/${categoryId}/items`)
      .send({
        name: 'Ensalada César',
        description: 'Lechuga, crutones, parmesano',
        pricePerPortion: 8500,
        portionGrams: 150,
        unit: 'gr',
      })
      .expect(201);

    const cat = res.body.categories.find((c: any) => c._id === categoryId);
    expect(cat.items).toHaveLength(1);
    expect(cat.items[0].name).toBe('Ensalada César');
    expect(cat.items[0].pricePerPortion).toBe(8500);
    expect(cat.items[0].portionGrams).toBe(150);
    expect(cat.items[0].unit).toBe('gr');
    itemId = cat.items[0]._id;
  });

  it('POST /api/menus/:id/categories/:catId/items — adds a second item', async () => {
    const res = await http
      .post(`/api/menus/${menuId}/categories/${categoryId}/items`)
      .send({
        name: 'Sopa de Tomate',
        pricePerPortion: 6200,
      })
      .expect(201);

    const cat = res.body.categories.find((c: any) => c._id === categoryId);
    expect(cat.items).toHaveLength(2);
  });

  it('POST /api/menus/:id/categories/:catId/items — returns 404 for invalid category', async () => {
    await http
      .post(`/api/menus/${menuId}/categories/000000000000000000000000/items`)
      .send({ name: 'X', pricePerPortion: 1000 })
      .expect(404);
  });

  it('PATCH /api/menus/:id/categories/:catId/items/:itemId — updates item fields', async () => {
    const res = await http
      .patch(`/api/menus/${menuId}/categories/${categoryId}/items/${itemId}`)
      .send({ pricePerPortion: 9500, isAvailable: false })
      .expect(200);

    const cat = res.body.categories.find((c: any) => c._id === categoryId);
    const item = cat.items.find((i: any) => i._id === itemId);
    expect(item.pricePerPortion).toBe(9500);
    expect(item.isAvailable).toBe(false);
    expect(item.name).toBe('Ensalada César');
  });

  it('DELETE /api/menus/:id/categories/:catId/items/:itemId — removes the second item', async () => {
    const getRes = await http.get(`/api/menus/${menuId}`).expect(200);
    const cat = getRes.body.categories.find((c: any) => c._id === categoryId);
    const secondId = cat.items.find((i: any) => i._id !== itemId)._id;

    const del = await http
      .delete(`/api/menus/${menuId}/categories/${categoryId}/items/${secondId}`)
      .expect(200);

    const updatedCat = del.body.categories.find((c: any) => c._id === categoryId);
    expect(updatedCat.items).toHaveLength(1);
  });

  // ── PUBLISH & PUBLIC SLUG LOOKUP ─────────────────────────────────────

  it('PATCH /api/menus/:id/publish — sets isActive to true', async () => {
    const res = await http
      .patch(`/api/menus/${menuId}/publish`)
      .send({ isActive: true })
      .expect(200);

    expect(res.body.isActive).toBe(true);
  });

  it('GET /api/menus/slug/:slug — returns published menu by slug', async () => {
    const res = await http.get('/api/menus/slug/menu-ejecutivo').expect(200);
    expect(res.body._id).toBe(menuId);
    expect(res.body.categories).toHaveLength(1);
    expect(res.body.categories[0].items).toHaveLength(1);
  });

  it('GET /api/menus/slug/:slug — returns 404 for unpublished menu', async () => {
    const menu = await http.post('/api/menus').send({ name: 'Sin Publicar' }).expect(201);
    await http.get(`/api/menus/slug/sin-publicar`).expect(404);
  });

  // ── CATEGORY REMOVAL CASCADES ITEMS ──────────────────────────────────

  it('removing a category also removes its items', async () => {
    await http
      .delete(`/api/menus/${menuId}/categories/${categoryId}`)
      .expect(200);

    const res = await http.get(`/api/menus/${menuId}`).expect(200);
    expect(res.body.categories).toHaveLength(0);
  });

  // ── DELETE MENU ──────────────────────────────────────────────────────

  it('DELETE /api/menus/:id — removes the menu', async () => {
    await http.delete(`/api/menus/${menuId}`).expect(200);
    await http.get(`/api/menus/${menuId}`).expect(404);
  });
});
