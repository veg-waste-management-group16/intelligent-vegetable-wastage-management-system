import { useEffect, useMemo, useState } from "react";
import {
  approveOrder,
  getAdminReportUrl,
  getAdminRequests,
  getOverview,
  rejectOrder
} from "../api";
import { formatDateTime } from "../utils";

function StatCard({ id, label, count, active, onClick }) {
  return (
    <div id={id} className={`stat-card clickable ${active ? "active" : ""}`} onClick={onClick}>
      {label}: <strong>{count}</strong>
    </div>
  );
}

export default function AdminPage() {
  const [filter, setFilter] = useState("ALL");
  const [transactions, setTransactions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0
  });

  const filteredTransactions = useMemo(() => {
    if (filter === "ALL") return transactions;
    return transactions.filter((t) => t.paymentStatus === filter);
  }, [filter, transactions]);

  const loadDashboard = async () => {
    const data = await getOverview();
    setCounts({
      totalTransactions: data.totalTransactions,
      successfulTransactions: data.successfulTransactions,
      failedTransactions: data.failedTransactions
    });
    setTransactions(data.transactionHistory || []);
    setRequests(await getAdminRequests());
  };

  useEffect(() => {
    loadDashboard().catch((e) => alert(e.message));
  }, []);

  const onApprove = async (orderId) => {
    try {
      await approveOrder(orderId);
      await loadDashboard();
    } catch (e) {
      alert(e.message);
    }
  };

  const onReject = async (orderId) => {
    try {
      await rejectOrder(orderId);
      await loadDashboard();
    } catch (e) {
      alert(e.message);
    }
  };

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Admin Panel</h2>
        <button type="button" className="sidebar-nav-btn" onClick={() => scrollToSection("overviewSection")}>
          Dashboard
        </button>
        <button type="button" className="sidebar-nav-btn" onClick={() => scrollToSection("transactionsSection")}>
          Transactions
        </button>
        <button type="button" className="sidebar-nav-btn" onClick={() => scrollToSection("reportsSection")}>
          Reports
        </button>
      </aside>

      <main className="content admin-dashboard">
        <h1 id="overviewSection">Transaction Overview</h1>
        <div className="cards" style={{ marginBottom: 20 }}>
          <StatCard
            id="card-all"
            label="Total Transactions"
            count={counts.totalTransactions}
            active={filter === "ALL"}
            onClick={() => setFilter("ALL")}
          />
          <StatCard
            id="card-success"
            label="Successful"
            count={counts.successfulTransactions}
            active={filter === "SUCCESS"}
            onClick={() => setFilter("SUCCESS")}
          />
          <StatCard
            id="card-failed"
            label="Failed"
            count={counts.failedTransactions}
            active={filter === "FAILED"}
            onClick={() => setFilter("FAILED")}
          />
        </div>

        <div className="table-wrap" id="transactionsSection">
          <h3>Transactions</h3>
          <table>
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Order ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="5">No transactions for this filter</td>
                </tr>
              ) : (
                filteredTransactions.map((item, idx) => (
                  <tr key={`${item.transactionId || idx}-${item.orderId}`}>
                    <td>{item.transactionId || "-"}</td>
                    <td>{`ORD${item.orderId}`}</td>
                    <td>{`${item.amountPaid ?? 0}rs`}</td>
                    <td className={item.paymentStatus === "SUCCESS" ? "status-success" : ""}>
                      {item.paymentStatus}
                    </td>
                    <td>{formatDateTime(item.paymentDate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="table-wrap" style={{ marginTop: 16 }}>
          <h3>Customer Requests (Admin Approval)</h3>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Order Status</th>
                <th>Payment</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="6">No customer requests</td>
                </tr>
              ) : (
                requests.map((item) => {
                  const approved = item.orderStatus === "APPROVED";
                  const rejected = item.orderStatus === "REJECTED";
                  const successPaid = item.paymentStatus === "SUCCESS";
                  const disableApprove = approved || rejected || successPaid;
                  const disableReject = rejected || successPaid;

                  return (
                    <tr key={item.orderId}>
                      <td>{`ORD${item.orderId}`}</td>
                      <td>
                        {item.customerName}
                        <br />
                        <span className="muted">{item.customerEmail}</span>
                      </td>
                      <td>{`${item.amount ?? 0}rs`}</td>
                      <td>{item.orderStatus}</td>
                      <td>{item.paymentStatus}</td>
                      <td>
                        <button
                          className="btn"
                          disabled={disableApprove}
                          style={disableApprove ? { background: "#8aa18f", cursor: "not-allowed" } : undefined}
                          onClick={() => onApprove(item.orderId)}
                        >
                          Approve
                        </button>
                        <button
                          className="btn"
                          disabled={disableReject}
                          style={
                            disableReject
                              ? { background: "#8aa18f", cursor: "not-allowed", marginLeft: 6 }
                              : { marginLeft: 6 }
                          }
                          onClick={() => onReject(item.orderId)}
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <div style={{ marginTop: 8 }} className="muted">
            Approve customer request before payment is allowed.
          </div>
        </div>

        <div className="table-wrap" id="reportsSection" style={{ marginTop: 16 }}>
          <h3>Reports</h3>
          <p className="muted">Generate full transaction report (payments + rejected requests).</p>
          <a className="btn-link" href={getAdminReportUrl()}>
            Generate Report
          </a>
        </div>
      </main>
    </div>
  );
}
