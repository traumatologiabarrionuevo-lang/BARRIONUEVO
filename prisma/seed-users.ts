import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const USERS = [
  { name: "Maricela Guamani",    email: "maricela@traumatologiabarrionuevo.com", role: "EMPLEADO",   branchId: "branch-sur"   },
  { name: "Gabriela Espin",      email: "gabriela@traumatologiabarrionuevo.com", role: "EMPLEADO",   branchId: "branch-sur"   },
  { name: "Jessenia Rodriguez",  email: "jessenia@traumatologiabarrionuevo.com", role: "EMPLEADO",   branchId: "branch-sur"   },
  { name: "Anahi Sarzosa",       email: "anahi@traumatologiabarrionuevo.com",    role: "EMPLEADO",   branchId: "branch-valle" },
  { name: "Kevin Vallejo",       email: "kevin@traumatologiabarrionuevo.com",    role: "EMPLEADO",   branchId: "branch-sur"   },
  { name: "Victor Santos",       email: "victor@traumatologiabarrionuevo.com",   role: "CONTADOR",   branchId: "branch-sur"   },
];

const DEFAULT_PASSWORD = "Barrionuevo2024!";

async function main() {
  console.log("👥 Creando usuarios...");
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  for (const user of USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        name:         user.name,
        email:        user.email,
        passwordHash: hash,
        role:         user.role as any,
        isActive:     true,
        branchId:     user.branchId,
      },
    });
    console.log(`✅ ${user.name} — ${user.email}`);
  }

  console.log(`\n🎉 Usuarios creados. Contraseña inicial: ${DEFAULT_PASSWORD}`);
  console.log("⚠️  Pídeles que la cambien al primer ingreso.");
}

main()
  .catch((e) => { console.error("❌ Error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
