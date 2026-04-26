import { useState, useEffect } from 'react';
import { Modal } from '../shared/Modal';

const SL_DISTRICTS = [
  'Ampara','Anuradhapura','Badulla','Batticaloa','Colombo',
  'Galle','Gampaha','Hambantota','Jaffna','Kalutara',
  'Kandy','Kegalle','Kilinochchi','Kurunegala','Mannar',
  'Matale','Matara','Monaragala','Mullaitivu','Nuwara Eliya',
  'Polonnaruwa','Puttalam','Ratnapura','Trincomalee','Vavuniya',
];

export function EditModal({ user, onClose, onSave }) {
  const [form, setForm]   = useState({});
  const [errs, setErrs]   = useState({});
  const [selectedVegs, setSelectedVegs] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name:                 user.name                 || '',
        phone:                user.phone                || '',
        nic:                  user.nic                  || '',
        farmSize:             user.farmSize             || '',
        farmLocation:         user.farmLocation         || '',
        yearsOfExperience:    user.yearsOfExperience    ?? '',
        cultivatedVegetables: user.cultivatedVegetables || '',
        cultivatedAreaHectares: user.cultivatedAreaHectares ?? '',
        deliveryAddress:      user.deliveryAddress      || '',
      });
      setErrs({});
    }
  }, [user]);

  if (!user) return null;
  const isFarmer = user.role === 'FARMER';

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrs(e => ({ ...e, [k]: '' })); };

  // ── Validation ───────────────────────────────────────────────────────
  function validate() {
    const e = {};

    // Name
    if (!form.name?.trim())
      e.name = 'Full name is required.';

    // Phone
    if (!form.phone?.trim())
      e.phone = 'Phone number is required.';
    else if (!/^[0-9]{10}$/.test(form.phone))
      e.phone = 'Phone must be exactly 10 digits (e.g. 0771234567).';

    // NIC
    if (!form.nic?.trim())
      e.nic = 'NIC is required.';
    else if (!/^[0-9]{9}[VvXx]$/.test(form.nic) && !/^[0-9]{12}$/.test(form.nic))
      e.nic = 'NIC must be 9 digits + V/X  or  12 digits.';

    // Farmer-specific
    if (isFarmer) {
      if (!form.farmSize?.trim())
        e.farmSize = 'Farm name is required.';
      if (selectedVegs.length === 0)
        e.cultivatedVegetables = 'Please select at least one vegetable.';
      if (!form.farmLocation)
        e.farmLocation = 'District is required.';
      if (form.cultivatedAreaHectares !== '' && form.cultivatedAreaHectares !== undefined) {
        const ha = parseFloat(form.cultivatedAreaHectares);
        if (isNaN(ha) || ha <= 0)
          e.cultivatedAreaHectares = 'Cultivated area must be greater than 0.';
      }
      if (form.yearsOfExperience !== '' && form.yearsOfExperience !== undefined) {
        const yoe = parseInt(form.yearsOfExperience);
        if (isNaN(yoe) || yoe < 0)
          e.yearsOfExperience = 'Experience cannot be negative.';
        if (yoe > 80)
          e.yearsOfExperience = 'Experience cannot exceed 80 years.';
      }
    }

    // Customer-specific
    if (!isFarmer && form.deliveryAddress && form.deliveryAddress.trim().length < 5)
      e.deliveryAddress = 'Please enter a valid delivery address (min 5 characters).';

    return e;
  }

  async function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    setSaving(true);
    await onSave(user.id, {
      ...form,
      cultivatedVegetables: selectedVegs.join(', '),
      yearsOfExperience:    form.yearsOfExperience    !== '' ? parseInt(form.yearsOfExperience)    : null,
      cultivatedAreaHectares: form.cultivatedAreaHectares !== '' ? parseFloat(form.cultivatedAreaHectares) : null,
    });
    setSaving(false);
  }

  // ── Field component with red border on error ──────────────────────
  const inp = (id, extraStyle = {}) => ({
    className: 'input',
    value: form[id] ?? '',
    onChange: e => set(id, e.target.value),
    style: { borderColor: errs[id] ? '#c0392b' : '', ...extraStyle },
  });

  const ErrMsg = ({ id }) => errs[id]
    ? <div style={{ fontSize:'0.76rem', color:'#c0392b', marginTop:4, display:'flex', alignItems:'center', gap:4 }}>⚠ {errs[id]}</div>
    : null;

  const Required = () => <span style={{ color:'#c0392b' }}> *</span>;

  // ── Render ────────────────────────────────────────────────────────
  return (
    <Modal open title={`Edit ${isFarmer ? 'Farmer' : 'Customer'} Details`} onClose={onClose} width={500}
      actions={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </>}
    >
      {/* ── Personal ── */}
      <div style={{ fontSize:'0.72rem', fontWeight:800, color:'#4a9e3f', textTransform:'uppercase',
        letterSpacing:'0.8px', marginBottom:12, paddingBottom:6, borderBottom:'2px solid #e8f5e9' }}>
        👤 Personal Information
      </div>

      <div className="form-group">
        <label className="label">Full Name<Required/></label>
        <input {...inp('name')} placeholder="e.g. Kamal Perera" />
        <ErrMsg id="name"/>
      </div>

      <div className="form-group">
        <label className="label">Phone Number<Required/></label>
        <input className="input" value={form.phone ?? ''} maxLength={10}
          style={{ borderColor: errs.phone ? '#c0392b' : '' }}
          onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0,10))}
          placeholder="e.g. 0771234567" />
        <div style={{ fontSize:'0.72rem', color:'#8a9e8a', marginTop:3 }}>10 digits, numbers only</div>
        <ErrMsg id="phone"/>
      </div>

      <div className="form-group">
        <label className="label">NIC Number<Required/></label>
        <input {...inp('nic')} placeholder="123456789V  or  12 digits" />
        <div style={{ fontSize:'0.72rem', color:'#8a9e8a', marginTop:3 }}>9 digits + V/X  or  12 digits</div>
        <ErrMsg id="nic"/>
      </div>

      {/* ── Farmer fields ── */}
      {isFarmer && <>
        <div style={{ fontSize:'0.72rem', fontWeight:800, color:'#4a9e3f', textTransform:'uppercase',
          letterSpacing:'0.8px', marginBottom:12, paddingBottom:6, borderBottom:'2px solid #e8f5e9', marginTop:18 }}>
          🌾 Farm Information
        </div>

        <div className="form-group">
          <label className="label">Farm Name / Village<Required/></label>
          <input {...inp('farmSize')} placeholder="e.g. Green Valley Farm, Peradeniya" />
          <ErrMsg id="farmSize"/>
        </div>

        <div className="form-group">
          <label className="label">District<Required/></label>
          <select className="input" value={form.farmLocation || ''}
            onChange={e => set('farmLocation', e.target.value)}
            style={{ background:'white', cursor:'pointer', borderColor: errs.farmLocation ? '#c0392b' : '' }}>
            <option value="">Select district…</option>
            {SL_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <ErrMsg id="farmLocation"/>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div className="form-group">
            <label className="label">Cultivated Area (ha)</label>
            <input className="input" type="number" step="0.1" min="0.1"
              value={form.cultivatedAreaHectares ?? ''}
              style={{ borderColor: errs.cultivatedAreaHectares ? '#c0392b' : '' }}
              onChange={e => set('cultivatedAreaHectares', e.target.value)}
              placeholder="e.g. 2.5" />
            <ErrMsg id="cultivatedAreaHectares"/>
          </div>

          <div className="form-group">
            <label className="label">Experience (years)</label>
            <input className="input" type="number" min="0" max="80"
              value={form.yearsOfExperience ?? ''}
              style={{ borderColor: errs.yearsOfExperience ? '#c0392b' : '' }}
              onChange={e => {
                const v = e.target.value;
                if (v === '' || parseInt(v) >= 0) set('yearsOfExperience', v);
              }}
              onBlur={e => { if (e.target.value !== '' && parseInt(e.target.value) < 0) set('yearsOfExperience', '0'); }}
              placeholder="e.g. 10" />
            <ErrMsg id="yearsOfExperience"/>
          </div>
        </div>

        <div className="form-group">
          <label className="label">Cultivated Vegetables <span style={{color:'#c0392b'}}>*</span></label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 10px', marginTop:6 }}>
            {['Cabbage', 'Beans', 'Tomato', 'Cauliflower', 'Potato', 'Okra', 'Brinjal', 'Green Chilli', 'Onion', 'Carrot'].map(veg => {
              const selected = selectedVegs.includes(veg);
              return (
                <label key={veg} onClick={() => {
                  setSelectedVegs(prev => prev.includes(veg) ? prev.filter(v => v !== veg) : [...prev, veg]);
                  setErrs(e => ({ ...e, cultivatedVegetables: '' }));
                }}
                  style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer',
                    padding:'7px 10px', borderRadius:8,
                    background: selected ? '#e8f5e9' : '#fafcfa',
                    border: `1.5px solid ${selected ? '#4a9e3f' : '#d0e8c8'}`,
                    userSelect:'none', transition:'all 0.15s' }}>
                  <div style={{ width:17, height:17, borderRadius:4, flexShrink:0,
                    background: selected ? '#4a9e3f' : 'white',
                    border: `2px solid ${selected ? '#4a9e3f' : '#c8d8c8'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'white', fontSize:'0.7rem', fontWeight:800 }}>
                    {selected && '✓'}
                  </div>
                  <span style={{ fontSize:'0.84rem', fontWeight: selected ? 700 : 400,
                    color: selected ? '#2d5a1b' : '#4a5c4a' }}>{veg}</span>
                </label>
              );
            })}
          </div>
          {selectedVegs.length > 0 && (
            <div style={{ fontSize:'0.76rem', color:'#4a9e3f', fontWeight:600, marginTop:6 }}>
              ✓ {selectedVegs.length} vegetable{selectedVegs.length > 1 ? 's' : ''} selected
            </div>
          )}
          <ErrMsg id="cultivatedVegetables"/>
        </div>
      </>}

      {/* ── Customer fields ── */}
      {!isFarmer && <>
        <div style={{ fontSize:'0.72rem', fontWeight:800, color:'#4a9e3f', textTransform:'uppercase',
          letterSpacing:'0.8px', marginBottom:12, paddingBottom:6, borderBottom:'2px solid #e8f5e9', marginTop:18 }}>
          🛒 Delivery Information
        </div>

        <div className="form-group">
          <label className="label">Delivery Address</label>
          <textarea className="input" rows={2} value={form.deliveryAddress ?? ''}
            style={{ borderColor: errs.deliveryAddress ? '#c0392b' : '', resize:'vertical' }}
            onChange={e => set('deliveryAddress', e.target.value)}
            placeholder="Full delivery address" />
          <ErrMsg id="deliveryAddress"/>
        </div>
      </>}
    </Modal>
  );
}
