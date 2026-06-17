import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  telephone: {
    type: String,
    default: '-',
  },
  role: {
    type: String,
    enum: ['Administrateur', 'Agent', 'Comptable'],
    default: 'Agent',
  },
  statut: {
    type: String,
    enum: ['Actif', 'Inactif'],
    default: 'Actif',
  },
  // Préférences du système pour le profil
  notifEmail: {
    type: Boolean,
    default: true,
  },
  notifVentes: {
    type: Boolean,
    default: true,
  },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
}, { timestamps: true });


export default mongoose.models.User || mongoose.model('User', UserSchema);