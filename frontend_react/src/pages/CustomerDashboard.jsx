import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { USER_API } from '../api';
import { BellDropdown } from '../components/shared/BellDropdown';
import { showToast } from '../components/shared/Toast';
import { Modal } from '../components/shared/Modal';
import { AppProvider, useApp } from '../context/AppContext';
import MarketPage from './MarketPage';
import CartDrawer from '../components/market/CartDrawer';
import MyOrders   from '../components/market/MyOrders';
import VegLifeLogo from '../components/shared/VegLifeLogo';

function CustomerDashboardInner() {
  const navigate = useNavigate();
  const { cartCount, setCartOpen, setUser: setCtxUser } = useApp();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('marketplace');
  const [dropOpen, setDropOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [form, setForm] = useState({});
  const [pwForm, setPwForm] = useState({});
  const [errs, setErrs] = useState({});
  const [pwErrs, setPwErrs] = useState({});
  const [saving, setSaving] = useState(false);
  const [sameAsDelivery, setSameAsDelivery] = useState(false);
  const [picPreview, setPicPreview] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const u = JSON.parse(sessionStorage.getItem('loggedUser') || 'null');
    if (!u || u.role !== 'CUSTOMER') { navigate('/'); return; }
    setUser(u);
  }, []);

  useEffect(() => {
    function handler(e) { if (!e.target.closest('#custDropBtn')) setDropOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function logout() {
    sessionStorage.removeItem('loggedUser');
    setCtxUser(null);
    navigate('/');
  }

  function openEdit() {
    const delivAddr = user.deliveryAddress || '';
    const billAddr  = user.billingAddress  || '';
    const same = delivAddr === '' || delivAddr === billAddr;
    setForm({ name: user.name || '', phone: user.phone || '', nic: user.nic || '', billingAddress: billAddr, deliveryAddress: delivAddr });
    setSameAsDelivery(same);
    setPicPreview(user.profilePicture || null);
    setErrs({}); setEditOpen(true); setDropOpen(false);
  }

  function handlePic(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('Image must be under 2MB.', true); return; }
    const reader = new FileReader();
    reader.onload = ev => setPicPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    const e = {};
    if (!form.name?.trim()) e.name = 'Name is required.';
    if (!/^[0-9]{10}$/.test(form.phone)) e.phone = 'Phone must be 10 digits.';
    if (!/^[0-9]{9}[VvXx]$/.test(form.nic) && !/^[0-9]{12}$/.test(form.nic)) e.nic = 'Invalid NIC.';
    if (Object.keys(e).length) { setErrs(e); return; }
    setSaving(true);
    try {
      const finalDelivery = sameAsDelivery ? form.billingAddress : (form.deliveryAddress || form.billingAddress);
      const payload = { ...form, deliveryAddress: finalDelivery, profilePicture: picPreview || user.profilePicture || null };
      const res = await fetch(`${USER_API}/${user.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        const updated = await res.json();
        const newUser = { ...user, ...updated };
        setUser(newUser); sessionStorage.setItem('loggedUser', JSON.stringify(newUser));
        setEditOpen(false); showToast('Profile updated!');
      } else showToast(await res.text(), true);
    } catch { showToast('Network error.', true); }
    setSaving(false);
  }

  async function changePassword() {
    const e = {};
    if (!pwForm.current) e.current = 'Current password required.';
    if (!pwForm.new || pwForm.new.length < 6) e.new = 'Min 6 characters.';
    if (pwForm.new !== pwForm.confirm) e.confirm = 'Passwords do not match.';
    if (Object.keys(e).length) { setPwErrs(e); return; }
    setSaving(true);
    try {
      const res = await fetch(`${USER_API}/change-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, currentPassword: pwForm.current, newPassword: pwForm.new }) });
      if (res.ok) { setPwOpen(false); setPwForm({}); showToast('Password changed!'); }
      else showToast(await res.text(), true);
    } catch { showToast('Network error.', true); }
    setSaving(false);
  }

  if (!user) return null;

  const navItems = [
    { id: 'marketplace', label: '🛒 Marketplace' },
    { id: 'orders',      label: '📦 My Orders'  },
    { id: 'profile',     label: '👤 Profile'    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 'var(--topbar-h)', background: 'var(--green-deep)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 100, boxShadow: '0 2px 16px rgba(0,0,0,0.25)', overflow: 'visible' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <VegLifeLogo size="sm" />
          {navItems.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              style={{ background: tab === n.id ? 'rgba(255,255,255,0.15)' : 'transparent', border: tab === n.id ? '1px solid rgba(255,255,255,0.25)' : '1px solid transparent', color: 'white', padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: '0.86rem', fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>
              {n.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setCartOpen(true)}
            style={{ position: 'relative', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.86rem', fontWeight: 600 }}
          >
            🛒 Cart
            {cartCount > 0 && (
              <span style={{ background: '#d4722a', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, position: 'absolute', top: -6, right: -6 }}>
                {cartCount}
              </span>
            )}
          </button>
          <BellDropdown role="CUSTOMER" />
          <div id="custDropBtn" style={{ position: 'relative' }}>
            <div onClick={() => setDropOpen(v => !v)} style={{ width: 38, height: 38, borderRadius: '50%', cursor: 'pointer', background: 'linear-gradient(135deg,#f39c12,#e67e22)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, boxShadow: dropOpen ? '0 0 0 3px rgba(255,255,255,0.2)' : 'none', transition: 'box-shadow 0.2s' }}>
              {user.profilePicture ? <img src={user.profilePicture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <span style={{ color: 'white', fontWeight: 700, fontSize: '0.92rem' }}>{(user.name || 'C').charAt(0).toUpperCase()}</span>}
            </div>
            {dropOpen && (
              <div style={{ position: 'fixed', top: 78, right: 24, background: 'white', borderRadius: 18, padding: '0', minWidth: 240, boxShadow: '0 12px 48px rgba(0,0,0,0.2)', zIndex: 9999, overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(135deg,#e67e22,#f39c12)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {user.profilePicture ? <img src={user.profilePicture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <span style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>{(user.name || 'C').charAt(0).toUpperCase()}</span>}
                  </div>
                  <div>
                    <div style={{ color: 'white', fontWeight: 700, fontSize: '0.92rem' }}>{user.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', marginTop: 2 }}>{user.email}</div>
                    <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.66rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, marginTop: 4, display: 'inline-block' }}>🛒 Customer</span>
                  </div>
                </div>
                <div style={{ padding: '6px 0' }}>
                {[
                  ['👤 My Profile',      () => { setTab('profile');     setDropOpen(false); }],
                  ['📦 My Orders',       () => { setTab('orders');      setDropOpen(false); }],
                  ['🛒 Marketplace',     () => { setTab('marketplace'); setDropOpen(false); }],
                  ['✏️ Edit Profile',    openEdit],
                  ['🔒 Change Password', () => { setPwOpen(true); setDropOpen(false); setPwForm({}); setPwErrs({}); }],
                  null,
                  ['🚪 Sign Out',        logout],
                ].map((item, i) =>
                  item === null
                    ? <div key={i} style={{ height: 1, background: '#f0f5f0', margin: '4px 0' }} />
                    : <div key={i} onClick={item[1]} style={{ padding: '11px 18px', fontSize: '0.9rem', cursor: 'pointer', color: item[0].includes('Sign') ? '#c0392b' : '#1a3a0a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10 }}
                        onMouseOver={e => e.currentTarget.style.background = item[0].includes('Sign') ? '#fdecea' : '#f0faf0'}
                        onMouseOut={e => e.currentTarget.style.background = ''}>
                        {item[0]}
                      </div>
                )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <CartDrawer setCurrentPage={(p) => { if (p === 'market') setTab('marketplace'); }} />

      <div style={{ paddingTop: 'var(--topbar-h)' }}>
        {tab === 'marketplace' && (
          <div className="animate-fade">
            <MarketPage ref={searchRef} />
          </div>
        )}

        {tab === 'orders' && (
          <div className="animate-fade" style={{ paddingTop: 32 }}>
            <MyOrders user={user} />
          </div>
        )}

        {tab === 'profile' && (
          <div className="animate-fade" style={{ maxWidth: 900, margin: '40px auto', padding: '0 24px' }}>
            <div className="page-header">
              <div><div className="page-title">My Profile</div><div className="page-sub">Manage your account details</div></div>
              <button className="btn btn-primary" onClick={openEdit}>✏️ Edit Profile</button>
            </div>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #f39c12, #e67e22)', border: '3px solid #f39c12', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {user.profilePicture ? <img src={user.profilePicture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <span style={{ color: 'white', fontWeight: 700, fontSize: '2rem' }}>{(user.name || 'C').charAt(0).toUpperCase()}</span>}
                </div>
                <div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.4rem', fontWeight: 700, color: 'var(--green-deep)' }}>{user.name}</div>
                  <div style={{ color: 'var(--text-light)', fontSize: '0.86rem', marginTop: 4 }}>{user.email}</div>
                  <span className={`status-badge status-${user.status}`} style={{ marginTop: 8, display: 'inline-block' }}>{user.status}</span>
                </div>
              </div>
              {[['Phone', user.phone], ['NIC', user.nic], ['Billing Address', user.billingAddress], ['Delivery Address', user.deliveryAddress || (user.billingAddress ? '(Same as billing)' : '—')], ['Email', user.email]].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #f5f5f5', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--text-light)', fontWeight: 600, fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{l}</span>
                  <span style={{ fontWeight: 500 }}>{v || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal open={editOpen} title="Edit Profile" onClose={() => setEditOpen(false)} width={460}
        actions={<>
          <button className="btn btn-ghost" onClick={() => setEditOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </>}
      >
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div onClick={() => document.getElementById('custPicInput').click()} style={{ width: 72, height: 72, borderRadius: '50%', background: picPreview ? 'transparent' : 'linear-gradient(135deg, #f39c12, #e67e22)', border: '3px solid #f39c12', overflow: 'hidden', cursor: 'pointer', margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {picPreview ? <img src={picPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <span style={{ fontSize: '1.8rem' }}>📷</span>}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-light)' }}>Click to change photo</div>
          <input id="custPicInput" type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={handlePic} />
        </div>
        {[['Full Name', 'name', 'text', 'Nimali Silva'], ['Phone Number', 'phone', 'tel', '0771234567'], ['NIC Number', 'nic', 'text', '123456789V or 12 digits']].map(([l, id, t, ph]) => (
          <div key={id} className="form-group">
            <label className="label">{l}</label>
            <input className="input" type={t} value={form[id] || ''} onChange={e => { setForm(f => ({ ...f, [id]: e.target.value })); setErrs(er => ({ ...er, [id]: '' })); }} placeholder={ph} />
            {errs[id] && <div className="field-err">{errs[id]}</div>}
          </div>
        ))}

        {/* Billing Address */}
        <div className="form-group">
          <label className="label">🏠 Billing Address</label>
          <input className="input" type="text" value={form.billingAddress || ''}
            onChange={e => {
              const val = e.target.value;
              setForm(f => ({ ...f, billingAddress: val, ...(sameAsDelivery ? { deliveryAddress: val } : {}) }));
              setErrs(er => ({ ...er, billingAddress: '' }));
            }}
            placeholder="No. 12, Galle Road, Colombo 3" />
          {errs.billingAddress && <div className="field-err">{errs.billingAddress}</div>}
        </div>

        {/* Same as billing checkbox */}
        <div style={{ display:'flex', alignItems:'center', gap:10, margin:'-6px 0 12px', cursor:'pointer' }}
          onClick={() => {
            const next = !sameAsDelivery;
            setSameAsDelivery(next);
            if (next) setForm(f => ({ ...f, deliveryAddress: f.billingAddress }));
          }}>
          <div style={{ width:18, height:18, borderRadius:5, border:'2px solid #4a9e3f',
            background: sameAsDelivery ? '#4a9e3f' : 'white', display:'flex', alignItems:'center',
            justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
            {sameAsDelivery && <span style={{ color:'white', fontSize:'0.75rem', fontWeight:900 }}>✓</span>}
          </div>
          <span style={{ fontSize:'0.84rem', color:'#4a5c4a', fontWeight:500, userSelect:'none' }}>
            Delivery address same as billing address
          </span>
        </div>

        {/* Delivery Address — only shown when not same as billing */}
        {!sameAsDelivery && (
          <div className="form-group">
            <label className="label">🚚 Delivery Address</label>
            <input className="input" type="text" value={form.deliveryAddress || ''}
              onChange={e => { setForm(f => ({ ...f, deliveryAddress: e.target.value })); setErrs(er => ({ ...er, deliveryAddress: '' })); }}
              placeholder="Enter a different delivery address" />
            {errs.deliveryAddress && <div className="field-err">{errs.deliveryAddress}</div>}
          </div>
        )}
      </Modal>

      <Modal open={pwOpen} title="Change Password" onClose={() => setPwOpen(false)} width={420}
        actions={<>
          <button className="btn btn-ghost" onClick={() => setPwOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={changePassword} disabled={saving}>{saving ? 'Changing…' : 'Change Password'}</button>
        </>}
      >
        {[['Current Password', 'current'], ['New Password', 'new'], ['Confirm New Password', 'confirm']].map(([l, id]) => (
          <div key={id} className="form-group">
            <label className="label">{l}</label>
            <input className="input" type="password" value={pwForm[id] || ''} onChange={e => { setPwForm(f => ({ ...f, [id]: e.target.value })); setPwErrs(er => ({ ...er, [id]: '' })); }} />
            {pwErrs[id] && <div className="field-err">{pwErrs[id]}</div>}
          </div>
        ))}
      </Modal>
    </div>
  );
}

export default function CustomerDashboard() {
  return (
    <AppProvider>
      <CustomerDashboardInner />
    </AppProvider>
  );
}
