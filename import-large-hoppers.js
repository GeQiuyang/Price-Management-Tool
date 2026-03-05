import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'server', 'database.db');

const data = [
    {
        "方数": "3方",
        "厚度": "2.75mm",
        "重量": "236kg",
        "内径": "1.8m",
        "圆柱高度": "0.88m",
        "总高": "1.9m",
        "经销商价": 1280,
        "终端价": 1430
    },
    {
        "方数": "3方",
        "厚度": "3.5mm",
        "重量": "",
        "内径": "1.8m",
        "圆柱高度": "0.88m",
        "总高": "1.9m",
        "经销商价": 1450,
        "终端价": 1600
    },
    {
        "方数": "3方",
        "厚度": "4mm",
        "重量": "",
        "内径": "1.8m",
        "圆柱高度": "0.88m",
        "总高": "1.9m",
        "经销商价": 1570,
        "终端价": 1720
    },
    {
        "方数": "3方",
        "厚度": "4.5mm",
        "重量": "",
        "内径": "1.8m",
        "圆柱高度": "0.88m",
        "总高": "1.9m",
        "经销商价": 1700,
        "终端价": 1850
    },
    {
        "方数": "3.5方",
        "厚度": "2.75mm",
        "重量": "",
        "内径": "1.95m",
        "圆柱高度": "0.9m",
        "总高": "1.87m",
        "经销商价": 1620,
        "终端价": 1770
    },
    {
        "方数": "3.5方",
        "厚度": "3.5mm",
        "重量": "",
        "内径": "1.95m",
        "圆柱高度": "0.9m",
        "总高": "1.87m",
        "经销商价": 1850,
        "终端价": 2000
    },
    {
        "方数": "3.5方",
        "厚度": "4mm",
        "重量": "",
        "内径": "1.95m",
        "圆柱高度": "0.9m",
        "总高": "1.87m",
        "经销商价": 1950,
        "终端价": 2100
    },
    {
        "方数": "3.5方",
        "厚度": "4.5mm",
        "重量": "",
        "内径": "1.95m",
        "圆柱高度": "0.9m",
        "总高": "1.87m",
        "经销商价": 2130,
        "终端价": 2280
    },
    {
        "方数": "4方",
        "厚度": "2.75mm",
        "重量": "",
        "内径": "2.1m",
        "圆柱高度": "0.9m",
        "总高": "1.82m",
        "经销商价": 2050,
        "终端价": 2300
    },
    {
        "方数": "4方",
        "厚度": "3.5mm",
        "重量": "",
        "内径": "2.1m",
        "圆柱高度": "0.9m",
        "总高": "1.82m",
        "经销商价": 2270,
        "终端价": 2520
    },
    {
        "方数": "4方",
        "厚度": "4mm",
        "重量": "",
        "内径": "2.1m",
        "圆柱高度": "0.9m",
        "总高": "1.82m",
        "经销商价": 2410,
        "终端价": 2660
    },
    {
        "方数": "4方",
        "厚度": "4.5mm",
        "重量": "",
        "内径": "2.1m",
        "圆柱高度": "0.9m",
        "总高": "1.82m",
        "经销商价": 2600,
        "终端价": 2850
    },
    {
        "方数": "4.5方",
        "厚度": "2.75mm",
        "重量": "",
        "内径": "2.2m",
        "圆柱高度": "0.9m",
        "总高": "1.92m",
        "经销商价": 2330,
        "终端价": 2630
    },
    {
        "方数": "4.5方",
        "厚度": "3.5mm",
        "重量": "",
        "内径": "2.2m",
        "圆柱高度": "0.9m",
        "总高": "1.92m",
        "经销商价": 2550,
        "终端价": 2850
    },
    {
        "方数": "4.5方",
        "厚度": "4mm",
        "重量": "",
        "内径": "2.2m",
        "圆柱高度": "0.9m",
        "总高": "1.92m",
        "经销商价": 2720,
        "终端价": 3020
    },
    {
        "方数": "4.5方",
        "厚度": "4.5mm",
        "重量": "",
        "内径": "2.2m",
        "圆柱高度": "0.9m",
        "总高": "1.92m",
        "经销商价": 2930,
        "终端价": 3230
    },
    {
        "方数": "5方",
        "厚度": "2.75mm",
        "重量": "",
        "内径": "2.3m",
        "圆柱高度": "0.9m",
        "总高": "1.97m",
        "经销商价": 3200,
        "终端价": 3500
    },
    {
        "方数": "5方",
        "厚度": "3.5mm",
        "重量": "",
        "内径": "2.3m",
        "圆柱高度": "0.9m",
        "总高": "1.97m",
        "经销商价": 3450,
        "终端价": 3750
    },
    {
        "方数": "5方",
        "厚度": "4mm",
        "重量": "",
        "内径": "2.3m",
        "圆柱高度": "0.9m",
        "总高": "1.97m",
        "经销商价": 3600,
        "终端价": 3900
    },
    {
        "方数": "5方",
        "厚度": "4.5mm",
        "重量": "",
        "内径": "2.3m",
        "圆柱高度": "0.9m",
        "总高": "1.97m",
        "经销商价": 3850,
        "终端价": 4150
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
