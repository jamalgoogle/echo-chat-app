import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export default prisma;

// Fields safe to show to other users (never include email or password).
export const userSelect = { id: true, username: true, avatar: true };
