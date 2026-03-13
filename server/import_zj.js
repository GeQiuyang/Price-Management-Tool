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

    const data = [
        // === 导管 ===
        { name: "300尖丝导管", desc: "壁厚：3.5mm,长度：3m", price: 405 },
        { name: "300尖丝导管", desc: "壁厚：3.5mm,长度：0.5m", price: 155 },
        { name: "300尖丝导管", desc: "壁厚：3.5mm,长度：1m", price: 205 },
        { name: "300尖丝导管", desc: "壁厚：3.5mm,长度：1.5m", price: 255 },
        { name: "300尖丝导管", desc: "壁厚：3.5mm,长度：4m", price: 458 },
        { name: "300大方丝导管", desc: "壁厚：3.5mm,长度：3m", price: 410 },
        { name: "300大方丝导管", desc: "壁厚：3.5mm,长度：0.5m", price: 160 },
        { name: "300大方丝导管", desc: "壁厚：3.5mm,长度：1m", price: 210 },
        { name: "300大方丝导管", desc: "壁厚：3.5mm,长度：1.5m", price: 260 },
        { name: "300大方丝导管", desc: "壁厚：3.5mm,长度：4m", price: 463 },
        { name: "260尖丝导管", desc: "壁厚：3.5mm,长度：3m", price: 341 },
        { name: "260尖丝导管", desc: "壁厚：3.5mm,长度：0.5m", price: 131 },
        { name: "260尖丝导管", desc: "壁厚：3.5mm,长度：1m", price: 173 },
        { name: "260尖丝导管", desc: "壁厚：3.5mm,长度：1.5m", price: 215 },
        { name: "260尖丝导管", desc: "壁厚：3.5mm,长度：4m", price: 388 },
        { name: "260大方丝导管", desc: "壁厚：3.5mm,长度：3m", price: 346 },
        { name: "260大方丝导管", desc: "壁厚：3.5mm,长度：0.5m", price: 136 },
        { name: "260大方丝导管", desc: "壁厚：3.5mm,长度：1m", price: 178 },
        { name: "260大方丝导管", desc: "壁厚：3.5mm,长度：1.5m", price: 220 },
        { name: "260大方丝导管", desc: "壁厚：3.5mm,长度：4m", price: 393 },

        // === 料斗 ===
        { name: "1方料斗", desc: "壁厚：3.5mm", price: 850 },
        { name: "1.5方料斗", desc: "壁厚：3.5mm", price: 1030 },
        { name: "2方料斗", desc: "壁厚：3.5mm", price: 1180 },
        { name: "2.5方料斗", desc: "壁厚：3.5mm", price: 1430 },
        { name: "3方料斗", desc: "壁厚：3.5mm", price: 1800 },

        // === 井口架 ===
        { name: "16槽钢井口架", desc: "长度：2m", price: 560 },
        { name: "16槽钢井口架", desc: "长度：2.5m", price: 640 },
        { name: "16槽钢井口架", desc: "长度：3m", price: 720 },

        // === 接头 ===
        { name: "219接头", desc: "", price: 72 },
        { name: "260接头", desc: "", price: 83 },
        { name: "300接头", desc: "", price: 100 },

        // === 公扣 ===
        { name: "219尖丝公扣", desc: "", price: 26 },
        { name: "260尖丝公扣", desc: "", price: 31 },
        { name: "300尖丝公扣", desc: "", price: 37 },

        // === 母扣 ===
        { name: "219尖丝母扣", desc: "", price: 26 },
        { name: "260尖丝母扣", desc: "", price: 31 },
        { name: "300尖丝母扣", desc: "", price: 37 },

        // === 衬套 ===
        { name: "219衬套", desc: "", price: 20 },
        { name: "260衬套", desc: "", price: 21 },
        { name: "300衬套", desc: "", price: 26 },

        // === 堵头 ===
        { name: "219堵头", desc: "", price: 75 },
        { name: "260堵头", desc: "", price: 75 },
        { name: "300堵头", desc: "", price: 85 },

        // === 清孔器 ===
        { name: "219清孔器", desc: "", price: 110 },
        { name: "260清孔器", desc: "", price: 120 },
        { name: "300清孔器", desc: "", price: 140 },

        // === 其他配件 ===
        { name: "小方斗", desc: "通用", price: 150 },
        { name: "密封圈", desc: "通用", price: 1 },
        { name: "扳手", desc: "加厚", price: 30 },
        { name: "垫叉", desc: "12槽钢", price: 110 },
        { name: "吊耳", desc: "通用", price: 26 },
    ];

    const warehouse = '浙江';
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
