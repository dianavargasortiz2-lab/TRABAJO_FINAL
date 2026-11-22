const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, trim: true, unique: true },
  },
  { timestamps: true },
);

const productSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    image: { type: String, default: '' },
    rating: { type: Number, min: 1, max: 5 },
    startsAt: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const customerSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    telefono: { type: String, required: true, trim: true, index: true },
    direccion: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    numeroOrden: { type: String, required: true, unique: true, index: true },
    cliente: {
      nombre: { type: String, required: true, trim: true },
      telefono: { type: String, required: true, trim: true, index: true },
      direccion: { type: String, required: true, trim: true },
      notas: { type: String, trim: true, default: '' },
      pago: {
        type: String,
        enum: ['Efectivo', 'Transferencia', 'Tarjeta contraentrega'],
        required: true,
      },
    },
    productos: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    costoDomicilio: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    estado: {
      type: String,
      enum: ['Recibido', 'En preparación', 'En camino', 'Entregado'],
      default: 'Recibido',
    },
    historial: [
      {
        estado: {
          type: String,
          enum: ['Recibido', 'En preparación', 'En camino', 'Entregado'],
          required: true,
        },
        fecha: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

const vacancySchema = new mongoose.Schema(
  {
    cargo: { type: String, required: true, trim: true },
    jornada: { type: String, required: true, trim: true },
    ubicacion: { type: String, required: true, trim: true },
    requisitos: { type: [String], default: [] },
    descripcion: { type: String, required: true, trim: true },
    activa: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const applicationSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    telefono: { type: String, required: true, trim: true },
    vacante: { type: mongoose.Schema.Types.ObjectId, ref: 'Vacancy', required: true },
    cv: { type: Buffer, required: true, select: false },
    cvNombre: { type: String, required: true },
    respuestas: { type: mongoose.Schema.Types.Mixed, default: {} },
    revisada: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
  },
  { timestamps: true },
);

const opinionSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, maxlength: 50 },
    plato: { type: String, trim: true, maxlength: 80, default: '' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comentario: { type: String, required: true, trim: true, maxlength: 500 },
    aprobada: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = {
  Category: mongoose.model('Category', categorySchema),
  Product: mongoose.model('Product', productSchema),
  Customer: mongoose.model('Customer', customerSchema),
  Order: mongoose.model('Order', orderSchema),
  Vacancy: mongoose.model('Vacancy', vacancySchema),
  Application: mongoose.model('Application', applicationSchema),
  AdminUser: mongoose.model('AdminUser', adminSchema),
  Opinion: mongoose.model('Opinion', opinionSchema),
};
