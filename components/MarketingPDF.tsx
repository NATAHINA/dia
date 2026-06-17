import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { addReportHeader } from "./ReportHeader"; 

export const generateMarketingPDF = (data: any[]) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // Appel de l'en-tête standardisé
  addReportHeader(doc, "Rapport des Performances Marketing");

  const tableData = data.map(c => [
    new Date(c.date).toLocaleDateString('fr-FR'),
    c.publication,
    c.portee.toLocaleString('fr-FR').replace(/\s/g, ' '),
    c.messages.toString(),
    c.reservationsObtenues.toString(),
    `${c.score} pts`
  ]);

  autoTable(doc, {
    startY: 65, // On commence un peu plus bas pour laisser place à l'en-tête
    head: [['Date', 'Publication', 'Portée', 'Msgs', 'Résa.', 'Score']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
    margin: { left: 14, right: 14 }
  });

  doc.save(`Marketing_${new Date().toISOString().split('T')[0]}.pdf`);
};