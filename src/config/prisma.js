const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

module.exports = prisma;

console.log('[Prisma] PrismaClient initialized');
