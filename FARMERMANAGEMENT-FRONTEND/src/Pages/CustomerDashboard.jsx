import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { USER_API } from '../api/index';
import { BellDropdown } from '../components/shared/BellDropdown';
import { showToast } from '../components/shared/Toast';
import { Modal } from '../components/shared/Modal';

export default function CustomerDashboard() {
  const navigate = useNavigate();
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
  const [picPreview, setPicPreview] = useState(null);

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

  function logout() { sessionStorage.removeItem('loggedUser'); navigate('/'); }

  function openEdit() {
    setForm({ name: user.name || '', phone: user.phone || '', nic: user.nic || '', deliveryAddress: user.deliveryAddress || '' });
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
      const payload = { ...form, profilePicture: picPreview || user.profilePicture || null };
      const res = await fetch(`${USER_API}/${user.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        const updated = await res.json();
        const newUser = { ...user, ...updated };
        setUser(newUser); sessionStorage.setItem('loggedUser', JSON.stringify(newUser));
        setEditOpen(false); showToast('✅ Profile updated!');
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
      if (res.ok) { setPwOpen(false); setPwForm({}); showToast('✅ Password changed!'); }
      else showToast(await res.text(), true);
    } catch { showToast('Network error.', true); }
    setSaving(false);
  }

  if (!user) return null;

  const navItems = [
    { id: 'marketplace', label: '🛒 Marketplace' },
    { id: 'orders',      label: '📦 My Orders' },
    { id: 'profile',     label: '👤 Profile' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Topbar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 'var(--topbar-h)', background: 'var(--green-deep)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 100, boxShadow: '0 2px 16px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.3rem', fontWeight: 800, color: 'white' }}>🌿 VegLife</span>
          {navItems.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              style={{ background: tab === n.id ? 'rgba(255,255,255,0.15)' : 'transparent', border: tab === n.id ? '1px solid rgba(255,255,255,0.25)' : '1px solid transparent', color: 'white', padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: '0.86rem', fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>
              {n.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BellDropdown role="CUSTOMER" />
          <div id="custDropBtn" style={{ position: 'relative' }}>
            <div onClick={() => setDropOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 10px', borderRadius: 10, background: dropOpen ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #f39c12, #e67e22)', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                {user.profilePicture ? <img src={user.profilePicture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{(user.name || 'C').charAt(0).toUpperCase()}</span>}
              </div>
              <div>
                <div style={{ color: 'white', fontSize: '0.88rem', fontWeight: 600 }}>{user.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>VegLife Customer</div>
              </div>
            </div>
            {dropOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'white', borderRadius: 14, padding: '8px 0', minWidth: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', zIndex: 200, animation: 'dropIn 0.15s ease' }}>
                {[['👤 My Profile', () => { setTab('profile'); setDropOpen(false); }], ['📦 My Orders', () => { setTab('orders'); setDropOpen(false); }], ['✏️ Edit Profile', openEdit], ['🔒 Change Password', () => { setPwOpen(true); setDropOpen(false); setPwForm({}); setPwErrs({}); }], null, ['🚪 Sign Out', logout]].map((item, i) =>
                  item === null ? <div key={i} style={{ height: 1, background: '#f0f0f0', margin: '6px 0' }} /> :
                  <div key={i} onClick={item[1]} style={{ padding: '10px 16px', fontSize: '0.88rem', cursor: 'pointer', color: item[0].includes('Sign') ? '#c0392b' : '#4a5c4a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}
                    onMouseOver={e => e.currentTarget.style.background = item[0].includes('Sign') ? '#fdecea' : 'var(--green-pale)'}
                    onMouseOut={e => e.currentTarget.style.background = ''}>
                    {item[0]}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ marginTop: 'var(--topbar-h)', maxWidth: 1200, margin: 'var(--topbar-h) auto 0', padding: '28px 24px' }}>
        {tab === 'marketplace' && (
          <div className="animate-fade">
            <div style={{ background: 'linear-gradient(135deg, #7f4f24, #a0522d)', borderRadius: 20, padding: '28px 32px', color: 'white', marginBottom: 24 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', fontWeight: 800, marginBottom: 6 }}>🛒 Fresh from the Farm</div>
              <div style={{ opacity: 0.8, fontSize: '0.9rem' }}>Browse and order fresh vegetables directly from verified Sri Lankan farmers</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '40px 36px' }}>
              <div style={{ fontSize: '3rem', marginBottom: 14 }}>🏪</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.3rem', color: 'var(--green-deep)', marginBottom: 8 }}>Marketplace Coming Soon</div>
              <div style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>The product marketplace is being built by the marketplace module team.</div>
            </div>
          </div>
        )}

        {tab === 'orders' && (
          <div className="animate-fade card" style={{ textAlign: 'center', padding: '48px 36px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 14 }}>📦</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.3rem', color: 'var(--green-deep)', marginBottom: 8 }}>My Orders</div>
            <div style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Order history and tracking — integration in progress.</div>
          </div>
        )}

        {tab === 'profile' && (
          <div className="animate-fade">
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
              {[['Phone', user.phone], ['NIC', user.nic], ['Delivery Address', user.deliveryAddress], ['Email', user.email]].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #f5f5f5', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--text-light)', fontWeight: 600, fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{l}</span>
                  <span style={{ fontWeight: 500 }}>{v || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
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
        {[['Full Name', 'name', 'text', 'Nimali Silva'], ['Phone Number', 'phone', 'tel', '0771234567'], ['NIC Number', 'nic', 'text', '123456789V or 12 digits'], ['Delivery Address', 'deliveryAddress', 'text', 'No. 12, Galle Road, Colombo 3']].map(([l, id, t, ph]) => (
          <div key={id} className="form-group">
            <label className="label">{l}</label>
            <input className="input" type={t} value={form[id] || ''} onChange={e => { setForm(f => ({ ...f, [id]: e.target.value })); setErrs(er => ({ ...er, [id]: '' })); }} placeholder={ph} />
            {errs[id] && <div className="field-err">{errs[id]}</div>}
          </div>
        ))}
      </Modal>

      {/* Change Password Modal */}
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
