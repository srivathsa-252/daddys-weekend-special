"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export default function CartPage() {
  const { items, removeItem, updateQty, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="font-display text-2xl text-gray-900 mb-3">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Add some items from our menu to get started.</p>
        <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
          <Link href="/">Browse Menu</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8">Your Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 bg-white border border-gray-100 shadow-sm rounded-2xl p-4">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                <Image src={item.image} alt={item.name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 truncate text-sm md:text-base">{item.name}</h3>
                  <p className="text-blue-600 font-bold mt-0.5 text-sm">{formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => item.quantity > 1 ? updateQty(item.id, item.quantity - 1) : removeItem(item.id)}
                    className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-blue-600 hover:text-blue-600 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-gray-800 font-semibold w-6 text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-blue-600 hover:text-blue-600 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="ml-auto text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 h-fit space-y-4">
          <h2 className="font-display text-lg md:text-xl font-bold text-gray-900">Order Summary</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm text-gray-500">
                <span>{item.name} × {item.quantity}</span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-4 flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span className="text-blue-600 text-lg">{formatCurrency(total)}</span>
          </div>
          <Button asChild size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md">
            <Link href="/checkout">Proceed to Checkout</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="w-full text-gray-500 hover:text-gray-900">
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
