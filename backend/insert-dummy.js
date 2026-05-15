const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

async function seed() {
  const dbPath = path.join(__dirname, 'data', 'atv.db');
  console.log('Connecting to:', dbPath);
  const db = new Database(dbPath);
  
  const email = 'test@example.com';
  const password = 'password123';
  const name = 'Utente Test';

  const hash = await bcrypt.hash(password, 10);
  
  try {
    const stmt = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
    const info = stmt.run(name, email, hash);
    console.log(`Success! Inserted user with ID ${info.lastInsertRowid}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      console.log('User test@example.com already exists. Updating password to password123...');
      const updateStmt = db.prepare('UPDATE users SET password_hash = ? WHERE email = ?');
      updateStmt.run(hash, email);
      console.log('Password updated successfully.');
    } else {
      console.error('Error:', err.message);
    }
  }
}

seed();
