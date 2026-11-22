require('dotenv').config();
const mongoose = require('mongoose');
const { Category, Product, Vacancy } = require('../models');
const catalog = require('../../shared/catalog.json');

async function seed() {
  if (!process.env.MONGO_URI) throw new Error('Configura MONGO_URI antes de sembrar el catálogo.');
  await mongoose.connect(process.env.MONGO_URI);
  for (const name of catalog.categories) {
    const slug = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    await Category.updateOne({ slug }, { $set: { name, slug } }, { upsert: true });
  }
  for (const product of catalog.products) {
    const { id: productId, ...fields } = product;
    await Product.updateOne({ productId }, { $set: { productId, ...fields } }, { upsert: true });
  }
  for (const vacancy of catalog.vacancies) {
    const { cargo, jornada, ubicacion, requisitos, descripcion, activa } = vacancy;
    await Vacancy.updateOne(
      { cargo },
      { $set: { cargo, jornada, ubicacion, requisitos, descripcion, activa } },
      { upsert: true },
    );
  }
  console.log('Catálogo y vacantes iniciales importados.');
}

seed()
  .catch((error) => {
    console.error('No se pudo importar el catálogo:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
