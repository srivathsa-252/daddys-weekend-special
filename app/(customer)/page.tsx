import { Suspense } from "react";
import { MenuSection } from "@/components/menu-section";
import { MenuGridSkeleton } from "@/components/menu-grid-skeleton";

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Suspense fallback={<MenuGridSkeleton />}>
        <MenuSection />
      </Suspense>
    </div>
  );
}
