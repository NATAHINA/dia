// components/ReportHeader.ts
import { jsPDF } from "jspdf";

export const addReportHeader = (doc: jsPDF, title: string) => {
  // Logo ou Nom de l'agence
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("DiaTravel", 14, 20);

  // Informations de contact
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Agence de Voyages & Excursions", 14, 26);
  doc.text("Lot IVB 12, Antananarivo, Madagascar", 14, 31);
  doc.text("Tél : +261 34 00 000 00 | Email : contact@diatravel.mg", 14, 36);

  // Ligne de séparation
  doc.setDrawColor(41, 128, 185); // Bleu DiaTravel
  doc.line(14, 40, 196, 40);

  // Titre du rapport
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, 14, 50);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text(`Date d'édition : ${new Date().toLocaleDateString('fr-FR')}`, 14, 55);
};