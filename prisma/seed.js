"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    // Create a demo barista
    const passwordHash = await bcryptjs_1.default.hash('password123', 10);
    await prisma.user.upsert({
        where: { email: 'barista@example.com' },
        update: {},
        create: {
            email: 'barista@example.com',
            passwordHash,
            name: 'Demo Barista',
            role: 'BARISTA',
            handle: 'demo-barista'
        }
    });
    // Create an admin user
    await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            passwordHash: await bcryptjs_1.default.hash('adminpassword123', 10),
            name: 'Admin',
            role: 'ADMIN',
            handle: 'admin'
        }
    });
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
