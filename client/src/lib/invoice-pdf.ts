import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { type Invoice, type InvoiceItem, type Office, type CompanySettings, type Company, type BankAccount } from "@shared/schema";
import { format } from "date-fns";

interface InvoiceData {
  invoice: Invoice;
  items: InvoiceItem[];
  office: Office;
  company?: Company | null;
  bankAccounts?: BankAccount[];
  companySettings: CompanySettings | null;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
};

// 印刷ビューのHTMLを生成する関数
function createInvoiceHTML(data: InvoiceData): string {
  const { invoice, items, office, company, bankAccounts, companySettings } = data;
  
  const itemsHTML = items.map((item) => `
    <tr>
      <td class="border border-gray-300 p-2">${item.description}</td>
      <td class="border border-gray-300 p-2 text-right">${item.quantity}</td>
      <td class="border border-gray-300 p-2 text-center">${item.unit || "-"}</td>
      <td class="border border-gray-300 p-2 text-right font-mono">${formatCurrency(item.unitPrice)}</td>
      <td class="border border-gray-300 p-2 text-center">
        ${item.taxRate}%${item.taxRate === 8 ? "※" : ""}
      </td>
      <td class="border border-gray-300 p-2 text-right font-mono">${formatCurrency(item.amount)}</td>
    </tr>
  `).join("");

  // 会社情報を優先、なければ従来のcompanySettingsを使用
  const displayCompany = company || companySettings;
  const displayBankAccounts = bankAccounts && bankAccounts.length > 0 ? bankAccounts : 
    (companySettings?.bankName ? [{
      id: 'legacy',
      companyId: '',
      accountName: '',
      bankName: companySettings.bankName || '',
      bankBranch: companySettings.bankBranch || '',
      bankAccountType: companySettings.bankAccountType || '',
      bankAccountNumber: companySettings.bankAccountNumber || '',
      bankAccountHolder: companySettings.bankAccountHolder || '',
      isDefault: 'false',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as BankAccount] : []);

  const companySettingsHTML = displayCompany ? `
    <hr class="my-6 border-gray-300" />
    <div class="grid grid-cols-2 gap-8 text-sm">
      <div class="space-y-1">
        <div class="font-bold mb-2">請求元</div>
        ${displayCompany.companyName ? `<div class="font-bold">${displayCompany.companyName}</div>` : ""}
        ${(displayCompany as any).representativeName ? `<div>代表者: ${(displayCompany as any).representativeName}</div>` : ""}
        ${displayCompany.postalCode || displayCompany.address ? `
          <div>
            ${displayCompany.postalCode ? `〒${displayCompany.postalCode} ` : ""}
            ${displayCompany.address || ""}
          </div>
        ` : ""}
        ${displayCompany.phone ? `<div>TEL: ${displayCompany.phone}</div>` : ""}
        ${displayCompany.email ? `<div>Email: ${displayCompany.email}</div>` : ""}
        ${displayCompany.invoiceRegistrationNumber ? `
          <div class="font-bold mt-2">
            登録番号: ${displayCompany.invoiceRegistrationNumber}
          </div>
        ` : ""}
      </div>

      ${displayBankAccounts.length > 0 ? `
        <div class="space-y-3">
          <div class="font-bold mb-2">振込先口座</div>
          ${displayBankAccounts.map((account, index) => `
            ${index > 0 ? '<div class="border-t border-gray-300 my-2 pt-2"></div>' : ''}
            <div class="space-y-1">
              ${account.accountName ? `<div class="font-semibold">${account.accountName}</div>` : ''}
              <div>${account.bankName} ${account.bankBranch || ""}</div>
              <div>${account.bankAccountType || ""} ${account.bankAccountNumber || ""}</div>
              ${account.bankAccountHolder ? `<div>口座名義: ${account.bankAccountHolder}</div>` : ""}
            </div>
          `).join('')}
        </div>
      ` : ""}
    </div>
  ` : "";

  return `
    <div style="background: white; color: black; padding: 32px; max-width: 210mm; margin: 0 auto; font-family: 'Noto Sans JP', sans-serif;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 30px; font-weight: bold; margin-bottom: 4px;">請求書</h1>
        <p style="font-size: 14px; color: #666;">INVOICE</p>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 32px;">
        <div style="line-height: 1.6;">
          <div style="font-size: 20px; font-weight: bold;">${office.name} 御中</div>
          ${office.postalCode ? `<div style="font-size: 14px;">〒${office.postalCode}</div>` : ""}
          ${office.address ? `<div style="font-size: 14px;">${office.address}</div>` : ""}
          ${office.phone1 ? `<div style="font-size: 14px;">TEL: ${office.phone1}</div>` : ""}
        </div>
        
        <div style="text-align: right; line-height: 1.6;">
          <div style="font-family: monospace; font-weight: bold;">No. ${invoice.invoiceNumber}</div>
          <div style="font-size: 14px;">発行日: ${format(new Date(invoice.issueDate), "yyyy年MM月dd日")}</div>
          ${invoice.dueDate ? `
            <div style="font-size: 14px;">支払期限: ${format(new Date(invoice.dueDate), "yyyy年MM月dd日")}</div>
          ` : ""}
        </div>
      </div>

      <div style="margin-bottom: 32px; padding: 16px; background: #f9fafb; border: 2px solid #1f2937; display: inline-block;">
        <div style="font-size: 18px; font-weight: bold;">
          合計金額: ${formatCurrency(invoice.totalAmount)}（税込）
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background: #1f2937; color: white;">
            <th style="border: 1px solid #9ca3af; padding: 8px; text-align: left;">品目・内容</th>
            <th style="border: 1px solid #9ca3af; padding: 8px; text-align: right; width: 64px;">数量</th>
            <th style="border: 1px solid #9ca3af; padding: 8px; text-align: center; width: 48px;">単位</th>
            <th style="border: 1px solid #9ca3af; padding: 8px; text-align: right; width: 96px;">単価</th>
            <th style="border: 1px solid #9ca3af; padding: 8px; text-align: center; width: 64px;">税率</th>
            <th style="border: 1px solid #9ca3af; padding: 8px; text-align: right; width: 112px;">金額</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div style="display: flex; justify-content: flex-end; margin-bottom: 24px;">
        <div style="width: 256px; line-height: 1.6;">
          <div style="display: flex; justify-content: space-between; padding: 4px 0;">
            <span>小計（税抜）</span>
            <span style="font-family: monospace;">${formatCurrency(invoice.subtotal)}</span>
          </div>
          ${(invoice.taxAmount10 || 0) > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span>消費税（10%）</span>
              <span style="font-family: monospace;">${formatCurrency(invoice.taxAmount10 || 0)}</span>
            </div>
          ` : ""}
          ${(invoice.taxAmount8 || 0) > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span>消費税（8%）※</span>
              <span style="font-family: monospace;">${formatCurrency(invoice.taxAmount8 || 0)}</span>
            </div>
          ` : ""}
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 2px solid #1f2937; font-weight: bold; font-size: 18px;">
            <span>合計（税込）</span>
            <span style="font-family: monospace;">${formatCurrency(invoice.totalAmount)}</span>
          </div>
        </div>
      </div>

      ${(invoice.taxAmount8 || 0) > 0 ? `
        <p style="font-size: 12px; color: #666; margin-bottom: 24px;">※ 軽減税率対象品目</p>
      ` : ""}

      ${companySettingsHTML}

      ${invoice.notes ? `
        <div style="margin-top: 24px; padding: 16px; background: #f9fafb; border: 1px solid #d1d5db; border-radius: 4px;">
          <div style="font-weight: bold; margin-bottom: 8px;">備考</div>
          <div style="font-size: 14px; white-space: pre-wrap;">${invoice.notes}</div>
        </div>
      ` : ""}
    </div>
  `;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<jsPDF> {
  // 一時的なコンテナを作成
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "210mm"; // A4幅
  container.innerHTML = createInvoiceHTML(data);
  document.body.appendChild(container);

  try {
    // html2canvasでキャプチャ
    const canvas = await html2canvas(container, {
      scale: 2, // 高解像度化
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    // PDFを作成
    const imgWidth = 210; // A4幅 (mm)
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    const doc = new jsPDF({
      orientation: imgHeight > 297 ? "portrait" : "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgData = canvas.toDataURL("image/png");
    
    // 1ページに収まる場合
    if (imgHeight <= 297) {
      doc.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    } else {
      // 複数ページに分割
      let position = 0;
      const pageHeight = 297;
      
      while (position < imgHeight) {
        if (position > 0) {
          doc.addPage();
        }
        
        const sourceY = (position * canvas.width) / imgWidth;
        const sourceHeight = Math.min((pageHeight * canvas.width) / imgWidth, canvas.height - sourceY);
        
        // キャンバスから部分的に切り取り
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        const ctx = pageCanvas.getContext("2d");
        
        if (ctx) {
          ctx.drawImage(
            canvas,
            0, sourceY,
            canvas.width, sourceHeight,
            0, 0,
            canvas.width, sourceHeight
          );
          
          const pageImgData = pageCanvas.toDataURL("image/png");
          const pageImgHeight = (sourceHeight * imgWidth) / canvas.width;
          doc.addImage(pageImgData, "PNG", 0, 0, imgWidth, pageImgHeight);
        }
        
        position += pageHeight;
      }
    }

    return doc;
  } finally {
    // 一時コンテナを削除
    document.body.removeChild(container);
  }
}

export async function downloadInvoicePDF(data: InvoiceData): Promise<void> {
  const doc = await generateInvoicePDF(data);
  doc.save(`${data.invoice.invoiceNumber}.pdf`);
}

export async function getInvoicePDFBase64(data: InvoiceData): Promise<string> {
  const doc = await generateInvoicePDF(data);
  return doc.output("datauristring").split(",")[1];
}
