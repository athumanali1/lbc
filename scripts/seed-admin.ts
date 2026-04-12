import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function createAdmin() {
  const { username, email, password, studentId } = {
    username: 'admin',
    email: 'admin@clubportal.local',
    password: 'admin123', // Change this after first login!
    studentId: 'ADMIN001',
  }

  // Check if admin already exists
  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }, { studentId }] },
  })
  if (existing) {
    console.log('⚠️ Admin user already exists.')
    return
  }

  const passwordHash = await hashPassword(password)

  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      studentId,
      role: 'ADMIN',
    },
  })

  console.log('✅ Admin user created:', user.username)
  console.log('🔑 Login with:', username, 'and password:', password)
  console.log('📧 Email:', email)
  console.log('🆔 Student ID:', studentId)
  console.log('⚠️ Change the password after first login!')
}

createAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
