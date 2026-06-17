import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { addReportHeader } from "./ReportHeader"; // Votre en-tête commun

export const generateDepartsPDF = (data: any[]) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  addReportHeader(doc, "Planning des Départs");

  const tableData = data.map(d => [
    new Date(d.dateDepart).toLocaleDateString('fr-FR'),
    d.circuit,
    d.client || '-',
    d.placesDisponibles.toString(),
    d.placesVendues.toString(),
    `${d.tauxRemplissage}%`
  ]);

  autoTable(doc, {
    startY: 65,
    head: [['Date', 'Circuit', 'Client', 'Capacité', 'Vendues', 'Remplissage']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
    columnStyles: { 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' } },
    margin: { left: 14, right: 14 }
  });

  doc.save(`Planning_Departs_${new Date().toISOString().split('T')[0]}.pdf`);
};