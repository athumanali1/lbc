// Mock database for local development when PostgreSQL is not available

export interface User {
  id: string
  username: string
  email: string
  passwordHash: string
  studentId: string
  role: string
  qrCodeData?: string
  avatarUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface Session {
  id: string
  userId: string
  token: string
  expiresAt: Date
}

const users: User[] = [
  {
    id: 'admin_001',
    username: 'admin',
    email: 'admin@club.com',
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5GS', // 'admin123'
    studentId: 'ADMIN001',
    role: 'ADMIN',
    qrCodeData: 'admin_qr_data_123',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'user_001',
    username: 'john',
    email: 'john@student.com',
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5GS', // 'admin123'
    studentId: 'STU001',
    role: 'MEMBER',
    qrCodeData: 'user_qr_data_456',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
]

const sessions: Session[] = []

export const mockDb = {
  user: {
    findUnique: async ({ where }: { where: { id?: string; username?: string; email?: string; studentId?: string } }) => {
      if (where.id) return users.find(u => u.id === where.id) || null
      if (where.username) return users.find(u => u.username === where.username) || null
      if (where.email) return users.find(u => u.email === where.email) || null
      if (where.studentId) return users.find(u => u.studentId === where.studentId) || null
      return null
    },
    findMany: async () => users,
    create: async ({ data }: { data: Partial<User> }) => {
      const newUser: User = {
        id: `user_${Date.now()}`,
        username: data.username!,
        email: data.email!,
        passwordHash: data.passwordHash!,
        studentId: data.studentId!,
        role: data.role || 'MEMBER',
        qrCodeData: data.qrCodeData,
        avatarUrl: data.avatarUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      users.push(newUser)
      return newUser
    },
    update: async ({ where, data }: { where: { id: string }, data: Partial<User> }) => {
      const index = users.findIndex(u => u.id === where.id)
      if (index === -1) throw new Error('User not found')
      users[index] = { ...users[index], ...data, updatedAt: new Date() }
      return users[index]
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const index = users.findIndex((u) => u.id === where.id)
      if (index === -1) throw new Error('User not found')
      const [deleted] = users.splice(index, 1)
      return deleted
    },
  },
  session: {
    findUnique: async ({ where }: { where: { token?: string } }) => {
      if (where.token) return sessions.find(s => s.token === where.token) || null
      return null
    },
    create: async ({ data }: { data: Partial<Session> }) => {
      const newSession: Session = {
        id: `session_${Date.now()}`,
        userId: data.userId!,
        token: data.token!,
        expiresAt: data.expiresAt!,
      }
      sessions.push(newSession)
      return newSession
    },
    deleteMany: async () => {
      sessions.length = 0
      return { count: sessions.length }
    },
  },
  // Chat models
  chatRoom: {
    findMany: async () => [],
    findUnique: async ({ where }: { where: { id?: string } }) => where.id ? null : null,
    create: async ({ data }: any) => ({ id: `room_${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() }),
    update: async ({ where, data }: any) => ({ id: where.id, ...data, updatedAt: new Date() }),
    delete: async ({ where }: any) => ({ id: where.id }),
  },
  chatMessage: {
    findMany: async ({ where }: any) => [],
    findUnique: async ({ where }: any) => where.id ? null : null,
    create: async ({ data }: any) => ({ id: `msg_${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() }),
    delete: async ({ where }: any) => ({ id: where.id }),
  },
  chatRoomMember: {
    findUnique: async ({ where }: any) => where.roomId_userId ? null : null,
    findMany: async () => [],
    create: async ({ data }: any) => ({ id: `member_${Date.now()}`, ...data }),
    delete: async ({ where }: any) => ({ id: where.id }),
  },
  folder: {
    findMany: async () => [],
    create: async () => null as any,
  },
  file: {
    findMany: async () => [],
    create: async () => null as any,
  },
}
