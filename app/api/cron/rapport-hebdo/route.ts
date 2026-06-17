import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Reservation from '@/models/Reservation';
import Depart from '@/models/Depart';
import Marketing from '@/models/Marketing';
import Objectif from '@/models/Objectif';
import { sendSystemEmail } from '@/lib/mailService';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // 1. DATES & INTERVALLES
    const mtn = new Date();
    const debutMois = new Date(mtn.getFullYear(), mtn.getMonth(), 1);
    const date7j = new Date(mtn.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 2. EXTRACTION DES DONNÉES (Parallèle)
    const [finances, totalRes, marketing, alertes, obj] = await Promise.all([
      Reservation.aggregate([
        { $match: { statut: { $ne: 'Annulé' }, date: { $gte: debutMois } } },
        { $group: { _id: null, ca: { $sum: '$montant' }, pax: { $sum: '$nbPersonnes' } } }
      ]),
      


      Reservation.countDocuments({ date: { $gte: date7j }, statut: { $ne: 'Annulé' } }),
      Marketing.find({ date: { $gte: date7j } }).sort({ reservationsObtenues: -1 }),
      Depart.find({ tauxRemplissage: { $lt: 50 } }).limit(5),
      Objectif.findOne({ mois: mtn.getMonth() + 1, annee: mtn.getFullYear() })
    ]);

    // 3. PRÉPARATION KPI (Gestion des valeurs nulles/indéfinies)
    const kpi = {
      ca: finances[0]?.ca || 0,
      pax: finances[0]?.pax || 0,
      obj: obj?.montant || 25000000,
      newRes: totalRes,
      taux: obj ? Math.round(((finances[0]?.ca || 0) / obj.montant) * 100) : 0
    };

    // 4. RÉCUPÉRATION DESTINATAIRES
    const users = await User.find({ notifEmail: true, statut: { $ne: 'Inactif' } });
    if (!users.length) return NextResponse.json({ message: "Aucun destinataire" });

    // 5. BOUCLE D'ENVOI
    const rapports = await Promise.all(users.map(async (u) => {
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd;">
          <h3 style="color: #228be6;">Rapport Exécutif Dia Travel</h3>
          <div style="padding: 10px; background: #e7f5ff;">
            <p>Objectif du mois : <b>${kpi.taux}%</b> atteint</p>
            <p>CA : ${kpi.ca.toLocaleString()} Ar / Cible : ${kpi.obj.toLocaleString()} Ar</p>
          </div>
          <h3>Performance Marketing (7j)</h3>
          <ul>${marketing.map(m => `<li>${m.publication}: ${m.reservationsObtenues} ventes</li>`).join('')}</ul>
          <h3>Alertes Remplissage</h3>
          <table width="100%">${alertes.map(a => `<tr><td>${a.circuit}</td><td>${a.tauxRemplissage}%</td></tr>`).join('')}</table>
        </div>`;

      return sendSystemEmail({ to: u.email, subject: "Rapport hebdomadaire", html });
    }));

    return NextResponse.json({ status: "Succès", envoyés: rapports.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

