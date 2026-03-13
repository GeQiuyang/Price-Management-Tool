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

    const data = [];

    // === 导管 ===
    data.push(
        { name: "300尖丝导管", desc: "壁厚：3.0mm, 长度：3m", price: 396 },
        { name: "300尖丝导管", desc: "壁厚：3.0mm, 长度：0.5m", price: 149 },
        { name: "300尖丝导管", desc: "壁厚：3.0mm, 长度：1m", price: 198 },
        { name: "300尖丝导管", desc: "壁厚：3.0mm, 长度：1.5m", price: 248 },
        { name: "300尖丝导管", desc: "壁厚：3.0mm, 长度：2m", price: 298 },
        { name: "300尖丝导管", desc: "壁厚：3.0mm, 长度：4m", price: 452 },
        { name: "300尖丝导管", desc: "壁厚：3.5mm, 长度：3m", price: 440 },
        { name: "300尖丝导管", desc: "壁厚：3.5mm, 长度：0.5m", price: 155 },
        { name: "300尖丝导管", desc: "壁厚：3.5mm, 长度：1m", price: 212 },
        { name: "300尖丝导管", desc: "壁厚：3.5mm, 长度：1.5m", price: 269 },
        { name: "300尖丝导管", desc: "壁厚：3.5mm, 长度：2m", price: 326 },
        { name: "300尖丝导管", desc: "壁厚：3.5mm, 长度：4m", price: 512 },
        { name: "260尖丝导管", desc: "壁厚：2.75mm, 长度：3m", price: 331 },
        { name: "260尖丝导管", desc: "壁厚：2.75mm, 长度：0.5m", price: 126 },
        { name: "260尖丝导管", desc: "壁厚：2.75mm, 长度：1m", price: 167 },
        { name: "260尖丝导管", desc: "壁厚：2.75mm, 长度：1.5m", price: 208 },
        { name: "260尖丝导管", desc: "壁厚：2.75mm, 长度：2m", price: 249 },
        { name: "260尖丝导管", desc: "壁厚：2.75mm, 长度：4m", price: 378 },
    );

    // === 料斗 ===
    data.push(
        { name: "1方料斗", desc: "壁厚：2.75mm", price: 1030 },
        { name: "1.5方料斗", desc: "壁厚：2.75mm", price: 1130 },
        { name: "2方料斗", desc: "壁厚：2.75mm", price: 1250 },
        { name: "2.5方料斗", desc: "壁厚：2.75mm", price: 1430 },
        { name: "3方料斗", desc: "壁厚：2.75mm", price: 1780 },
    );

    // === 井口架 ===
    data.push(
        { name: "260 14槽钢井口架", desc: "长度：2m", price: 500 },
        { name: "260 14槽钢井口架", desc: "长度：2.5m", price: 550 },
        { name: "260 14槽钢井口架", desc: "12号槽钢垫叉", price: 120 },
        { name: "300 14槽钢井口架", desc: "长度：2m", price: 500 },
        { name: "300 14槽钢井口架", desc: "长度：2.5m", price: 550 },
        { name: "300 14槽钢井口架", desc: "长度：3m", price: 600 },
        { name: "300 14槽钢井口架", desc: "12号槽钢垫叉", price: 120 },
    );

    // === 三件套/配件 (split 300/260) ===
    const splitItems300_260 = [
        { baseName: "三件套", prices: [140, 120] },
        { baseName: "公扣", prices: [53, 46] },
        { baseName: "母扣", prices: [53, 46] },
        { baseName: "衬套", prices: [38, 33] },
        { baseName: "清空器", prices: [150, 130] },
        { baseName: "堵头", prices: [80, 70] },
        { baseName: "广式全圆吊耳", prices: [180, 180] },
        { baseName: "广式全圆吊耳钢丝绳", prices: [240, 240] },
        { baseName: "吊耳16mm", prices: [35, 35] },
        { baseName: "钢丝绳吊耳", prices: [100, 100] },
        { baseName: "料斗接", prices: [140, 120] },
    ];
    for (const item of splitItems300_260) {
        data.push({ name: item.baseName, desc: "300", price: item.prices[0] });
        data.push({ name: item.baseName, desc: "260", price: item.prices[1] });
    }

    // === 扳手14mm (split 260/300/219) ===
    data.push(
        { name: "扳手14mm", desc: "260", price: 30 },
        { name: "扳手14mm", desc: "300", price: 30 },
        { name: "扳手14mm", desc: "219", price: 27 },
    );

    // === 钢丝绳 ===
    data.push(
        { name: "料斗盖钢丝绳", desc: "长度：12#*2m*1根", price: 55 },
        { name: "井口架钢丝绳", desc: "长度：14#*3m*2根", price: 150 },
        { name: "料斗钢丝绳", desc: "长度：16#*3m*2根", price: 200 },
        { name: "钢丝绳", desc: "长度：18#*4m*2根", price: 270 },
    );

    // === 其他配件 ===
    data.push(
        { name: "小方斗", desc: "260", price: 180 },
        { name: "钢丝绳测绳", desc: "", price: 1 },
        { name: "密封圈", desc: "", price: 1 },
        { name: "料斗盖(同价)", desc: "", price: 30 },
    );

    const warehouse = '成都';
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
