require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { AdminUser } = require('../models');

async function seedAdmin() {
  const { MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Configura MONGO_URI, ADMIN_EMAIL y ADMIN_PASSWORD para crear el administrador.');
  }
  await mongoose.connect(MONGO_URI);
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await AdminUser.updateOne(
    { email: ADMIN_EMAIL.trim().toLowerCase() },
    { $set: { email: ADMIN_EMAIL.trim().toLowerCase(), passwordHash } },
    { upsert: true },
  );
  console.log(`Administrador configurado: ${ADMIN_EMAIL.trim().toLowerCase()}`);
}

seedAdmin()
  .catch((error) => {
    console.error('No se pudo configurar el administrador:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
