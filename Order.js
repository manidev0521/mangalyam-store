const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId:     { type: String, unique: true },
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerName:{ type: String, required: true },
  phone:       { type: String, required: true },
  address:     { type: String, default: '' },
  city:        { type: String, default: '' },
  items: [{
    productId:   { type: String },
    productName: { type: String },
    qty:         { type: Number },
    unitPrice:   { type: Number },
    total:       { type: Number },
  }],
  totalAmount:  { type: Number, required: true },
  status:       { type: String, enum: ['placed','confirmed','packed','out_for_delivery','delivered'], default: 'placed' },
  timeline: [{
    status:    String,
    message:   String,
    timestamp: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

orderSchema.pre('save', async function(next) {
  if (!this.orderId) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderId = `MG-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
