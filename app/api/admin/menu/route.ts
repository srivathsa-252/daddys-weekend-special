import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitize } from "@/lib/sanitize";
import { menuItemSchema } from "@/utils/validators";
import { cloudinary } from "@/lib/cloudinary";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.menuItem.findMany({ orderBy: { displayOrder: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const activeCount = await prisma.menuItem.count({ where: { isAvailable: true } });
  if (activeCount >= 10) {
    return NextResponse.json(
      {
        error:
          "Menu limit reached. You can have a maximum of 10 active menu items. Please disable or delete an existing item before adding a new one.",
      },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = menuItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { name, description, price, image, isVeg, isAvailable, displayOrder } = parsed.data;

  const item = await prisma.menuItem.create({
    data: {
      name: sanitize(name),
      description: sanitize(description),
      price,
      image,
      isVeg: isVeg ?? true,
      isAvailable,
      displayOrder,
    },
  });

  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = menuItemSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  // If re-enabling and would exceed 10
  if (parsed.data.isAvailable === true) {
    const activeCount = await prisma.menuItem.count({ where: { isAvailable: true, NOT: { id } } });
    if (activeCount >= 10) {
      return NextResponse.json(
        { error: "Cannot enable item: menu is already at the 10-item limit." },
        { status: 400 }
      );
    }
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) data.name = sanitize(parsed.data.name);
  if (parsed.data.description !== undefined) data.description = sanitize(parsed.data.description);
  if (parsed.data.price !== undefined) data.price = parsed.data.price;
  if (parsed.data.image !== undefined) data.image = parsed.data.image;
  if (parsed.data.isVeg !== undefined) data.isVeg = parsed.data.isVeg;
  if (parsed.data.isAvailable !== undefined) data.isAvailable = parsed.data.isAvailable;
  if (parsed.data.displayOrder !== undefined) data.displayOrder = parsed.data.displayOrder;

  const item = await prisma.menuItem.update({ where: { id }, data });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const orderItemCount = await prisma.orderItem.count({ where: { menuItemId: id } });

  if (orderItemCount > 0) {
    // Soft delete
    await prisma.menuItem.update({
      where: { id },
      data: { isAvailable: false },
    });
    return NextResponse.json({ message: "Item hidden (soft-deleted) to preserve order history." });
  } else {
    // Hard delete
    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (item?.image && item.image.includes("res.cloudinary.com")) {
      try {
        const publicId = item.image.split("/").slice(-2).join("/").split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch {
        // Log but don't fail
        console.error("Cloudinary delete failed for item", id);
      }
    }
    await prisma.menuItem.delete({ where: { id } });
    return NextResponse.json({ message: "Item permanently deleted." });
  }
}
