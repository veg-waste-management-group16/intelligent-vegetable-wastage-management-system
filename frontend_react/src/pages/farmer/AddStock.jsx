import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../api/farmerConfig';
import '../../Css/addstock.css';

// ── Vegetable catalogue with default images ────────────────────────────────
const VEGETABLES = [
  { name: 'Cabbage',      emoji: '🥬', image: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400&q=80', category: 'Cruciferous' },
  { name: 'Beans',        emoji: '🫘', image: 'https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?w=400&q=80', category: 'Legume' },
  { name: 'Tomato',       emoji: '🍅', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80', category: 'Fruit Vegetable' },
  { name: 'Cauliflower',  emoji: '🥦', image: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=400&q=80', category: 'Cruciferous' },
  { name: 'Potato',       emoji: '🥔', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80', category: 'Root Vegetable' },
  { name: 'Okra',         emoji: '🌿', image: 'https://images.unsplash.com/photo-1527324688151-0e627063f2b1?w=400&q=80', category: 'Fruit Vegetable' },
  { name: 'Brinjal',      emoji: '🍆', image: 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=400&q=80', category: 'Fruit Vegetable' },
  { name: 'Green Chilli', emoji: '🌶️', image: 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=400&q=80', category: 'Spice Vegetable' },
  { name: 'Onion',        emoji: '🧅', image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80', category: 'Allium' },
  { name: 'Carrot',       emoji: '🥕', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80', category: 'Root Vegetable' },
];

const addDays = (dateStr, days) => {
  if (!dateStr) return '';
  return new Date(new Date(dateStr).getTime() + days * 86400000).toISOString().split('T')[0];
};

const todayStr = () => {
  const tzoffset = new Date().getTimezoneOffset() * 60000;
  return new Date(Date.now() - tzoffset).toISOString().split('T')[0];
};

const LISTINGS_API = '/api/listings';

export default function AddStockForm() {
  const loggedUser = (() => { try { return JSON.parse(sessionStorage.getItem('loggedUser') || '{}'); } catch { return {}; } })();
  const farmerId = loggedUser.farmerId || loggedUser.farmerIndex || 'F001';
  const farmerName = loggedUser.name || 'Farmer';
  const farmerLocation = loggedUser.farmLocation || 'Sri Lanka';

  const empty = { vegetableName: '', harvestDate: '', quantityKg: '', pricePerKg: '', qualityGrade: '', expiryEstimate: '' };
  const [form, setForm]     = useState(empty);
  const [touched, setTouched] = useState({});
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [lastStockId, setLastStockId] = useState(null);
  const [successMsg, setSuccessMsg]   = useState('');
  const maxDate = todayStr();

  const selectedVeg = VEGETABLES.find(v => v.name === form.vegetableName);
  const expiryMax   = form.harvestDate ? addDays(form.harvestDate, 14) : undefined;

  const validate = (name, value) => {
    if (name === 'vegetableName' && !value)  return 'Please select a vegetable.';
    if (name === 'harvestDate') {
      if (!value) return 'Harvest date is required.';
      if (value > maxDate) return 'Harvest date cannot be in the future.';
    }
    if (name === 'quantityKg') {
      if (!value) return 'Quantity is required.';
      if (parseFloat(value) <= 0) return 'Must be greater than 0.';
    }
    if (name === 'pricePerKg') {
      if (!value) return 'Price is required.';
      if (parseFloat(value) <= 0) return 'Must be greater than 0.';
    }
    if (name === 'qualityGrade' && !value) return 'Please select a grade.';
    if (name === 'expiryEstimate') {
      if (!value) return 'Expiry date is required.';
      if (form.harvestDate && value < form.harvestDate) return 'Cannot be before harvest date.';
      if (expiryMax && value > expiryMax) return 'Must be within 2 weeks of harvest.';
    }
    return '';
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (touched[name]) setErrors(prev => ({ ...prev, [name]: validate(name, value) }));
  };

  const handleVegSelect = veg => {
    setForm(f => ({ ...f, vegetableName: veg.name }));
    if (touched.vegetableName) setErrors(prev => ({ ...prev, vegetableName: '' }));
  };

  const handleBlur = e => {
    const { name, value } = e.target;
    setTouched(t => ({ ...t, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validate(name, value) }));
  };

  const validateAll = () => {
    const newErrs = {};
    Object.keys(empty).forEach(k => { const e = validate(k, form[k]); if (e) newErrs[k] = e; });
    setErrors(newErrs);
    setTouched(Object.keys(empty).reduce((a,k) => ({ ...a, [k]: true }), {}));
    return Object.keys(newErrs).length === 0;
  };

  const handleSubmit = async (action) => {
    if (!validateAll()) return;
    setLoading(true);
    setSuccessMsg('');
    try {
      // 1. Add to farmer stock backend
      const stockRes = await fetch(`${API_BASE_URL}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId,
          vegetableName: form.vegetableName,
          category: selectedVeg?.category || 'Vegetable',
          harvestDate: form.harvestDate,
          quantityKg: parseFloat(form.quantityKg),
          pricePerKg: parseFloat(form.pricePerKg),
          qualityGrade: form.qualityGrade,
          expiryEstimate: form.expiryEstimate || null,
        })
      });

      if (!stockRes.ok) {
        const d = await stockRes.json();
        window.alert(d.message || 'Failed to add stock');
        setLoading(false);
        return;
      }

      const saved = await stockRes.json();
      const stockId = saved?.data?.stockId || saved?.stockId || null;
      setLastStockId(stockId);

      // 2. Auto-create a marketplace listing
      const expiryDays = form.expiryEstimate
        ? Math.ceil((new Date(form.expiryEstimate) - new Date()) / 86400000)
        : 7;
      const riskLevel = expiryDays <= 2 ? 'HIGH' : expiryDays <= 5 ? 'MEDIUM' : 'LOW';
      const discount  = riskLevel === 'HIGH' ? 20 : riskLevel === 'MEDIUM' ? 10 : 0;

      await fetch(LISTINGS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer_id: loggedUser.id || 1,
          title: form.vegetableName,
          description: `Fresh ${form.vegetableName} from ${farmerLocation}. Harvested on ${form.harvestDate}. Quality Grade ${form.qualityGrade}.`,
          category: selectedVeg?.category || 'Vegetable',
          price_per_kg: parseFloat(form.pricePerKg),
          quantity_kg: parseFloat(form.quantityKg),
          risk_level: riskLevel,
          suggested_discount: discount,
          availability_status: 'available',
          is_visible: true,
          farmer_name: farmerName,
          farmer_location: farmerLocation,
          image: selectedVeg?.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80',
          listed_at: new Date().toISOString(),
          expires_at: form.expiryEstimate ? new Date(form.expiryEstimate).toISOString() : null,
          rating: 0,
          reviews: 0,
        })
      }).catch(() => {}); // non-blocking — stock is already saved

      setSuccessMsg(`✅ Stock added successfully! Stock ID: ${stockId || '—'}`);

      if (action === 'add_another') {
        setForm(empty);
        setTouched({});
        setErrors({});
      } else {
        window.dispatchEvent(new CustomEvent('farmer-nav', { detail: 'viewstock' }));
      }
    } catch (err) {
      window.alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="form-wrapper">
        {/* Header */}
        <header className="form-header">
          <h1>Add New Stock</h1>
          <p className="subtitle">List your fresh produce — it will appear in the marketplace automatically</p>
        </header>

        {successMsg && (
          <div style={{ background:'#e8f5e9', border:'1px solid #c8e6c9', color:'#2d5a1b',
            borderRadius:12, padding:'14px 18px', marginBottom:20, fontWeight:600, fontSize:'0.9rem',
            display:'flex', alignItems:'center', gap:10 }}>
            {successMsg}
          </div>
        )}

        {/* Stock ID display (only after saving) */}
        {lastStockId && (
          <div style={{ background:'#f0faf0', border:'1px solid #c8e6c9', borderRadius:10,
            padding:'10px 16px', marginBottom:16, fontSize:'0.84rem', color:'#2d5a1b',
            display:'flex', alignItems:'center', gap:10 }}>
            <span style={{fontWeight:700}}>Last Stock ID:</span>
            <code style={{background:'#2d5a1b',color:'white',padding:'2px 10px',borderRadius:6,fontWeight:700}}>#{lastStockId}</code>
          </div>
        )}

        <form onSubmit={e => e.preventDefault()} className="form-group">

          {/* Farmer ID — read only */}
          <div className="form-section" style={{ marginBottom: 20 }}>
            <label>Farmer ID</label>
            <input type="text" value={farmerId} disabled
              style={{ background:'#f0f5f0', color:'#4a5c4a', cursor:'not-allowed', fontWeight:700 }}/>
          </div>

          {/* Vegetable selector */}
          <div className="form-section full-width" style={{ marginBottom: 20 }}>
            <label>Vegetable <span className="required">*</span></label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px, 1fr))', gap:10, marginTop:8 }}>
              {VEGETABLES.map(veg => {
                const selected = form.vegetableName === veg.name;
                return (
                  <button key={veg.name} type="button" onClick={() => handleVegSelect(veg)}
                    style={{
                      padding:'12px 8px', border:`2px solid ${selected?'#4a9e3f':'#d0e8c8'}`,
                      borderRadius:14, background: selected ? '#e8f5e9' : 'white',
                      cursor:'pointer', transition:'all 0.15s',
                      boxShadow: selected ? '0 4px 12px rgba(74,158,63,0.2)' : '0 1px 4px rgba(0,0,0,0.05)',
                      display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                    }}>
                    <img src={veg.image} alt={veg.name}
                      style={{ width:52, height:52, borderRadius:10, objectFit:'cover',
                        border: selected ? '2px solid #4a9e3f' : '2px solid #e0f0da' }}
                      onError={e => { e.target.style.display='none'; }}/>
                    <span style={{ fontSize:'0.82rem', fontWeight: selected?700:500,
                      color: selected?'#2d5a1b':'#4a5c4a', lineHeight:1.2, textAlign:'center' }}>
                      {veg.name}
                    </span>
                    {selected && <span style={{fontSize:'0.68rem',color:'#4a9e3f',fontWeight:700}}>✓ Selected</span>}
                  </button>
                );
              })}
            </div>
            {touched.vegetableName && errors.vegetableName &&
              <span className="error-text">{errors.vegetableName}</span>}
          </div>

          {/* Preview of selected veg */}
          {selectedVeg && (
            <div style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 16px',
              background:'linear-gradient(135deg,#e8f5e9,#f0faf0)', borderRadius:14,
              border:'1px solid #c8e6c9', marginBottom:20 }}>
              <img src={selectedVeg.image} alt={selectedVeg.name}
                style={{ width:56, height:56, borderRadius:12, objectFit:'cover', border:'2px solid #4a9e3f' }}/>
              <div>
                <div style={{ fontWeight:800, color:'#1a3a0a', fontSize:'1rem' }}>{selectedVeg.emoji} {selectedVeg.name}</div>
                <div style={{ fontSize:'0.78rem', color:'#6a8a6a', marginTop:2 }}>Category: {selectedVeg.category}</div>
                <div style={{ fontSize:'0.76rem', color:'#4a9e3f', marginTop:2, fontWeight:600 }}>
                  This image will appear in the marketplace
                </div>
              </div>
            </div>
          )}

          {/* Dates row */}
          <div className="form-row">
            <div className="form-section">
              <label>Harvest Date <span className="required">*</span></label>
              <input type="date" name="harvestDate" max={maxDate} value={form.harvestDate}
                onChange={handleChange} onBlur={handleBlur}/>
              {touched.harvestDate && errors.harvestDate && <span className="error-text">{errors.harvestDate}</span>}
            </div>
            <div className="form-section">
              <label>Estimated Expiry <span className="required">*</span></label>
              <input type="date" name="expiryEstimate"
                min={form.harvestDate || undefined} max={expiryMax}
                value={form.expiryEstimate} onChange={handleChange} onBlur={handleBlur}/>
              {touched.expiryEstimate && errors.expiryEstimate && <span className="error-text">{errors.expiryEstimate}</span>}
            </div>
          </div>

          {/* Quantity + Price row */}
          <div className="form-row">
            <div className="form-section">
              <label>Quantity (kg) <span className="required">*</span></label>
              <input type="number" name="quantityKg" step="0.1" min="0.1"
                value={form.quantityKg} onChange={handleChange} onBlur={handleBlur}
                placeholder="e.g. 50"/>
              {touched.quantityKg && errors.quantityKg && <span className="error-text">{errors.quantityKg}</span>}
            </div>
            <div className="form-section">
              <label>Price per kg (Rs.) <span className="required">*</span></label>
              <input type="number" name="pricePerKg" step="0.01" min="0.01"
                value={form.pricePerKg} onChange={handleChange} onBlur={handleBlur}
                placeholder="e.g. 120"/>
              {touched.pricePerKg && errors.pricePerKg && <span className="error-text">{errors.pricePerKg}</span>}
            </div>
          </div>

          {/* Quality Grade */}
          <div className="form-section full-width" style={{ marginBottom: 20 }}>
            <label>Quality Grade <span className="required">*</span></label>
            <div className="quality-options">
              {[
                { g:'A', label:'Grade A', sub:'Premium quality', color:'#2d5a1b' },
                { g:'B', label:'Grade B', sub:'Standard quality', color:'#e8a820' },
                { g:'C', label:'Grade C', sub:'Discounted price', color:'#e67e22' },
              ].map(({ g, label, sub, color }) => (
                <label key={g} className="radio-label">
                  <input type="radio" name="qualityGrade" value={g}
                    checked={form.qualityGrade === g} onChange={handleChange}/>
                  <div className={`grade-badge grade-${g.toLowerCase()}`}
                    style={{ borderColor: form.qualityGrade === g ? color : undefined,
                      background: form.qualityGrade === g ? `${color}15` : undefined }}>
                    {label}
                    <div className="grade-desc">{sub}</div>
                  </div>
                </label>
              ))}
            </div>
            {touched.qualityGrade && errors.qualityGrade && <span className="error-text">{errors.qualityGrade}</span>}
          </div>

          {/* Marketplace notice */}
          <div style={{ background:'#fff3e0', border:'1px solid #ffd080', borderRadius:12,
            padding:'13px 16px', marginBottom:20, fontSize:'0.84rem', color:'#7d5300',
            display:'flex', gap:10, alignItems:'flex-start' }}>
            <span style={{flexShrink:0}}>🛒</span>
            <span>This stock will be <strong>automatically added to the marketplace</strong> so customers can see and order it right away.</span>
          </div>

          {/* Action buttons */}
          <div className="form-actions">
            <button type="button" className="btn btn-primary"
              onClick={() => handleSubmit('add_another')} disabled={loading}>
              {loading ? 'Saving…' : '➕ Save & Add Another'}
            </button>
            <button type="button" className="btn btn-primary"
              onClick={() => handleSubmit('close')} disabled={loading}
              style={{ background:'linear-gradient(135deg,#2d5a1b,#1a3a0a)' }}>
              {loading ? 'Saving…' : '✅ Save & View Stock'}
            </button>
            <button type="button" disabled={loading}
              onClick={() => window.dispatchEvent(new CustomEvent('farmer-nav',{detail:'viewstock'}))}
              style={{ background:'white', border:'1.5px solid #d0e8c8', color:'#4a5c4a',
                padding:'12px 20px', borderRadius:10, cursor:'pointer',
                fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:'0.88rem' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
