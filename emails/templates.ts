function baseLayout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Daddy's Weekend Special</title>
</head>
<body style="margin:0;padding:0;background-color:#0A1128;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A1128;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0F1B3D;border-radius:16px;border:1px solid rgba(240,165,0,0.2);overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0F1B3D,#152347);padding:32px;text-align:center;border-bottom:2px solid #F0A500;">
            <h1 style="margin:0;color:#F0A500;font-size:24px;font-weight:700;letter-spacing:0.05em;">
              Daddy's Weekend Special
            </h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.5);font-size:13px;letter-spacing:0.1em;text-transform:uppercase;">
              Premium Weekend Dining
            </p>
          </td>
        </tr>
        <!-- Content -->
        <tr><td style="padding:40px 32px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 32px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
            <p style="margin:0;color:rgba(255,255,255,0.3);font-size:12px;">
              © ${new Date().getFullYear()} Daddy's Weekend Special. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function orderRef(orderNumber: number): string {
  return `#${String(orderNumber).padStart(4, "0")}`;
}

interface ConfirmedParams {
  customerName: string;
  orderNumber: number;
  items: { name: string; quantity: number; price: number }[];
  total: number;
}

export function orderConfirmedTemplate({ customerName, orderNumber, items, total }: ConfirmedParams): string {
  const itemRows = items
    .map(
      (i) => `
    <tr>
      <td style="padding:8px 0;color:rgba(255,255,255,0.8);font-size:14px;">${i.name} × ${i.quantity}</td>
      <td style="padding:8px 0;color:#F0A500;font-size:14px;text-align:right;font-weight:600;">£${(i.price * i.quantity).toFixed(2)}</td>
    </tr>`
    )
    .join("");

  return baseLayout(`
    <h2 style="margin:0 0 8px;color:#F0A500;font-size:28px;font-weight:700;">Your Order is Confirmed! 🎉</h2>
    <p style="color:rgba(255,255,255,0.7);margin:0 0 24px;font-size:15px;">Hi ${customerName}, great news — your order has been confirmed!</p>

    <div style="background:rgba(240,165,0,0.08);border:1px solid rgba(240,165,0,0.2);border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Order Reference</p>
      <p style="margin:4px 0 0;color:#F0A500;font-size:28px;font-weight:700;font-family:monospace;">${orderRef(orderNumber)}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr><td colspan="2" style="padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.1);">
        <p style="margin:0;color:white;font-weight:600;font-size:15px;">Items Ordered</p>
      </td></tr>
      ${itemRows}
      <tr>
        <td style="padding-top:12px;border-top:1px solid rgba(255,255,255,0.1);color:white;font-weight:700;font-size:15px;">Total</td>
        <td style="padding-top:12px;border-top:1px solid rgba(255,255,255,0.1);color:#F0A500;font-weight:700;font-size:18px;text-align:right;">£${total.toFixed(2)}</td>
      </tr>
    </table>

    <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.6;">
      Thank you for dining with us. We'll notify you once a delivery partner is assigned to your order.
    </p>
    <p style="color:rgba(255,255,255,0.4);font-size:13px;margin-top:16px;">— The Daddy's Weekend Special Team</p>
  `);
}

interface PartnerAssignedParams {
  customerName: string;
  orderNumber: number;
  partnerName: string;
  partnerPhone: string;
  estimatedDelivery: string;
}

export function partnerAssignedTemplate({ customerName, orderNumber, partnerName, partnerPhone, estimatedDelivery }: PartnerAssignedParams): string {
  return baseLayout(`
    <h2 style="margin:0 0 8px;color:#F0A500;font-size:28px;font-weight:700;">Partner Assigned! 🚗</h2>
    <p style="color:rgba(255,255,255,0.7);margin:0 0 24px;font-size:15px;">Hi ${customerName}, a delivery partner has been assigned to your order and is on the way!</p>

    <div style="background:rgba(240,165,0,0.08);border:1px solid rgba(240,165,0,0.2);border-radius:10px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0;color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Order Reference</p>
      <p style="margin:4px 0 0;color:#F0A500;font-size:28px;font-weight:700;font-family:monospace;">${orderRef(orderNumber)}</p>
    </div>

    <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 14px;color:white;font-weight:600;font-size:15px;">Your Delivery Partner</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;width:40%;">Name</td>
          <td style="padding:6px 0;color:white;font-size:14px;font-weight:600;">${partnerName}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Phone</td>
          <td style="padding:6px 0;color:white;font-size:14px;font-weight:600;">${partnerPhone}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Est. Delivery</td>
          <td style="padding:6px 0;color:#F0A500;font-size:14px;font-weight:600;">${estimatedDelivery}</td>
        </tr>
      </table>
    </div>

    <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.6;">
      Your food is on its way! Please be ready to receive your order. If you need to contact your delivery partner, use the number above.
    </p>
    <p style="color:rgba(255,255,255,0.4);font-size:13px;margin-top:16px;">— The Daddy's Weekend Special Team</p>
  `);
}

interface DeliveredParams {
  customerName: string;
  orderNumber: number;
}

export function orderDeliveredTemplate({ customerName, orderNumber }: DeliveredParams): string {
  return baseLayout(`
    <h2 style="margin:0 0 8px;color:#F0A500;font-size:28px;font-weight:700;">Order Delivered! 🎉</h2>
    <p style="color:rgba(255,255,255,0.7);margin:0 0 24px;font-size:15px;">Hi ${customerName}, we hope you enjoyed your meal!</p>

    <div style="background:rgba(240,165,0,0.08);border:1px solid rgba(240,165,0,0.2);border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Order Reference</p>
      <p style="margin:4px 0 0;color:#F0A500;font-size:28px;font-weight:700;font-family:monospace;">${orderRef(orderNumber)}</p>
    </div>

    <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:10px;padding:20px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 6px;color:#34d399;font-size:16px;font-weight:700;">✓ Successfully Delivered</p>
      <p style="margin:0;color:rgba(255,255,255,0.6);font-size:13px;">Thank you for dining with Daddy's Weekend Special</p>
    </div>

    <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.6;margin-bottom:20px;">
      We'd love to hear what you thought about your experience. Your feedback helps us serve you better!
    </p>

    <div style="text-align:center;margin-bottom:24px;">
      <a href="https://forms.gle/example" style="display:inline-block;background:#F0A500;color:#0A1128;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;letter-spacing:0.02em;">
        Leave a Review ⭐
      </a>
    </div>

    <p style="color:rgba(255,255,255,0.4);font-size:13px;margin-top:16px;">— The Daddy's Weekend Special Team</p>
  `);
}

interface CancelledParams {
  customerName: string;
  orderNumber: number;
  refunded: boolean;
}

export function orderCancelledTemplate({ customerName, orderNumber, refunded }: CancelledParams): string {
  return baseLayout(`
    <h2 style="margin:0 0 8px;color:white;font-size:28px;font-weight:700;">Order Cancelled</h2>
    <p style="color:rgba(255,255,255,0.7);margin:0 0 24px;font-size:15px;">Hi ${customerName}, we're sorry to inform you that your order has been cancelled.</p>

    <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Order Reference</p>
      <p style="margin:4px 0 0;color:white;font-size:28px;font-weight:700;font-family:monospace;">${orderRef(orderNumber)}</p>
    </div>

    ${
      refunded
        ? `<div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:10px;padding:14px 18px;margin-bottom:24px;">
        <p style="margin:0;color:#34d399;font-size:14px;font-weight:600;">✓ Refund Initiated</p>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:13px;">A full refund has been initiated and should appear within 5–10 business days.</p>
      </div>`
        : ""
    }

    <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.6;">
      We apologise for any inconvenience. Please visit our website to place a new order.
    </p>
    <p style="color:rgba(255,255,255,0.4);font-size:13px;margin-top:16px;">— The Daddy's Weekend Special Team</p>
  `);
}
