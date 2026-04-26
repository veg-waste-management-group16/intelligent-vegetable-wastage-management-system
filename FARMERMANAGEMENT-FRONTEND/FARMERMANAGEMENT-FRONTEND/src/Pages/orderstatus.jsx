import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../api/config';
import '../Css/orderstatus.css';

const OrderStatus = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const API_ORDER_URL = API_BASE_URL.replace('/stocks', '/orders');
  const farmerId = sessionStorage.getItem('loggedUser') 
                   ? JSON.parse(sessionStorage.getItem('loggedUser'))?.farmerId || 'F001' 
                   : 'F001';

  useEffect(() => {
    fetchOrders();
  }, [farmerId]);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_ORDER_URL}/farmer/${farmerId}`);
      if (!response.ok) {
        throw new Error('Failed to load orders');
      }
      const data = await response.json();
      setOrders(data.data || []);
    } catch (err) {
      setError(err.message || 'Error communicating with backend');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    if (!window.confirm(`Update order status to ${newStatus}?`)) return;

    try {
      const res = await fetch(`${API_ORDER_URL}/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderStatus: newStatus })
      });
      
      if (!res.ok) throw new Error('Failed to update status');

      // Update local state instead of refetching for speed
      setOrders(prev => prev.map(order => 
        order.orderId === orderId ? { ...order, orderStatus: newStatus } : order
      ));
      window.alert('Status updated successfully!');

    } catch (err) {
      window.alert('Could not update status: ' + err.message);
    }
  };

  const filteredOrders = orders.filter(o => 
    (filterStatus === '' || o.orderStatus === filterStatus) &&
    ((o.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
     (o.vegetableName || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="order-page">
      <div className="order-header">
        <h1>Stock Orders & Sales</h1>
        <p>Manage and track your incoming stock orders from clients</p>
      </div>

      <div className="order-container">
        <div className="order-controls">
          <div className="order-search">
             <input 
               type="text" 
               placeholder="Search by customer or vegetable..." 
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
                  <th>Customer Details</th>
                  <th>Vegetable Stock</th>
                  <th>Order Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan="7" style={{textAlign: 'center', padding: '30px'}}>No orders found.</td></tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.orderId}>
                      <td><strong>#{order.orderId}</strong></td>
                      <td>
                        {new Date(order.createdAt).toLocaleDateString()}
                        <div className="text-muted">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </td>
                      <td>
                        <div><strong>{order.customerName}</strong></div>
                        <div className="text-muted">{order.deliveryAddress || 'No address provided'}</div>
                      </td>
                      <td>
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
    </div>
  );
};

export default OrderStatus;
