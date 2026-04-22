import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { processPayment } from "../api";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function PaymentPage() {
  const query = useQuery();
  const navigate = useNavigate();

  const orderId = Number(query.get("orderId") || 123);
  const customerName = query.get("customerName") || "Customer";
  const amount = query.get("amount") || "500.00";
  const fromPage = query.get("from") || "/customer-dashboard";

  const [paymentMethod, setPaymentMethod] = useState("Credit/Debit Card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState("");

  const isCardPayment = paymentMethod === "Credit/Debit Card";

  const validatePaymentForm = () => {
    setError("");
    setErrorField("");

    if (!isCardPayment) {
      return true;
    }

    const normalizedCard = cardNumber.replace(/\s/g, "");

    if (!/^\d{12,19}$/.test(normalizedCard)) {
      setErrorField("cardNumber");
      setError("Card number must be 12 to 19 digits.");
      return false;
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate.trim())) {
      setErrorField("expiryDate");
      setError("Expiry date must be in MM/YY format.");
      return false;
    }

    const [month, year] = expiryDate.split("/").map(Number);
    const fullYear = 2000 + year;
    const now = new Date();
    const expiry = new Date(fullYear, month, 0, 23, 59, 59);
    if (expiry < now) {
      setErrorField("expiryDate");
      setError("Card is expired.");
      return false;
    }

    if (!/^\d{3,4}$/.test(cvv.trim())) {
      setErrorField("cvv");
      setError("CVV must be 3 digits.");
      return false;
    }

    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validatePaymentForm()) return;

    try {
      const result = await processPayment({
        orderId,
        paymentMethod,
        cardNumber: cardNumber.replace(/\s/g, ""),
        expiryDate: expiryDate.trim(),
        cvv: cvv.trim()
      });

      sessionStorage.setItem("lastPayment", JSON.stringify({ ...result, fromPage }));
      navigate(`/success?from=${encodeURIComponent(fromPage)}`);
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="center-page payment-portal">
      <div className="panel">
        <h1>Complete Your Payment 💳💰</h1>
        <h3 className="muted">Secure checkout for transaction processing 🔐💸</h3>
        <h3>
          Customer: <span className="muted">{customerName}</span>
        </h3>
        <h3>
          Order ID: <span className="muted">#{`ORD${orderId}`}</span>
        </h3>
        <h2>
          Total Amount 💵: <span className="muted">{amount}rs</span>
        </h2>

        <form onSubmit={onSubmit}>
          <div className={`field ${errorField === "paymentMethod" ? "error" : ""}`}>
            <label htmlFor="paymentMethod">Payment Method</label>
            <select id="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option>Credit/Debit Card</option>
              <option>GPay</option>
              <option>Online Transfer</option>
            </select>
          </div>

          {isCardPayment ? (
            <>
              <div className={`field ${errorField === "cardNumber" ? "error" : ""}`}>
                <label htmlFor="cardNumber">Card Number</label>
                <input
                  id="cardNumber"
                  placeholder="Enter 12-digit card number"
                  maxLength={19}
                  required
                  value={cardNumber}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 19);
                    setCardNumber(digits.replace(/(\d{4})(?=\d)/g, "$1 "));
                  }}
                />
              </div>

              <div className="inline">
                <div className={`field ${errorField === "expiryDate" ? "error" : ""}`}>
                  <label htmlFor="expiryDate">Expiry Date (MM/YY)</label>
                  <input
                    id="expiryDate"
                    placeholder="MM/YY"
                    required
                    value={expiryDate}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                      if (digits.length >= 3) {
                        setExpiryDate(`${digits.slice(0, 2)}/${digits.slice(2)}`);
                      } else {
                        setExpiryDate(digits);
                      }
                    }}
                  />
                </div>

                <div className={`field ${errorField === "cvv" ? "error" : ""}`}>
                  <label htmlFor="cvv">CVV</label>
                  <input
                    id="cvv"
                    placeholder="123"
                    maxLength={3}
                    required
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="field">
              <label>Selected Method</label>
              <input value={`${paymentMethod} selected`} disabled />
            </div>
          )}

          <div className={`form-error ${error ? "show" : ""}`}>{error}</div>

          <div style={{ textAlign: "center", marginTop: 16, display: "flex", justifyContent: "center", gap: 10 }}>
            <button className="btn btn-secondary" type="button" onClick={() => navigate(fromPage)}>
              Back
            </button>
            <button className="btn" type="submit">
              Pay Now 💸
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
