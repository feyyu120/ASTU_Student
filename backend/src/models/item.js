import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['lost', 'found'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,  // e.g., 'ID card', 'Calculator'
    required: true
  },
  location: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  imageUrl: {
    type: String,  // Path to uploaded image
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'claimed', 'resolved'],
    default: 'pending'
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true  // Reporter
  },
  finderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null  // For found items
  }
}, { timestamps: true });

const Item = mongoose.model("Item", itemSchema);

export default Item;