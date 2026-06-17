import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { addReportHeader } from "./ReportHeader"; 

export const generatePDF = (data: any[]) => {
  // Création de l'instance PDF
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  addReportHeader(doc, "Rapport des Réservations");

  // 3. Transformation des données
  const tableData = data.map(r => [
    new Date(r.date).toLocaleDateString('fr-FR'),
    r.client || "N/A",
    r.circuit || "N/A",
    r.nbPersonnes || 0,
    `${r.montant.toLocaleString('fr-FR').replace(/\s/g, ' ')} Ar`
  ]);

  // 4. Génération du tableau avec autoTable importé explicitement
  autoTable(doc, {
    startY: 65,
    head: [['Date', 'Client', 'Circuit', 'Pax', 'Montant']],
    body: tableData,
    theme: 'striped', // 'striped' est souvent plus lisible qu'une 'grid' totale
    headStyles: { 
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    },
    columnStyles: {
      4: { halign: 'right' } // Aligner les montants à droite
    },
    margin: { left: 14, right: 14 }
  });

  // 5. Téléchargement du fichier
  const fileName = `Rapport_Reservations_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};