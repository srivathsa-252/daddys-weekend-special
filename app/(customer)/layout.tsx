import { Navbar } from "@/components/navbar";
import { MobileNav } from "@/components/mobile-nav";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Navbar />
      <main className="pb-16 md:pb-0">{children}</main>
      <MobileNav />
    </div>
  );
}
