import { type Invoice, type InvoiceItem, type Office, type CompanySettings } from "@shared/schema";
import { format } from "date-fns";

interface InvoicePrintViewProps {
  invoice: Invoice;
  items: InvoiceItem[];
  office: Office;
  companySettings: CompanySettings | null;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
};

export function InvoicePrintView({ invoice, items, office, companySettings }: InvoicePrintViewProps) {
  return (
    <div className="invoice-print-view bg-white text-black p-8 max-w-[210mm] mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-1">請求書</h1>
        <p className="text-sm text-gray-600">INVOICE</p>
      </div>

      <div className="flex justify-between mb-8">
        <div className="space-y-1">
          <div className="text-xl font-bold">{office.name} 御中</div>
          {office.postalCode && <div className="text-sm">〒{office.postalCode}</div>}
          {office.address && <div className="text-sm">{office.address}</div>}
          {office.phone1 && <div className="text-sm">TEL: {office.phone1}</div>}
        </div>
        
        <div className="text-right space-y-1">
          <div className="font-mono font-bold">No. {invoice.invoiceNumber}</div>
          <div className="text-sm">発行日: {format(new Date(invoice.issueDate), "yyyy年MM月dd日")}</div>
          {invoice.dueDate && (
            <div className="text-sm">支払期限: {format(new Date(invoice.dueDate), "yyyy年MM月dd日")}</div>
          )}
        </div>
      </div>

      <div className="mb-8 p-4 bg-gray-50 border-2 border-gray-800 inline-block">
        <div className="text-lg font-bold">
          合計金額: {formatCurrency(invoice.totalAmount)}（税込）
        </div>
      </div>

      <table className="w-full border-collapse mb-6">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="border border-gray-400 p-2 text-left">品目・内容</th>
            <th className="border border-gray-400 p-2 text-right w-16">数量</th>
            <th className="border border-gray-400 p-2 text-center w-12">単位</th>
            <th className="border border-gray-400 p-2 text-right w-24">単価</th>
            <th className="border border-gray-400 p-2 text-center w-16">税率</th>
            <th className="border border-gray-400 p-2 text-right w-28">金額</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td className="border border-gray-300 p-2">{item.description}</td>
              <td className="border border-gray-300 p-2 text-right">{item.quantity}</td>
              <td className="border border-gray-300 p-2 text-center">{item.unit || "-"}</td>
              <td className="border border-gray-300 p-2 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
              <td className="border border-gray-300 p-2 text-center">
                {item.taxRate}%{item.taxRate === 8 ? "※" : ""}
              </td>
              <td className="border border-gray-300 p-2 text-right font-mono">{formatCurrency(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-6">
        <div className="w-64 space-y-1">
          <div className="flex justify-between py-1">
            <span>小計（税抜）</span>
            <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
          </div>
          {(invoice.taxAmount10 || 0) > 0 && (
            <div className="flex justify-between py-1">
              <span>消費税（10%）</span>
              <span className="font-mono">{formatCurrency(invoice.taxAmount10 || 0)}</span>
            </div>
          )}
          {(invoice.taxAmount8 || 0) > 0 && (
            <div className="flex justify-between py-1">
              <span>消費税（8%）※</span>
              <span className="font-mono">{formatCurrency(invoice.taxAmount8 || 0)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-t-2 border-gray-800 font-bold text-lg">
            <span>合計（税込）</span>
            <span className="font-mono">{formatCurrency(invoice.totalAmount)}</span>
          </div>
        </div>
      </div>

      {(invoice.taxAmount8 || 0) > 0 && (
        <p className="text-xs text-gray-600 mb-6">※ 軽減税率対象品目</p>
      )}

      <hr className="my-6 border-gray-300" />

      {companySettings && (
        <div className="grid grid-cols-2 gap-8 text-sm">
          <div className="space-y-1">
            <div className="font-bold mb-2">請求元</div>
            {companySettings.companyName && <div className="font-bold">{companySettings.companyName}</div>}
            {companySettings.representativeName && <div>代表者: {companySettings.representativeName}</div>}
            {(companySettings.postalCode || companySettings.address) && (
              <div>
                {companySettings.postalCode && `〒${companySettings.postalCode} `}
                {companySettings.address}
              </div>
            )}
            {companySettings.phone && <div>TEL: {companySettings.phone}</div>}
            {companySettings.email && <div>Email: {companySettings.email}</div>}
            {companySettings.invoiceRegistrationNumber && (
              <div className="font-bold mt-2">
                登録番号: {companySettings.invoiceRegistrationNumber}
              </div>
            )}
          </div>

          {companySettings.bankName && (
            <div className="space-y-1">
              <div className="font-bold mb-2">振込先口座</div>
              <div>{companySettings.bankName} {companySettings.bankBranch}</div>
              <div>{companySettings.bankAccountType} {companySettings.bankAccountNumber}</div>
              {companySettings.bankAccountHolder && <div>口座名義: {companySettings.bankAccountHolder}</div>}
            </div>
          )}
        </div>
      )}

      {invoice.notes && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-300 rounded">
          <div className="font-bold mb-2">備考</div>
          <div className="text-sm whitespace-pre-wrap">{invoice.notes}</div>
        </div>
      )}
    </div>
  );
}
