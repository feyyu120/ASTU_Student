import mongoose from 'mongoose';

const claimDetailSchema = new mongoose.Schema({
  claimId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Claim', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  content: { type: String },
  imageUrl: { type: String }, // Cloudinary URL
  createdAt: { type: Date, default: Date.now },
});

const ClaimDetail = mongoose.model('ClaimDetail', claimDetailSchema);

export default ClaimDetail;