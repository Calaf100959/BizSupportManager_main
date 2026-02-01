import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { type Invoice, type InvoiceItem, type Office, type CompanySettings } from "@shared/schema";
import { format } from "date-fns";

interface InvoiceData {
  invoice: Invoice;
  items: InvoiceItem[];
  office: Office;
  companySettings: CompanySettings | null;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP').format(amount);
};

export async function generateInvoicePDF(data: InvoiceData): Promise<jsPDF> {
  const { invoice, items, office, companySettings } = data;
  
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 25;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("INVOICE", pageWidth / 2, yPos, { align: "center" });
  
  doc.setFontSize(12);
  doc.text("請求書", pageWidth / 2, yPos + 8, { align: "center" });
  
  yPos += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`No. ${invoice.invoiceNumber}`, pageWidth - margin, yPos, { align: "right" });
  yPos += 6;
  doc.text(`発行日: ${format(new Date(invoice.issueDate), "yyyy年MM月dd日")}`, pageWidth - margin, yPos, { align: "right" });
  if (invoice.dueDate) {
    yPos += 6;
    doc.text(`支払期限: ${format(new Date(invoice.dueDate), "yyyy年MM月dd日")}`, pageWidth - margin, yPos, { align: "right" });
  }

  yPos += 15;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(office.name || "", margin, yPos);
  doc.setFontSize(12);
  doc.text(" 御中", margin + doc.getTextWidth(office.name || ""), yPos);
  
  yPos += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  if (office.postalCode) {
    doc.text(`〒${office.postalCode}`, margin, yPos);
    yPos += 5;
  }
  if (office.address) {
    doc.text(office.address, margin, yPos);
    yPos += 5;
  }

  yPos += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  const totalText = `合計金額: ¥${formatCurrency(invoice.totalAmount)}`;
  doc.text(totalText, margin, yPos);
  
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos + 2, margin + doc.getTextWidth(totalText), yPos + 2);

  yPos += 20;

  const tableData = items.map((item) => [
    item.description,
    item.quantity.toString(),
    item.unit || "-",
    `¥${formatCurrency(item.unitPrice)}`,
    `${item.taxRate}%${item.taxRate === 8 ? "*" : ""}`,
    `¥${formatCurrency(item.amount)}`,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["品目・内容", "数量", "単位", "単価", "税率", "金額"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [60, 60, 60],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { halign: "left", cellWidth: 60 },
      1: { halign: "right", cellWidth: 20 },
      2: { halign: "center", cellWidth: 15 },
      3: { halign: "right", cellWidth: 30 },
      4: { halign: "center", cellWidth: 20 },
      5: { halign: "right", cellWidth: 30 },
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  const summaryX = pageWidth - margin - 70;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  doc.text("小計（税抜）", summaryX, yPos);
  doc.text(`¥${formatCurrency(invoice.subtotal)}`, pageWidth - margin, yPos, { align: "right" });
  yPos += 6;

  if ((invoice.taxAmount10 || 0) > 0) {
    doc.text("消費税（10%）", summaryX, yPos);
    doc.text(`¥${formatCurrency(invoice.taxAmount10 || 0)}`, pageWidth - margin, yPos, { align: "right" });
    yPos += 6;
  }

  if ((invoice.taxAmount8 || 0) > 0) {
    doc.text("消費税（8%）*", summaryX, yPos);
    doc.text(`¥${formatCurrency(invoice.taxAmount8 || 0)}`, pageWidth - margin, yPos, { align: "right" });
    yPos += 6;
  }

  doc.setLineWidth(0.3);
  doc.line(summaryX, yPos, pageWidth - margin, yPos);
  yPos += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("合計（税込）", summaryX, yPos);
  doc.text(`¥${formatCurrency(invoice.totalAmount)}`, pageWidth - margin, yPos, { align: "right" });

  yPos += 8;
  if ((invoice.taxAmount8 || 0) > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("* 軽減税率対象品目", margin, yPos);
  }

  yPos += 15;

  if (companySettings) {
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("請求元情報", margin, yPos);
    yPos += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    if (companySettings.companyName) {
      doc.text(companySettings.companyName, margin, yPos);
      yPos += 5;
    }
    if (companySettings.representativeName) {
      doc.text(`代表者: ${companySettings.representativeName}`, margin, yPos);
      yPos += 5;
    }
    if (companySettings.postalCode || companySettings.address) {
      const addressLine = [
        companySettings.postalCode ? `〒${companySettings.postalCode}` : "",
        companySettings.address || "",
      ].filter(Boolean).join(" ");
      doc.text(addressLine, margin, yPos);
      yPos += 5;
    }
    if (companySettings.phone) {
      doc.text(`TEL: ${companySettings.phone}`, margin, yPos);
      yPos += 5;
    }
    if (companySettings.email) {
      doc.text(`Email: ${companySettings.email}`, margin, yPos);
      yPos += 5;
    }
    if (companySettings.invoiceRegistrationNumber) {
      doc.setFont("helvetica", "bold");
      doc.text(`登録番号: ${companySettings.invoiceRegistrationNumber}`, margin, yPos);
      yPos += 5;
    }

    if (companySettings.bankName) {
      yPos += 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("振込先口座", margin, yPos);
      yPos += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const bankInfo = [
        companySettings.bankName,
        companySettings.bankBranch,
        companySettings.bankAccountType,
        companySettings.bankAccountNumber,
      ].filter(Boolean).join(" ");
      doc.text(bankInfo, margin, yPos);
      yPos += 5;
      
      if (companySettings.bankAccountHolder) {
        doc.text(`口座名義: ${companySettings.bankAccountHolder}`, margin, yPos);
      }
    }
  }

  return doc;
}

export function downloadInvoicePDF(data: InvoiceData): void {
  generateInvoicePDF(data).then((doc) => {
    doc.save(`${data.invoice.invoiceNumber}.pdf`);
  });
}

export async function getInvoicePDFBase64(data: InvoiceData): Promise<string> {
  const doc = await generateInvoicePDF(data);
  return doc.output("datauristring").split(",")[1];
}
