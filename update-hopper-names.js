import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'server', 'database.db');

async function run() {
    console.log("初始化 sql.js...");
    const SQL = await initSqlJs();
    console.log("读取数据库...");
    const fileBuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(fileBuffer);

    console.log("查询导管类下的料斗产品...");
    const stmt = db.prepare("SELECT id, name FROM products WHERE category = '导管类' AND name LIKE '料斗 %'");

    const hoppers = [];
    while (stmt.step()) {
        hoppers.push(stmt.getAsObject());
    }
    stmt.free();

    const updateStmt = db.prepare("UPDATE products SET name = ? WHERE id = ?");
    let updatedCount = 0;

    for (const item of hoppers) {
        // name looks like: "料斗 0.5方" -> we want "0.5方料斗"
        // Also handling cases like "料斗 0.5方" explicitly: Replace "料斗 " and append "料斗"
        const parts = item.name.split(' ');
        if (parts[0] === '料斗' && parts.length >= 2) {
            const size = parts.slice(1).join(' '); // in case there's something else like '0.5方'
            const newName = `${size}料斗`;

            if (newName !== item.name) {
                updateStmt.run([newName, item.id]);
                updatedCount++;
                console.log(`更新产品: ${item.name} -> ${newName}`);
            }
        }
    }
    updateStmt.free();

    if (updatedCount > 0) {
        console.log(`成功更新 ${updatedCount} 条数据！正在保存...`);
        const exportData = db.export();
        fs.writeFileSync(dbPath, Buffer.from(exportData));
        console.log("保存完成。");
    } else {
        console.log("没有找到需要更新的产品。");
    }
}

run().catch(console.error);
