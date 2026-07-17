"use client";

import Image from "next/image";
import { useEffect } from "react";
import { X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ProductActions } from "@/components/product-actions";
import type { MenuItemType } from "@/types";

export function ProductModal({ item, onClose }: { item: MenuItemType; onClose: () => void }) {
  // Lock background scroll while open, close on Escape
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center sm:justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl overflow-y-auto overscroll-contain shadow-xl animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative w-full h-56 sm:h-64">
          <Image
            src={item.image}
            alt={item.name}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 512px"
          />
          {/* Drag handle (mobile affordance) */}
          <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/70" />
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm hover:bg-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Details */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center justify-center w-4 h-4 border-2 rounded-sm ${
                item.isVeg ? "border-green-500" : "border-red-400"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${item.isVeg ? "bg-green-500" : "bg-red-400"}`} />
            </span>
            <span className={`text-xs font-semibold ${item.isVeg ? "text-green-600" : "text-red-500"}`}>
              {item.isVeg ? "Vegetarian" : "Non-Vegetarian"}
            </span>
          </div>

          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
              {item.name}
            </h2>
            <span className="text-blue-600 font-bold text-xl whitespace-nowrap">
              {formatCurrency(item.price)}
            </span>
          </div>

          <div>
            <h3 className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-1.5">
              About this dish
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
              {item.description}
            </p>
          </div>

          <div className="pt-2 pb-[env(safe-area-inset-bottom)]">
            <ProductActions
              item={{ id: item.id, name: item.name, price: item.price, image: item.image }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
