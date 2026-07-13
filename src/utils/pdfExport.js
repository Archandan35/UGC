/**
 * pdfExport.js — Re-exports the certificate generator and provides a generic
 * "save table as PDF" helper for the admin Results screen.
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export { generateCertificate } from "./certificate";

export function exportTableToPDF({ title = "Report", headers = [], rows = [], filename = "report.pdf" }) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(16);
  doc.text(title, 14, 16);
  autoTable(doc, {
    startY: 22,
    head: [headers],
    body: rows,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
  });
  doc.save(filename);
}

export default { exportTableToPDF };
