require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const port = Number(process.env.PORT || 3000);
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error('Falta MONGO_URI. Configura MongoDB antes de iniciar la API.');
  process.exit(1);
}

if (mongoUri.includes('<db_password>')) {
  console.error('Reemplaza <db_password> en .env con la contraseña real de MongoDB Atlas.');
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => {
    app.listen(port, () => {
      console.log(`API lista en http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('No se pudo conectar a MongoDB:', error.message);
    process.exit(1);
  });
