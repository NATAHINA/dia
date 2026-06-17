import mongoose from 'mongoose';

if (mongoose.models.Depart) {
  delete mongoose.models.Depart;
}

const DepartSchema = new mongoose.Schema(
  {
    dateDepart: {
      type: Date,
      required: [true, 'La date de départ est obligatoire'],
    },
    circuit: {
      type: String,
      required: [true, 'Le nom du circuit est obligatoire'],
      trim: true,
    },
    client: {
      type: String,
      trim: true,
      default: '',
    },
    placesDisponibles: {
      type: Number,
      required: true,
      default: 0,
    },
    placesVendues: {
      type: Number,
      required: true,
      default: 0,
    },
    tauxRemplissage: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);


async function calculerStatistiques(doc: any) {
  if (!doc) return;

  try {
    // Récupération de la date
    const dateSource = doc.dateDepart || doc.date;
    if (!dateSource) return;

    const dateRecherche = new Date(dateSource);
    if (isNaN(dateRecherche.getTime())) return;
    
    dateRecherche.setUTCHours(0, 0, 0, 0);
    const lendemain = new Date(dateRecherche.getTime() + 24 * 60 * 60 * 1000);

    const Reservation = mongoose.models.Reservation;
    let totalVendues = 0;

    if (Reservation) {
      const agregation = await Reservation.aggregate([
        {
          $match: {
            circuit: { $regex: new RegExp(`^${doc.circuit.trim()}$`, 'i') },
            date: {
              $gte: dateRecherche,
              $lt: lendemain,
            },
            statut: { $ne: 'Annulé' }
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$nbPersonnes' }, 
          },
        },
      ]);

      if (agregation.length > 0) {
        totalVendues = agregation[0].total;
      }
    }

    doc.placesVendues = totalVendues;

    const dispo = Number(doc.placesDisponibles) || 0;
    if (dispo > 0) {
      doc.tauxRemplissage = Math.round((totalVendues / dispo) * 100 * 10) / 10;
    } else {
      doc.tauxRemplissage = 0;
    }
  } catch (err) {
    console.error('Erreur lors du calcul automatique :', err);
  }
}

DepartSchema.pre('save', async function () {
  await calculerStatistiques(this);
});

DepartSchema.pre('findOneAndUpdate', async function () {
  const docActuel = await this.model.findOne(this.getQuery());
  const update = this.getUpdate() as any;

  if (docActuel && update) {
    const modifications = update.$set || update;

    const simulationDoc = {
      dateDepart: modifications.dateDepart !== undefined ? modifications.dateDepart : docActuel.dateDepart,
      circuit: modifications.circuit !== undefined ? modifications.circuit : docActuel.circuit,
      placesDisponibles: modifications.placesDisponibles !== undefined ? Number(modifications.placesDisponibles) : docActuel.placesDisponibles,
      placesVendues: docActuel.placesVendues,
      tauxRemplissage: docActuel.tauxRemplissage
    };

    await calculerStatistiques(simulationDoc);

    if (update.$set) {
      update.$set.placesVendues = simulationDoc.placesVendues;
      update.$set.tauxRemplissage = simulationDoc.tauxRemplissage;
    } else {
      update.placesVendues = simulationDoc.placesVendues;
      update.tauxRemplissage = simulationDoc.tauxRemplissage;
    }
  }
});

export default mongoose.models.Depart || mongoose.model('Depart', DepartSchema);