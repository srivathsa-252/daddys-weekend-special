import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Admin user
  const hashedPassword = await bcrypt.hash("ChangeMe_Immediately123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@daddysweekendspecial.com" },
    update: {},
    create: {
      email: "admin@daddysweekendspecial.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin user created:", admin.email);
  console.log("");
  console.log("⚠️  ============================================================");
  console.log("⚠️  Default admin password must be changed before production deployment.");
  console.log("⚠️  Email:    admin@daddysweekendspecial.com");
  console.log("⚠️  Password: ChangeMe_Immediately123!");
  console.log("⚠️  ============================================================");
  console.log("");

  // Menu items
  const menuItems = [
    {
      name: "Weekend Ribeye Special",
      description: "12oz prime ribeye with truffle butter, roasted garlic mash, and seasonal vegetables.",
      price: 42.99,
      image: "https://res.cloudinary.com/demo/image/upload/v1/samples/food/fish-vegetables",
      displayOrder: 1,
    },
    {
      name: "Lobster Bisque",
      description: "Rich, creamy bisque with chunks of fresh lobster, a swirl of cream, and chives.",
      price: 18.99,
      image: "https://res.cloudinary.com/demo/image/upload/v1/samples/food/spices",
      displayOrder: 2,
    },
    {
      name: "Pan-Seared Duck Breast",
      description: "Crispy-skin duck breast with cherry reduction, wild rice pilaf, and haricots verts.",
      price: 36.99,
      image: "https://res.cloudinary.com/demo/image/upload/v1/samples/food/fish-vegetables",
      displayOrder: 3,
    },
    {
      name: "Seafood Linguine",
      description: "Linguine tossed with shrimp, scallops, mussels, white wine, garlic, and fresh herbs.",
      price: 32.99,
      image: "https://res.cloudinary.com/demo/image/upload/v1/samples/food/spices",
      displayOrder: 4,
    },
    {
      name: "Beef Wellington",
      description: "Classic tenderloin wrapped in mushroom duxelles and golden puff pastry. Serves one.",
      price: 52.99,
      image: "https://res.cloudinary.com/demo/image/upload/v1/samples/food/fish-vegetables",
      displayOrder: 5,
    },
    {
      name: "Truffle Arancini",
      description: "Crispy risotto balls filled with black truffle and parmesan, served with aioli.",
      price: 14.99,
      image: "https://res.cloudinary.com/demo/image/upload/v1/samples/food/spices",
      displayOrder: 6,
    },
    {
      name: "Grilled Halibut",
      description: "Fresh halibut filet with lemon beurre blanc, asparagus, and fingerling potatoes.",
      price: 38.99,
      image: "https://res.cloudinary.com/demo/image/upload/v1/samples/food/fish-vegetables",
      displayOrder: 7,
    },
    {
      name: "Wagyu Burger",
      description: "6oz Wagyu patty with aged cheddar, caramelized onions, truffle aioli on brioche.",
      price: 28.99,
      image: "https://res.cloudinary.com/demo/image/upload/v1/samples/food/spices",
      displayOrder: 8,
    },
    {
      name: "Chocolate Lava Cake",
      description: "Warm dark chocolate cake with molten center, vanilla bean ice cream, and raspberry coulis.",
      price: 12.99,
      image: "https://res.cloudinary.com/demo/image/upload/v1/samples/food/dessert",
      displayOrder: 9,
    },
    {
      name: "Charcuterie Board",
      description: "Selection of cured meats, artisan cheeses, seasonal fruits, nuts, and house-made crostini.",
      price: 24.99,
      image: "https://res.cloudinary.com/demo/image/upload/v1/samples/food/spices",
      displayOrder: 10,
    },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.create({ data: item });
  }
  console.log("✅ 10 menu items seeded.");
  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
