import { useState, useEffect } from 'react';
import { Trash2, Eye, EyeOff, Plus, RefreshCw, ShoppingBag, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { DEMO_PRODUCTS } from '../../data/products';
import { showToast } from '../shared/Toast';
import styles from './ListingsTab.module.css';

const API_BASE = '/api/listings';

export default function ListingsTab({ adminUser, setSharedListings }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: 'Leafy',
    price_per_kg: '', quantity_kg: '', availability_status: 'available',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadListings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}`);
      if (res.ok) {
        const data = await res.json();
        setListings(Array.isArray(data) ? data : DEMO_PRODUCTS);
      } else {
        setListings(DEMO_PRODUCTS);
      }
    } catch {
      setListings(DEMO_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadListings(); }, []);

  const toggleVisibility = async (id, current) => {
    try {
      const res = await fetch(`${API_BASE}/${id}/visibility`, { method: 'PATCH' });
      if (res.ok) {
        setListings(prev => prev.map(l => l.listing_id === id ? { ...l, is_visible: !current } : l));
        setSharedListings && setSharedListings(prev => prev ? prev.map(l => l.listing_id === id ? { ...l, is_visible: !current } : l) : null);
        showToast(`Listing ${current ? 'hidden' : 'made visible'} ✓`);
        return;
      }
    } catch {}
    setListings(prev => prev.map(l => l.listing_id === id ? { ...l, is_visible: !current } : l));
    showToast(`Listing ${current ? 'hidden' : 'visible'} ✓ (demo)`);
  };

  const deleteListing = async (id) => {
    if (!window.confirm('Delete this listing permanently?')) return;
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setListings(prev => prev.filter(l => l.listing_id !== id));
        showToast('Listing deleted ✓');
        return;
      }
    } catch {}
    setListings(prev => prev.filter(l => l.listing_id !== id));
    showToast('Listing deleted ✓ (demo)');
  };

  const createListing = async () => {
    if (!form.title || !form.price_per_kg || !form.quantity_kg) {
      showToast('Please fill Title, Price and Quantity', true); return;
    }
    setSubmitting(true);
    const payload = {
      ...form,
      farmer_id: adminUser?.id || 1,
      price_per_kg: parseFloat(form.price_per_kg),
      quantity_kg: parseFloat(form.quantity_kg),
      is_visible: true,
      expires_at: new Date(Date.now() + 3 * 24 * 3600000).toISOString(),
    };
    const demoListing = {
      ...payload,
      listing_id: Date.now(),
      risk_level: 'LOW',
      suggested_discount: 0,
      farmer_name: adminUser?.name || 'Admin',
      farmer_location: 'Colombo',
      rating: 4.5,
      reviews: 0,
      listed_at: new Date().toISOString(),
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80',
    };
    try {
      const res = await fetch(`${API_BASE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json();
        const newItem = { ...demoListing, ...created };
        setListings(prev => [newItem, ...prev]);
        setSharedListings && setSharedListings(prev => [newItem, ...(prev || [])]);
        showToast('Listing created & saved to database! 🥬');
      } else {
        setListings(prev => [demoListing, ...prev]);
        setSharedListings && setSharedListings(prev => [demoListing, ...(prev || [])]);
        showToast('Listing created (demo mode) 🥬');
      }
    } catch {
      setListings(prev => [demoListing, ...prev]);
      setSharedListings && setSharedListings(prev => [demoListing, ...(prev || [])]);
      showToast('Listing created (demo mode — start backend to save) 🥬');
    } finally {
      setForm({ title: '', description: '', category: 'Leafy', price_per_kg: '', quantity_kg: '', availability_status: 'available' });
      setShowForm(false);
      setSubmitting(false);
    }
  };

  const recalcDiscounts = async () => {
    try {
      await fetch(`${API_BASE}/admin/recalculate-discounts`);
      showToast('Discounts recalculated ✓');
      loadListings();
    } catch {
      showToast('Recalculated (demo) ✓');
    }
  };

  const displayed = listings.filter(l => {
    if (tab === 'high') return l.risk_level === 'HIGH';
    if (tab === 'hidden') return !l.is_visible;
    return true;
  });

  const stats = {
    total: listings.length,
    visible: listings.filter(l => l.is_visible).length,
    high: listings.filter(l => l.risk_level === 'HIGH').length,
    deals: listings.filter(l => l.suggested_discount > 0).length,
  };

  const RISK_COLORS = { HIGH: '#d4722a', MEDIUM: '#e8a820', LOW: '#4a9e3f' };

  return (
    <div className={`animate-fade ${styles.page}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div>
            <div className={styles.headerBadge}>🥬 Listings Management</div>
            <h1 className={styles.headerTitle}>Product Listings</h1>
            <p className={styles.headerSub}>
              Welcome, <strong>{adminUser?.name}</strong>. Manage all vegetable listings here.
            </p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.refreshBtn} onClick={loadListings}><RefreshCw size={15} /> Refresh</button>
            <button className={styles.recalcBtn} onClick={recalcDiscounts}>⚡ Recalc Discounts</button>
            <button className={styles.addBtn} onClick={() => setShowForm(s => !s)}><Plus size={15} /> New Listing</button>
          </div>
        </div>
      </div>

      <div className={styles.body}>
        {/* Stats */}
        <div className={styles.statsRow}>
          {[
            { icon: <ShoppingBag size={22}/>, value: stats.total,   label: 'Total Listings',    color: '#2d5a1b' },
            { icon: <CheckCircle size={22}/>, value: stats.visible, label: 'Visible to Market',  color: '#4a9e3f' },
            { icon: <AlertTriangle size={22}/>, value: stats.high,  label: 'High Risk (Urgent)', color: '#d4722a' },
            { icon: <Users size={22}/>,       value: stats.deals,   label: 'Active Deals',       color: '#e8a820' },
          ].map((s, i) => (
            <div className={styles.statCard} key={i}>
              <div className={styles.statIcon} style={{ color: s.color }}>{s.icon}</div>
              <div className={styles.statVal} style={{ color: s.color }}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Create form */}
        {showForm && (
          <div className={styles.formCard}>
            <h3 className={styles.formTitle}>➕ Create New Listing</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Title *</label>
                <input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} placeholder="e.g. Fresh Kankun" className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <label>Category *</label>
                <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))} className={styles.input}>
                  {['Leafy','Root','Gourd','Fruiting','Herb'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Price per kg (Rs.) *</label>
                <input type="number" value={form.price_per_kg} onChange={e => setForm(p => ({...p, price_per_kg: e.target.value}))} placeholder="150" className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <label>Quantity (kg) *</label>
                <input type="number" value={form.quantity_kg} onChange={e => setForm(p => ({...p, quantity_kg: e.target.value}))} placeholder="50" className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <label>Status</label>
                <select value={form.availability_status} onChange={e => setForm(p => ({...p, availability_status: e.target.value}))} className={styles.input}>
                  <option value="available">Available</option>
                  <option value="low">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
              <div className={`${styles.formGroup} ${styles.fullSpan}`}>
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="Describe the product..." className={styles.textarea} rows={3} />
              </div>
            </div>
            <div className={styles.formActions}>
              <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
              <button className={styles.submitBtn} onClick={createListing} disabled={submitting}>
                {submitting ? 'Creating...' : '✓ Create Listing'}
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className={styles.tabs}>
          {[
            { key: 'all',    label: `All Listings (${stats.total})` },
            { key: 'high',   label: `🔥 High Risk (${stats.high})` },
            { key: 'hidden', label: `👁 Hidden (${listings.length - stats.visible})` },
          ].map(t => (
            <button key={t.key} className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className={styles.loading}>Loading listings…</div>
        ) : displayed.length === 0 ? (
          <div className={styles.empty}>No listings in this category.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th><th>Category</th><th>Price/kg</th><th>Qty (kg)</th>
                  <th>Risk</th><th>Discount</th><th>Status</th><th>Visible</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(l => (
                  <tr key={l.listing_id} className={!l.is_visible ? styles.hiddenRow : ''}>
                    <td>
                      <div className={styles.productCell}>
                        <img src={l.image} alt={l.title} className={styles.thumb}
                          onError={e => e.target.src='https://images.unsplash.com/photo-1540420773420-3366772f4999?w=80&q=60'} />
                        <div>
                          <div className={styles.productName}>{l.title}</div>
                          <div className={styles.productFarmer}>📍 {l.farmer_location || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={styles.catBadge}>{l.category}</span></td>
                    <td className={styles.price}>Rs. {l.price_per_kg}</td>
                    <td>{l.quantity_kg} kg</td>
                    <td>
                      <span className={styles.riskBadge} style={{ background: RISK_COLORS[l.risk_level] || '#4a9e3f' }}>
                        {l.risk_level}
                      </span>
                    </td>
                    <td>{l.suggested_discount > 0 ? <span className={styles.discountBadge}>{l.suggested_discount}%</span> : '—'}</td>
                    <td>
                      <span className={styles.statusDot} style={{ background: l.availability_status === 'available' ? '#4a9e3f' : l.availability_status === 'low' ? '#e8a820' : '#c0392b' }} />
                      {l.availability_status}
                    </td>
                    <td>
                      <button
                        className={`${styles.visBtn} ${l.is_visible ? styles.visBtnOn : styles.visBtnOff}`}
                        onClick={() => toggleVisibility(l.listing_id, l.is_visible)}
                        title={l.is_visible ? 'Hide this listing' : 'Show this listing'}
                      >
                        {l.is_visible ? <Eye size={14}/> : <EyeOff size={14}/>}
                        {l.is_visible ? 'Visible' : 'Hidden'}
                      </button>
                    </td>
                    <td>
                      <button className={styles.deleteBtn} onClick={() => deleteListing(l.listing_id)} title="Delete listing">
                        <Trash2 size={14}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
