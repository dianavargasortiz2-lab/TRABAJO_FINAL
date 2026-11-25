const bcrypt = require('bcryptjs');
const models = require('./models');
const catalog = require('../shared/catalog.json');

async function bootstrapDatabase(databaseModels = models, catalogData = catalog, environment = process.env) {
  const { Category, Product, Vacancy, AdminUser } = databaseModels;

  for (const name of catalogData.categories) {
    const slug = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    await Category.updateOne({ slug }, { $setOnInsert: { name, slug } }, { upsert: true });
  }

  for (const product of catalogData.products) {
    const { id: productId, ...fields } = product;
    await Product.updateOne(
      { productId },
      { $setOnInsert: { productId, ...fields } },
      { upsert: true },
    );
  }

  for (const vacancy of catalogData.vacancies) {
    const { cargo, jornada, ubicacion, requisitos, descripcion, activa } = vacancy;
    await Vacancy.updateOne(
      { cargo },
      { $setOnInsert: { cargo, jornada, ubicacion, requisitos, descripcion, activa } },
      { upsert: true },
    );
  }

  const email = environment.ADMIN_EMAIL?.trim().toLowerCase();
  const password = environment.ADMIN_PASSWORD;
  if (!email && !password) return;
  if (!email || !password || password.length < 12) {
    throw new Error('Configura ADMIN_EMAIL y una ADMIN_PASSWORD de al menos 12 caracteres.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await AdminUser.updateOne(
    { email },
    { $setOnInsert: { email, passwordHash } },
    { upsert: true },
  );
}

module.exports = { bootstrapDatabase };
