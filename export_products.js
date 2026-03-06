import initSqlJs from 'sql.js';
import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'server', 'database.db');

async function exportProducts() {
    const SQL = await initSqlJs();
    const fileBuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(fileBuffer);

    const categories = ['钻具类', '导管类'];
    const results = {};

    categories.forEach(category => {
        const stmt = db.prepare('SELECT * FROM products WHERE category = ?');
        stmt.bind([category]);

        const categoryData = [];
        while (stmt.step()) {
            categoryData.push(stmt.getAsObject());
        }
        stmt.free();
        results[category] = categoryData;
    });

    const outputPath = join(__dirname, 'exported_products.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`Successfully exported data to ${outputPath}`);
}

exportProducts().catch(err => {
    console.error('Export failed:', err);
    process.exit(1);
});
