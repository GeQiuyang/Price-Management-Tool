import initSqlJs from 'sql.js';
import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'database.db');

async function updateSchema() {
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  // 1. Create quote_lists table
  db.run(`
    CREATE TABLE IF NOT EXISTS quote_lists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create default quote if not exists
  const quotes = db.exec('SELECT id FROM quote_lists LIMIT 1');
  let defaultQuoteId = 'default-quote';
  if (quotes.length === 0) {
    db.run('INSERT INTO quote_lists (id, name) VALUES (?, ?)', [defaultQuoteId, '报价单 1']);
  } else {
    defaultQuoteId = quotes[0].values[0][0];
  }

  // 2. Add quote_list_id to quote_items
  try {
    db.run('ALTER TABLE quote_items ADD COLUMN quote_list_id TEXT');
    // Update existing records to use the default quote list
    db.run('UPDATE quote_items SET quote_list_id = ? WHERE quote_list_id IS NULL', [defaultQuoteId]);
  } catch (e) {
    console.log('Column quote_list_id already exists in quote_items or error:', e.message);
  }

  // 3. Add quote_list_id to quote_imported_data
  try {
    db.run('ALTER TABLE quote_imported_data ADD COLUMN quote_list_id TEXT');
     // Update existing records to use the default quote list
     db.run('UPDATE quote_imported_data SET quote_list_id = ? WHERE quote_list_id IS NULL', [defaultQuoteId]);
  } catch (e) {
    console.log('Column quote_list_id already exists in quote_imported_data or error:', e.message);
  }

  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  console.log('Schema updated successfully!');
}

updateSchema();
