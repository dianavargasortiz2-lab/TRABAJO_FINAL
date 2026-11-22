const test = require('node:test');
const assert = require('node:assert/strict');
const { getDeliveryFee } = require('./config');

test('no inventa un costo cuando el domicilio no está configurado', () => {
  const previous = process.env.DELIVERY_FEE_COP;
  delete process.env.DELIVERY_FEE_COP;
  assert.equal(getDeliveryFee(), null);
  if (previous !== undefined) process.env.DELIVERY_FEE_COP = previous;
});

test('acepta explícitamente un domicilio gratuito', () => {
  const previous = process.env.DELIVERY_FEE_COP;
  process.env.DELIVERY_FEE_COP = '0';
  assert.equal(getDeliveryFee(), 0);
  if (previous === undefined) delete process.env.DELIVERY_FEE_COP;
  else process.env.DELIVERY_FEE_COP = previous;
});

test('rechaza tarifas negativas o fraccionarias', () => {
  const previous = process.env.DELIVERY_FEE_COP;
  for (const value of ['-1', '1200.5']) {
    process.env.DELIVERY_FEE_COP = value;
    assert.throws(() => getDeliveryFee(), /entero no negativo/);
  }
  if (previous === undefined) delete process.env.DELIVERY_FEE_COP;
  else process.env.DELIVERY_FEE_COP = previous;
});
