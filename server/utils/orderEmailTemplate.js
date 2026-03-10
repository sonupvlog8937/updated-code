/**
 * orderEmailTemplate.js
 * Order confirm hone ke baad customer ko jaane wali email
 * Professional & Production-Ready Design
 *
 * @param {string} username  - customer ka naam
 * @param {Object} orders    - Mongoose order document
 * @returns {string}         - HTML string
 */
const OrderConfirmationEmail = (username, orders) => {
    const storeName  = process.env.STORE_NAME  || 'Zeedaddy';
    const storeColor = process.env.STORE_COLOR || '#1a1a2e';
    const storeUrl   = process.env.STORE_URL   || '#';
    const year       = new Date().getFullYear();

    const accentColor   = '#e94560';
    const accentLight   = '#fff0f3';
    const darkBg        = '#1a1a2e';
    const textDark      = '#0f0f1a';
    const textMid       = '#4a4a6a';
    const textLight     = '#8888aa';
    const borderColor   = '#ebebf5';
    const successGreen  = '#00c896';
    const warningYellow = '#ffb800';

    const products = Array.isArray(orders?.products) ? orders.products : [];

    const grandTotal = products.reduce((sum, item) => {
        const lineTotal = item?.subTotal
            ? Number(item.subTotal)
            : Number(item?.price || 0) * Number(item?.quantity || 1);
        return sum + lineTotal;
    }, 0);

    const formatINR = (amount) =>
        Number(amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

    const orderId   = orders?._id?.toString() || 'N/A';
    const orderDate = orders?.date
        ? new Date(orders.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
        : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

    const payStatus  = orders?.payment_status || 'Pending';
    const isPaid     = payStatus?.toLowerCase() === 'paid';
    const badgeBg    = isPaid ? '#e6faf5' : '#fff8e6';
    const badgeColor = isPaid ? '#00a87a' : '#cc8800';
    const badgeDot   = isPaid ? successGreen : warningYellow;

    // ── Product Cards (card-style, no inner table) ────────────────────────────
    const productRowsHtml = products.length > 0
        ? products.map((item, index) => {
            const name    = item?.productTitle || item?.name || 'Product';
            const qty     = Number(item?.quantity || 1);
            const lineAmt = item?.subTotal
                ? Number(item.subTotal)
                : Number(item?.price || 0) * qty;
            const image   = item?.image || (Array.isArray(item?.images) ? item.images[0] : '');
            const isLast  = index === products.length - 1;

            return `
            <tr>
              <td style="padding:${index === 0 ? '8px 8px 4px' : '4px 8px'}${isLast ? ' 8px' : ''};">

                <!-- Product Card -->
                <div style="background:#ffffff;border:1px solid ${borderColor};border-radius:14px;padding:16px 18px;display:flex;align-items:center;">

                  <!-- Left: Image + Info -->
                  <div style="display:inline-block;vertical-align:middle;${image ? 'width:calc(100% - 120px)' : 'width:calc(100% - 60px)'};">
                    <div style="display:inline-block;vertical-align:middle;">
                      ${image ? `
                      <img src="${image}" alt="${name}" width="56" height="56"
                           style="display:inline-block;vertical-align:middle;width:56px;height:56px;
                                  border-radius:10px;object-fit:cover;border:1px solid ${borderColor};
                                  margin-right:14px;"/>` : ''}
                    </div>
                    <div style="display:inline-block;vertical-align:middle;max-width:280px;">
                      <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:${textDark};line-height:1.3;">${name}</p>
                      <p style="margin:0;font-size:12px;color:${textLight};line-height:1.5;">
                        ${item?.size  ? `Size: <strong style="color:${textMid};">${item.size}</strong>&nbsp;&nbsp;` : ''}
                        ${item?.color ? `Color: <strong style="color:${textMid};">${item.color}</strong>` : ''}
                      </p>
                    </div>
                  </div>

                  <!-- Right: Qty + Price -->
                  <div style="display:inline-block;vertical-align:middle;text-align:right;float:right;min-width:100px;">
                    <p style="margin:0 0 4px;">
                      <span style="display:inline-block;background:#f4f4fc;color:${textMid};
                                   font-size:12px;font-weight:600;padding:3px 10px;
                                   border-radius:20px;">Qty: ${qty}</span>
                    </p>
                    <p style="margin:0;font-size:16px;font-weight:800;color:${accentColor};">${formatINR(lineAmt)}</p>
                  </div>

                </div>
              </td>
            </tr>`;
        }).join('')
        : `<tr>
             <td style="padding:32px;text-align:center;color:${textLight};font-size:14px;">
               No products found.
             </td>
           </tr>`;

    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>Order Confirmed – ${storeName}</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f0f0f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

<!-- Preheader (hidden) -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
  Your order has been confirmed! Hi ${username}, we've received your order and it's being processed. Order #${orderId.slice(-8).toUpperCase()}
</div>
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f0f8;padding:40px 16px;">
  <tr>
    <td align="center">

      <!-- ═══════════════════════════════════════ -->
      <!-- MAIN CONTAINER                         -->
      <!-- ═══════════════════════════════════════ -->
      <table width="600" cellpadding="0" cellspacing="0" border="0"
             style="max-width:600px;width:100%;">

        <!-- ── TOP LOGO BAR ── -->
        <tr>
          <td style="padding-bottom:24px;text-align:center;">
            <table cellpadding="0" cellspacing="0" border="0" align="center">
              <tr>
                <td style="background:${darkBg};padding:14px 32px;border-radius:50px;">
                  <span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:1px;font-family:Georgia,serif;">
                    ${storeName.toUpperCase()}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── HERO CARD ── -->
        <tr>
          <td style="background:${darkBg};border-radius:20px 20px 0 0;padding:48px 40px 40px;text-align:center;">

            <!-- Success Icon -->
            <div style="display:inline-block;width:72px;height:72px;background:${accentColor};border-radius:50%;margin-bottom:20px;line-height:72px;text-align:center;">
              <span style="font-size:32px;line-height:72px;display:inline-block;">✓</span>
            </div>

            <h1 style="margin:0 0 12px;font-size:28px;font-weight:800;color:#ffffff;font-family:Georgia,serif;line-height:1.2;">
              Order Confirmed!
            </h1>
            <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.7;">
              Hey <strong style="color:#ffffff;">${username}</strong>, thank you for your purchase.<br/>
              Your order is confirmed and being processed.
            </p>

            <!-- Order ID Badge -->
            <div style="display:inline-block;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:12px;padding:12px 28px;">
              <p style="margin:0 0 2px;font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:2px;">Order ID</p>
              <p style="margin:0;font-size:18px;font-weight:800;color:#ffffff;letter-spacing:2px;font-family:'Courier New',monospace;">
                #${orderId.slice(-8).toUpperCase()}
              </p>
            </div>
          </td>
        </tr>

        <!-- ── ORDER META STRIP ── -->
        <tr>
          <td style="background:#ffffff;padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <!-- Date -->
                <td style="padding:20px;text-align:center;border-right:1px solid ${borderColor};">
                  <p style="margin:0 0 4px;font-size:10px;color:${textLight};text-transform:uppercase;letter-spacing:1.5px;">Date</p>
                  <p style="margin:0;font-size:13px;font-weight:600;color:${textDark};">${orderDate}</p>
                </td>
                <!-- Payment Status -->
                <td style="padding:20px;text-align:center;border-right:1px solid ${borderColor};">
                  <p style="margin:0 0 6px;font-size:10px;color:${textLight};text-transform:uppercase;letter-spacing:1.5px;">Payment</p>
                  <span style="display:inline-block;background:${badgeBg};color:${badgeColor};font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;">
                    <span style="display:inline-block;width:6px;height:6px;background:${badgeDot};border-radius:50%;margin-right:5px;vertical-align:middle;"></span>${payStatus}
                  </span>
                </td>
                <!-- Delivery -->
                <td style="padding:20px;text-align:center;">
                  <p style="margin:0 0 4px;font-size:10px;color:${textLight};text-transform:uppercase;letter-spacing:1.5px;">Delivery</p>
                  <p style="margin:0;font-size:13px;font-weight:600;color:${textDark};">3–5 Business Days</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── DIVIDER ── -->
        <tr>
          <td style="background:#ffffff;padding:0 24px;">
            <div style="height:1px;background:linear-gradient(to right,transparent,${borderColor},transparent);"></div>
          </td>
        </tr>

        <!-- ── PRODUCTS SECTION ── -->
        <tr>
          <td style="background:#f0f0f8;padding:20px 16px 8px;">
            <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#8888aa;text-transform:uppercase;letter-spacing:2px;padding:0 8px;">Order Items</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              ${productRowsHtml}
            </table>
          </td>
        </tr>

        <!-- ── TOTAL SECTION ── -->
        <tr>
          <td style="background:#ffffff;padding:16px 24px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="width:50%;"></td>
                <td style="width:50%;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0"
                         style="background:#f8f8fc;border-radius:12px;overflow:hidden;">
                    <tr>
                      <td style="padding:14px 18px 8px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="font-size:12px;color:${textLight};">Subtotal</td>
                            <td style="text-align:right;font-size:12px;color:${textMid};font-weight:500;">${formatINR(grandTotal)}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 18px 8px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="font-size:12px;color:${textLight};">Shipping</td>
                            <td style="text-align:right;font-size:12px;color:${successGreen};font-weight:600;">FREE</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:10px 18px 14px;border-top:1px solid ${borderColor};">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="font-size:14px;font-weight:700;color:${textDark};">Total</td>
                            <td style="text-align:right;font-size:20px;font-weight:800;color:${accentColor};">${formatINR(grandTotal)}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── TRACKING STEPS ── -->
        <tr>
          <td style="background:#ffffff;padding:0 24px 28px;">
            <div style="background:#f8f8fc;border-radius:14px;padding:20px 24px;">
              <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:${textLight};text-transform:uppercase;letter-spacing:2px;">Order Journey</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <!-- Step 1: Confirmed -->
                  <td style="text-align:center;width:25%;">
                    <div style="width:36px;height:36px;background:${accentColor};border-radius:50%;margin:0 auto 8px;line-height:36px;text-align:center;">
                      <span style="color:#fff;font-size:14px;font-weight:700;">✓</span>
                    </div>
                    <p style="margin:0;font-size:10px;font-weight:600;color:${accentColor};">Confirmed</p>
                  </td>
                  <!-- Line -->
                  <td style="padding-bottom:20px;">
                    <div style="height:2px;background:linear-gradient(to right,${accentColor},${borderColor});border-radius:2px;"></div>
                  </td>
                  <!-- Step 2: Processing -->
                  <td style="text-align:center;width:25%;">
                    <div style="width:36px;height:36px;background:${darkBg};border-radius:50%;margin:0 auto 8px;line-height:36px;text-align:center;">
                      <span style="color:rgba(255,255,255,0.5);font-size:14px;">⚙</span>
                    </div>
                    <p style="margin:0;font-size:10px;font-weight:600;color:${textLight};">Processing</p>
                  </td>
                  <!-- Line -->
                  <td style="padding-bottom:20px;">
                    <div style="height:2px;background:${borderColor};border-radius:2px;"></div>
                  </td>
                  <!-- Step 3: Shipped -->
                  <td style="text-align:center;width:25%;">
                    <div style="width:36px;height:36px;background:#f0f0f8;border:2px solid ${borderColor};border-radius:50%;margin:0 auto 8px;line-height:32px;text-align:center;">
                      <span style="color:${textLight};font-size:14px;">📦</span>
                    </div>
                    <p style="margin:0;font-size:10px;font-weight:600;color:${textLight};">Shipped</p>
                  </td>
                  <!-- Line -->
                  <td style="padding-bottom:20px;">
                    <div style="height:2px;background:${borderColor};border-radius:2px;"></div>
                  </td>
                  <!-- Step 4: Delivered -->
                  <td style="text-align:center;width:25%;">
                    <div style="width:36px;height:36px;background:#f0f0f8;border:2px solid ${borderColor};border-radius:50%;margin:0 auto 8px;line-height:32px;text-align:center;">
                      <span style="color:${textLight};font-size:14px;">🏠</span>
                    </div>
                    <p style="margin:0;font-size:10px;font-weight:600;color:${textLight};">Delivered</p>
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>

        <!-- ── CTA BUTTON ── -->
        <tr>
          <td style="background:#ffffff;padding:0 24px 32px;text-align:center;">
            <a href="${storeUrl}/my-orders"
               style="display:inline-block;background:${darkBg};color:#ffffff;font-size:14px;font-weight:700;padding:16px 48px;border-radius:50px;text-decoration:none;letter-spacing:0.5px;">
              Track My Order →
            </a>
            <p style="margin:16px 0 0;font-size:13px;color:${textLight};">
              Need help? <a href="mailto:support@${storeName.toLowerCase()}.in" style="color:${accentColor};text-decoration:none;font-weight:600;">Contact Support</a>
            </p>
          </td>
        </tr>

        <!-- ── BOTTOM CARD ── -->
        <tr>
          <td style="background:${darkBg};border-radius:0 0 20px 20px;padding:28px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <!-- Store info -->
                <td style="vertical-align:top;">
                  <p style="margin:0 0 4px;font-size:16px;font-weight:800;color:#ffffff;font-family:Georgia,serif;">${storeName}</p>
                  <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.4);">Online Shopping App</p>
                </td>
                <!-- Social / links -->
                <td style="text-align:right;vertical-align:top;">
                  <a href="${storeUrl}" style="display:inline-block;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);font-size:12px;font-weight:600;padding:8px 16px;border-radius:20px;text-decoration:none;">Visit Store</a>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top:20px;border-top:1px solid rgba(255,255,255,0.08);">
                  <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.3);line-height:1.8;text-align:center;">
                    © ${year} ${storeName}. All rights reserved.<br/>
                    This is an automated email — please do not reply directly.<br/>
                    <a href="${storeUrl}/unsubscribe" style="color:rgba(255,255,255,0.3);text-decoration:underline;">Unsubscribe</a> · <a href="${storeUrl}/privacy" style="color:rgba(255,255,255,0.3);text-decoration:underline;">Privacy Policy</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Bottom spacing -->
        <tr><td style="height:40px;"></td></tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`;
};

export default OrderConfirmationEmail;