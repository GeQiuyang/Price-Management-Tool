const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'server', 'database.db');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run("BEGIN TRANSACTION");
  
  let updateCount = 0;
  const stmt = db.prepare("UPDATE products SET description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");

  db.all("SELECT id, name, description FROM products WHERE category = '钻具类'", (err, rows) => {
    if (err) throw err;
    
    for (const item of rows) {
      const desc = item.description || '';
      
      // 我们只处理包含"型号"、"规格"、"重"的条目，或者像"60-26"这种直接是型号的条目
      // 如果没有描述，直接跳过
      if (!desc) continue;
      
      let newDesc = desc;
      
      // 处理现有格式例如: 型号43AS, 规格:10支/箱, 含箱总重18.1kg
      // 或者: 60-26 (如果是纯型号)
      
      let model = '';
      let specStr = '';
      let weightStr = '';
      
      // 提取型号
      const modelMatch = desc.match(/型号:?\s*([a-zA-Z0-9\-\/]*)/) || desc.match(/型号([a-zA-Z0-9\-\/]+)/);
      if (modelMatch) {
         model = modelMatch[1];
      } else if (/^[a-zA-Z0-9\-\/]+$/.test(desc.trim())) {
         // 把直接的一串字符当做型号
         model = desc.trim();
      }
      
      // 提取规格
      const specMatch = desc.match(/规格:?\s*(\d+支\/箱)/) || desc.match(/(\d+支\/箱)/);
      if (specMatch) {
         specStr = specMatch[1];
      }
      
      // 提取重量
      const weightMatch = desc.match(/重:?\s*(\d+\.?\d*kg)/) || desc.match(/含箱总重(\d+\.?\d*kg)/);
      if (weightMatch) {
         weightStr = weightMatch[1];
      }
      
      // 对于捞沙斗/筒钻等钻具，不去动它们复杂的参数组合，这里只针对看起来像截齿/齿座的
      // 判断条件：如果有上面提取到的 specStr 或者 weightStr，或者是纯型号，或者是包含NT/AS等
      // 或者干脆直接匹配用户的 "型号43AS, 规格:10支/箱, 含箱总重18.1kg" 格式
      
      if ((desc.includes('箱') || desc.includes('支/') || desc.includes('重') || desc.includes('型号')) && 
          !desc.includes('筒高') && !desc.includes('顶板')) {
          
          let parts = [];
          if (model) parts.push(`型号：${model}`);
          if (specStr) parts.push(`规格：${specStr}`);
          if (weightStr) parts.push(`总重：${weightStr}`);
          
          // 若有其他无法解析但原本有价值的信息（比如“适配宝峨齿齿座”），保留？
          // 为了严谨并符合用户的示例: "型号：43AS | 规格：10支/箱 | 总重：18.1kg"
          // 取保parts非空
          if (parts.length > 0) {
              newDesc = parts.join(' | ');
              
              // 加上原有的其他特殊说明，如果有的话
              const otherMatch = desc.match(/,(适配.+)/);
              if (otherMatch) {
                 newDesc += ` | ${otherMatch[1]}`;
              }
          }
      }
      
      if (newDesc !== desc) {
         console.log(`[${item.id}] ${desc} -> ${newDesc}`);
         stmt.run(newDesc, item.id);
         updateCount++;
      }
    }
    
    stmt.finalize();
    db.run("COMMIT", () => {
      console.log(`\n更新完成！总计更新 ${updateCount} 条记录。`);
      db.close();
      
      // 触发重启
      const { exec } = require('child_process');
      exec('kill -9 $(lsof -t -i:3001) && cd server && node server.js &', (error) => {
         if (error) console.error("重启失败：", error);
         else console.log("后端服务已重启。");
      });
    });
  });
});
