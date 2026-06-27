export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, CheckCircle, PoundSterling, Clock } from "lucide-react";

export default async function AdminDashboard() {
  const [pendingCount, confirmedCount, orders] = await Promise.all([
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "CONFIRMED" } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { items: true },
    }),
  ]);

  const revenueResult = await prisma.order.aggregate({
    _sum: { total: true },
    where: { paymentStatus: "PAID" },
  });
  const revenue = Number(revenueResult._sum.total ?? 0);

  const stats = [
    { label: "Pending Orders", value: pendingCount, icon: Clock, color: "text-amber-500" },
    { label: "Confirmed Orders", value: confirmedCount, icon: CheckCircle, color: "text-emerald-600" },
    { label: "Total Revenue", value: formatCurrency(revenue), icon: PoundSterling, color: "text-blue-600" },
    { label: "Total Orders", value: orders.length, icon: ClipboardList, color: "text-blue-600" },
  ];

  const statusVariant = (status: string) => {
    if (status === "CONFIRMED") return "success";
    if (status === "CANCELLED") return "destructive";
    return "warning";
  };

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

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-gray-400 text-sm py-4">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-gray-900 font-medium text-sm">{order.customerName}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{order.customerEmail} · {formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-blue-600 font-semibold text-sm">{formatCurrency(Number(order.total))}</span>
                    <Badge variant={statusVariant(order.status) as "success" | "destructive" | "warning"}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
