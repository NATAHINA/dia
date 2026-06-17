import mongoose from 'mongoose';

const ReservationSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'La date est obligatoire'],
    },
    client: {
      type: String,
      required: [true, 'Le nom du client est obligatoire'],
      trim: true,
    },
    circuit: {
      type: String,
      required: [true, 'Le circuit est obligatoire'],
      trim: true,
    },
    nbPersonnes: {
      type: Number,
      required: true,
      default: 1,
    },
    montant: {
      type: Number,
      required: true,
      default: 0,
    },
    acompte: {
      type: Number,
      required: true,
      default: 0,
    },
    solde: {
      type: Number,
      default: 0,
    },
    statut: {
      type: String,
      enum: ['Confirmé', 'En attente', 'Annulé'],
      default: 'En attente',
    },
    nouveauClient: {
      type: String,
      enum: ['Oui', 'Non'],
      default: 'Oui',
    },
  },
  { timestamps: true }
);


function calculerSolde(doc: any) {
  if (!doc) return;
  const montant = Number(doc.montant) || 0;
  const acompte = Number(doc.acompte) || 0;
  doc.solde = montant - acompte;
}


async function synchroniserDepartAssocie(circuit: string, dateSource: any) {
  if (!circuit || !dateSource) return;

  const Depart = mongoose.models.Depart;
  if (Depart) {
    const dateRecherche = new Date(dateSource);
    dateRecherche.setUTCHours(0, 0, 0, 0);
    const lendemain = new Date(dateRecherche.getTime() + 24 * 60 * 60 * 1000);

    const departConcerne = await Depart.findOne({
      circuit: { $regex: new RegExp(`^${circuit.trim()}$`, 'i') },
      dateDepart: { $gte: dateRecherche, $lt: lendemain }
    });

    if (departConcerne) {
      await departConcerne.save();
    }
  }
}

// ==========================================
// 1. HOOKS FINANCIERS (AVANT L'ÉCRITURE)
// ==========================================
ReservationSchema.pre('save', function () {
  calculerSolde(this);
});

ReservationSchema.pre('findOneAndUpdate', function () {
  const update = this.getUpdate() as any;
  if (update) {
    if (update.$set) {
      calculerSolde(update.$set);
    } else {
      calculerSolde(update);
    }
  }
});

// ==========================================
// 2. HOOKS DE SYNCHRONISATION (APRÈS L'ÉCRITURE)
// ==========================================

// Déclenché automatiquement à la CRÉATION d'une réservation
ReservationSchema.post('save', async function (doc) {
  await synchroniserDepartAssocie(doc.circuit, doc.date);
});

// Déclenché automatiquement à la MODIFICATION d'une réservation (Changement de places, date, circuit ou statut)
ReservationSchema.post('findOneAndUpdate', async function () {
  // 1. On récupère la requête pour savoir quelle réservation a été ciblée
  const query = this.getQuery();
  const update = this.getUpdate() as any;
  
  // 2. On récupère le document modifié pour avoir ses valeurs finales en base de données
  const docModifie = await this.model.findOne(query);
  
  if (docModifie) {
    // On synchronise le départ actuel
    await synchroniserDepartAssocie(docModifie.circuit, docModifie.date);

    // Sécurité : Si l'utilisateur a modifié la DATE ou le CIRCUIT de la réservation, 
    // il faut aussi recalculer l'ANCIEN départ pour libérer les places !
    const modifs = update?.$set || update;
    if (modifs?.date || modifs?.circuit) {
      const ancienneDate = (this as any).options?.context?.date || docModifie.date;
      const ancienCircuit = (this as any).options?.context?.circuit || docModifie.circuit;
      await synchroniserDepartAssocie(ancienCircuit, ancienneDate);
    }
  }
});

// Déclenché automatiquement à la SUPPRESSION d'une réservation
ReservationSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    // Si la réservation est supprimée, on libère immédiatement les places sur le planning
    await synchroniserDepartAssocie(doc.circuit, doc.date);
  }
});

export default mongoose.models.Reservation || mongoose.model('Reservation', ReservationSchema);