import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.join(__dirname, 'exported_products.json');
const excelPath = path.join(__dirname, 'exported_products.xlsx');

async function convert() {
    if (!fs.existsSync(jsonPath)) {
        console.error('JSON file not found at:', jsonPath);
        process.exit(1);
    }

    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const wb = XLSX.utils.book_new();

    for (const [category, products] of Object.entries(jsonData)) {
        const ws = XLSX.utils.json_to_sheet(products);
        XLSX.utils.book_append_sheet(wb, ws, category);
    }

    XLSX.writeFile(wb, excelPath);
    console.log(`Successfully converted JSON to Excel: ${excelPath}`);
}

convert().catch(err => {
    console.error('Conversion failed:', err);
    process.exit(1);
});
