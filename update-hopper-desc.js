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
    const stmt = db.prepare("SELECT id, name, description FROM products WHERE category = '导管类' AND name LIKE '%料斗'");

    const hoppers = [];
    while (stmt.step()) {
        hoppers.push(stmt.getAsObject());
    }
    stmt.free();

    const updateStmt = db.prepare("UPDATE products SET description = ? WHERE id = ?");
    let updatedCount = 0;

    for (const item of hoppers) {
        if (!item.description) continue;

        // original looks like: 方数: 0.5方, 厚度: 2.75mm, 重量: 80.5kg, 内径: 0.95m, 圆柱高度: 0.5m, 总高: 1.2m
        // remove "方数: xxx, "
        let newDesc = item.description.replace(/方数: [^,]+,\s*/, '');

        if (newDesc !== item.description) {
            updateStmt.run([newDesc, item.id]);
            updatedCount++;
            console.log(`更新产品 [${item.name}] 描述: \n  旧: ${item.description}\n  新: ${newDesc}`);
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
