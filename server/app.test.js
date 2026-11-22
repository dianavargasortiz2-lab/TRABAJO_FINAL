const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const app = require('./app');

let server;
let baseUrl;
const previousDeliveryFee = process.env.DELIVERY_FEE_COP;

test.before(async () => {
  delete process.env.DELIVERY_FEE_COP;
  server = app.listen(0);
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  if (previousDeliveryFee === undefined) delete process.env.DELIVERY_FEE_COP;
  else process.env.DELIVERY_FEE_COP = previousDeliveryFee;
  server.closeAllConnections();
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

test('health endpoint reports API without claiming a MongoDB connection', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { api: 'ok', database: false });
});

test('store configuration reports an unset delivery fee explicitly', async () => {
  const response = await fetch(`${baseUrl}/api/store-config`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { deliveryFee: null });
});

test('order endpoint refuses an order until a real delivery fee is configured', async () => {
  const response = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cliente: {}, productos: [] }),
  });
  assert.equal(response.status, 503);
  assert.match((await response.json()).message, /costo del domicilio no está configurado/);
});

test('admin endpoints require a signed-in session', async () => {
  const response = await fetch(`${baseUrl}/api/admin/orders`);
  assert.equal(response.status, 401);
});

test('application endpoint rejects files that are not real PDFs', async () => {
  const form = new FormData();
  form.append('nombre', 'Postulante de prueba');
  form.append('email', 'persona@example.com');
  form.append('telefono', '3001234567');
  form.append('vacante', 'vacante-inexistente');
  form.append('cv', new Blob(['not a PDF'], { type: 'application/pdf' }), 'hoja.pdf');
  const response = await fetch(`${baseUrl}/api/applications`, {
    method: 'POST',
    body: form,
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /documento PDF válido/);
});

test('application endpoint enforces the 5 MB upload limit', async () => {
  const form = new FormData();
  form.append(
    'cv',
    new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], { type: 'application/pdf' }),
    'hoja.pdf',
  );
  const response = await fetch(`${baseUrl}/api/applications`, {
    method: 'POST',
    body: form,
  });
  assert.equal(response.status, 413);
  assert.match((await response.json()).message, /no puede superar 5 MB/);
});
