const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'server', 'database.db');

const db = new sqlite3.Database(dbPath);

console.log("开始格式化钻具类截齿产品规格...");

db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    let updateCount = 0;
    // 更新语句准备好
    const stmt = db.prepare("UPDATE products SET description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");

    // 获取所有钻具类产品
    db.all("SELECT id, name, description FROM products WHERE category = '钻具类'", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }

        for (const item of rows) {
            const desc = item.description || '';
            const name = item.name || '';

            // 过滤出截齿相关产品（避开捞沙斗、筒钻、螺旋钻等带复杂多维度规格的钻具）
            const isTeeth = name.includes('截齿') || name.includes('宝石') || name.includes('钻宝') ||
                name.includes('SMS6系') || name.includes('钻金') || name.includes('座') || name.includes('拔齿器') || name.includes('装齿钳') || name.includes('销子');

            if (!isTeeth || !desc) continue;

            let model = '';
            let specStr = '';
            let weightStr = '';
            let extra = [];

            // 解析型号 (例如：型号50-20, 型号CC5522, 60-26等)
            // 处理："型号CC520-9T, 规格:20支/箱, 含箱总重28.45kg"
            // 处理："60-26" 直白型号
            if (desc.includes('型号')) {
                const match = desc.match(/型号:?\s*([a-zA-Z0-9\-\/]*)/) || desc.match(/型号([a-zA-Z0-9\-\/]+)/);
                if (match && match[1]) {
                    model = match[1].trim();
                }
            } else if (!desc.includes(',') && !desc.includes('规格') && !desc.includes('重') && desc.length < 15) {
                // 如果没有逗号，也没有规格/重字眼，且很短，一般就是纯型号 (例: "60-26")
                model = desc.trim();
            } else if (name.includes('截齿') || name.includes('座')) {
                // 如果实在没写型号，可能需要从name等地方提取，但为了安全直接保留
                const parts = desc.split(/[,，]/);
                if (parts[0] && !parts[0].includes('规格') && !parts[0].includes('重')) {
                    model = parts[0].replace('型号', '').trim();
                }
            }

            // 解析规格 (例如：规格:20支/箱)
            if (desc.includes('规格') || desc.includes('箱')) {
                const match = desc.match(/规格:?\s*(\d+支\/箱)/) || desc.match(/(\d+支\/箱)/) || desc.match(/(\d+件套)/);
                if (match && match[1]) {
                    specStr = match[1].trim();
                }
            }

            // 解析重量 (例如：含箱总重21.9kg)
            if (desc.includes('重')) {
                const match = desc.match(/重:?\s*(\d+\.?\d*kg)/) || desc.match(/含箱总重(\d+\.?\d*kg)/) || desc.match(/总重(\d+\.?\d*kg)/);
                if (match && match[1]) {
                    weightStr = match[1].trim();
                }
            }

            // 保留额外信息 (例如：适配截齿齿座)
            if (desc.includes('适配')) {
                const match = desc.match(/适配([a-zA-Z0-9\-\u4e00-\u9fa5]+)/);
                if (match && match[0]) {
                    extra.push(match[0].trim());
                }
            }

            // 对于纯配件（拔齿器、装齿钳等），如果描述和名称一样，忽略处理型号
            if ((name.includes('器') || name.includes('钳') || name.includes('销子')) && desc === name) {
                model = desc;
            }

            // 构建新的 description, 如果没有任何提取到有用的，就不变
            if (model || specStr || weightStr) {
                const parts = [];
                if (model) parts.push(`型号：${model}`);
                if (specStr) parts.push(`规格：${specStr}`);
                if (weightStr) parts.push(`总重：${weightStr}`);

                extra.forEach(e => parts.push(e));

                const newDesc = parts.join(' | ');

                if (newDesc && newDesc !== desc && newDesc !== '型号：') {
                    console.log(`[ID:${item.id}] ${desc}\n -> ${newDesc}\n`);
                    stmt.run(newDesc, item.id);
                    updateCount++;
                }
            }
        }

        stmt.finalize();
        db.run("COMMIT", () => {
            console.log(`更新结束！总计格式化了 ${updateCount} 条截齿产品规格。`);
            db.close();

            const { exec } = require('child_process');
            exec('kill -9 $(lsof -t -i:3001) && cd server && node server.js &', (err) => {
                if (!err) console.log("后端服务已重启。");
            });
        });
    });
});
