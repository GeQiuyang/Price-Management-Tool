import fs from 'fs';
import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WAREHOUSE_INFOS = {
    '广州': '广州仓库工作时间:8:30AM-11.30AM,1:00PM-6:00PM((特殊情况提前沟通)需要开顶的车,仓库负责人:陈金峰17352688572',
    '武汉': '武汉仓库工作时间:8:00AM-6:00PM(特殊情况提前沟通),周日正常发货,仓库负责人杨:17786446669',
    '长沙&邵阳': '邵阳仓库工作时间:9:00AM-5:00PM(特殊情况提前沟通)周日正常发货;仓库负责人:毛15873756361 | 长沙仓库工作时间:8:00AM-12:00PM,2:00PM-7:00PM(特殊情况提前沟通),周日正常发货;仓库负责人:曾19174945158'
};

async function migrateWarehouseInfos() {
    const SQL = await initSqlJs();
    const dbPath = join(__dirname, 'database.db');

    if (!fs.existsSync(dbPath)) {
        console.error('Database not found at:', dbPath);
        return;
    }

    const fileBuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(fileBuffer);

    for (const [name, info] of Object.entries(WAREHOUSE_INFOS)) {
        const key = `warehouse_info_${name}`;
        const exists = db.exec('SELECT id FROM system_settings WHERE key = ?', [key]);
        if (exists.length > 0 && exists[0].values.length > 0) {
            db.run('UPDATE system_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?', [info, key]);
        } else {
            db.run('INSERT INTO system_settings (key, value) VALUES (?, ?)', [key, info]);
        }
    }

    const exportData = db.export();
    const buffer = Buffer.from(exportData);
    fs.writeFileSync(dbPath, buffer);
    console.log('Successfully migrated warehouse infos to system_settings');
}

migrateWarehouseInfos().catch(console.error);
