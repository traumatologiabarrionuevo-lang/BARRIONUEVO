import { prisma } from "@/lib/prisma";

type Role = "ADMINISTRATIVO" | "EMPLEADO" | "CONTADOR" | "OTRO_ADMINISTRATIVO";

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  ADMINISTRATIVO: [
    "dashboard:view", "cierres:view", "cierres:create", "cierres:edit",
    "cierres:delete", "cierres:export", "conciliaciones:view",
    "conciliaciones:create", "conciliaciones:export", "auditoria:view",
    "perfiles:view", "perfiles:create", "perfiles:edit",
    "establecimientos:view", "establecimientos:create", "establecimientos:edit",
  ],
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

export async function hasPermission(
  userId: string,
  permissionCode: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      userPermissions: {
        where: { permission: { code: permissionCode } },
        select: { granted: true },
      },
    },
  });

  if (!user) return false;

  // Comprueba override individual
  if (user.userPermissions.length > 0) {
    return user.userPermissions[0].granted;
  }

  // Fallback a permisos del rol
  return ROLE_PERMISSIONS[user.role as Role]?.includes(permissionCode) ?? false;
}

export function getRolePermissions(role: Role): string[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
