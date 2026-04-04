const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:             { type: String, required: true },
  tamilName:        { type: String, default: '' },
  brand:            { type: String, default: 'Mangalyam · G. Anandan' },
  type:             { type: String, default: '' },
  categories:       [{ type: String }],
  badge:            { type: String, default: '' },
  badgeColor:       { type: String, default: 'm' },
  emoji:            { type: String, default: '🧵' },
  images:           [{ type: String }],
  retailPrice:      { type: Number, required: true },
  wholesalePrice:   { type: Number, required: true },
  wholesaleMinQty:  { type: Number, default: 20 },
  rating:           { type: Number, default: 4.5 },
  reviewCount:      { type: Number, default: 0 },
  specs:            { type: Map, of: String },
  stock:            { type: Number, default: 100 },
  isActive:         { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
