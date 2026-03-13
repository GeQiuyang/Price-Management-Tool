import http from 'http';

const data = [
    {
        "规格": "14号槽钢井口架",
        "详情": [
            "长度：1.5m,重量：75.6kg,经销商价：370,终端价：420",
            "长度：2m,重量：77.3kg,经销商价：410,终端价：460",
            "长度：2.5m,重量：98kg,经销商价：460,终端价：510",
            "长度：3m,重量：93kg,经销商价：510,终端价：560",
            "长度：3.5m,重量：未知,经销商价：570,终端价：620"
        ]
    },
    {
        "规格": "16号槽钢井口架",
        "详情": [
            "长度：1.5m,重量：未知,经销商价：400,终端价：450",
            "长度：2m,重量：86.8kg,经销商价：450,终端价：500",
            "长度：2.5m,重量：102.5kg,经销商价：510,终端价：560",
            "长度：3m,重量：109kg,经销商价：570,终端价：620",
            "长度：3.5m,重量：未知,经销商价：630,终端价：680",
            "长度：4m,重量：未知,经销商价：690,终端价：740"
        ]
    },
    {
        "规格": "16号重型槽钢井口架",
        "详情": [
            "长度：1.5m,重量：未知,经销商价：440,终端价：490",
            "长度：2m,重量：未知,经销商价：490,终端价：540",
            "长度：2.5m,重量：未知,经销商价：560,终端价：610",
            "长度：3m,重量：未知,经销商价：630,终端价：680",
            "长度：3.5m,重量：未知,经销商价：700,终端价：750",
            "长度：4m,重量：未知,经销商价：760,终端价：810"
        ]
    }
];

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

    let counter = 0;
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
            let description = detailStr.replace(/,?经销商价.*$/, '').trim();
            const lengthMatch = description.match(/长度[：:]\s*([\d\.]+)m/);
            const length = lengthMatch ? lengthMatch[1] : 'O';

            const name = `${namePrefix}`;
            const category = '导管类';
            const sku = `WQ-${namePrefix}-${length}-${counter++}`;

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
