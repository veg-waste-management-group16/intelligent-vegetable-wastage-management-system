import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { USER_API } from '../api';
import { BellDropdown } from '../components/shared/BellDropdown';
import { showToast } from '../components/shared/Toast';
import { Modal } from '../components/shared/Modal';
import VegLifeLogo from '../components/shared/VegLifeLogo';

// ── Farmer module pages (all self-contained, use their own CSS + farmer backend) ──
import FarmerDashboardPage from './farmer/FarmerDashboardPage';
import AddStock            from './farmer/AddStock';
import ViewStock           from './farmer/ViewStock';
import AIDemand            from './farmer/AIDemand';
import WastageReport       from './farmer/WastageReport';
import OrderStatus         from './farmer/OrderStatus';
import FarmerProfile       from './farmer/FarmerProfile';

const SL_DISTRICTS = [
  'Ampara','Anuradhapura','Badulla','Batticaloa','Colombo',
  'Galle','Gampaha','Hambantota','Jaffna','Kalutara',
  'Kandy','Kegalle','Kilinochchi','Kurunegala','Mannar',
  'Matale','Matara','Monaragala','Mullaitivu','Nuwara Eliya',
  'Polonnaruwa','Puttalam','Ratnapura','Trincomalee','Vavuniya',
];

export default function FarmerDashboard() {
  const navigate = useNavigate();
  const [user, setUser]         = useState(null);
  const [tab, setTab]           = useState('dashboard');
  const [dropOpen, setDropOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [pwOpen, setPwOpen]     = useState(false);
  const [form, setForm]         = useState({});
  const [pwForm, setPwForm]     = useState({});
  const [errs, setErrs]         = useState({});
  const [pwErrs, setPwErrs]     = useState({});
  const [saving, setSaving]     = useState(false);
  const [picPreview, setPicPreview] = useState(null);

  useEffect(() => {
    const raw = JSON.parse(sessionStorage.getItem('loggedUser') || 'null');
    if (!raw || raw.role !== 'FARMER') { navigate('/'); return; }
    // Ensure farmerId is set so farmer module pages can read it from session
    const u = { ...raw, farmerId: raw.farmerId || raw.farmerIndex || 'F001' };
    sessionStorage.setItem('loggedUser', JSON.stringify(u));
    setUser(u);
  }, []);

  useEffect(() => {
    function handler(e) { if (!e.target.closest('#farmerDropBtn')) setDropOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    function farmerNavHandler(e) { setTab(e.detail); }
    function farmerEditHandler() { openEdit(); }
    window.addEventListener('farmer-nav', farmerNavHandler);
    window.addEventListener('farmer-edit-profile', farmerEditHandler);
    return () => {
      window.removeEventListener('farmer-nav', farmerNavHandler);
      window.removeEventListener('farmer-edit-profile', farmerEditHandler);
    };
  }, []);

  function logout() { sessionStorage.removeItem('loggedUser'); navigate('/'); }

  function openEdit() {
    setForm({
      name: user.name || '',
      phone: user.phone || '',
      nic: user.nic || '',
      farmSize: user.farmSize || '',
      farmLocation: user.farmLocation || '',
      yearsOfExperience: user.yearsOfExperience || '',
      cultivatedVegetables: user.cultivatedVegetables || '',
    });
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
    if (!form.name?.trim())
      e.name = 'Full name is required.';
    if (!form.phone || !/^[0-9]{10}$/.test(form.phone))
      e.phone = 'Phone must be exactly 10 digits (e.g. 0771234567).';
    if (form.nic && !/^[0-9]{9}[VvXx]$/.test(form.nic) && !/^[0-9]{12}$/.test(form.nic))
      e.nic = 'NIC: 9 digits + V/X  or  12 digits.';
    if (!form.farmLocation)
      e.farmLocation = 'District is required.';
    if (!form.farmSize?.trim())
      e.farmSize = 'Farm name is required.';
    if (form.cultivatedAreaHectares !== undefined && form.cultivatedAreaHectares !== '' &&
        (isNaN(form.cultivatedAreaHectares) || parseFloat(form.cultivatedAreaHectares) <= 0))
      e.cultivatedAreaHectares = 'Cultivated area must be greater than 0.';
    if (Object.keys(e).length) { setErrs(e); return; }
    setSaving(true);
    try {
      const payload = { ...form, profilePicture: picPreview || user.profilePicture || null };
      const res = await fetch(`${USER_API}/${user.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
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
      const res = await fetch(`${USER_API}/change-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, currentPassword: pwForm.current, newPassword: pwForm.new })
      });
      if (res.ok) { setPwOpen(false); setPwForm({}); showToast('Password changed!'); }
      else showToast(await res.text(), true);
    } catch { showToast('Network error.', true); }
    setSaving(false);
  }

  if (!user) return null;

  // ── Pending approval screen ──────────────────────────────────
  if (user.status === 'pending') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg,#0f2206,#1a3a0a,#2d5a1b)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 20, textAlign: 'center', padding: '40px 20px'
      }}>
        <div style={{ fontSize: '4rem' }}>⏳</div>
        <h2 style={{ fontFamily: 'Playfair Display,serif', color: '#fff', fontSize: '1.8rem', fontWeight: 800 }}>
          Account Pending Approval
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '1rem', maxWidth: 420, lineHeight: 1.8 }}>
          Your farmer account <strong style={{color:'#e8a820'}}>{user.email}</strong> has been registered
          and is waiting for admin approval. You will be able to access your dashboard once approved.
        </p>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>
          Farmer ID assigned: <strong style={{color:'#8de87a'}}>{user.farmerIndex || user.farmerId || '—'}</strong>
        </p>
        <button
          onClick={() => { sessionStorage.removeItem('loggedUser'); navigate('/'); }}
          style={{
            marginTop: 12, padding: '13px 32px',
            background: 'rgba(255,255,255,0.12)',
            color: '#fff', border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 12, fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'DM Sans,sans-serif'
          }}
        >
          ← Back to Login
        </button>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: '🏠 Dashboard'        },
    { id: 'addstock',  label: '➕ Add Stock'         },
    { id: 'viewstock', label: '📦 View Stock'        },
    { id: 'aidemand',  label: '🤖 AI Demand'         },
    { id: 'wastage',   label: '📊 Financial Report'  },
    { id: 'orders',    label: '🚚 Orders'            },
  ];

  const navBtn = (id, label) => (
    <button key={id} onClick={() => setTab(id)} style={{
      background: tab === id ? 'rgba(255,255,255,0.18)' : 'transparent',
      border: tab === id ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
      color: tab === id ? 'white' : 'rgba(255,255,255,0.8)',
      padding: '8px 16px', borderRadius: 9,
      cursor: 'pointer', fontSize: '0.85rem', fontWeight: tab === id ? 700 : 500,
      fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap',
      transition: 'all 0.15s', letterSpacing: '0.1px',
    }}>{label}</button>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f4f8f0' }}>

      {/* ── Topbar ── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 68,
        background: 'var(--green-deep,#1a3a0a)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', zIndex: 200, boxShadow: '0 2px 16px rgba(0,0,0,0.25)',
        gap: 12, overflow: 'visible',
      }}>
        {/* Brand */}
        <div style={{ flexShrink: 0 }}><VegLifeLogo size="sm" /></div>

        {/* Nav tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', overflowX: 'auto', overflowY: 'visible' }}>
          {navItems.map(n => navBtn(n.id, n.label))}
        </div>

        {/* Right: bell + avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <BellDropdown role="FARMER" />

          <div id="farmerDropBtn" style={{ position: 'relative' }}>
            {/* Single avatar circle — click to open dropdown */}
            <div onClick={() => setDropOpen(v => !v)} style={{
              width: 38, height: 38, borderRadius: '50%', cursor: 'pointer',
              background: 'linear-gradient(135deg,#4a9e3f,#2d5a1b)',
              border: '2px solid rgba(255,255,255,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', flexShrink: 0,
              boxShadow: dropOpen ? '0 0 0 3px rgba(255,255,255,0.2)' : 'none',
              transition: 'box-shadow 0.2s',
            }}>
              {user.profilePicture
                ? <img src={user.profilePicture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                : <span style={{ color: 'white', fontWeight: 700, fontSize: '0.92rem' }}>
                    {(user.name || 'F').charAt(0).toUpperCase()}
                  </span>}
            </div>

            {dropOpen && (
              <div style={{
                position: 'fixed', top: 78, right: 24,
                background: 'white', borderRadius: 18, padding: '0',
                minWidth: 240, boxShadow: '0 12px 48px rgba(0,0,0,0.2)', zIndex: 9999,
                overflow: 'hidden',
              }}>
                {/* Profile header */}
                <div style={{
                  background: 'linear-gradient(135deg,#1a3a0a,#2d5a1b)',
                  padding: '18px 18px 16px', display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                  }}>
                    {user.profilePicture
                      ? <img src={user.profilePicture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                      : <span style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>
                          {(user.name || 'F').charAt(0).toUpperCase()}
                        </span>}
                  </div>
                  <div>
                    <div style={{ color: 'white', fontWeight: 700, fontSize: '0.92rem' }}>{user.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', marginTop: 2 }}>{user.email}</div>
                    <div style={{ marginTop: 5 }}>
                      <span style={{
                        background: 'rgba(74,158,63,0.35)', color: '#a0e090',
                        fontSize: '0.66rem', fontWeight: 700, padding: '2px 9px',
                        borderRadius: 20, letterSpacing: '0.5px',
                      }}>🌾 {user.farmerIndex || user.farmerId || 'FARMER'}</span>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div style={{ padding: '6px 0' }}>
                  {[
                    { icon: '👤', label: 'My Profile',       action: () => { setTab('profile'); setDropOpen(false); } },
                    { icon: '✏️', label: 'Edit Profile',     action: () => { setDropOpen(false); setTimeout(openEdit, 50); } },
                    { icon: '🔒', label: 'Change Password',  action: () => { setDropOpen(false); setTimeout(() => { setPwOpen(true); setPwForm({}); setPwErrs({}); }, 50); } },
                    null,
                    { icon: '🚪', label: 'Sign Out',         action: logout, danger: true },
                  ].map((item, i) =>
                    item === null
                      ? <div key={i} style={{ height: 1, background: '#f0f5f0', margin: '4px 0' }} />
                      : <div key={i} onClick={item.action} style={{
                          padding: '12px 18px', fontSize: '0.9rem', cursor: 'pointer',
                          color: item.danger ? '#c0392b' : '#1a3a0a',
                          fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10,
                          transition: 'background 0.15s',
                        }}
                          onMouseOver={e => e.currentTarget.style.background = item.danger ? '#fdecea' : '#f0faf0'}
                          onMouseOut={e => e.currentTarget.style.background = ''}>
                          <span style={{ fontSize: '1rem', width: 20 }}>{item.icon}</span>
                          {item.label}
                        </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Page Content ── */}
      <div style={{ paddingTop: 68 }}>

        {tab === 'dashboard' && (
          <div className="animate-fade">
            {/* Inject farmer name from session into dashboard greeting */}
            <FarmerDashboardPage />
          </div>
        )}

        {tab === 'addstock' && (
          <div className="animate-fade">
            <AddStock />
          </div>
        )}

        {tab === 'viewstock' && (
          <div className="animate-fade">
            <ViewStock />
          </div>
        )}

        {tab === 'aidemand' && (
          <div className="animate-fade">
            <AIDemand />
          </div>
        )}

        {tab === 'wastage' && (
          <div className="animate-fade">
            <WastageReport />
          </div>
        )}

        {tab === 'orders' && (
          <div className="animate-fade">
            <OrderStatus />
          </div>
        )}

        {tab === 'profile' && (
          <div className="animate-fade">
            <FarmerProfile />
          </div>
        )}
      </div>

      {/* ── Edit Profile Modal ── */}
      <Modal open={editOpen} title="Edit Farmer Profile" onClose={() => setEditOpen(false)} width={500}
        actions={<>
          <button className="btn btn-ghost" onClick={() => setEditOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </>}
      >
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div onClick={() => document.getElementById('farmerPicInput').click()} style={{
            width: 72, height: 72, borderRadius: '50%',
            background: picPreview ? 'transparent' : 'linear-gradient(135deg,#4a9e3f,#2d5a1b)',
            border: '3px solid #4a9e3f', overflow: 'hidden', cursor: 'pointer',
            margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {picPreview
              ? <img src={picPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              : <span style={{ fontSize: '1.8rem' }}>📷</span>}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-light)' }}>Click to change photo</div>
          <input id="farmerPicInput" type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={handlePic} />
        </div>
        {/* Full Name */}
        {[
          ['Full Name',            'name',                'text',   'Kamal Perera'],
          ['Phone Number',         'phone',               'tel',    '0771234567'],
          ['NIC Number',           'nic',                 'text',   '123456789V'],
        ].map(([l, id, t, ph]) => (
          <div key={id} className="form-group">
            <label className="label">{l}{['name','phone'].includes(id) && <span style={{color:'#c0392b'}}> *</span>}</label>
            <input className="input" type={t} value={form[id] || ''}
              maxLength={id === 'phone' ? 10 : undefined}
              onChange={e => { setForm(f => ({ ...f, [id]: e.target.value })); setErrs(er => ({ ...er, [id]: '' })); }}
              placeholder={ph}
              style={{ borderColor: errs[id] ? '#c0392b' : '' }} />
            {errs[id] && <div className="field-err" style={{color:'#c0392b',fontSize:'0.78rem',marginTop:4}}>⚠ {errs[id]}</div>}
          </div>
        ))}

        {/* District dropdown */}
        <div className="form-group">
          <label className="label">District <span style={{color:'#c0392b'}}>*</span></label>
          <select className="input" value={form.farmLocation || ''}
            onChange={e => { setForm(f => ({ ...f, farmLocation: e.target.value })); setErrs(er => ({ ...er, farmLocation: '' })); }}
            style={{ borderColor: errs.farmLocation ? '#c0392b' : '', background:'white' }}>
            <option value="">Select district…</option>
            {SL_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          {errs.farmLocation && <div className="field-err" style={{color:'#c0392b',fontSize:'0.78rem',marginTop:4}}>⚠ {errs.farmLocation}</div>}
        </div>

        {/* Farm name */}
        <div className="form-group">
          <label className="label">Farm Name / Village <span style={{color:'#c0392b'}}>*</span></label>
          <input className="input" type="text" value={form.farmSize || ''}
            onChange={e => { setForm(f => ({ ...f, farmSize: e.target.value })); setErrs(er => ({ ...er, farmSize: '' })); }}
            placeholder="e.g. Green Valley Farm, Peradeniya"
            style={{ borderColor: errs.farmSize ? '#c0392b' : '' }} />
          {errs.farmSize && <div className="field-err" style={{color:'#c0392b',fontSize:'0.78rem',marginTop:4}}>⚠ {errs.farmSize}</div>}
        </div>

        {/* Cultivated area & experience */}
        {[
          ['Cultivated Area (ha)', 'cultivatedAreaHectares', 'number', '2.5'],
          ['Years of Experience',  'yearsOfExperience',      'number', '10'],
          ['Cultivated Vegetables','cultivatedVegetables',   'text',   'Tomato, Carrot, Beans'],
        ].map(([l, id, t, ph]) => (
          <div key={id} className="form-group">
            <label className="label">{l}</label>
            <input className="input" type={t} value={form[id] || ''}
              onChange={e => { setForm(f => ({ ...f, [id]: e.target.value })); setErrs(er => ({ ...er, [id]: '' })); }}
              placeholder={ph}
              style={{ borderColor: errs[id] ? '#c0392b' : '' }} />
            {errs[id] && <div className="field-err" style={{color:'#c0392b',fontSize:'0.78rem',marginTop:4}}>⚠ {errs[id]}</div>}
          </div>
        ))}
      </Modal>

      {/* ── Change Password Modal ── */}
      <Modal open={pwOpen} title="Change Password" onClose={() => setPwOpen(false)} width={420}
        actions={<>
          <button className="btn btn-ghost" onClick={() => setPwOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={changePassword} disabled={saving}>{saving ? 'Changing…' : 'Change Password'}</button>
        </>}
      >
        {[['Current Password','current'],['New Password','new'],['Confirm New Password','confirm']].map(([l, id]) => (
          <div key={id} className="form-group">
            <label className="label">{l}</label>
            <input className="input" type="password" value={pwForm[id] || ''}
              onChange={e => { setPwForm(f => ({ ...f, [id]: e.target.value })); setPwErrs(er => ({ ...er, [id]: '' })); }} />
            {pwErrs[id] && <div className="field-err">{pwErrs[id]}</div>}
          </div>
        ))}
      </Modal>
    </div>
  );
}
