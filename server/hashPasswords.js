import 'dotenv/config';
import bcrypt from 'bcryptjs';
// Import db.js to ensure schema + seed runs first
import db from './db.js';

const users = db.prepare('SELECT id, username, password FROM users').all();
let hashed = 0;

for (const user of users) {
  // Skip already-hashed passwords (bcrypt hashes start with $2a$ or $2b$)
  if (user.password.startsWith('$2')) {
    console.log(`  ⏭  ${user.username} — already hashed, skipping`);
    continue;
  }
  const hash = await bcrypt.hash(user.password, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, user.id);
  console.log(`  ✅ ${user.username} — password hashed`);
  hashed++;
}

console.log(`\nDone. ${hashed} password(s) hashed.`);
db.close();
