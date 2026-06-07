/**
 * certificate.js — Generates a PDF completion certificate via jsPDF.
 * Pure client-side, no network calls.
 */
import jsPDF from "jspdf";

export function generateCertificate({
  name = "Student",
  examTitle = "Mock Exam",
  score = 0,
  totalMarks = 0,
  accuracy = 0,
  date = new Date(),
  certificateId,
}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Outer border
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(6);
  doc.rect(20, 20, W - 40, H - 40);
  doc.setLineWidth(1);
  doc.rect(34, 34, W - 68, H - 68);

  // Header
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(34);
  doc.text("Certificate of Achievement", W / 2, 120, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(71, 85, 105);
  doc.text("This certificate is proudly presented to", W / 2, 160, { align: "center" });

  // Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.setTextColor(37, 99, 235);
  doc.text(name, W / 2, 220, { align: "center" });

  // Body
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(51, 65, 85);
  const body =
    `for successfully completing "${examTitle}" with a score of ` +
    `${score} out of ${totalMarks} (${accuracy}% accuracy).`;
  doc.text(body, W / 2, 270, { align: "center", maxWidth: W - 200 });

  // Footer line
  doc.setDrawColor(148, 163, 184);
  doc.line(W / 2 - 120, H - 130, W / 2 + 120, H - 130);
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text("Authorized Signatory", W / 2, H - 110, { align: "center" });

  doc.setFontSize(10);
  doc.text(`Issued: ${new Date(date).toLocaleDateString()}`, 60, H - 60);
  if (certificateId) {
    doc.text(`Certificate ID: ${certificateId}`, W - 60, H - 60, { align: "right" });
  }

  const safe = name.replace(/[^a-z0-9]+/gi, "_");
  doc.save(`certificate_${safe}.pdf`);
}
