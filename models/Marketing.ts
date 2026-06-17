import mongoose from 'mongoose';

const MarketingSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'La date est obligatoire'],
    },
    publication: {
      type: String,
      required: [true, 'Le nom de la publication est obligatoire'],
      trim: true,
    },
    portee: {
      type: Number,
      default: 0,
    },
    messages: {
      type: Number,
      default: 0,
    },
    reservationsObtenues: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, 
  }
);

export default mongoose.models.Marketing || mongoose.model('Marketing', MarketingSchema);