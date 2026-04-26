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
  const farmerId = JSON.parse(sessionStorage.getItem('loggedUser') || '{}')?.farmerId || '';

  useEffect(() => {
    if (!farmerId) {
      setError('Farmer not logged in.');
      setOrders([]);
      return;
    }
    fetchOrders();
  }, [farmerId]);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_ORDER_URL}/farmer/${farmerId}`);
      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Failed to load orders');
      }

      setOrders(Array.isArray(result.data) ? result.data : []);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus })
      });

      const result = await res.json();

      if (!res.ok || result.success === false) {
        throw new Error(result.message || 'Failed to update status');
      }

      setOrders(prev =>
        prev.map(order =>
          order.orderId === orderId ? { ...order, orderStatus: newStatus } : order
        )
      );
      window.alert('Status updated successfully!');
    } catch (err) {
      window.alert('Could not update status: ' + err.message);
    }
  };

  const safeDate = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString();
  };

  const safeTime = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredOrders = orders.filter(o =>
    (filterStatus === '' || o.orderStatus === filterStatus) &&
    ((o.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.vegetableName || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="order-page">
      {/* your existing JSX, only replace createdAt lines below */}
      {/* {safeDate(order.createdAt)} */}
      {/* <div className="text-muted">{safeTime(order.createdAt)}</div> */}
    </div>
  );
};

export default OrderStatus;