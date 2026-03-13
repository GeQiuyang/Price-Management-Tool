import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'server', 'database.db');

const data = {
    "16号槽钢清孔泵井口架": [
        { "长度": "2m", "经销商价": 920, "终端价": 1020 },
        { "长度": "2.5m", "经销商价": 980, "终端价": 1080 },
        { "长度": "3m", "经销商价": 1040, "终端价": 1140 },
        { "长度": "3.5m", "经销商价": 1110, "终端价": 1210 },
        { "长度": "4m", "经销商价": 1210, "终端价": 1310 },
        { "长度": "4.5m", "经销商价": 1310, "终端价": 1410 }
    ],
    "16号加重槽钢清孔泵井口架": [
        { "长度": "2m", "经销商价": 970, "终端价": 1070 },
        { "长度": "2.5m", "经销商价": 1030, "终端价": 1130 },
        { "长度": "3m", "经销商价": 1090, "终端价": 1190 },
        { "长度": "3.5m", "经销商价": 1170, "终端价": 1270 },
        { "长度": "4m", "经销商价": 1270, "终端价": 1370 },
        { "长度": "4.5m", "经销商价": 1380, "终端价": 1480 }
    ]
};

async function run() {
    console.log("初始化 sql.js...");
    const SQL = await initSqlJs();
    console.log("读取数据库...");
    const fileBuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(fileBuffer);

    let counter = Date.now();
    const stmt = db.prepare(`
        INSERT INTO products (name, category, sku, price, dealer_price, description, status) 
        VALUES (?, ?, ?, ?, ?, ?, 'active')
    `);

    let imported = 0;
    for (const [name, items] of Object.entries(data)) {
        for (const item of items) {
            const price = item.终端价;
            const dealer_price = item.经销商价;
            const length = item.长度;
            const description = `长度：${length},重量：未知`;
            const sku = `CPW-${name}-${length.replace('.', '_')}-${counter++}`;
            const category = '导管类';

            stmt.run([name, category, sku, price, dealer_price, description]);
            imported++;
            console.log(`✅ Added: ${name} | ${description} (Dealer: ${dealer_price}, Retail: ${price})`);
        }
    }
    stmt.free();

    console.log(`成功导入 ${imported} 条数据！正在保存...`);
    const exportData = db.export();
    fs.writeFileSync(dbPath, Buffer.from(exportData));
    console.log("保存完成。");
}

run().catch(console.error);
