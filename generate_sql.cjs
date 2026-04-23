const fs = require('fs');
const data = JSON.parse(fs.readFileSync('api/simulation_data.json', 'utf8'));
let sql = '';
data.users.forEach(u => {
    sql += `INSERT IGNORE INTO users (id, name, short_code, is_active, created_at) VALUES (${u.id}, '${u.name}', '${u.short_code}', ${u.is_active ? 1 : 0}, '${u.created_at}');\n`;
});
data.box_colors.forEach(c => {
    sql += `INSERT IGNORE INTO box_colors (id, name, hex, short_code, is_active, created_at) VALUES (${c.id}, '${c.name}', '${c.hex}', '${c.short_code}', ${c.is_active ? 1 : 0}, '${c.created_at}');\n`;
});
data.transactions.forEach((tx) => {
    sql += `INSERT IGNORE INTO transactions (id, user_code, user_name, color_code, color_name, quantity, type, created_at) VALUES (${tx.id}, '${tx.user_code}', '${tx.user_name}', '${tx.color_code}', '${tx.color_name}', ${tx.quantity}, '${tx.type}', '${tx.created_at}');\n`;
});
fs.writeFileSync('hostinger_dummy_data.sql', sql);
