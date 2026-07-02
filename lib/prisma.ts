import { PrismaClient } from '@prisma/client'
import path from 'path'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Ensure DATABASE_URL points to the correct SQLite file in any environment
const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
process.env.DATABASE_URL = `file:${dbPath}`

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
