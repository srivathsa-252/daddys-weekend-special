function baseLayout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

        <!-- Header -->
        <tr>
          <td style="background:#1D4ED8;padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.01em;">
              Daddy's Weekend Special
            </h1>
            <p style="margin:5px 0 0;color:rgba(255,255,255,0.65);font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">
              Weekend Dining
            </p>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="background:#ffffff;padding:36px 32px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F9FAFB;padding:20px 32px;border-top:1px solid #E5E7EB;text-align:center;">
            <p style="margin:0;color:#9CA3AF;font-size:12px;">
              © ${new Date().getFullYear()} Daddy's Weekend Special · All rights reserved
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function orderRefBox(orderNumber: number): string {
  const ref = `#${String(orderNumber).padStart(4, "0")}`;
  return `
  <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:16px 20px;margin-bottom:24px;text-align:center;">
    <p style="margin:0 0 4px;color:#3B82F6;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">Order Reference</p>
    <p style="margin:0;color:#1D4ED8;font-size:32px;font-weight:800;font-family:monospace;letter-spacing:0.05em;">${ref}</p>
  </div>`;
}

// ─────────────────────────────────────────────
// Confirmed
// ─────────────────────────────────────────────
interface ConfirmedParams {
  customerName: string;
  orderNumber: number;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  addressLine1: string;
  city: string;
  postcode: string;
}

export function orderConfirmedTemplate({ customerName, orderNumber, items, total, addressLine1, city, postcode }: ConfirmedParams): string {
  const rows = items.map((i) => `
    <tr>
      <td style="padding:8px 0;color:#374151;font-size:14px;border-bottom:1px solid #F3F4F6;">${i.name} × ${i.quantity}</td>
      <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #F3F4F6;">£${(i.price * i.quantity).toFixed(2)}</td>
    </tr>`).join("");

  return baseLayout("Order Confirmed", `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:#ECFDF5;border:1px solid #A7F3D0;border-radius:50%;width:56px;height:56px;line-height:56px;text-align:center;font-size:26px;margin-bottom:14px;">✓</div>
      <h2 style="margin:0 0 6px;color:#111827;font-size:24px;font-weight:700;">Order Confirmed!</h2>
      <p style="margin:0;color:#6B7280;font-size:15px;">Hi ${customerName}, your order is confirmed.</p>
    </div>

    ${orderRefBox(orderNumber)}

    <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:14px 20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;color:#6B7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">Delivery Address</p>
      <p style="margin:0;color:#111827;font-size:14px;">${addressLine1}, ${city}, ${postcode}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td colspan="2" style="padding-bottom:10px;">
          <p style="margin:0;color:#111827;font-weight:600;font-size:14px;">Items Ordered</p>
        </td>
      </tr>
      ${rows}
      <tr>
        <td style="padding-top:12px;color:#111827;font-weight:700;font-size:15px;">Total</td>
        <td style="padding-top:12px;color:#1D4ED8;font-weight:700;font-size:18px;text-align:right;">£${total.toFixed(2)}</td>
      </tr>
    </table>

    <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0;">
      We'll notify you as soon as a delivery partner is assigned. Thank you for dining with us!
    </p>
  `);
}

// ─────────────────────────────────────────────
// Partner Assigned
// ─────────────────────────────────────────────
interface PartnerAssignedParams {
  customerName: string;
  orderNumber: number;
  partnerName: string;
  partnerPhone: string;
  estimatedDelivery: string;
}

export function partnerAssignedTemplate({ customerName, orderNumber, partnerName, partnerPhone, estimatedDelivery }: PartnerAssignedParams): string {
  return baseLayout("Partner Assigned", `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:40px;margin-bottom:12px;">🚗</div>
      <h2 style="margin:0 0 6px;color:#111827;font-size:24px;font-weight:700;">Your Partner is On the Way!</h2>
      <p style="margin:0;color:#6B7280;font-size:15px;">Hi ${customerName}, a delivery partner has been assigned.</p>
    </div>

    ${orderRefBox(orderNumber)}

    <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 14px;color:#111827;font-weight:600;font-size:14px;">Delivery Partner Details</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:7px 0;color:#6B7280;font-size:13px;width:36%;">Name</td>
          <td style="padding:7px 0;color:#111827;font-size:14px;font-weight:600;">${partnerName}</td>
        </tr>
        <tr>
          <td style="padding:7px 0;color:#6B7280;font-size:13px;">Phone</td>
          <td style="padding:7px 0;color:#111827;font-size:14px;font-weight:600;">${partnerPhone}</td>
        </tr>
        <tr>
          <td style="padding:7px 0;color:#6B7280;font-size:13px;">Est. Delivery</td>
          <td style="padding:7px 0;color:#1D4ED8;font-size:14px;font-weight:700;">${estimatedDelivery}</td>
        </tr>
      </table>
    </div>

    <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0;">
      Please be ready to receive your order. If you need to reach your delivery partner, use the number above.
    </p>
  `);
}

// ─────────────────────────────────────────────
// Delivered
// ─────────────────────────────────────────────
interface DeliveredParams {
  customerName: string;
  orderNumber: number;
}

export function orderDeliveredTemplate({ customerName, orderNumber }: DeliveredParams): string {
  return baseLayout("Order Delivered", `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:40px;margin-bottom:12px;">🎉</div>
      <h2 style="margin:0 0 6px;color:#111827;font-size:24px;font-weight:700;">Order Delivered!</h2>
      <p style="margin:0;color:#6B7280;font-size:15px;">Hi ${customerName}, hope you enjoyed your meal!</p>
    </div>

    ${orderRefBox(orderNumber)}

    <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:10px;padding:16px 20px;text-align:center;margin-bottom:24px;">
      <p style="margin:0;color:#059669;font-size:15px;font-weight:600;">✓ Successfully Delivered</p>
    </div>

    <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 24px;">
      We'd love to hear what you thought! Your feedback helps us keep improving.
    </p>

    <div style="text-align:center;">
      <a href="https://forms.gle/example"
         style="display:inline-block;background:#1D4ED8;color:#ffffff;font-weight:600;font-size:15px;padding:13px 32px;border-radius:8px;text-decoration:none;">
        Leave a Review ⭐
      </a>
    </div>
  `);
}

// ─────────────────────────────────────────────
// Cancelled
// ─────────────────────────────────────────────
interface CancelledParams {
  customerName: string;
  orderNumber: number;
  refunded: boolean;
}

export function orderCancelledTemplate({ customerName, orderNumber, refunded }: CancelledParams): string {
  return baseLayout("Order Cancelled", `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:40px;margin-bottom:12px;">❌</div>
      <h2 style="margin:0 0 6px;color:#111827;font-size:24px;font-weight:700;">Order Cancelled</h2>
      <p style="margin:0;color:#6B7280;font-size:15px;">Hi ${customerName}, your order has been cancelled.</p>
    </div>

    ${orderRefBox(orderNumber)}

    ${refunded ? `
    <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:10px;padding:14px 20px;margin-bottom:24px;">
      <p style="margin:0;color:#059669;font-size:14px;font-weight:600;">✓ Refund Initiated</p>
      <p style="margin:6px 0 0;color:#6B7280;font-size:13px;">A full refund should appear within 5–10 business days.</p>
    </div>` : ""}

    <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0;">
      We apologise for any inconvenience. Please visit our website to place a new order.
    </p>
  `);
}
