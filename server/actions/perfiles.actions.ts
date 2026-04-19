"use server";

import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { ROLE_MODULE_ACCESS, type Role } from "@/lib/module-access";

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: Role;
  branchId?: string;
}): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMINISTRATIVO") {
    return { success: false, error: "Sin permisos" };
  }

  if (!data.name || !data.email || !data.password) {
    return { success: false, error: "Todos los campos son requeridos" };
  }

  if (data.password.length < 6) {
    return { success: false, error: "La contraseña debe tener al menos 6 caracteres" };
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return { success: false, error: "Ya existe un usuario con ese correo" };

  const passwordHash = await bcrypt.hash(data.password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
        branchId: data.branchId || null,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "CREATE",
      module: "perfiles",
      detail: `Usuario creado: ${user.name} (${user.email}) — Rol: ${user.role}`,
    });

    revalidatePath("/perfiles");
    return { success: true };
  } catch {
    return { success: false, error: "Error al crear el usuario" };
  }
}

export async function updateUser(
  id: string,
  data: {
    name: string;
    email: string;
    password?: string;
    role: Role;
    branchId?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMINISTRATIVO")
    return { success: false, error: "Sin permisos" };

  if (!data.name || !data.email)
    return { success: false, error: "Nombre y correo son requeridos" };

  if (data.password && data.password.length < 6)
    return { success: false, error: "La contraseña debe tener al menos 6 caracteres" };

  const existing = await prisma.user.findFirst({
    where: { email: data.email, NOT: { id } },
  });
  if (existing) return { success: false, error: "Ya existe un usuario con ese correo" };

  try {
    const updateData: Record<string, unknown> = {
      name: data.name,
      email: data.email,
      role: data.role,
      branchId: data.branchId || null,
    };
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 12);
    }

    const user = await prisma.user.update({ where: { id }, data: updateData });

    await logAudit({
      userId: session.user.id,
      action: "UPDATE",
      module: "perfiles",
      detail: `Usuario actualizado: ${user.name} (${user.email}) — Rol: ${user.role}`,
    });

    revalidatePath("/perfiles");
    return { success: true };
  } catch {
    return { success: false, error: "Error al actualizar el usuario" };
  }
}

export async function deleteUser(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMINISTRATIVO") {
    return { success: false, error: "Sin permisos" };
  }

  if (id === session.user.id) {
    return { success: false, error: "No puedes eliminar tu propia cuenta" };
  }

  try {
    const user = await prisma.user.delete({ where: { id } });

    await logAudit({
      userId: session.user.id,
      action: "DELETE",
      module: "perfiles",
      detail: `Usuario eliminado: ${user.name} (${user.email})`,
    });

    revalidatePath("/perfiles");
    return { success: true };
  } catch {
    return { success: false, error: "Error al eliminar el usuario" };
  }
}

export async function setUserModuleAccess(
  userId: string,
  moduleKey: string,
  granted: boolean
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMINISTRATIVO") {
    return { success: false, error: "Sin permisos" };
  }
  if (userId === session.user.id) {
    return { success: false, error: "No puedes modificar tu propio acceso a módulos" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, name: true },
  });
  if (!user) return { success: false, error: "Usuario no encontrado" };

  const permCode = `${moduleKey}:view`;

  const permission = await prisma.permission.upsert({
    where: { code: permCode },
    update: {},
    create: { code: permCode, module: moduleKey, action: "view" },
  });

  const roleDefault = ROLE_MODULE_ACCESS[user.role as Role]?.includes(moduleKey) ?? false;

  if (granted === roleDefault) {
    // Matches role default — remove override to keep DB clean
    await prisma.userPermission.deleteMany({
      where: { userId, permissionId: permission.id },
    });
  } else {
    await prisma.userPermission.upsert({
      where: { userId_permissionId: { userId, permissionId: permission.id } },
      update: { granted },
      create: { userId, permissionId: permission.id, granted },
    });
  }

  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    module: "perfiles",
    detail: `Módulo "${moduleKey}" ${granted ? "activado" : "desactivado"} para usuario: ${user.name}`,
  });

  revalidatePath("/perfiles");
  return { success: true };
}

export async function toggleUser(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMINISTRATIVO") {
    return { success: false, error: "Sin permisos" };
  }

  if (id === session.user.id) {
    return { success: false, error: "No puedes desactivar tu propia cuenta" };
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
    });

    await logAudit({
      userId: session.user.id,
      action: "UPDATE",
      module: "perfiles",
      detail: `Usuario ${isActive ? "activado" : "desactivado"}: ${user.name}`,
    });

    revalidatePath("/perfiles");
    return { success: true };
  } catch {
    return { success: false, error: "Error al actualizar el usuario" };
  }
}
