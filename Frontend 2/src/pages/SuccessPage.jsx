import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { formatDateTime } from "../utils";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function SuccessPage() {
  const query = useQuery();
  const navigate = useNavigate();
  const fromPage = query.get("from") || "/customer-dashboard";

  const raw = sessionStorage.getItem("lastPayment");
  const payment = raw ? JSON.parse(raw) : null;

  return (
    <div className="center-page">
      <div className="panel">
        <div className="success-icon">✓</div>
        <h1>Payment Successful ✅💰</h1>
        <h3 className="muted">Your transaction is complete. 🧾💸</h3>
        <h2>
          Transaction ID 🧾: <span className="muted">{payment?.transactionId || "-"}</span>
        </h2>
        <h2>
          Amount Paid 💵: <span className="muted">{`${payment?.amountPaid ?? 0}rs`}</span>
        </h2>
        <h2>
          Date: <span className="muted">{formatDateTime(payment?.paymentDate)}</span>
        </h2>

        <div style={{ textAlign: "center", marginTop: 18, display: "flex", justifyContent: "center", gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            Download Receipt
          </button>
          <button id="backBtn" className="btn" onClick={() => navigate(fromPage)}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
