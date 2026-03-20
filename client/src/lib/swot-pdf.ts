import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  convertInchesToTwip,
} from "docx";

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

function todayStr(): string {
  return new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

function esc(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function listItems(items: string[], emptyMsg = "（未入力）"): string {
  if (!items.length) return `<li style="color:#9ca3af;font-style:italic;">${emptyMsg}</li>`;
  return items.map(s => `<li style="margin-bottom:5px;line-height:1.6;">${esc(s)}</li>`).join("");
}

// ─── HTML templates ───────────────────────────────────────────────

function coverHtml(data: SwotPdfData): string {
  const hasCross = data.soStrategies.length || data.woStrategies.length || data.stStrategies.length || data.wtStrategies.length;
  const section = (label: string, color: string, items: string[]) => `
    <div style="margin-bottom:22px;">
      <div style="font-size:13px;font-weight:700;color:${color};margin-bottom:8px;padding-bottom:4px;border-bottom:2px solid ${color};">${label}</div>
      <ul style="margin:0;padding-left:20px;font-size:12px;color:#374151;">${listItems(items)}</ul>
    </div>`;

  return `<div style="width:794px;background:white;font-family:'Helvetica Neue',Arial,'Hiragino Sans','Yu Gothic',sans-serif;box-sizing:border-box;">
  <div style="background:linear-gradient(135deg,#1e40af 0%,#2563eb 100%);padding:56px 56px 44px;color:white;">
    <div style="font-size:11px;letter-spacing:2px;opacity:0.75;margin-bottom:14px;">BUSINESS ANALYSIS REPORT</div>
    <div style="font-size:34px;font-weight:700;line-height:1.2;margin-bottom:6px;">SWOT分析レポート</div>
    <div style="font-size:15px;opacity:0.8;margin-bottom:28px;">${hasCross ? "SWOT分析 ＋ クロスSWOT戦略" : "SWOT分析"}</div>
    <div style="border-top:1px solid rgba(255,255,255,0.3);padding-top:22px;">
      <div style="font-size:22px;font-weight:700;margin-bottom:4px;">${esc(data.officeName)}</div>
      ${data.industry ? `<div style="font-size:12px;opacity:0.8;">${esc(data.industry)}</div>` : ""}
      ${data.address ? `<div style="font-size:12px;opacity:0.7;">${esc(data.address)}</div>` : ""}
      <div style="font-size:12px;opacity:0.7;margin-top:8px;">作成日：${todayStr()}</div>
    </div>
  </div>

  <div style="padding:40px 56px 56px;">
    <div style="font-size:18px;font-weight:700;color:#111827;margin-bottom:28px;padding-bottom:10px;border-bottom:2px solid #1d4ed8;">内部環境分析</div>
    ${section("💪 強み (Strengths)", "#1d4ed8", data.strengths)}
    ${section("⚠️ 弱み (Weaknesses)", "#c2410c", data.weaknesses)}
    <div style="font-size:18px;font-weight:700;color:#111827;margin-top:32px;margin-bottom:28px;padding-bottom:10px;border-bottom:2px solid #15803d;">外部環境分析</div>
    ${section("🌱 機会 (Opportunities)", "#15803d", data.opportunities)}
    ${section("⚡ 脅威 (Threats)", "#b91c1c", data.threats)}
  </div>
</div>`;
}

function swotGridHtml(data: SwotPdfData): string {
  const cell = (emoji: string, title: string, sub: string, color: string, bg: string, border: string, items: string[]) => `
    <div style="background:${bg};border:2px solid ${border};border-radius:6px;padding:16px;min-height:200px;">
      <div style="font-size:13px;font-weight:700;color:${color};margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid ${border};">${emoji} ${title} <span style="font-weight:400;font-size:11px;opacity:0.7;">— ${sub}</span></div>
      <ul style="margin:0;padding-left:18px;font-size:11px;color:#374151;line-height:1.7;">${listItems(items)}</ul>
    </div>`;

  return `<div style="width:1123px;background:white;font-family:'Helvetica Neue',Arial,'Hiragino Sans','Yu Gothic',sans-serif;box-sizing:border-box;">
  <div style="background:linear-gradient(135deg,#1e40af,#2563eb);padding:16px 28px;display:flex;justify-content:space-between;align-items:center;">
    <div>
      <div style="color:rgba(255,255,255,0.7);font-size:10px;letter-spacing:1px;">SWOT ANALYSIS</div>
      <div style="color:white;font-size:19px;font-weight:700;">SWOT分析 — ${esc(data.officeName)}</div>
    </div>
    <div style="color:rgba(255,255,255,0.7);font-size:11px;">${todayStr()}</div>
  </div>
  <div style="padding:20px 24px;display:grid;grid-template-columns:1fr 1fr;gap:16px;">
    ${cell("💪", "強み", "Strengths / 内部・プラス", "#1d4ed8", "#eff6ff", "#bfdbfe", data.strengths)}
    ${cell("⚠️", "弱み", "Weaknesses / 内部・マイナス", "#c2410c", "#fff7ed", "#fed7aa", data.weaknesses)}
    ${cell("🌱", "機会", "Opportunities / 外部・プラス", "#15803d", "#f0fdf4", "#bbf7d0", data.opportunities)}
    ${cell("⚡", "脅威", "Threats / 外部・マイナス", "#b91c1c", "#fef2f2", "#fecaca", data.threats)}
  </div>
</div>`;
}

function crossSwotHtml(data: SwotPdfData): string {
  const cell = (title: string, desc: string, color: string, bg: string, items: string[]) => `
    <div style="background:${bg};border-radius:5px;padding:14px;min-height:160px;">
      <div style="font-size:11px;font-weight:700;color:${color};margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid ${color}40;">${title} <span style="font-weight:400;opacity:0.8;">— ${desc}</span></div>
      <ul style="margin:0;padding-left:16px;font-size:10.5px;color:#374151;line-height:1.7;">${listItems(items)}</ul>
    </div>`;

  return `<div style="width:1123px;background:white;font-family:'Helvetica Neue',Arial,'Hiragino Sans','Yu Gothic',sans-serif;box-sizing:border-box;">
  <div style="background:linear-gradient(135deg,#065f46,#059669);padding:16px 28px;display:flex;justify-content:space-between;align-items:center;">
    <div>
      <div style="color:rgba(255,255,255,0.7);font-size:10px;letter-spacing:1px;">CROSS SWOT ANALYSIS</div>
      <div style="color:white;font-size:19px;font-weight:700;">クロスSWOT分析 — ${esc(data.officeName)}</div>
    </div>
    <div style="color:rgba(255,255,255,0.7);font-size:11px;">${todayStr()}</div>
  </div>
  <div style="padding:20px 24px;">
    <table style="width:100%;border-collapse:separate;border-spacing:12px;">
      <thead>
        <tr>
          <th style="width:100px;"></th>
          <th style="background:#dbeafe;border-radius:5px;padding:10px;font-size:12px;font-weight:700;color:#1d4ed8;text-align:center;">強み (S)</th>
          <th style="background:#fee2e2;border-radius:5px;padding:10px;font-size:12px;font-weight:700;color:#b91c1c;text-align:center;">弱み (W)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="background:#dcfce7;border-radius:5px;padding:10px;font-size:12px;font-weight:700;color:#15803d;text-align:center;vertical-align:middle;">機会 (O)</td>
          <td style="vertical-align:top;">${cell("SO 積極戦略", "強みで機会を掴む", "#1d4ed8", "#eff6ff", data.soStrategies)}</td>
          <td style="vertical-align:top;">${cell("WO 改善戦略", "弱みを補い機会を捉える", "#15803d", "#f0fdf4", data.woStrategies)}</td>
        </tr>
        <tr>
          <td style="background:#fef9c3;border-radius:5px;padding:10px;font-size:12px;font-weight:700;color:#a16207;text-align:center;vertical-align:middle;">脅威 (T)</td>
          <td style="vertical-align:top;">${cell("ST 差別化戦略", "強みで脅威に対抗", "#9333ea", "#faf5ff", data.stStrategies)}</td>
          <td style="vertical-align:top;">${cell("WT 致命傷回避", "弱みと脅威を最小化", "#b91c1c", "#fef2f2", data.wtStrategies)}</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>`;
}

// ─── Render & split utility ─────────────────────────────────────────

async function renderSection(
  pdf: jsPDF,
  html: string,
  renderWidth: number,
  pageMmW: number,
  pageMmH: number,
  isFirst: boolean
): Promise<void> {
  const el = document.createElement("div");
  el.style.cssText = `position:fixed;left:-9999px;top:0;width:${renderWidth}px;`;
  el.innerHTML = html;
  document.body.appendChild(el);

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: renderWidth,
      windowWidth: renderWidth,
    });

    const pxPerMmW = canvas.width / pageMmW;
    const pageSliceH = Math.floor(pageMmH * pxPerMmW);
    let yPx = 0;
    let pageIndex = 0;

    while (yPx < canvas.height) {
      const sliceH = Math.min(pageSliceH, canvas.height - yPx);
      const sliceMmH = sliceH / pxPerMmW;

      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceH;
      const ctx = pageCanvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, sliceH);
      ctx.drawImage(canvas, 0, yPx, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

      const imgData = pageCanvas.toDataURL("image/jpeg", 0.95);

      if (!isFirst || pageIndex > 0) {
        pdf.addPage([pageMmW, pageMmH], pageMmW > pageMmH ? "landscape" : "portrait");
      }
      pdf.addImage(imgData, "JPEG", 0, 0, pageMmW, sliceMmH);

      yPx += sliceH;
      pageIndex++;
    }
  } finally {
    document.body.removeChild(el);
  }
}

// ─── PDF export ─────────────────────────────────────────────────────

export async function generateSwotPdf(data: SwotPdfData): Promise<void> {
  const hasCross = data.soStrategies.length || data.woStrategies.length || data.stStrategies.length || data.wtStrategies.length;

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  await renderSection(pdf, coverHtml(data), 794, 210, 297, true);
  await renderSection(pdf, swotGridHtml(data), 1123, 297, 210, false);
  if (hasCross) {
    await renderSection(pdf, crossSwotHtml(data), 1123, 297, 210, false);
  }

  const date = new Date().toLocaleDateString("ja-JP").replace(/\//g, "-");
  pdf.save(`SWOT分析_${data.officeName}_${date}.pdf`);
}

// ─── Word export ─────────────────────────────────────────────────────

function noBorder() {
  return {
    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    insideH: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    insideV: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  };
}

function solidBorder(color: string) {
  const b = { style: BorderStyle.SINGLE, size: 6, color };
  return { top: b, bottom: b, left: b, right: b };
}

function swotTableCell(
  label: string,
  labelColor: string,
  bgHex: string,
  items: string[]
): TableCell {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: label, bold: true, color: labelColor, size: 22 })],
      spacing: { after: 100 },
    }),
    ...items.map(
      item =>
        new Paragraph({
          children: [new TextRun({ text: `• ${item}`, size: 20, color: "374151" })],
          spacing: { after: 60 },
        })
    ),
    ...(items.length === 0
      ? [new Paragraph({ children: [new TextRun({ text: "（未入力）", size: 18, color: "9CA3AF", italics: true })] })]
      : []),
  ];

  return new TableCell({
    children: paragraphs,
    borders: solidBorder(labelColor.toLowerCase()),
    shading: { type: ShadingType.SOLID, color: bgHex, fill: bgHex },
    margins: { top: convertInchesToTwip(0.1), bottom: convertInchesToTwip(0.1), left: convertInchesToTwip(0.12), right: convertInchesToTwip(0.12) },
  });
}

function headerCell(text: string, bgHex: string, textColor: string): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, color: textColor, size: 22 })],
        alignment: AlignmentType.CENTER,
      }),
    ],
    shading: { type: ShadingType.SOLID, color: bgHex, fill: bgHex },
    borders: noBorder(),
    margins: { top: convertInchesToTwip(0.06), bottom: convertInchesToTwip(0.06), left: convertInchesToTwip(0.08), right: convertInchesToTwip(0.08) },
  });
}

function emptyCornerCell(): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [] })],
    borders: noBorder(),
    shading: { type: ShadingType.SOLID, color: "FFFFFF", fill: "FFFFFF" },
  });
}

function sectionHeading(text: string, color: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, color, size: 28 })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 400, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color } },
  });
}

function bulletParagraphs(items: string[]): Paragraph[] {
  if (!items.length) {
    return [new Paragraph({ children: [new TextRun({ text: "（未入力）", size: 20, color: "9CA3AF", italics: true })], spacing: { after: 80 } })];
  }
  return items.map(
    item =>
      new Paragraph({
        children: [new TextRun({ text: item, size: 20, color: "374151" })],
        bullet: { level: 0 },
        spacing: { after: 80 },
      })
  );
}

export async function generateSwotDocx(data: SwotPdfData): Promise<void> {
  const hasCross = !!(data.soStrategies.length || data.woStrategies.length || data.stStrategies.length || data.wtStrategies.length);
  const dateStr = todayStr();

  const swotMatrix = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          swotTableCell("強み (Strengths)\n内部・プラス要因", "1D4ED8", "EFF6FF", data.strengths),
          swotTableCell("弱み (Weaknesses)\n内部・マイナス要因", "C2410C", "FFF7ED", data.weaknesses),
        ],
      }),
      new TableRow({
        children: [
          swotTableCell("機会 (Opportunities)\n外部・プラス要因", "15803D", "F0FDF4", data.opportunities),
          swotTableCell("脅威 (Threats)\n外部・マイナス要因", "B91C1C", "FEF2F2", data.threats),
        ],
      }),
    ],
  });

  const crossMatrix = hasCross
    ? new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              emptyCornerCell(),
              headerCell("強み (S)", "DBEAFE", "1D4ED8"),
              headerCell("弱み (W)", "FEE2E2", "B91C1C"),
            ],
          }),
          new TableRow({
            children: [
              headerCell("機会 (O)", "DCFCE7", "15803D"),
              swotTableCell("SO 積極戦略\n強みで機会を掴む", "1D4ED8", "EFF6FF", data.soStrategies),
              swotTableCell("WO 改善戦略\n弱みを補い機会を捉える", "15803D", "F0FDF4", data.woStrategies),
            ],
          }),
          new TableRow({
            children: [
              headerCell("脅威 (T)", "FEF9C3", "A16207"),
              swotTableCell("ST 差別化戦略\n強みで脅威に対抗", "9333EA", "FAF5FF", data.stStrategies),
              swotTableCell("WT 致命傷回避\n弱みと脅威を最小化", "B91C1C", "FEF2F2", data.wtStrategies),
            ],
          }),
        ],
      })
    : null;

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Yu Gothic", size: 20 },
        },
      },
    },
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: "SWOT分析レポート", bold: true, size: 52, color: "1E40AF" })],
            heading: HeadingLevel.TITLE,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: data.officeName, bold: true, size: 32, color: "111827" })],
            spacing: { after: 100 },
          }),
          ...(data.industry ? [new Paragraph({ children: [new TextRun({ text: data.industry, size: 22, color: "6B7280" })], spacing: { after: 60 } })] : []),
          ...(data.address ? [new Paragraph({ children: [new TextRun({ text: data.address, size: 22, color: "6B7280" })], spacing: { after: 60 } })] : []),
          new Paragraph({
            children: [new TextRun({ text: `作成日：${dateStr}`, size: 22, color: "6B7280" })],
            spacing: { after: 400 },
          }),

          sectionHeading("SWOT分析", "1D4ED8"),
          swotMatrix,

          new Paragraph({ children: [new TextRun({ text: "" })], spacing: { before: 400, after: 200 } }),

          sectionHeading("詳細リスト — 強み (Strengths)", "1D4ED8"),
          ...bulletParagraphs(data.strengths),

          sectionHeading("詳細リスト — 弱み (Weaknesses)", "C2410C"),
          ...bulletParagraphs(data.weaknesses),

          sectionHeading("詳細リスト — 機会 (Opportunities)", "15803D"),
          ...bulletParagraphs(data.opportunities),

          sectionHeading("詳細リスト — 脅威 (Threats)", "B91C1C"),
          ...bulletParagraphs(data.threats),

          ...(hasCross && crossMatrix
            ? [
                new Paragraph({ children: [new TextRun({ text: "" })], spacing: { before: 600, after: 200 } }),
                sectionHeading("クロスSWOT分析", "065F46"),
                crossMatrix,

                new Paragraph({ children: [new TextRun({ text: "" })], spacing: { before: 400, after: 200 } }),

                sectionHeading("SO 積極戦略 — 強みで機会を掴む", "1D4ED8"),
                ...bulletParagraphs(data.soStrategies),

                sectionHeading("WO 改善戦略 — 弱みを補い機会を捉える", "15803D"),
                ...bulletParagraphs(data.woStrategies),

                sectionHeading("ST 差別化戦略 — 強みで脅威に対抗", "9333EA"),
                ...bulletParagraphs(data.stStrategies),

                sectionHeading("WT 致命傷回避 — 弱みと脅威を最小化", "B91C1C"),
                ...bulletParagraphs(data.wtStrategies),
              ]
            : []),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const date = new Date().toLocaleDateString("ja-JP").replace(/\//g, "-");
  a.download = `SWOT分析_${data.officeName}_${date}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
