"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

export function Navbar() {
  const { count } = useCart();

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo / Brand Header */}
          <Link href="/" className="flex items-center gap-2.5 font-sans text-xl font-bold text-gray-900 tracking-tight">
            {/* Drop the logo file at public/logo.png — hidden automatically until it exists */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt=""
              className="h-9 w-auto"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
            Daddy&apos;s Kitchen
          </Link>

          {/* Cart Actions */}
          <Link
            href="/cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-black text-white hover:bg-black/90 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white border-2 border-white">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
