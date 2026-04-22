export function formatDateTime(value) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleDateString("en-GB");
}

export function pillClass(status) {
  if (!status) return "pending";
  const value = String(status).toUpperCase();
  if (value === "SUCCESS" || value === "PAID") return "success";
  if (value === "FAILED" || value === "PAYMENT_FAILED") return "failed";
  return "pending";
}
