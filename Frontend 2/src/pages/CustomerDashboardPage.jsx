import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCustomerDashboardCards } from "../api";
import { pillClass } from "../utils";

export default function CustomerDashboardPage() {
  const [cards, setCards] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getCustomerDashboardCards()
      .then(setCards)
      .catch((e) => alert(e.message));
  }, []);

  return (
    <div className="content customer-dashboard">
      <div className="customer-dashboard-header">
        <h1>Customer Order Payment Dashboard</h1>
        <p className="muted">Admin-approved orders can proceed to payment.</p>
      </div>
      {cards.length === 0 ? (
        <p>No customer records found.</p>
      ) : (
        <div className="customer-grid">
          {cards.map((card, idx) => {
            const pendingApproval =
              card.orderStatus && card.orderStatus !== "APPROVED" && card.paymentStatus !== "SUCCESS";

            return (
              <div className="customer-card" key={`${card.orderId || idx}-${card.email}`}>
                <h3>{card.name}</h3>
                <p>{card.email}</p>
                <p>Order: {card.orderId ? `ORD${card.orderId}` : "-"}</p>
                <p>Amount: {card.totalAmount ?? 0}rs</p>
                <p>
                  Order Status: <span className={`status-pill ${pillClass(card.orderStatus)}`}>{card.orderStatus ?? "N/A"}</span>
                </p>
                <p>
                  Payment Status: <span className={`status-pill ${pillClass(card.paymentStatus)}`}>{card.paymentStatus ?? "PENDING"}</span>
                </p>
                {card.canProcessPayment && card.orderId ? (
                  <button
                    className="btn"
                    onClick={() =>
                      navigate(
                        `/payment?orderId=${card.orderId}&customerName=${encodeURIComponent(card.name)}&amount=${card.totalAmount ?? 0}&from=/customer-dashboard`
                      )
                    }
                  >
                    Process Payment
                  </button>
                ) : (
                  <button className="btn" disabled style={{ background: "#8aa18f", cursor: "not-allowed" }}>
                    {pendingApproval ? "Waiting Admin Approval" : "Already Paid / No Order"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
