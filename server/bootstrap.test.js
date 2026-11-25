const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { bootstrapDatabase } = require('./bootstrap');

function createModels() {
  const calls = { Category: [], Product: [], Vacancy: [], AdminUser: [] };
  const createModel = (name) => ({
    updateOne: async (...args) => calls[name].push(args),
  });
  return {
    calls,
    models: {
      Category: createModel('Category'),
      Product: createModel('Product'),
      Vacancy: createModel('Vacancy'),
      AdminUser: createModel('AdminUser'),
    },
  };
}

test('database bootstrap inserts missing catalog data without replacing existing records', async () => {
  const { calls, models } = createModels();
  await bootstrapDatabase(
    models,
    {
      categories: ['Pollos'],
      products: [{ id: 'pollo', name: 'Pollo', price: 10 }],
      vacancies: [{
        cargo: 'Cocinero',
        jornada: 'Completa',
        ubicacion: 'Neiva',
        requisitos: [],
        descripcion: 'Vacante inicial',
        activa: true,
      }],
    },
    {},
  );

  assert.deepEqual(calls.Category[0][1].$setOnInsert, { name: 'Pollos', slug: 'pollos' });
  assert.deepEqual(calls.Product[0][1].$setOnInsert, {
    productId: 'pollo',
    name: 'Pollo',
    price: 10,
  });
  assert.equal(calls.Vacancy[0][1].$setOnInsert.descripcion, 'Vacante inicial');
  assert.equal(calls.AdminUser.length, 0);
});

test('database bootstrap creates the initial administrator from private environment values', async () => {
  const { calls, models } = createModels();
  await bootstrapDatabase(models, { categories: [], products: [], vacancies: [] }, {
    ADMIN_EMAIL: 'Admin@Example.com',
    ADMIN_PASSWORD: 'a-private-password',
  });

  const [filter, update, options] = calls.AdminUser[0];
  assert.deepEqual(filter, { email: 'admin@example.com' });
  assert.equal(options.upsert, true);
  assert.equal(update.$setOnInsert.email, 'admin@example.com');
  assert.equal(await bcrypt.compare('a-private-password', update.$setOnInsert.passwordHash), true);
});

test('database bootstrap rejects incomplete administrator configuration', async () => {
  const { models } = createModels();
  await assert.rejects(
    bootstrapDatabase(models, { categories: [], products: [], vacancies: [] }, {
      ADMIN_EMAIL: 'admin@example.com',
    }),
    /Configura ADMIN_EMAIL/,
  );
});
