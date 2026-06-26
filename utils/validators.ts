import { z } from "zod";

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters").max(100),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().regex(/^\+?[\d\s\-().]{7,20}$/, "Invalid phone number"),
  items: z
    .array(
      z.object({
        menuItemId: z.string(),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1, "Cart is empty"),
});

export const menuItemSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(10).max(500),
  price: z.number().positive().max(9999),
  image: z.string().url(),
  isVeg: z.boolean().optional().default(true),
  isAvailable: z.boolean().optional().default(true),
  displayOrder: z.number().int().optional().default(0),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
