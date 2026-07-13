/**
 * paymentService.js — Razorpay checkout (client side).
 * Talks to the Express endpoints in server.js. The browser never sees the
 * key secret; it only receives the public key_id + an order id from the server.
 */

const API_BASE = import.meta.env.VITE_API_BASE || "";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/**
 * Start a Razorpay checkout for the given plan.
 * @param {{planId:string, uid:string, user?:object}} args
 * @returns {Promise<{success:boolean, error?:string}>}
 */
export async function startCheckout({ planId, uid, user }) {
  const ok = await loadRazorpayScript();
  if (!ok) return { success: false, error: "Could not load Razorpay" };

  // 1. Create the order on the server (server decides the amount).
  const orderRes = await fetch(`${API_BASE}/api/razorpay/order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId, uid }),
  });
  if (!orderRes.ok) {
    const e = await orderRes.json().catch(() => ({}));
    return { success: false, error: e.error || "Could not create order" };
  }
  const order = await orderRes.json();

  // 2. Open the checkout and verify the signature on success.
  return new Promise((resolve) => {
    const rzp = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "OdiaExams",
      description: order.planLabel,
      order_id: order.orderId,
      prefill: {
        name: user?.displayName || user?.name || "",
        email: user?.email || "",
      },
      theme: { color: "#1d4ed8" },
      handler: async (resp) => {
        const verifyRes = await fetch(`${API_BASE}/api/razorpay/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...resp, planId, uid }),
        });
        const v = await verifyRes.json().catch(() => ({}));
        resolve(
          v.verified
            ? { success: true }
            : { success: false, error: v.error || "Verification failed" }
        );
      },
      modal: {
        ondismiss: () => resolve({ success: false, error: "Checkout cancelled" }),
      },
    });
    rzp.open();
  });
}
