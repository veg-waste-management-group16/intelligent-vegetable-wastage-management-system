import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../api/farmerConfig';
import '../../Css/orderstatus.css';

const PAY_API = '/api/payments';

const OrderStatus = () => {
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'deliveries'

  const API_ORDER_URL = API_BASE_URL.replace('/stocks', '/orders');
  const farmerId = (() => {
    try { const u = JSON.parse(sessionStorage.getItem('loggedUser')||'{}'); return u.farmerId || u.farmerIndex || 'F001'; }
    catch { return 'F001'; }
  })();

  useEffect(() => { fetchOrders(); fetchDeliveryInfo(); }, [farmerId]);

  const fetchOrders = async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch(`${API_ORDER_URL}/farmer/${farmerId}`);
      if (!response.ok) throw new Error('Failed to load orders');
      const data = await response.json();
      setOrders(data.data || []);
    } catch (err) {
      setError(err.message || 'Error communicating with backend');
    } finally { setLoading(false); }
  };

  const fetchDeliveryInfo = async () => {
    try {
      const res = await fetch(`${PAY_API}/orders/farmer-delivery/${farmerId}`);
      if (res.ok) setDeliveries(await res.json());
    } catch { /* silent — delivery info is supplementary */ }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    if (!window.confirm(`Update order status to ${newStatus}?`)) return;
    try {
      const res = await fetch(`${API_ORDER_URL}/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      setOrders(prev => prev.map(order =>
        order.orderId === orderId ? { ...order, orderStatus: newStatus } : order
      ));
      window.alert('Status updated successfully!');
    } catch (err) { window.alert('Could not update status: ' + err.message); }
  };

  const filteredOrders = orders.filter(o =>
    (filterStatus === '' || o.orderStatus === filterStatus) &&
    ((o.vegetableName || '').toLowerCase().includes(searchQuery.toLowerCase()))
    // NOTE: customer name intentionally excluded from search to protect privacy
  );

  const tabStyle = active => ({
    padding:'10px 22px', borderRadius:10, border:'none', fontSize:'0.88rem', fontWeight:700,
    cursor:'pointer', transition:'all 0.15s',
    background: active ? 'linear-gradient(135deg,#2d5a1b,#4a9e3f)' : '#f0f5f0',
    color: active ? 'white' : '#4a5c4a',
    boxShadow: active ? '0 2px 8px rgba(45,90,27,0.3)' : 'none',
  });

  return (
    <div className="order-page">
      <div className="order-header">
        <h1>Stock Orders & Deliveries</h1>
        <p>Manage incoming stock orders and check pickup schedules</p>
      </div>

      {/* Tab switcher */}
      <div style={{ display:'flex', gap:10, marginBottom:20, padding:'0 4px' }}>
        <button style={tabStyle(activeTab==='orders')} onClick={()=>setActiveTab('orders')}>
          📦 My Orders
        </button>
        <button style={tabStyle(activeTab==='deliveries')} onClick={()=>setActiveTab('deliveries')}>
          🚚 Pickup & Delivery Schedule
        </button>
      </div>

      {activeTab === 'orders' && (
        <div className="order-container">
          <div className="order-controls">
            <div className="order-search">
              <input
                type="text"
                placeholder="Search by vegetable name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="order-filter">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="READY">Ready for Pickup</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p className="order-status-text">Loading your orders...</p>
          ) : error ? (
            <p className="order-status-text order-status-error" role="alert">
              <span className="warning-icon" aria-hidden="true">!</span>
              <span>{error}</span>
            </p>
          ) : (
            <div className="order-table-wrapper">
              <table className="order-table">
                <thead>
                  <tr>
                    <th>Order Ref</th>
                    <th>Date & Time</th>
                    <th>Vegetable Stock</th>
                    <th>Order Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr><td colSpan="6" style={{textAlign: 'center', padding: '30px'}}>No orders found.</td></tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order.orderId}>
                        <td><strong>#{order.orderId}</strong></td>
                        <td>
                          {new Date(order.createdAt).toLocaleDateString()}
                          <div className="text-muted">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </td>
                        <td>
                          {/* Customer name/address intentionally hidden from farmer */}
                          <div><strong>{order.quantityKg} kg of {order.vegetableName}</strong></div>
                          <div className="text-muted">Stock ID: {order.stockId}</div>
                        </td>
                        <td>
                          <div>Rs. {order.totalAmount}</div>
                          <div className="text-muted">via {order.paymentMethod}</div>
                        </td>
                        <td>
                          <span className={`status-badge status-${(order.orderStatus || '').toLowerCase()}`}>
                            {order.orderStatus}
                          </span>
                        </td>
                        <td>
                          {order.orderStatus === 'PENDING' && (
                            <button className="action-btn btn-update" onClick={() => handleStatusUpdate(order.orderId, 'CONFIRMED')}>Confirm</button>
                          )}
                          {order.orderStatus === 'CONFIRMED' && (
                            <button className="action-btn btn-update" onClick={() => handleStatusUpdate(order.orderId, 'READY')}>Mark Ready</button>
                          )}
                          {order.orderStatus === 'READY' && (
                            <button className="action-btn btn-update" onClick={() => handleStatusUpdate(order.orderId, 'DISPATCHED')}>Dispatch</button>
                          )}
                          {order.orderStatus === 'DISPATCHED' && (
                            <button className="action-btn btn-update" onClick={() => handleStatusUpdate(order.orderId, 'DELIVERED')}>Delivered</button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'deliveries' && (
        <div className="order-container">
          <div style={{ background:'#fff3e0', border:'1px solid #ffd080', borderRadius:12,
            padding:'12px 16px', marginBottom:18, fontSize:'0.84rem', color:'#7d5300' }}>
            ℹ️ This shows pickup dates and delivery agent details assigned by admin. Customer information is not shown here.
          </div>

          {deliveries.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px 24px', color:'#8a9e8a' }}>
              <div style={{ fontSize:'2.5rem', marginBottom:12 }}>🚚</div>
              <div style={{ fontWeight:700, marginBottom:6 }}>No delivery schedules yet</div>
              <div style={{ fontSize:'0.88rem' }}>Pickup dates will appear here once admin assigns a delivery agent to your orders.</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {deliveries.map(d => (
                <div key={d.orderId} style={{ background:'white', borderRadius:14, border:'1px solid #e0f0da',
                  boxShadow:'0 2px 8px rgba(26,58,10,0.06)', padding:'18px 22px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
                    <div>
                      <div style={{ fontWeight:800, color:'#1a3a0a', marginBottom:4 }}>Order #ORD{d.orderId}</div>
                      <div style={{ fontSize:'0.82rem', color:'#8a9e8a' }}>
                        Order Date: {d.orderDate ? new Date(d.orderDate).toLocaleDateString('en-LK') : '—'}
                      </div>
                    </div>
                    {d.pickupDate && (
                      <div style={{ background:'#e8f5e9', borderRadius:10, padding:'10px 18px', textAlign:'center' }}>
                        <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#4a9e3f', textTransform:'uppercase', letterSpacing:'0.5px' }}>📅 Pickup Date</div>
                        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.2rem', fontWeight:800, color:'#2d5a1b', marginTop:4 }}>
                          {new Date(d.pickupDate + 'T00:00:00').toLocaleDateString('en-LK',{day:'numeric',month:'short',year:'numeric'})}
                        </div>
                      </div>
                    )}
                  </div>

                  {d.agentName && (
                    <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid #e0f0da',
                      display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'10px 24px',
                      fontSize:'0.84rem', color:'#4a5c4a' }}>
                      <div>
                        <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#8a9e8a', textTransform:'uppercase', marginBottom:3 }}>Delivery Agent</div>
                        <div style={{ fontWeight:700, color:'#1a3a0a' }}>{d.agentName}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#8a9e8a', textTransform:'uppercase', marginBottom:3 }}>Contact</div>
                        <div>📞 {d.agentPhone}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#8a9e8a', textTransform:'uppercase', marginBottom:3 }}>Vehicle</div>
                        <div>🚗 {d.agentVehicle}</div>
                      </div>
                      {d.deliveryStatus && (
                        <div>
                          <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#8a9e8a', textTransform:'uppercase', marginBottom:3 }}>Status</div>
                          <span style={{ background:'#e3f2fd', color:'#1976d2', fontSize:'0.76rem', fontWeight:700,
                            padding:'3px 10px', borderRadius:20, textTransform:'uppercase', display:'inline-block' }}>
                            {d.deliveryStatus}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderStatus;
