const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'server', 'database.db');

const db = new sqlite3.Database(dbPath);

const baseWeights = {
    '219': {
        '2.75': 55.1,
        '3.25': 62.1,
        '3.5': 64.8
    },
    '260': {
        '2.8': 61.1,
        '3.25': 72.3,
        '3.5': 74,
        '3.75': 81,
        '4': 85.5
    },
    '300': {
        '3': 77.95,
        '3.5': 88.6,
        '3.75': 95.9,
        '4': 100,
        '4.5': 110
    }
};

const lengths = [0.5, 1, 1.5, 3, 4];

db.all("SELECT id, name, description FROM products WHERE category = '导管类'", (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }

    console.log(`找到 ${rows.length} 根导管...`);

    let updateCount = 0;

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        const stmt = db.prepare("UPDATE products SET description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");

        for (const product of rows) {
            let newDesc = product.description || '';

            const pipeMatch = product.name.match(/(300|260|219)导管/);
            if (!pipeMatch) continue;
            const pipeType = pipeMatch[1];

            const lengthMatch = product.name.match(/·\s*(\d+\.?\d*)m/);
            if (!lengthMatch) continue;
            const length = parseFloat(lengthMatch[1]);

            if (!lengths.includes(length)) continue;

            const thickMatch = product.description && product.description.match(/壁厚(\d+\.?\d*)mm/);
            if (!thickMatch) continue;
            const thickness = thickMatch[1];

            const baseWeightInfo = baseWeights[pipeType];
            if (!baseWeightInfo) continue;
            const baseWeight = baseWeightInfo[thickness];
            if (!baseWeight) continue;

            const weightPerMeter = baseWeight / 3;
            const targetWeight = (weightPerMeter * length).toFixed(2);

            if (newDesc.includes('重量')) {
                newDesc = newDesc.replace(/，?重量.*?kg/, `，重量${targetWeight}kg`);
            } else {
                newDesc = `${newDesc}，重量${targetWeight}kg`;
            }

            if (newDesc !== product.description) {
                stmt.run(newDesc, product.id);
                updateCount++;
                console.log(`[ID:${product.id}] ${product.name} -> ${newDesc}`);
            }
        }

        stmt.finalize();
        db.run("COMMIT", () => {
            console.log(`更新完成！总计更新 ${updateCount} 条。`);
            db.close();
        });
    });
});
