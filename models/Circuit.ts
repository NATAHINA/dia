import mongoose from 'mongoose';

if (mongoose.models.Circuit) {
  delete mongoose.models.Circuit;
}

const CircuitSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, 'Le nom du circuit est obligatoire'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    prixStandard: {
      type: Number,
      required: [true, 'Le prix standard est obligatoire'],
      default: 0,
    },
    capaciteMax: {
      type: Number,
      required: [true, 'La capacité maximale est obligatoire'],
      default: 10,
    },
    dureeJours: {
      type: Number,
      default: 1,
    }
  },
  { timestamps: true }
);

export default mongoose.model('Circuit', CircuitSchema);