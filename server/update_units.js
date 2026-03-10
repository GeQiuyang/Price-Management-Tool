import fs from 'fs';
import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function updateUnits() {
    const SQL = await initSqlJs();
    const dbPath = join(__dirname, 'database.db');

    if (!fs.existsSync(dbPath)) {
        console.error('Database not found at:', dbPath);
        return;
    }

    const fileBuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(fileBuffer);

    // Update products table
    db.run("UPDATE products SET name = REPLACE(name, '米', 'm') WHERE name LIKE '%米%'");
    db.run("UPDATE products SET description = REPLACE(description, '米', 'm') WHERE description LIKE '%米%'");
    db.run("UPDATE products SET sku = REPLACE(sku, '米', 'm') WHERE sku LIKE '%米%'");

    // Update warehouse_products table
    db.run("UPDATE warehouse_products SET name = REPLACE(name, '米', 'm') WHERE name LIKE '%米%'");
    db.run("UPDATE warehouse_products SET description = REPLACE(description, '米', 'm') WHERE description LIKE '%米%'");

    const exportData = db.export();
    const buffer = Buffer.from(exportData);
    fs.writeFileSync(dbPath, buffer);

    const pChanges = db.exec("SELECT changes()")[0].values[0][0];
    console.log('Database units updated: 米 -> m');
}

updateUnits().catch(console.error);
