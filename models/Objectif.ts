

import mongoose from 'mongoose';

const ObjectifSchema = new mongoose.Schema(
  {
    mois: {
      type: Number,
      required: [true, 'Le mois est obligatoire'],
      min: 1,
      max: 12,
    },
    annee: {
      type: Number,
      required: [true, "L'année est obligatoire"],
      default: 2026,
    },
    montant: {
      type: Number,
      required: [true, 'Le montant de l\'objectif est obligatoire'],
      default: 0,
    },
  },
  { timestamps: true }
);

// Cette syntaxe est cruciale pour Next.js (Turbopack / Webpack)
export default mongoose.models.Objectif || mongoose.model('Objectif', ObjectifSchema);