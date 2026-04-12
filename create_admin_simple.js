const bcryptjs = require('bcryptjs');

async function createAdmin() {
  const password = 'admn123';
  const hashedPassword = await bcryptjs.hash(password, 12);
  console.log('Hashed password:', hashedPassword);
  
  const now = new Date().toISOString();
  console.log(`INSERT INTO users (id, username, email, password_hash, student_id, role, created_at, updated_at) VALUES ('admin_001', 'admn', 'admin@club.com', '${hashedPassword}', 'ADMIN001', 'ADMIN', '${now}', '${now}');`);
}

createAdmin().catch(console.error);
