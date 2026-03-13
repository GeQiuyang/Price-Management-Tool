import fs from 'fs';
import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function importData() {
    const SQL = await initSqlJs();
    const dbPath = join(__dirname, 'database.db');

    if (!fs.existsSync(dbPath)) {
        console.error('Database not found at:', dbPath);
        return;
    }

    const fileBuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(fileBuffer);

    // Flatten the JSON data into individual rows
    const data = [];

    // === 导管（尖丝）===
    const tubes = [
        { name: "300尖丝导管", desc: "壁厚：3.0mm 长度：3m", price: 399 },
        { name: "300尖丝导管", desc: "壁厚：3.0mm 长度：0.5m", price: 150 },
        { name: "300尖丝导管", desc: "壁厚：3.0mm 长度：1m", price: 199 },
        { name: "300尖丝导管", desc: "壁厚：3.0mm 长度：1.5m", price: 250 },
        { name: "300尖丝导管", desc: "壁厚：3.0mm 长度：4m", price: 456 },
        { name: "260尖丝导管", desc: "壁厚：2.8mm 长度：3m", price: 331 },
        { name: "260尖丝导管", desc: "壁厚：2.8mm 长度：0.5m", price: 126 },
        { name: "260尖丝导管", desc: "壁厚：2.8mm 长度：1m", price: 167 },
        { name: "260尖丝导管", desc: "壁厚：2.8mm 长度：1.5m", price: 208 },
        { name: "260尖丝导管", desc: "壁厚：2.8mm 长度：4m", price: 378 },
        { name: "219尖丝导管", desc: "壁厚：2.75mm 长度：3m", price: 304 },
        { name: "219尖丝导管", desc: "壁厚：2.75mm 长度：0.5m", price: 112 },
        { name: "219尖丝导管", desc: "壁厚：2.75mm 长度：1m", price: 150 },
        { name: "219尖丝导管", desc: "壁厚：2.75mm 长度：1.5m", price: 189 },
        { name: "219尖丝导管", desc: "壁厚：2.75mm 长度：4m", price: 353 },
    ];
    data.push(...tubes);

    // === 料斗与井口架 ===
    data.push(
        { name: "料斗", desc: "壁厚：2.75mm 1.5方", price: 1060 },
        { name: "料斗", desc: "壁厚：2.75mm 2方", price: 1180 },
        { name: "料斗", desc: "壁厚：2.75mm 2.5方", price: 1360 },
        { name: "井口架(14槽钢)", desc: "长度：1.5m", price: 490 },
        { name: "井口架(14槽钢)", desc: "长度：2m", price: 530 },
        { name: "井口架(14槽钢)", desc: "长度：2.5m", price: 580 },
    );

    // === 配件(219/260/300同价) ===
    data.push(
        { name: "小方斗", desc: "", price: 170 },
        { name: "密封圈", desc: "", price: 1 },
        { name: "扳手", desc: "", price: 30 },
        { name: "吊耳", desc: "", price: 26 },
        { name: "料斗盖", desc: "", price: 30 },
    );

    // === 三件套/堵头/清孔器 (split by 219/260/300) ===
    const splitItems = [
        { baseName: "接头(方牙+5元/套)", types: ["219型", "260型", "300型"], prices: [82, 93, 111] },
        { baseName: "公扣(方牙+3元/个)", types: ["219型", "260型", "300型"], prices: [30, 35, 41] },
        { baseName: "母扣(方牙+3元/个)", types: ["219型", "260型", "300型"], prices: [30, 35, 41] },
        { baseName: "衬套", types: ["219型", "260型", "300型"], prices: [22, 23, 29] },
        { baseName: "堵头", types: ["219型", "260型", "300型"], prices: [75, 75, 85] },
        { baseName: "清孔器(不带管)", types: ["219型", "260型", "300型"], prices: [110, 120, 140] },
    ];
    for (const item of splitItems) {
        for (let i = 0; i < item.types.length; i++) {
            data.push({ name: item.baseName, desc: item.types[i], price: item.prices[i] });
        }
    }

    // === 钢丝绳 ===
    data.push(
        { name: "吊耳钢丝绳", desc: "16号3m1根(含吊耳, 编好)", price: 90 },
        { name: "料斗盖钢丝绳", desc: "12号*2m1根(含卸扣卡子, 编好)", price: 48 },
        { name: "料斗/井口架钢丝绳", desc: "16号3m2根(含卸扣卡子, 编好)", price: 182 },
        { name: "料斗/井口架钢丝绳", desc: "16号4m1根(含卸扣卡子, 编好)", price: 110 },
        { name: "料斗/井口架钢丝绳", desc: "18号4m2根(含卸扣卡子, 编好)", price: 270 },
    );

    const warehouse = '大连';
    let totalImported = 0;

    for (const item of data) {
        db.run(
            'INSERT INTO warehouse_products (name, description, price, warehouse, status) VALUES (?, ?, ?, ?, ?)',
            [item.name, item.desc || null, item.price, warehouse, 'active']
        );
        totalImported++;
    }

    const exportData = db.export();
    const buffer = Buffer.from(exportData);
    fs.writeFileSync(dbPath, buffer);
    console.log(`Successfully imported ${totalImported} items to ${warehouse} warehouse.`);
}

importData().catch(console.error);
