import { PrismaClient } from '@prisma/client'
import { mockDb } from './mock-db'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Use mock database for local development
const useMockDb = process.env.USE_MOCK_DB === '1'

const prismaClient = globalForPrisma.prisma ?? new PrismaClient()

export const prisma: PrismaClient = (useMockDb ? (mockDb as unknown) : prismaClient) as PrismaClient

if (process.env.NODE_ENV !== 'production' && !useMockDb) {
  globalForPrisma.prisma = prismaClient
}
