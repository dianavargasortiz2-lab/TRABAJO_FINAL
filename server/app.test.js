const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const app = require('./app');
const { Product, Customer, Order } = require('./models');

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

test('order endpoint saves an order with delivery fee pending confirmation', async () => {
  const originalFind = Product.find;
  const originalFindOneAndUpdate = Customer.findOneAndUpdate;
  const originalCreate = Order.create;
  Product.find = () => ({
    lean: async () => [{ productId: 'pollo-entero', name: 'Pollo', price: 30000 }],
  });
  Customer.findOneAndUpdate = async () => ({});
  Order.create = async (order) => order;

  try {
    const response = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente: {
          nombre: 'Cliente de prueba',
          telefono: '3001234567',
          direccion: 'Calle 1 # 2-3',
          pago: 'Efectivo',
        },
        productos: [{ productId: 'pollo-entero', quantity: 1 }],
      }),
    });
    assert.equal(response.status, 201);
    const order = await response.json();
    assert.equal(order.subtotal, 30000);
    assert.equal(order.costoDomicilio, null);
    assert.equal(order.total, null);
  } finally {
    Product.find = originalFind;
    Customer.findOneAndUpdate = originalFindOneAndUpdate;
    Order.create = originalCreate;
  }
});

test('order schema accepts orders whose delivery fee and total are pending', async () => {
  const order = new Order({
    numeroOrden: 'CAF-TEST',
    cliente: {
      nombre: 'Cliente',
      telefono: '3001234567',
      direccion: 'Calle 1 # 2-3',
      pago: 'Efectivo',
    },
    productos: [{
      productId: 'pollo-entero',
      name: 'Pollo',
      price: 30000,
      quantity: 1,
      subtotal: 30000,
    }],
    subtotal: 30000,
    costoDomicilio: null,
    total: null,
    estado: 'Recibido',
  });
  await assert.doesNotReject(order.validate());
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
