"use server";

import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createBranch(data: {
  name: string;
  address?: string;
  icon?: string;
}): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMINISTRATIVO") {
    return { success: false, error: "Sin permisos" };
  }

  if (!data.name.trim()) return { success: false, error: "El nombre es requerido" };

  try {
    const branch = await prisma.branch.create({
      data: {
        name: data.name.trim(),
        address: data.address?.trim() || null,
        icon: data.icon?.trim() || "store",
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "CREATE",
      module: "establecimientos",
      detail: `Establecimiento creado: ${branch.name}`,
      branchId: branch.id,
    });

    revalidatePath("/establecimientos");
    return { success: true };
  } catch {
    return { success: false, error: "Error al crear el establecimiento" };
  }
}

export async function updateBranch(
  id: string,
  data: { name: string; address?: string; icon?: string }
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMINISTRATIVO")
    return { success: false, error: "Sin permisos" };

  if (!data.name.trim()) return { success: false, error: "El nombre es requerido" };

  try {
    const branch = await prisma.branch.update({
      where: { id },
      data: {
        name: data.name.trim(),
        address: data.address?.trim() || null,
        icon: data.icon?.trim() || "store",
      },
    });
    await logAudit({
      userId: session.user.id,
      action: "UPDATE",
      module: "establecimientos",
      detail: `Establecimiento actualizado: ${branch.name}`,
      branchId: id,
    });
    revalidatePath("/establecimientos");
    return { success: true };
  } catch {
    return { success: false, error: "Error al actualizar" };
  }
}

export async function deleteBranch(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMINISTRATIVO")
    return { success: false, error: "Sin permisos" };

  try {
    const branch = await prisma.branch.findUnique({ where: { id }, include: { _count: { select: { cashClosings: true } } } });
    if (!branch) return { success: false, error: "Sucursal no encontrada" };
    if (branch._count.cashClosings > 0)
      return { success: false, error: `No se puede eliminar: tiene ${branch._count.cashClosings} cierres registrados` };

    await prisma.branch.delete({ where: { id } });
    await logAudit({
      userId: session.user.id,
      action: "DELETE",
      module: "establecimientos",
      detail: `Establecimiento eliminado: ${branch.name}`,
    });
    revalidatePath("/establecimientos");
    return { success: true };
  } catch {
    return { success: false, error: "Error al eliminar" };
  }
}

export async function toggleBranch(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMINISTRATIVO") {
    return { success: false, error: "Sin permisos" };
  }

  try {
    const branch = await prisma.branch.update({
      where: { id },
      data: { isActive },
    });

    await logAudit({
      userId: session.user.id,
      action: "UPDATE",
      module: "establecimientos",
      detail: `Establecimiento ${isActive ? "activado" : "desactivado"}: ${branch.name}`,
      branchId: id,
    });

    revalidatePath("/establecimientos");
    return { success: true };
  } catch {
    return { success: false, error: "Error al actualizar el establecimiento" };
  }
}
