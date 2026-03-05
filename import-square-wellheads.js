import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'server', 'database.db');

const data = [
    {
        "规格": "10号方管井口架",
        "详情": [
            "长度：2m，重量：未知，经销商价：630，终端价：680",
            "长度：2.5m，重量：未知，经销商价：680，终端价：730",
            "长度：3m，重量：未知，经销商价：730，终端价：780",
            "长度：3.5m，重量：未知，经销商价：830，终端价：880",
            "长度：4m，重量：未知，经销商价：950，终端价：1000",
            "长度：4.5m，重量：未知，经销商价：1100，终端价：1150"
        ]
    },
    {
        "规格": "10号方管清孔泵井口架",
        "详情": [
            "长度：2m，重量：未知，经销商价：1050，终端价：1150",
            "长度：2.5m，重量：未知，经销商价：1150，终端价：1250",
            "长度：3m，重量：未知，经销商价：1200，终端价：1300",
            "长度：3.5m，重量：未知，经销商价：1300，终端价：1400",
            "长度：4m，重量：未知，经销商价：1450，终端价：1550",
            "长度：4.5m，重量：未知，经销商价：1550，终端价：1650"
        ]
    }
];

async function run() {
    console.log("初始化 sql.js...");
    const SQL = await initSqlJs();
    console.log("读取数据库...");
    const fileBuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(fileBuffer);

    let counter = Date.now(); // More unique counter
    const stmt = db.prepare(`
        INSERT INTO products (name, category, sku, price, dealer_price, description, status) 
        VALUES (?, ?, ?, ?, ?, ?, 'active')
    `);

    let imported = 0;
    for (const group of data) {
        const namePrefix = group['规格'];

        for (const detailStr of group['详情']) {
            const dealerMatch = detailStr.match(/经销商价[：:]\s*(\d+)/);
            const retailMatch = detailStr.match(/终端价[：:]\s*(\d+)/);

            const dealer_price = dealerMatch ? parseFloat(dealerMatch[1]) : 0;
            const price = retailMatch ? parseFloat(retailMatch[1]) : 0;

            // Extract description and length
            let description = detailStr.replace(/，?经销商价.*$/, '').trim();
            const lengthMatch = description.match(/长度[：:]\s*([\d\.]+)m/);
            const length = lengthMatch ? lengthMatch[1] : 'O';

            const name = `${namePrefix}`;
            const category = '导管类';
            const sku = `SQW-${namePrefix}-${length}-${counter++}`;

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
