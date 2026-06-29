"use client";

import { useEffect } from "react";
import { useCart } from "@/hooks/use-cart";

// Clears the cart on mount — used on order-success after Stripe redirect (3DS flow)
export function CartClearer() {
  const { clearCart } = useCart();
  useEffect(() => {
    clearCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
