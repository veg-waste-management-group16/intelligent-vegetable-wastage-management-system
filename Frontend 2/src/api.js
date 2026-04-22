const API_BASE = "http://localhost:8080/api/payments";

export async function getOverview() {
  const response = await fetch(`${API_BASE}/overview`);
  if (!response.ok) {
    throw new Error("Unable to load overview");
  }
  return response.json();
}

export async function processPayment(payload) {
  const response = await fetch(`${API_BASE}/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : {};
  if (!response.ok) {
    const message = data.message || "Payment failed";
    throw new Error(message);
  }

  return data;
}

export async function getCustomerDashboardCards() {
  const response = await fetch(`${API_BASE}/customers/dashboard`);
  if (!response.ok) {
    throw new Error("Unable to load customer dashboard");
  }
  return response.json();
}

export async function getAdminRequests() {
  const response = await fetch(`${API_BASE}/admin/requests`);
  if (!response.ok) {
    throw new Error("Unable to load admin requests");
  }
  return response.json();
}

export async function approveOrder(orderId) {
  const response = await fetch(`${API_BASE}/admin/requests/${orderId}/approve`, {
    method: "POST"
  });
  if (!response.ok) {
    throw new Error("Approve failed");
  }
}

export async function rejectOrder(orderId) {
  const response = await fetch(`${API_BASE}/admin/requests/${orderId}/reject`, {
    method: "POST"
  });
  if (!response.ok) {
    throw new Error("Reject failed");
  }
}

export function getAdminReportUrl() {
  return `${API_BASE}/admin/report`;
}
