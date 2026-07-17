export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { ProductActions } from "@/components/product-actions";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const item = await prisma.menuItem.findUnique({ where: { id } });
  if (!item || !item.isAvailable) notFound();

  const price = Number(item.price);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-6 md:mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Menu
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        {/* Image */}
        <div className="relative w-full aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          <Image
            src={item.image}
            alt={item.name}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* Details */}
        <div className="flex flex-col gap-4">
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

          <h1 className="font-display text-2xl md:text-4xl font-bold text-gray-900 leading-tight">
            {item.name}
          </h1>

          <p className="text-blue-600 font-bold text-2xl">{formatCurrency(price)}</p>

          <div>
            <h2 className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-2">
              About this dish
            </h2>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed whitespace-pre-line">
              {item.description}
            </p>
          </div>

          <div className="mt-auto pt-4">
            <ProductActions
              item={{ id: item.id, name: item.name, price, image: item.image }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
