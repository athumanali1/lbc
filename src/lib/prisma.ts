import { PrismaClient } from '@prisma/client'
import { mockDb } from './mock-db'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Use mock database for local development
const useMockDb = process.env.NODE_ENV === 'development' || !process.env.DATABASE_URL?.includes('postgresql')

export const prisma = useMockDb ? mockDb : (globalForPrisma.prisma ?? new PrismaClient())

if (process.env.NODE_ENV !== 'production' && !useMockDb) {
  globalForPrisma.prisma = prisma as PrismaClient
}
