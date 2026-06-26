"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { count } = useCart();

  // If we are in the admin dashboard, we don't show the customer mobile navigation
  if (pathname?.startsWith("/admin")) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white/95 py-2 shadow-lg backdrop-blur-md md:hidden">
      <div className="flex items-center justify-around">
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center gap-0.5 text-xs font-medium transition-colors",
            pathname === "/" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
          )}
        >
          <Home className="w-6 h-6" />
          <span>Home</span>
        </Link>

        <Link
          href="/cart"
          className={cn(
            "relative flex flex-col items-center gap-0.5 text-xs font-medium transition-colors",
            pathname === "/cart" || pathname === "/checkout" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
          )}
        >
          <ShoppingBag className="w-6 h-6" />
          {count > 0 && (
            <span className="absolute top-0 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
              {count}
            </span>
          )}
          <span>Cart</span>
        </Link>
      </div>
    </div>
  );
}
