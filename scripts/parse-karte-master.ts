import fs from 'fs';
import path from 'path';

// CSVデータを読み込み
const csvPath = path.join(process.cwd(), 'attached_assets', 'カルテシステム再現PJ_1759989767688.csv');
const csvData = fs.readFileSync(csvPath, 'utf-8');

interface GuidanceItem {
  code: string;
  name: string;
}

interface GuidanceCategory {
  code: string;
  name: string;
  itemCode: string;
}

interface GuidanceContent {
  code: string;
  name: string;
  itemCode: string;
  categoryCode: string;
}

const guidanceItems: GuidanceItem[] = [];
const guidanceCategories: GuidanceCategory[] = [];
const guidanceContents: GuidanceContent[] = [];

const lines = csvData.split('\n');
// Skip header rows (first 5 lines)
for (let i = 5; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const parts = line.split(',');
  if (parts.length < 6) continue;

  const itemCode = parts[0].trim();
  const itemName = parts[1].trim();
  const categoryCode = parts[2].trim();
  const categoryName = parts[3].trim();
  const contentCode = parts[4].trim();
  const contentName = parts[5].trim();

  if (!itemCode || !categoryCode || !contentCode) continue;

  // Add guidance item if not exists
  if (!guidanceItems.find(item => item.code === itemCode)) {
    guidanceItems.push({ code: itemCode, name: itemName });
  }

  // Add guidance category if not exists
  const categoryKey = `${itemCode}-${categoryCode}`;
  if (!guidanceCategories.find(cat => cat.itemCode === itemCode && cat.code === categoryCode)) {
    guidanceCategories.push({
      code: categoryCode,
      name: categoryName,
      itemCode: itemCode
    });
  }

  // Add guidance content
  guidanceContents.push({
    code: contentCode,
    name: contentName,
    itemCode: itemCode,
    categoryCode: categoryCode
  });
}

// Sort by code
guidanceItems.sort((a, b) => a.code.localeCompare(b.code));
guidanceCategories.sort((a, b) => {
  if (a.itemCode !== b.itemCode) return a.itemCode.localeCompare(b.itemCode);
  return a.code.localeCompare(b.code);
});
guidanceContents.sort((a, b) => {
  if (a.itemCode !== b.itemCode) return a.itemCode.localeCompare(b.itemCode);
  if (a.categoryCode !== b.categoryCode) return a.categoryCode.localeCompare(b.categoryCode);
  return a.code.localeCompare(b.code);
});

// Create output directory
const outputDir = path.join(process.cwd(), 'shared', 'data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write to files
fs.writeFileSync(
  path.join(outputDir, 'karte-master.json'),
  JSON.stringify({
    guidanceItems,
    guidanceCategories,
    guidanceContents
  }, null, 2)
);

console.log('✓ Parsed guidance items:', guidanceItems.length);
console.log('✓ Parsed guidance categories:', guidanceCategories.length);
console.log('✓ Parsed guidance contents:', guidanceContents.length);
console.log('✓ Output file: shared/data/karte-master.json');
