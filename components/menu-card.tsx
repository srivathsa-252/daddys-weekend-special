"use client";

import Image from "next/image";
import { useState } from "react";
import { ShoppingCart, Check, Eye } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/use-cart";
import { formatCurrency, cn } from "@/lib/utils";
import { ProductModal } from "@/components/product-modal";
import type { MenuItemType } from "@/types";

export function MenuCard({ item }: { item: MenuItemType }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  function handleAdd() {
    addItem({ id: item.id, name: item.name, price: item.price, image: item.image, quantity: 1 });
    toast.success(`${item.name} added to cart`);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <>
      {showDetails && <ProductModal item={item} onClose={() => setShowDetails(false)} />}

      <div className="group flex flex-row md:flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow p-3 md:p-0 gap-4 md:gap-0">
        {/* Image — opens the detail popup */}
        <button
          type="button"
          onClick={() => setShowDetails(true)}
          className="relative block w-24 h-24 md:w-full md:h-52 rounded-xl md:rounded-none overflow-hidden flex-shrink-0 cursor-pointer text-left"
          aria-label={`View details for ${item.name}`}
        >
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 96px, 250px"
          />
          {/* Hover overlay — desktop */}
          <div className="hidden md:flex absolute inset-0 z-10 items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
            <span className="flex items-center gap-1.5 bg-white/95 text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
              <Eye className="w-3.5 h-3.5" /> View Details
            </span>
          </div>
          {/* Price tag on desktop */}
          <div className="hidden md:block absolute bottom-3 right-3 z-10">
            <span className="bg-blue-600 text-white font-bold text-sm px-3 py-1 rounded-full shadow-sm">
              {formatCurrency(item.price)}
            </span>
          </div>
        </button>

        {/* Content container */}
        <div className="flex flex-col flex-1 gap-2 md:p-5 justify-between">
          <div className="space-y-1">
            <div className="flex justify-between items-start gap-2">
              <button
                type="button"
                onClick={() => setShowDetails(true)}
                className="text-left"
              >
                <h3 className="font-semibold text-gray-900 text-sm md:text-lg leading-tight line-clamp-2 hover:text-blue-600 transition-colors">{item.name}</h3>
              </button>
              {/* Price tag on mobile */}
              <span className="md:hidden text-blue-600 font-bold text-sm whitespace-nowrap">
                {formatCurrency(item.price)}
              </span>
            </div>
            <p className="text-xs md:text-sm text-gray-500 leading-relaxed line-clamp-2 md:line-clamp-3">
              {item.description}
            </p>
          </div>

          <button
            onClick={handleAdd}
            className={cn(
              "w-full mt-1.5 md:mt-4 py-2 px-4 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm",
              added
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
            )}
          >
            {added ? (
              <><Check className="w-4 h-4" /> Added</>
            ) : (
              <><ShoppingCart className="w-4 h-4" /> Add to Cart</>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
