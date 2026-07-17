"use client";

import { useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { MenuCard } from "@/components/menu-card";
import type { MenuItemType } from "@/types";

interface MenuClientContainerProps {
  initialItems: MenuItemType[];
}

type DietFilter = "all" | "veg" | "nonveg";

const VegIcon = () => (
  <span className="inline-flex items-center justify-center w-4 h-4 border-2 border-green-600 rounded-sm flex-shrink-0">
    <span className="w-2 h-2 rounded-full bg-green-600" />
  </span>
);

const NonVegIcon = () => (
  <span className="inline-flex items-center justify-center w-4 h-4 border-2 border-red-600 rounded-sm flex-shrink-0">
    <span className="w-2 h-2 rounded-full bg-red-600" />
  </span>
);

export function MenuClientContainer({ initialItems }: MenuClientContainerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dietFilter, setDietFilter] = useState<DietFilter>("all");

  const filteredItems = initialItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDiet =
      dietFilter === "all" ||
      (dietFilter === "veg" && item.isVeg) ||
      (dietFilter === "nonveg" && !item.isVeg);

    return matchesSearch && matchesDiet;
  });

  const filterOptions: { key: DietFilter; label: string; icon?: React.ReactNode }[] = [
    { key: "all", label: "All" },
    { key: "veg", label: "Veg", icon: <VegIcon /> },
    { key: "nonveg", label: "Non-Veg", icon: <NonVegIcon /> },
  ];

  return (
    <div className="space-y-6">

      {/* Search Input */}
      <div className="relative w-full">
        <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search items available..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-full text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/50 shadow-sm transition-all"
        />
      </div>

      {/* Promo Card Banner */}
      <div className="relative overflow-hidden bg-blue-600 rounded-2xl p-5 text-white flex flex-col gap-4 shadow-md">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-100 mb-0.5">
            Daddy&apos;s Weekend Special
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight">WEEKEND SPECIALS</h2>
          <span className="inline-block mt-2 border border-white/40 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full">
            Limited Time
          </span>
        </div>
        <div className="relative w-full aspect-[1751/898] rounded-xl overflow-hidden shadow-inner">
          <Image
            src="/banner1.png"
            alt="Weekend Specials Banner"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1200px"
            priority
          />
        </div>
      </div>

      {/* Diet Filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="bg-blue-50 text-blue-600 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border border-blue-100">
            For You
          </span>
          <h3 className="font-bold text-gray-900 text-lg flex items-center gap-1.5">
            Items Available
            <span className="inline-flex items-center justify-center bg-gray-100 text-gray-600 text-xs font-semibold rounded-full h-5 w-5">
              {filteredItems.length}
            </span>
          </h3>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
          {filterOptions.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setDietFilter(key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold capitalize transition-all border ${
                dietFilter === key
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtered Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-sm">No dishes matched your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
