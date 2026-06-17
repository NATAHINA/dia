import mongoose from 'mongoose';

if (mongoose.models.Client) {
  delete mongoose.models.Client;
}

const ClientSchema = new mongoose.Schema(
  {
    nomComplet: {
      type: String,
      required: [true, 'Le nom du client est obligatoire'],
      trim: true,
    },
    telephone: {
      type: String,
      required: [true, 'Le numéro de téléphone est obligatoire'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    adresse: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
    }
  },
  { timestamps: true }
);

export default mongoose.model('Client', ClientSchema);