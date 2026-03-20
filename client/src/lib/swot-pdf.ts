import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface SwotPdfData {
  officeName: string;
  industry?: string;
  address?: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  soStrategies: string[];
  woStrategies: string[];
  stStrategies: string[];
  wtStrategies: string[];
}

const today = () => new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });

function bullet(items: string[]): string {
  if (!items.length) return `<li style="color:#9ca3af;font-style:italic;">（未入力）</li>`;
  return items.map(item => `<li style="margin-bottom:4px;line-height:1.5;">${escapeHtml(item)}</li>`).join("");
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function createCoverHtml(data: SwotPdfData): string {
  const hasCross = data.soStrategies.length || data.woStrategies.length || data.stStrategies.length || data.wtStrategies.length;
  const countRow = (label: string, items: string[]) =>
    `<tr>
      <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-weight:600;">${label}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${items.length}項目</td>
      <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:11px;">${items[0] ? escapeHtml(items[0]) + (items.length > 1 ? " …" : "") : "（未入力）"}</td>
    </tr>`;

  return `
<div style="width:794px;height:1123px;background:white;font-family:'Helvetica Neue',Arial,sans-serif;box-sizing:border-box;display:flex;flex-direction:column;">
  <div style="background:linear-gradient(135deg,#1e40af 0%,#1d4ed8 50%,#2563eb 100%);padding:60px 56px 48px;color:white;">
    <div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;opacity:0.8;margin-bottom:16px;">Business Analysis Report</div>
    <div style="font-size:36px;font-weight:700;line-height:1.2;margin-bottom:8px;">SWOT分析レポート</div>
    <div style="font-size:16px;opacity:0.85;margin-bottom:32px;">${hasCross ? "SWOT分析 ＋ クロスSWOT戦略" : "SWOT分析"}</div>
    <div style="border-top:1px solid rgba(255,255,255,0.3);padding-top:24px;">
      <div style="font-size:22px;font-weight:700;margin-bottom:6px;">${escapeHtml(data.officeName)}</div>
      ${data.industry ? `<div style="font-size:13px;opacity:0.8;">${escapeHtml(data.industry)}</div>` : ""}
      ${data.address ? `<div style="font-size:13px;opacity:0.7;margin-top:2px;">${escapeHtml(data.address)}</div>` : ""}
    </div>
  </div>

  <div style="padding:40px 56px;flex:1;display:flex;flex-direction:column;gap:32px;">
    <div style="display:flex;gap:16px;align-items:center;color:#6b7280;font-size:13px;">
      <span>作成日：${today()}</span>
    </div>

    <div>
      <div style="font-size:15px;font-weight:700;color:#111827;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #1d4ed8;">分析概要</div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:8px 12px;text-align:left;color:#374151;font-weight:700;border-bottom:2px solid #e5e7eb;width:120px;">カテゴリ</th>
            <th style="padding:8px 12px;text-align:left;color:#374151;font-weight:700;border-bottom:2px solid #e5e7eb;width:60px;">件数</th>
            <th style="padding:8px 12px;text-align:left;color:#374151;font-weight:700;border-bottom:2px solid #e5e7eb;">代表項目</th>
          </tr>
        </thead>
        <tbody>
          ${countRow("強み (Strengths)", data.strengths)}
          ${countRow("弱み (Weaknesses)", data.weaknesses)}
          ${countRow("機会 (Opportunities)", data.opportunities)}
          ${countRow("脅威 (Threats)", data.threats)}
          ${hasCross ? countRow("積極戦略 (SO)", data.soStrategies) : ""}
          ${hasCross ? countRow("改善戦略 (WO)", data.woStrategies) : ""}
          ${hasCross ? countRow("差別化戦略 (ST)", data.stStrategies) : ""}
          ${hasCross ? countRow("致命傷回避 (WT)", data.wtStrategies) : ""}
        </tbody>
      </table>
    </div>

    <div>
      <div style="font-size:15px;font-weight:700;color:#111827;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #1d4ed8;">強みのポイント（一部抜粋）</div>
      <ul style="margin:0;padding-left:20px;font-size:13px;color:#374151;">
        ${data.strengths.slice(0, 3).map(s => `<li style="margin-bottom:6px;line-height:1.6;">${escapeHtml(s)}</li>`).join("") || `<li style="color:#9ca3af;">（未入力）</li>`}
      </ul>
    </div>

    <div>
      <div style="font-size:15px;font-weight:700;color:#111827;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #16a34a;">主な機会（一部抜粋）</div>
      <ul style="margin:0;padding-left:20px;font-size:13px;color:#374151;">
        ${data.opportunities.slice(0, 3).map(s => `<li style="margin-bottom:6px;line-height:1.6;">${escapeHtml(s)}</li>`).join("") || `<li style="color:#9ca3af;">（未入力）</li>`}
      </ul>
    </div>
  </div>

  <div style="padding:20px 56px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;color:#9ca3af;font-size:11px;">
    <span>SWOT分析レポート — ${escapeHtml(data.officeName)}</span>
    <span>1 / ${hasCross ? 3 : 2}</span>
  </div>
</div>`;
}

function swotCell(title: string, color: string, bg: string, border: string, items: string[]): string {
  return `
<div style="background:${bg};border:2px solid ${border};border-radius:6px;padding:14px;display:flex;flex-direction:column;overflow:hidden;">
  <div style="font-size:13px;font-weight:700;color:${color};margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid ${border};">${title}</div>
  <ul style="margin:0;padding-left:16px;font-size:11px;color:#374151;flex:1;overflow:hidden;">
    ${bullet(items)}
  </ul>
</div>`;
}

function createSwotHtml(data: SwotPdfData): string {
  const hasCross = data.soStrategies.length || data.woStrategies.length || data.stStrategies.length || data.wtStrategies.length;
  return `
<div style="width:1123px;height:794px;background:white;font-family:'Helvetica Neue',Arial,sans-serif;box-sizing:border-box;display:flex;flex-direction:column;">
  <div style="background:linear-gradient(135deg,#1e40af,#2563eb);padding:18px 32px;display:flex;justify-content:space-between;align-items:center;">
    <div>
      <div style="color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:1px;">SWOT ANALYSIS</div>
      <div style="color:white;font-size:20px;font-weight:700;">SWOT分析　—　${escapeHtml(data.officeName)}</div>
    </div>
    <div style="color:rgba(255,255,255,0.7);font-size:11px;">${today()} ／ 2 / ${hasCross ? 3 : 2}</div>
  </div>

  <div style="flex:1;padding:20px 24px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:16px;overflow:hidden;">
    ${swotCell("💪 強み (Strengths) — 内部・プラス", "#1d4ed8", "#eff6ff", "#bfdbfe", data.strengths)}
    ${swotCell("⚠️ 弱み (Weaknesses) — 内部・マイナス", "#c2410c", "#fff7ed", "#fed7aa", data.weaknesses)}
    ${swotCell("🌱 機会 (Opportunities) — 外部・プラス", "#15803d", "#f0fdf4", "#bbf7d0", data.opportunities)}
    ${swotCell("⚡ 脅威 (Threats) — 外部・マイナス", "#b91c1c", "#fef2f2", "#fecaca", data.threats)}
  </div>
</div>`;
}

function crossCell(title: string, color: string, bg: string, items: string[]): string {
  return `
<div style="background:${bg};border-radius:4px;padding:10px;overflow:hidden;height:100%;box-sizing:border-box;display:flex;flex-direction:column;">
  <div style="font-size:10px;font-weight:700;color:${color};margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid ${color}30;">${title}</div>
  <ul style="margin:0;padding-left:14px;font-size:10px;color:#374151;flex:1;overflow:hidden;line-height:1.6;">
    ${bullet(items)}
  </ul>
</div>`;
}

function createCrossSwotHtml(data: SwotPdfData): string {
  return `
<div style="width:1123px;height:794px;background:white;font-family:'Helvetica Neue',Arial,sans-serif;box-sizing:border-box;display:flex;flex-direction:column;">
  <div style="background:linear-gradient(135deg,#065f46,#059669);padding:18px 32px;display:flex;justify-content:space-between;align-items:center;">
    <div>
      <div style="color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:1px;">CROSS SWOT ANALYSIS</div>
      <div style="color:white;font-size:20px;font-weight:700;">クロスSWOT分析　—　${escapeHtml(data.officeName)}</div>
    </div>
    <div style="color:rgba(255,255,255,0.7);font-size:11px;">${today()} ／ 3 / 3</div>
  </div>

  <div style="flex:1;padding:16px 20px;overflow:hidden;">
    <div style="display:grid;grid-template-columns:88px 1fr 1fr;grid-template-rows:36px 1fr 1fr;gap:8px;height:100%;">
      <div></div>
      <div style="background:#dbeafe;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#1d4ed8;">強み (S)</div>
      <div style="background:#fee2e2;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#b91c1c;">弱み (W)</div>

      <div style="background:#dcfce7;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#15803d;writing-mode:horizontal-tb;text-align:center;padding:4px;">機会 (O)</div>
      ${crossCell("SO — 積極戦略（強みで機会を掴む）", "#1d4ed8", "#eff6ff", data.soStrategies)}
      ${crossCell("WO — 改善戦略（弱みを補い機会を捉える）", "#15803d", "#f0fdf4", data.woStrategies)}

      <div style="background:#fef9c3;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#a16207;writing-mode:horizontal-tb;text-align:center;padding:4px;">脅威 (T)</div>
      ${crossCell("ST — 差別化戦略（強みで脅威に対抗）", "#9333ea", "#faf5ff", data.stStrategies)}
      ${crossCell("WT — 致命傷回避（弱みと脅威を最小化）", "#b91c1c", "#fef2f2", data.wtStrategies)}
    </div>
  </div>
</div>`;
}

async function renderPage(html: string, width: number, height: number): Promise<string> {
  const el = document.createElement("div");
  el.style.cssText = `position:fixed;left:-9999px;top:0;width:${width}px;height:${height}px;overflow:hidden;`;
  el.innerHTML = html;
  document.body.appendChild(el);
  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      logging: false,
      width,
      height,
      windowWidth: width,
      windowHeight: height,
    });
    return canvas.toDataURL("image/jpeg", 0.95);
  } finally {
    document.body.removeChild(el);
  }
}

export async function generateSwotPdf(data: SwotPdfData): Promise<void> {
  const hasCross = data.soStrategies.length || data.woStrategies.length || data.stStrategies.length || data.wtStrategies.length;

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const coverImg = await renderPage(createCoverHtml(data), 794, 1123);
  pdf.addImage(coverImg, "JPEG", 0, 0, 210, 297);

  pdf.addPage([297, 210], "landscape");
  const swotImg = await renderPage(createSwotHtml(data), 1123, 794);
  pdf.addImage(swotImg, "JPEG", 0, 0, 297, 210);

  if (hasCross) {
    pdf.addPage([297, 210], "landscape");
    const crossImg = await renderPage(createCrossSwotHtml(data), 1123, 794);
    pdf.addImage(crossImg, "JPEG", 0, 0, 297, 210);
  }

  const filename = `SWOT分析_${data.officeName}_${new Date().toLocaleDateString("ja-JP").replace(/\//g, "-")}.pdf`;
  pdf.save(filename);
}
