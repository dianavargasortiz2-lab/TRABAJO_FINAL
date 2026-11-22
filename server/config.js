function getDeliveryFee() {
  const raw = process.env.DELIVERY_FEE_COP;
  if (raw === undefined || raw.trim() === '') return null;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error('DELIVERY_FEE_COP debe ser un entero no negativo en pesos colombianos.');
  }
  return value;
}

module.exports = { getDeliveryFee };
