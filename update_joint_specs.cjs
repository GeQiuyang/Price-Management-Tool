const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'server', 'database.db');

const db = new sqlite3.Database(dbPath);

const jointData = [
    { "产品名称": "219接头", "产品规格": "公扣外径", "数值": 242 },
    { "产品名称": "219接头", "产品规格": "母扣外径", "数值": 261 },
    { "产品名称": "219接头", "产品规格": "衬套外径", "数值": 219 },
    { "产品名称": "260接头", "产品规格": "公扣外径", "数值": 287 },
    { "产品名称": "260接头", "产品规格": "母扣外径", "数值": 304 },
    { "产品名称": "260接头", "产品规格": "衬套外径", "数值": 260 },
    { "产品名称": "300接头", "产品规格": "公扣外径", "数值": 324 },
    { "产品名称": "300接头", "产品规格": "母扣外径", "数值": 343 },
    { "产品名称": "300接头", "产品规格": "衬套外径", "数值": 298 }
];

db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    const stmt = db.prepare("UPDATE products SET description = ?, updated_at = CURRENT_TIMESTAMP WHERE category = '导管类' AND name LIKE ?");

    for (const item of jointData) {
        // 提取管型(219/260/300)和接头类型(公扣/母扣/衬套)
        const pipeType = item.产品名称.replace('接头', '');
        const jointType = item.产品规格.replace('外径', '');
        const newDesc = `${item.产品规格}${item.数值}mm`;

        // 构造模糊匹配模式，匹配包含指定管型和接头类型的产品，且不论尖丝还是方丝
        // 例如："%219%公扣%"
        const namePattern = `%${pipeType}%${jointType}%`;

        stmt.run([newDesc, namePattern], function (err) {
            if (err) {
                console.error('更新失败:', err);
            } else {
                console.log(`更新了 ${this.changes} 条记录: name匹配 ${namePattern} -> description='${newDesc}'`);
            }
        });
    }

    stmt.finalize();
    db.run("COMMIT", () => {
        console.log(`\n更新事务提交完成。`);
        db.close();
    });
});
