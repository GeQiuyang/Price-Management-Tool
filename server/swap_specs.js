import fs from 'fs';
import initSqlJs from 'sql.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function swapSpecs() {
    const SQL = await initSqlJs();
    const dbPath = path.join(__dirname, 'database.db');

    if (!fs.existsSync(dbPath)) {
        console.error('Database not found!');
        return;
    }

    const fileBuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(fileBuffer);

    let updatedProductsCount = 0;
    let updatedWarehouseProductsCount = 0;

    // Process products table
    const productsResult = db.exec("SELECT id, description FROM products WHERE description LIKE '%长度%' AND description LIKE '%壁厚%'");
    if (productsResult.length > 0) {
        const rows = productsResult[0].values;
        for (const [id, description] of rows) {
            if (typeof description === 'string') {
                const newDescription = description.replace(/长度([：:]\s*[\d\.]+m)，壁厚([：:]\s*[\d\.]+mm)/g, '壁厚$2，长度$1');
                if (newDescription !== description) {
                    db.run("UPDATE products SET description = ? WHERE id = ?", [newDescription, id]);
                    updatedProductsCount++;
                }
            }
        }
    }

    // Process warehouse_products table
    const warehouseProductsResult = db.exec("SELECT id, description FROM warehouse_products WHERE description LIKE '%长度%' AND description LIKE '%壁厚%'");
    if (warehouseProductsResult.length > 0) {
        const rows = warehouseProductsResult[0].values;
        for (const [id, description] of rows) {
            if (typeof description === 'string') {
                const newDescription = description.replace(/长度([：:]\s*[\d\.]+m)，壁厚([：:]\s*[\d\.]+mm)/g, '壁厚$2，长度$1');
                if (newDescription !== description) {
                    db.run("UPDATE warehouse_products SET description = ? WHERE id = ?", [newDescription, id]);
                    updatedWarehouseProductsCount++;
                }
            }
        }
    }

    if (updatedProductsCount > 0 || updatedWarehouseProductsCount > 0) {
        const exportData = db.export();
        const buffer = Buffer.from(exportData);
        fs.writeFileSync(dbPath, buffer);
        console.log(`Successfully updated ${updatedProductsCount} products and ${updatedWarehouseProductsCount} warehouse products.`);
    } else {
        console.log('No products needed updating.');
    }
}

swapSpecs().catch(console.error);
