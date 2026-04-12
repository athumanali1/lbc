const bcrypt = require('bcrypt');

async function createAdmin() {
  const password = 'admn123';
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('Hashed password:', hashedPassword);
  
  const now = new Date().toISOString();
  const adminUser = {
    id: 'admin_001',
    username: 'admn',
    email: 'admin@club.com', 
    password_hash: hashedPassword,
    student_id: 'ADMIN001',
    role: 'ADMIN',
    created_at: now,
    updated_at: now
  };
  
  console.log('SQL to insert admin user:');
  console.log(`INSERT INTO users (id, username, email, password_hash, student_id, role, created_at, updated_at) VALUES ('${adminUser.id}', '${adminUser.username}', '${adminUser.email}', '${adminUser.password_hash}', '${adminUser.student_id}', '${adminUser.role}', '${adminUser.created_at}', '${adminUser.updated_at}');`);
}

createAdmin().catch(console.error);
