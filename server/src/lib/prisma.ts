import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => new PrismaClient();

type GlobalWithPrisma = typeof globalThis & {
  prisma?: PrismaClient;
};

const globalRef = globalThis as GlobalWithPrisma;

export const prisma = globalRef.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalRef.prisma = prisma;
}

export default prisma;
