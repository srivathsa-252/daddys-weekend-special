"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AssignPartnerModal } from "@/components/admin/assign-partner-modal";

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PARTNER_ASSIGNED"
  | "DELIVERED"
  | "CANCELLED";

interface Order {
  id: string;
  orderNumber: number;
  customerName: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

type Action = "CONFIRM" | "CANCEL" | "MARK_DELIVERED";

function displayRef(n: number) {
  return `#${String(n).padStart(4, "0")}`;
}

function statusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    PARTNER_ASSIGNED: "Partner Assigned",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  };
  return labels[status] ?? status;
}

function orderBadgeVariant(
  status: OrderStatus
): "success" | "destructive" | "warning" | "default" | "secondary" {
  if (status === "CONFIRMED" || status === "DELIVERED") return "success";
  if (status === "CANCELLED") return "destructive";
  if (status === "PARTNER_ASSIGNED") return "default";
  return "warning";
}

const ACTION_MESSAGES: Record<Action, string> = {
  CONFIRM: "Order confirmed & email sent",
  CANCEL: "Order cancelled",
  MARK_DELIVERED: "Order marked as delivered — email sent",
};

export function RecentOrdersDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [assignModal, setAssignModal] = useState<{ id: string; orderNumber: number } | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/orders?limit=5");
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function handleAction(orderId: string, action: Action) {
    setActionLoading(orderId + action);
    const res = await fetch(`/api/admin/orders?id=${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const json = await res.json();
    setActionLoading(null);
    if (res.ok) {
      toast.success(ACTION_MESSAGES[action]);
      fetchOrders();
    } else {
      toast.error(json.error ?? "Action failed");
    }
  }

  return (
    <>
      {assignModal && (
        <AssignPartnerModal
          orderId={assignModal.id}
          orderNumber={assignModal.orderNumber}
          onClose={() => setAssignModal(null)}
          onSuccess={() => { setAssignModal(null); fetchOrders(); }}
        />
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-gray-900">Recent Orders</CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchOrders} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="divide-y divide-gray-100">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="py-3 first:pt-0 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="shimmer-bg h-4 w-10 rounded-md" />
                    <div className="shimmer-bg h-4 w-28 rounded-md" />
                    <div className="shimmer-bg h-5 w-20 rounded-full ml-auto" />
                    <div className="shimmer-bg h-4 w-14 rounded-md" />
                  </div>
                  <div className="shimmer-bg h-3 w-24 rounded-md" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <p className="text-gray-400 text-sm py-4">No orders yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {orders.map((order) => {
                const canCancel = order.status === "PENDING" || order.status === "CONFIRMED";
                return (
                  <div key={order.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold font-mono text-sm flex-shrink-0 mt-0.5">
                        {displayRef(order.orderNumber)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-medium text-sm truncate">
                          {order.customerName}
                        </p>
                        <p className="text-gray-400 text-xs mt-0.5">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-blue-600 font-semibold text-sm whitespace-nowrap">
                          {formatCurrency(Number(order.total))}
                        </span>
                        <Badge variant={orderBadgeVariant(order.status)}>
                          {statusLabel(order.status)}
                        </Badge>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {(order.status === "PENDING" ||
                      order.status === "CONFIRMED" ||
                      order.status === "PARTNER_ASSIGNED") && (
                      <div className="flex gap-2 mt-2">
                        {order.status === "PENDING" && (
                          <Button
                            size="sm"
                            className="text-xs h-7 px-3"
                            onClick={() => handleAction(order.id, "CONFIRM")}
                            disabled={!!actionLoading}
                          >
                            {actionLoading === order.id + "CONFIRM" ? "..." : "Accept"}
                          </Button>
                        )}
                        {order.status === "CONFIRMED" && (
                          <Button
                            size="sm"
                            className="text-xs h-7 px-3"
                            onClick={() => setAssignModal({ id: order.id, orderNumber: order.orderNumber })}
                            disabled={!!actionLoading}
                          >
                            Assign Partner
                          </Button>
                        )}
                        {order.status === "PARTNER_ASSIGNED" && (
                          <Button
                            size="sm"
                            className="text-xs h-7 px-3"
                            onClick={() => handleAction(order.id, "MARK_DELIVERED")}
                            disabled={!!actionLoading}
                          >
                            {actionLoading === order.id + "MARK_DELIVERED" ? "..." : "Mark Delivered"}
                          </Button>
                        )}
                        {canCancel && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleAction(order.id, "CANCEL")}
                            disabled={!!actionLoading}
                          >
                            {actionLoading === order.id + "CANCEL" ? "..." : "Cancel"}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
