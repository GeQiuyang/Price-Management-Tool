import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'server', 'database.db');

const data = [
    {
        "方数": "5.5方",
        "厚度": "2.75mm",
        "重量": "",
        "内径": "2.4m",
        "圆柱高度": "0.9m",
        "总高": "2.02m",
        "经销商价": 3400,
        "终端价": 3750
    },
    {
        "方数": "5.5方",
        "厚度": "3.5mm",
        "重量": "",
        "内径": "2.4m",
        "圆柱高度": "0.9m",
        "总高": "2.02m",
        "经销商价": 3750,
        "终端价": 4100
    },
    {
        "方数": "5.5方",
        "厚度": "4mm",
        "重量": "",
        "内径": "2.4m",
        "圆柱高度": "0.9m",
        "总高": "2.02m",
        "经销商价": 3950,
        "终端价": 4300
    },
    {
        "方数": "5.5方",
        "厚度": "4.5mm",
        "重量": "",
        "内径": "2.4m",
        "圆柱高度": "0.9m",
        "总高": "2.02m",
        "经销商价": 4180,
        "终端价": 4530
    },
    {
        "方数": "6方",
        "厚度": "2.75mm",
        "重量": "",
        "内径": "2.5m",
        "圆柱高度": "0.9m",
        "总高": "2.1m",
        "经销商价": 4100,
        "终端价": 4500
    },
    {
        "方数": "6方",
        "厚度": "3.5mm",
        "重量": "",
        "内径": "2.5m",
        "圆柱高度": "0.9m",
        "总高": "2.1m",
        "经销商价": 4400,
        "终端价": 4800
    },
    {
        "方数": "6方",
        "厚度": "4mm",
        "重量": "",
        "内径": "2.5m",
        "圆柱高度": "0.9m",
        "总高": "2.1m",
        "经销商价": 4600,
        "终端价": 5000
    },
    {
        "方数": "6方",
        "厚度": "4.5mm",
        "重量": "",
        "内径": "2.5m",
        "圆柱高度": "0.9m",
        "总高": "2.1m",
        "经销商价": 4900,
        "终端价": 5300
    }
];

async function run() {
    console.log("初始化 sql.js...");
    const SQL = await initSqlJs();
    console.log("读取数据库...");
    const fileBuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(fileBuffer);

    // Get max SKU ID for LD prefix
    const maxSkuQuery = db.exec("SELECT sku FROM products WHERE sku LIKE 'LD-%'");
    let counter = 0;
    if (maxSkuQuery.length > 0) {
        maxSkuQuery[0].values.forEach((row) => {
            const sku = row[0];
            const parts = sku.split('-');
            const num = parseInt(parts[parts.length - 1]);
            if (!isNaN(num) && num >= counter) {
                counter = num + 1;
            }
        });
    }

    const insertStmt = db.prepare(`
        INSERT INTO products (name, category, sku, price, dealer_price, description, status) 
        VALUES (?, ?, ?, ?, ?, ?, 'active')
    `);

    let insertedCount = 0;

    for (const item of data) {
        // As per the update: name should not have thickness but should be "X方料斗"
        const name = `${item.方数}料斗`;
        const category = '导管类';

        const fStr = item.方数.replace('方', 'F');
        const tStr = item.厚度.replace('mm', '');
        const sku = `LD-${fStr}-${tStr}-${counter++}`;

        // As per update: remove 方数 from description
        const description = `厚度: ${item.厚度}, 重量: ${item.重量 || '未知'}, 内径: ${item.内径}, 圆柱高度: ${item.圆柱高度}, 总高: ${item.总高}`;
        const price = item.终端价;
        const dealer_price = item.经销商价;

        insertStmt.run([name, category, sku, price, dealer_price, description]);
        insertedCount++;
    }

    insertStmt.free();

    console.log(`成功插入 ${insertedCount} 条数据！正在保存...`);
    const exportData = db.export();
    fs.writeFileSync(dbPath, Buffer.from(exportData));
    console.log("保存完成。");
}

run().catch(console.error);
