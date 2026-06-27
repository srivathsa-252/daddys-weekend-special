"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, UtensilsCrossed, ClipboardList, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed, exact: false },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList, exact: false },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col min-h-screen">
      <div className="p-6 border-b border-gray-100">
        <h1 className="font-sans text-lg font-bold text-gray-900 leading-tight">
          Daddy's Kitchen
        </h1>
        <p className="text-gray-400 text-xs mt-1">Admin Panel</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                active
                  ? "bg-blue-50 text-blue-600 border border-blue-100"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 w-full transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
