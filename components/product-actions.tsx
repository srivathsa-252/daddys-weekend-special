"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart, Check } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/use-cart";
import { formatCurrency, cn } from "@/lib/utils";

export function ProductActions({
  item,
}: {
  item: { id: string; name: string; price: number; image: string };
}) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem({ id: item.id, name: item.name, price: item.price, image: item.image, quantity });
    toast.success(`${quantity} × ${item.name} added to cart`);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {/* Quantity stepper */}
      <div className="flex items-center justify-between sm:justify-start gap-3 border border-gray-200 rounded-xl px-3 py-2">
        <button
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Decrease quantity"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="font-bold text-gray-900 w-6 text-center">{quantity}</span>
        <button
          onClick={() => setQuantity((q) => Math.min(20, q + 1))}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Increase quantity"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={handleAdd}
        className={cn(
          "flex-1 py-3 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm",
          added
            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
            : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
        )}
      >
        {added ? (
          <><Check className="w-4 h-4" /> Added to Cart</>
        ) : (
          <><ShoppingCart className="w-4 h-4" /> Add {quantity > 1 ? `${quantity} ` : ""}to Cart · {formatCurrency(item.price * quantity)}</>
        )}
      </button>
    </div>
  );
}
