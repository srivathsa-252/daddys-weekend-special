export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, CheckCircle, PoundSterling, Clock } from "lucide-react";
import { RecentOrdersDashboard } from "@/components/admin/recent-orders";

export default async function AdminDashboard() {
  const [pendingCount, activeCount, totalCount, revenueResult] = await Promise.all([
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({
      where: { status: { in: ["CONFIRMED", "PARTNER_ASSIGNED", "OUT_FOR_DELIVERY"] } },
    }),
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: "DELIVERED" },
    }),
  ]);
  const revenue = Number(revenueResult._sum.total ?? 0);

  const stats = [
    { label: "Pending Orders", value: pendingCount, icon: Clock, color: "text-amber-500" },
    { label: "Active Orders", value: activeCount, icon: CheckCircle, color: "text-emerald-600" },
    { label: "Total Revenue", value: formatCurrency(revenue), icon: PoundSterling, color: "text-blue-600" },
    { label: "Total Orders", value: totalCount, icon: ClipboardList, color: "text-blue-600" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-sans text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Welcome back, Admin</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-500 text-sm">{stat.label}</p>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <RecentOrdersDashboard />
    </div>
  );
}
