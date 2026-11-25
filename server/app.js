require('dotenv').config();
const crypto = require('node:crypto');
const path = require('node:path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { getDeliveryFee } = require('./config');
const { requireAdmin } = require('./middleware/admin-auth');
const {
  AdminUser,
  Application,
  Category,
  Customer,
  Opinion,
  Order,
  Product,
  Vacancy,
} = require('./models');

const app = express();
const orderStates = ['Recibido', 'En preparación', 'En camino', 'Entregado'];
const paymentMethods = ['Efectivo', 'Transferencia', 'Tarjeta contraentrega'];
const frontendOrigins = (
  process.env.FRONTEND_ORIGIN ||
  process.env.RENDER_EXTERNAL_URL ||
  'http://localhost:4200'
)
  .split(',')
  .map((origin) => origin.trim())
  .concat('https://dianavargasortiz2-lab.github.io');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const isPdf =
      file.mimetype === 'application/pdf' &&
      path.extname(file.originalname).toLowerCase() === '.pdf';
    callback(isPdf ? null : new Error('La hoja de vida debe ser un archivo PDF.'), isPdf);
  },
});

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: frontendOrigins,
  }),
);
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ api: 'ok', database: require('mongoose').connection.readyState === 1 });
});

app.get('/api/store-config', (_req, res) => {
  try {
    res.json({ deliveryFee: getDeliveryFee() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/categories', async (_req, res) => {
  const categories = await Category.find().sort({ name: 1 }).lean();
  res.json(categories);
});

app.get('/api/products', async (_req, res) => {
  const products = await Product.find({ active: true }).sort({ name: 1 }).lean();
  res.json(
    products.map(({ productId, ...product }) => ({
      ...product,
      id: productId,
    })),
  );
});

app.get('/api/vacancies', async (_req, res) => {
  const vacancies = await Vacancy.find({ activa: true }).sort({ createdAt: -1 }).lean();
  res.json(vacancies);
});

app.post('/api/applications', upload.single('cv'), async (req, res) => {
  const { nombre, email, telefono, vacante } = req.body;
  if (!nombre?.trim() || !email?.trim() || !telefono?.trim() || !vacante || !req.file) {
    return res.status(400).json({ message: 'Completa los campos obligatorios y adjunta tu hoja de vida PDF.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ message: 'El correo electrónico no es válido.' });
  }
  if (req.file.buffer.subarray(0, 5).toString() !== '%PDF-') {
    return res.status(400).json({ message: 'El archivo adjunto no contiene un documento PDF válido.' });
  }
  const job = await Vacancy.findOne({ _id: vacante, activa: true });
  if (!job) return res.status(404).json({ message: 'La vacante seleccionada ya no está disponible.' });
  const isCourier = job.cargo.toLocaleLowerCase('es').includes('repartidor');
  if (
    isCourier &&
    (req.body.reqMoto !== 'true' ||
      req.body.reqLicencia !== 'true' ||
      req.body.reqCalles !== 'true')
  ) {
    return res.status(400).json({ message: 'Confirma los requisitos obligatorios para la vacante de repartidor.' });
  }
  if (!isCourier && !req.body.motivacion?.trim()) {
    return res.status(400).json({ message: 'Indica por qué te interesa trabajar con nosotros.' });
  }
  const allowedAnswers = [
    'disponibilidad',
    'experiencia',
    'motivacion',
    'edad',
    'experienciaCaja',
    'experienciaDomicilios',
    'moto',
    'reqMoto',
    'reqLicencia',
    'reqCalles',
  ];
  const respuestas = Object.fromEntries(
    allowedAnswers
      .filter((key) => typeof req.body[key] === 'string')
      .map((key) => [key, req.body[key].trim().slice(0, 1000)]),
  );
  await Application.create({
    nombre: nombre.trim(),
    email: email.trim().toLowerCase(),
    telefono: telefono.trim(),
    vacante: job._id,
    cv: req.file.buffer,
    cvNombre: path.basename(req.file.originalname),
    respuestas,
  });
  res.status(201).json({ message: 'Postulación recibida. Te contactaremos pronto.' });
});

app.get('/api/opinions', async (_req, res) => {
  const opinions = await Opinion.find({ aprobada: true })
    .select('nombre plato rating comentario createdAt')
    .sort({ createdAt: -1 })
    .lean();
  res.json(opinions);
});

app.post('/api/opinions', async (req, res) => {
  const { nombre, plato = '', rating, comentario } = req.body;
  const score = Number(rating);
  if (!nombre?.trim() || !comentario?.trim() || !Number.isInteger(score) || score < 1 || score > 5) {
    return res.status(400).json({ message: 'Nombre, comentario y calificación de 1 a 5 son obligatorios.' });
  }
  await Opinion.create({ nombre: nombre.trim(), plato: plato.trim(), rating: score, comentario: comentario.trim() });
  res.status(201).json({ message: '¡Opinión recibida! Aparecerá después de revisión.' });
});

app.post('/api/orders', async (req, res) => {
  const { cliente, productos } = req.body;
  const deliveryFee = getDeliveryFee();
  if (
    !cliente ||
    !cliente.nombre?.trim() ||
    !cliente.telefono?.trim() ||
    !cliente.direccion?.trim() ||
    !paymentMethods.includes(cliente.pago)
  ) {
    return res.status(400).json({ message: 'Completa los datos de entrega y selecciona un método de pago válido.' });
  }
  if (!Array.isArray(productos) || productos.length < 1 || productos.length > 30) {
    return res.status(400).json({ message: 'El pedido debe incluir entre 1 y 30 productos.' });
  }
  const requested = new Map();
  for (const item of productos) {
    const quantity = Number(item.quantity);
    if (typeof item.productId !== 'string' || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      return res.status(400).json({ message: 'Hay productos o cantidades no válidos en el pedido.' });
    }
    requested.set(item.productId, (requested.get(item.productId) || 0) + quantity);
  }
  const found = await Product.find({
    productId: { $in: [...requested.keys()] },
    active: true,
  }).lean();
  if (found.length !== requested.size) {
    return res.status(400).json({ message: 'Uno o más productos ya no están disponibles.' });
  }
  const orderItems = found.map((product) => {
    const quantity = requested.get(product.productId);
    return {
      productId: product.productId,
      name: product.name,
      price: product.price,
      quantity,
      subtotal: product.price * quantity,
    };
  });
  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  await Customer.findOneAndUpdate(
    { telefono: cliente.telefono.trim() },
    {
      nombre: cliente.nombre.trim(),
      telefono: cliente.telefono.trim(),
      direccion: cliente.direccion.trim(),
    },
    { upsert: true, new: true, runValidators: true },
  );
  const order = await Order.create({
    numeroOrden: `CAF-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    cliente: {
      nombre: cliente.nombre.trim(),
      telefono: cliente.telefono.trim(),
      direccion: cliente.direccion.trim(),
      notas: typeof cliente.notas === 'string' ? cliente.notas.trim() : '',
      pago: cliente.pago,
    },
    productos: orderItems,
    subtotal,
    costoDomicilio: deliveryFee,
    total: deliveryFee === null ? null : subtotal + deliveryFee,
    estado: orderStates[0],
    historial: [{ estado: orderStates[0], fecha: new Date() }],
  });
  res.status(201).json(order);
});

app.get('/api/orders/:numeroOrden', async (req, res) => {
  const telefono = String(req.query.telefono || '').trim();
  if (!telefono) return res.status(400).json({ message: 'Ingresa el teléfono asociado a la orden.' });
  const order = await Order.findOne({
    numeroOrden: req.params.numeroOrden,
    'cliente.telefono': telefono,
  })
    .select('-cliente.direccion -cliente.notas -cliente.pago')
    .lean();
  if (!order) return res.status(404).json({ message: 'No se encontró el pedido con esos datos.' });
  res.json(order);
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string' || !process.env.JWT_SECRET) {
    return res.status(400).json({ message: 'Ingresa correo y contraseña válidos.' });
  }
  const admin = await AdminUser.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    return res.status(401).json({ message: 'Correo o contraseña incorrectos.' });
  }
  const token = jwt.sign({ sub: admin.id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user: { email: admin.email } });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!email) return res.status(400).json({ message: 'Ingresa el correo administrador.' });
  const admin = await AdminUser.findOne({ email });
  const smtpConfigured =
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.MAIL_FROM;
  if (!smtpConfigured) {
    return res.status(503).json({ message: 'La recuperación por correo no está configurada. Configura SMTP antes de usarla.' });
  }
  if (!admin) return res.json({ message: 'Si el correo está registrado, recibirás instrucciones de recuperación.' });
  const rawToken = crypto.randomBytes(32).toString('hex');
  admin.resetTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  admin.resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000);
  await admin.save();
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const resetUrl = `${process.env.FRONTEND_ORIGIN || 'http://localhost:4200'}/admin/login?reset=${rawToken}`;
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: admin.email,
    subject: 'Recuperación de acceso — Asadero Con Afán',
    text: `Abre este enlace para cambiar tu contraseña (válido por 30 minutos): ${resetUrl}`,
  });
  res.json({ message: 'Si el correo está registrado, recibirás instrucciones de recuperación.' });
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (typeof token !== 'string' || typeof password !== 'string' || password.length < 12) {
    return res.status(400).json({ message: 'El enlace o la contraseña no son válidos. Usa al menos 12 caracteres.' });
  }
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const admin = await AdminUser.findOne({
    resetTokenHash: tokenHash,
    resetTokenExpires: { $gt: new Date() },
  }).select('+passwordHash +resetTokenHash +resetTokenExpires');
  if (!admin) return res.status(400).json({ message: 'El enlace de recuperación venció o ya fue utilizado.' });
  admin.passwordHash = await bcrypt.hash(password, 12);
  admin.resetTokenHash = undefined;
  admin.resetTokenExpires = undefined;
  await admin.save();
  res.json({ message: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
});

app.use('/api/admin', requireAdmin);

app.get('/api/admin/orders', async (_req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 }).limit(200).lean();
  res.json(orders);
});

app.patch('/api/admin/orders/:id', async (req, res) => {
  if (!orderStates.includes(req.body.estado)) {
    return res.status(400).json({ message: 'Estado de pedido no válido.' });
  }
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { $set: { estado: req.body.estado }, $push: { historial: { estado: req.body.estado, fecha: new Date() } } },
    { new: true, runValidators: true },
  );
  if (!order) return res.status(404).json({ message: 'No se encontró el pedido.' });
  res.json(order);
});

app.get('/api/admin/vacancies', async (_req, res) => {
  res.json(await Vacancy.find().sort({ createdAt: -1 }).lean());
});

app.post('/api/admin/vacancies', async (req, res) => {
  const vacancy = await Vacancy.create(req.body);
  res.status(201).json(vacancy);
});

app.put('/api/admin/vacancies/:id', async (req, res) => {
  const vacancy = await Vacancy.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    overwrite: true,
  });
  if (!vacancy) return res.status(404).json({ message: 'No se encontró la vacante.' });
  res.json(vacancy);
});

app.patch('/api/admin/vacancies/:id', async (req, res) => {
  const vacancy = await Vacancy.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!vacancy) return res.status(404).json({ message: 'No se encontró la vacante.' });
  res.json(vacancy);
});

app.delete('/api/admin/vacancies/:id', async (req, res) => {
  const vacancy = await Vacancy.findByIdAndDelete(req.params.id);
  if (!vacancy) return res.status(404).json({ message: 'No se encontró la vacante.' });
  res.status(204).end();
});

app.get('/api/admin/applications', async (req, res) => {
  const filter = {};
  if (typeof req.query.vacancy === 'string' && req.query.vacancy) {
    filter.vacante = req.query.vacancy;
  }
  const applications = await Application.find(filter)
    .select('-cv')
    .populate('vacante', 'cargo')
    .sort({ createdAt: -1 })
    .lean();
  res.json(applications);
});

app.get('/api/admin/applications/:id/resume', async (req, res) => {
  const application = await Application.findById(req.params.id).select('+cv');
  if (!application) return res.status(404).json({ message: 'No se encontró la postulación.' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(application.cvNombre)}"`,
  );
  res.send(application.cv);
});

app.patch('/api/admin/applications/:id', async (req, res) => {
  const application = await Application.findByIdAndUpdate(
    req.params.id,
    { revisada: Boolean(req.body.revisada) },
    { new: true },
  )
    .select('-cv')
    .populate('vacante', 'cargo');
  if (!application) return res.status(404).json({ message: 'No se encontró la postulación.' });
  res.json(application);
});

app.get('/api/admin/opinions', async (_req, res) => {
  res.json(await Opinion.find().sort({ createdAt: -1 }).lean());
});

app.patch('/api/admin/opinions/:id', async (req, res) => {
  const opinion = await Opinion.findByIdAndUpdate(
    req.params.id,
    { aprobada: Boolean(req.body.aprobada) },
    { new: true, runValidators: true },
  );
  if (!opinion) return res.status(404).json({ message: 'No se encontró la opinión.' });
  res.json(opinion);
});

app.delete('/api/admin/opinions/:id', async (req, res) => {
  const opinion = await Opinion.findByIdAndDelete(req.params.id);
  if (!opinion) return res.status(404).json({ message: 'No se encontró la opinión.' });
  res.status(204).end();
});

if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.resolve(__dirname, '../dist/asadero-con-afan/browser');
  app.use(express.static(clientBuildPath));
  app.use((req, res, next) => {
    if (
      req.method !== 'GET' ||
      req.path === '/api' ||
      req.path.startsWith('/api/')
    ) {
      return next();
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'), (error) => {
      if (error) next(error);
    });
  });
}

app.use('/api', (_req, res) => res.status(404).json({ message: 'Endpoint no encontrado.' }));

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'La hoja de vida no puede superar 5 MB.' });
  }
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ message: 'No se pudo procesar el archivo adjunto.' });
  }
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ message: 'Los datos enviados no son válidos.' });
  }
  console.error('Error de API:', error);
  return res.status(500).json({ message: 'Ocurrió un error interno. Intenta nuevamente.' });
});

module.exports = app;
