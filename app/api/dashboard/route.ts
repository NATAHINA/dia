import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Reservation from '@/models/Reservation';
import Depart from '@/models/Depart';
import Objectif from '@/models/Objectif';
import Circuit from '@/models/Circuit';
import Marketing from '@/models/Marketing';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    
    const maintenantMada = new Date(new Date().toLocaleString("en-US", { timeZone: "Indian/Antananarivo" }));
    
    const moisSelectionne = parseInt(searchParams.get('month') || String(maintenantMada.getMonth() + 1), 10); 
    const anneeSelectionnee = parseInt(searchParams.get('year') || String(maintenantMada.getFullYear()), 10);

    const objectifDb = await Objectif.findOne({ mois: moisSelectionne, annee: anneeSelectionnee });
    const objectifMoisActuel = objectifDb ? objectifDb.montant : 25000000;

    const debutMois = new Date(`${anneeSelectionnee}-${String(moisSelectionne).padStart(2, '0')}-01T00:00:00+03:00`);
    const dernierJour = new Date(anneeSelectionnee, moisSelectionne, 0).getDate();
    const finMois = new Date(`${anneeSelectionnee}-${String(moisSelectionne).padStart(2, '0')}-${String(dernierJour).padStart(2, '0')}T23:59:59.999+03:00`);

    const debutAnnee = new Date(`${anneeSelectionnee}-01-01T00:00:00+03:00`);
    const finAnnee = new Date(`${anneeSelectionnee}-12-31T23:59:59.999+03:00`);

    const circuitsEnregistres = await Circuit.find({}, 'nom').lean();
    const circuitsCibles = circuitsEnregistres.map((c: any) => c.nom.trim());

    const kpiFinancesMois = await Reservation.aggregate([
      { $match: { statut: { $ne: 'Annulé' }, date: { $gte: debutMois, $lte: finMois } } },
      {
        $group: {
          _id: null,
          caMois: { $sum: '$montant' },
          soldeMois: { $sum: '$solde' },
          voyagersMois: { $sum: '$nbPersonnes' }
        }
      }
    ]);

    const totalCAAnnuel = await Reservation.aggregate([
      { $match: { statut: { $ne: 'Annulé' }, date: { $gte: debutAnnee, $lte: finAnnee } } },
      { $group: { _id: null, total: { $sum: '$montant' }, soldeTotal: { $sum: '$solde' } } }
    ]);

    const statsClientsCount = await Reservation.aggregate([
      { $match: { statut: { $ne: 'Annulé' }, date: { $gte: debutAnnee, $lte: finAnnee } } },
      { $group: { _id: { $trim: { input: { $toLower: '$client' } } }, totalVoyages: { $sum: 1 } } }
    ]);

    const nbClientsTotal = statsClientsCount.length;
    const clientsFideles = statsClientsCount.filter(c => c.totalVoyages >= 2).length;

    const caMois = kpiFinancesMois[0]?.caMois || 0;
    const soldeMois = kpiFinancesMois[0]?.soldeMois || 0;
    const voyageursMois = kpiFinancesMois[0]?.voyagersMois || 0;

    const caGlobal = totalCAAnnuel[0]?.total || 0;
    const soldeGlobalTotal = totalCAAnnuel[0]?.soldeTotal || 0;

    const totalReservationsMois = await Reservation.countDocuments({ 
      statut: { $ne: 'Annulé' }, date: { $gte: debutMois, $lte: finMois }
    });
    
    const nouveauxClientsMois = await Reservation.countDocuments({ 
      nouveauClient: 'Oui', statut: { $ne: 'Annulé' }, date: { $gte: debutMois, $lte: finMois } 
    });

    const totalDepartsMois = await Depart.countDocuments({ dateDepart: { $gte: debutMois, $lte: finMois } });
    
    const tauxMoyenAggregation = await Depart.aggregate([
      { $match: { dateDepart: { $gte: debutMois, $lte: finMois } } },
      { $group: { _id: null, moyenne: { $avg: '$tauxRemplissage' } } }
    ]);
    const tauxRemplissageMoyen = tauxMoyenAggregation[0]?.moyenne ? Math.round(tauxMoyenAggregation[0].moyenne * 10) / 10 : 0;

    // -------------------------------------------------------------------------
    // 5. CALCUL DU TOP DESTINATIONS DU MOIS
    // -------------------------------------------------------------------------
    const statsCircuitsRaw = await Reservation.aggregate([
      { $match: { statut: { $ne: 'Annulé' }, date: { $gte: debutMois, $lte: finMois } } },
      {
        $group: {
          _id: { $trim: { input: { $toLower: '$circuit' } } },
          nbClients: { $sum: '$nbPersonnes' },
          caGenerated: { $sum: '$montant' }
        }
      }
    ]);

    const topDestinations = circuitsCibles.map(nomCircuit => {
      const matchDb = statsCircuitsRaw.find(c => c._id === nomCircuit.toLowerCase());
      return {
        circuit: nomCircuit,
        nbClients: matchDb ? matchDb.nbClients : 0,
        ca: matchDb ? matchDb.caGenerated : 0
      };
    }).sort((a, b) => b.ca - a.ca);

    // -------------------------------------------------------------------------
    // 6. PERFORMANCES MARKETING DU MOIS
    // -------------------------------------------------------------------------
    const donneesMarketingDb = await Marketing.find({
      date: { $gte: debutMois, $lte: finMois }
    }).lean();

    const publicationsPerformantes = donneesMarketingDb.map((campagne: any) => {
      return {
        titre: campagne.publication,
        messages: campagne.messages || 0,
        ventes: campagne.reservationsObtenues || 0,
        portee: new Intl.NumberFormat('fr-FR').format(campagne.portee || 0)
      };
    }).sort((a, b) => b.ventes - a.ventes);

    const totalMessagesFacebook = publicationsPerformantes.reduce((sum, item) => sum + item.messages, 0);
    const totalVentesFacebook = publicationsPerformantes.reduce((sum, item) => sum + item.ventes, 0);
    const tauxTransformation = totalMessagesFacebook > 0 
      ? Math.round((totalVentesFacebook / totalMessagesFacebook) * 100 * 10) / 10 
      : 0;

    // -------------------------------------------------------------------------
    // 7. HISTORIQUE DE L'ANNÉE SÉLECTIONNÉE (POUR LES GRAPHIQUES)
    // -------------------------------------------------------------------------
    const historiqueRaw = await Reservation.aggregate([
      { $match: { statut: { $ne: 'Annulé' }, date: { $gte: debutAnnee, $lte: finAnnee } } },
      {
        $group: {
          _id: { $month: { date: '$date', timezone: 'Indian/Antananarivo' } },
          ca: { $sum: '$montant' },
          voyagers: { $sum: '$nbPersonnes' }
        }
      }
    ]);

    const tousLesObjectifs = await Objectif.find({ annee: anneeSelectionnee });
    const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    // Changement : slice(0, 12) ou dynamique pour afficher toute l'année en cours
    const performanceCharts = moisNoms.map((nom, index) => {
      const numMois = index + 1;
      const dbData = historiqueRaw.find(h => h._id === numMois);
      const objDb = tousLesObjectifs.find(o => o.mois === numMois);
      
      const objectifsParDefaut: Record<number, number> = { 1: 20000000, 2: 20000000, 3: 22000000, 4: 25000000, 5: 28000000, 6: 25000000, 7: 25000000, 8: 25000000, 9: 25000000, 10: 25000000, 11: 25000000, 12: 25000000 };
      const montantObjectifComp = objDb ? objDb.montant : (objectifsParDefaut[numMois] || 25000000);

      return {
        month: nom,
        Realisation: dbData ? dbData.ca : 0,
        Objectif: montantObjectifComp,
        Voyageurs: dbData ? dbData.voyagers : 0
      };
    });

    return NextResponse.json({
      kpis: {
        caMois,
        soldeMois,
        voyageursMois,
        caGlobal, // Représente maintenant le CA cumulé de l'année sélectionnée
        soldeGlobalTotal, // Reste à encaisser sur l'année sélectionnée
        totalReservationsMois,
        nouveauxClientsMois,
        totalDepartsMois,
        tauxRemplissageMoyen,
        nbClientsTotal,
        clientsFideles,
        facebookMessages: totalMessagesFacebook,
        facebookVentes: totalVentesFacebook,
        tauxTransformation,
        objectifMois: objectifMoisActuel,
        annee: anneeSelectionnee // Renvoyé au front pour confirmation d'affichage
      },
      topDestinations,
      performanceCharts,
      publicationsPerformantes
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}