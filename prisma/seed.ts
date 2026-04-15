import { PrismaClient } from "@prisma/client";

type Role = "ADMINISTRATIVO" | "EMPLEADO" | "CONTADOR" | "OTRO_ADMINISTRATIVO";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PERMISSIONS = [
  // Dashboard
  { code: "dashboard:view", module: "dashboard", action: "view", description: "Ver dashboard" },
  // Cierres
  { code: "cierres:view", module: "cierres", action: "view", description: "Ver cierres" },
  { code: "cierres:create", module: "cierres", action: "create", description: "Crear cierres" },
  { code: "cierres:edit", module: "cierres", action: "edit", description: "Editar cierres" },
  { code: "cierres:delete", module: "cierres", action: "delete", description: "Eliminar cierres" },
  { code: "cierres:export", module: "cierres", action: "export", description: "Exportar cierres" },
  // Conciliaciones
  { code: "conciliaciones:view", module: "conciliaciones", action: "view", description: "Ver conciliaciones" },
  { code: "conciliaciones:create", module: "conciliaciones", action: "create", description: "Crear conciliaciones" },
  { code: "conciliaciones:export", module: "conciliaciones", action: "export", description: "Exportar conciliaciones" },
  // Auditoría
  { code: "auditoria:view", module: "auditoria", action: "view", description: "Ver auditoría" },
  // Perfiles
  { code: "perfiles:view", module: "perfiles", action: "view", description: "Ver perfiles" },
  { code: "perfiles:create", module: "perfiles", action: "create", description: "Crear perfiles" },
  { code: "perfiles:edit", module: "perfiles", action: "edit", description: "Editar perfiles" },
  // Establecimientos
  { code: "establecimientos:view", module: "establecimientos", action: "view", description: "Ver establecimientos" },
  { code: "establecimientos:create", module: "establecimientos", action: "create", description: "Crear establecimientos" },
  { code: "establecimientos:edit", module: "establecimientos", action: "edit", description: "Editar establecimientos" },
];

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  ADMINISTRATIVO: PERMISSIONS.map((p) => p.code),
  EMPLEADO: ["dashboard:view", "cierres:view", "cierres:create", "establecimientos:view"],
  CONTADOR: [
    "dashboard:view", "cierres:view", "cierres:export",
    "conciliaciones:view", "conciliaciones:create", "conciliaciones:export",
    "auditoria:view", "establecimientos:view",
  ],
  OTRO_ADMINISTRATIVO: [
    "dashboard:view", "cierres:view", "cierres:create",
    "conciliaciones:view", "establecimientos:view",
  ],
};

async function main() {
  console.log("🌱 Iniciando seed...");

  // ── Permisos ────────────────────────────────────────────────────
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
  }
  console.log(`✅ ${PERMISSIONS.length} permisos creados`);

  // ── Permisos por rol ────────────────────────────────────────────
  for (const [role, codes] of Object.entries(ROLE_PERMISSIONS)) {
    for (const code of codes) {
      const permission = await prisma.permission.findUnique({ where: { code } });
      if (!permission) continue;
      await prisma.rolePermission.upsert({
        where: { role_permissionId: { role: role as Role, permissionId: permission.id } },
        update: {},
        create: { role: role as Role, permissionId: permission.id },
      });
    }
  }
  console.log("✅ Permisos por rol asignados");

  // ── Sucursales ──────────────────────────────────────────────────
  const branchSur = await prisma.branch.upsert({
    where: { id: "branch-sur" },
    update: {},
    create: {
      id: "branch-sur",
      name: "Sur — El Calzado",
      address: "Av. Teniente Hugo Ortiz S11-245 y Rosa Yeira, junto a la estación de bomberos",
      icon: "location_city",
      isActive: true,
    },
  });

  const branchValle = await prisma.branch.upsert({
    where: { id: "branch-valle" },
    update: {},
    create: {
      id: "branch-valle",
      name: "Valle de los Chillos — Capelo",
      address: "Av. Mariana de Jesús y de los Romeros",
      icon: "location_on",
      isActive: true,
    },
  });
  console.log("✅ Sucursales creadas: Sur, Valle");

  // ── Usuario administrador ───────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash("Admin2024!", 12);
  await prisma.user.upsert({
    where: { email: "hugomauricio79@gmail.com" },
    update: {},
    create: {
      id: "user-hugo",
      name: "Hugo Mauricio Vallejo",
      email: "hugomauricio79@gmail.com",
      passwordHash: adminPasswordHash,
      role: "ADMINISTRATIVO",
      isActive: true,
      branchId: branchSur.id,
    },
  });
  console.log("✅ Admin creado: hugomauricio79@gmail.com / Admin2024!");

  // ── Usuario empleado de prueba ──────────────────────────────────
  const empPasswordHash = await bcrypt.hash("Empleado123!", 12);
  await prisma.user.upsert({
    where: { email: "empleado@traumatologiabarrionuevo.com" },
    update: {},
    create: {
      name: "Maricela Guamani",
      email: "empleado@traumatologiabarrionuevo.com",
      passwordHash: empPasswordHash,
      role: "EMPLEADO",
      isActive: true,
      branchId: branchSur.id,
    },
  });
  console.log("✅ Empleado de prueba creado");

  console.log("🎉 Seed completado exitosamente");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
