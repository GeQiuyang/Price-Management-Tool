import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'server', 'database.db');

async function run() {
    const SQL = await initSqlJs();
    const fileBuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(fileBuffer);

    const stmt = db.prepare("SELECT id, name, category, description FROM products WHERE category = '导管类'");
    const products = [];
    while (stmt.step()) {
        products.push(stmt.getAsObject());
    }
    stmt.free();

    function search(query) {
        let keyword = query.trim().replace(/-/g, '');
        const pipeSegments = keyword.toLowerCase().match(/[\u4e00-\u9fff]+|[a-z0-9.]+/gi) || [keyword.toLowerCase()];

        return products.filter(p => {
            const excludeWords = ['钻宝', 'SMS6系', '钻金'];
            for (const word of excludeWords) {
                if (p.name.includes(word) && !keyword.includes(word)) return false;
            }

            const searchableText = `${p.name} ${p.description || ''}`.toLowerCase();
            return pipeSegments.every(seg => searchableText.includes(seg));
        });
    }

    const testCases = [
        "219 方丝",
        "219 4m",
        "219 方丝 4m",
        "300",
        "3m",
        "260 尖丝 1.5",
        "料斗",
        "料斗 0.5",
        "公扣",
        "3.5mm",
        "4"
    ];

    for (const tc of testCases) {
        const results = search(tc);
        console.log(`\n=== 搜索: "${tc}" (匹配 ${results.length} 个) ===`);
        // Just print first 5 matches to avoid spam
        results.slice(0, 5).forEach(r => {
            console.log(`- ${r.name} | ${r.description || ''}`);
        });
        if (results.length > 5) {
            console.log(`... 及更多 ${results.length - 5} 个`);
        }
    }
}

run().catch(console.error);
