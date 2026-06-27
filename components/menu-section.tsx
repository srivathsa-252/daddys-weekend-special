import { prisma } from "@/lib/prisma";
import { MenuClientContainer } from "@/components/menu-client-container";

export async function MenuSection() {
  const items = await prisma.menuItem.findMany({
    where: { isAvailable: true },
    orderBy: { displayOrder: "asc" },
  });

  const serializedItems = items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: Number(item.price),
    image: item.image,
    isVeg: item.isVeg,
    isAvailable: item.isAvailable,
    displayOrder: item.displayOrder,
  }));

  return <MenuClientContainer initialItems={serializedItems} />;
}
