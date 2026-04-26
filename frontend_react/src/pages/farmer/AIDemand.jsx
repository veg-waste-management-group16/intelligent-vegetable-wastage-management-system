import React, { useState, useEffect, useMemo } from 'react';
import '../../Css/aidemand.css';
import { API_BASE_URL } from '../../api/farmerConfig';

// ── Helpers ────────────────────────────────────────────────────────────────
const getDaysUntilExpiry = (expiryDate) => {
  if (!expiryDate) return 999; // no expiry = treat as fresh
  const now = new Date(); now.setHours(0,0,0,0);
  const exp = new Date(expiryDate); exp.setHours(0,0,0,0);
  return Math.floor((exp - now) / 86400000);
};

const getWastageRisk = (daysLeft) => {
  if (daysLeft < 0)  return 'Expired';
  if (daysLeft <= 1) return 'Critical';
  if (daysLeft <= 3) return 'High';
  if (daysLeft <= 7) return 'Medium';
  return 'Low';
};

const riskOrder = { Expired:5, Critical:4, High:3, Medium:2, Low:1 };

const RiskBadge = ({ risk }) => {
  const colors = {
    Expired:  { bg:'#1a1a1a', color:'white' },
    Critical: { bg:'#fdecea', color:'#c0392b' },
    High:     { bg:'#fff3e0', color:'#e67e22' },
    Medium:   { bg:'#fffde7', color:'#e8a820' },
    Low:      { bg:'#e8f5e9', color:'#2d5a1b' },
  };
  const s = colors[risk] || colors.Low;
  return (
    <span style={{ background:s.bg, color:s.color, padding:'3px 10px',
      borderRadius:20, fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase' }}>
      {risk}
    </span>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
const AIDemand = () => {
  const [stocks, setStocks]           = useState([]);
  const [predictions, setPredictions] = useState({}); // stockId -> prediction
  const [farmerId, setFarmerId]       = useState('F001');
  const [loading, setLoading]         = useState(false);
  const [aiLoading, setAiLoading]     = useState(false);
  const [error, setError]             = useState('');
  const [aiConnected, setAiConnected] = useState(false);
  const [search, setSearch]           = useState('');
  const [sortBy, setSortBy]           = useState('highest-risk');
  const [selectedStockId, setSelectedStockId] = useState('');
  const [quickOpen, setQuickOpen]     = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [overviewData, setOverviewData] = useState([]);
  const [priceInput, setPriceInput]   = useState('');
  const [statusInput, setStatusInput] = useState('');
  const [qtyInput, setQtyInput]       = useState('');

  // ── 1. Load farmer + stocks ───────────────────────────────────────────
  useEffect(() => {
    const u = JSON.parse(sessionStorage.getItem('loggedUser') || '{}');
    const id = u.farmerId || u.farmerIndex || 'F001';
    setFarmerId(id);
    fetchStocks(id);
  }, []);

  const fetchStocks = async (id) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/farmer/${id}`);
      if (!res.ok) throw new Error('Failed to load stocks');
      const raw = await res.json();
      const rows = Array.isArray(raw) ? raw : (raw.data || []);
      const normalized = rows.map(item => ({
        ...item,
        id:           item.stockId || item.id,
        expiryDate:   item.expiryEstimate || item.expiryDate || null,
        harvestDate:  item.harvestDate || null,
        status:       item.availabilityStatus || item.status || 'Available',
      }));
      setStocks(normalized);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── 2. Load AI predictions for ALL stocks at once ─────────────────────
  useEffect(() => {
    if (!stocks.length) { setPredictions({}); return; }
    loadAllPredictions();
  }, [stocks]);

  const loadAllPredictions = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId,
          stocks: stocks.map(s => ({
            vegetableName: s.vegetableName,
            pricePerKg:    s.pricePerKg    || 100,
            quantityKg:    s.quantityKg    || 0,
            harvestDate:   s.harvestDate   || null,
            expiryEstimate:s.expiryDate    || null,
          }))
        })
      });

      if (!res.ok) throw new Error('AI server error');
      const data = await res.json();
      setAiConnected(true);

      // Map predictions back by vegetableName -> stockId
      const map = {};
      (data.predictions || []).forEach(pred => {
        const stock = stocks.find(s =>
          s.vegetableName?.toLowerCase() === pred.vegetableName?.toLowerCase()
        );
        if (stock) {
          map[stock.id] = {
            weeklyDemandKg:    pred.weeklyDemandKg,
            demandLevel:       pred.demandLevel,
            demandTrend:       pred.demandTrend,
            wastageRisk:       pred.wastageRisk,
            suggestedPrice:    pred.suggestedPricePerKg,
            recommendedAction: pred.recommendedAction,
            confidence:        pred.confidence,
          };
        }
      });
      setPredictions(map);
    } catch {
      setAiConnected(false);
      // Fallback: compute risk locally from days to expiry
      const map = {};
      stocks.forEach(s => {
        const daysLeft = getDaysUntilExpiry(s.expiryDate);
        const risk = getWastageRisk(daysLeft);
        const priceFactor = risk === 'Expired' ? 0.5
          : risk === 'Critical' ? 0.6
          : risk === 'High' ? 0.75
          : risk === 'Medium' ? 0.9 : 1;
        const weeklyDemand = parseFloat((s.quantityKg * 0.7).toFixed(1));
        map[s.id] = {
          weeklyDemandKg:    weeklyDemand,
          demandLevel:       weeklyDemand > 50 ? 'High' : weeklyDemand > 20 ? 'Medium' : 'Low',
          demandTrend:       'stable',
          wastageRisk:       risk,
          suggestedPrice:    parseFloat((s.pricePerKg * priceFactor).toFixed(2)),
          recommendedAction: risk === 'Expired'
            ? 'Remove expired stock immediately.'
            : risk === 'Critical'
            ? `Only ${daysLeft} day(s) left. Sell immediately at discounted price.`
            : risk === 'High'
            ? `${daysLeft} days remaining. Consider reducing price to move stock faster.`
            : 'Stock levels are healthy. Maintain current strategy.',
          confidence: 65,
        };
      });
      setPredictions(map);
    } finally {
      setAiLoading(false);
    }
  };

  // ── 3. Compute enriched rows ──────────────────────────────────────────
  const enrichedStocks = useMemo(() => stocks.map(stock => {
    const pred     = predictions[stock.id];
    const daysLeft = getDaysUntilExpiry(stock.expiryDate);
    const risk     = pred?.wastageRisk || getWastageRisk(daysLeft);
    const weekDemand = pred?.weeklyDemandKg ?? parseFloat((stock.quantityKg * 0.7).toFixed(1));
    const sugPrice   = pred?.suggestedPrice  ?? stock.pricePerKg;
    const potWastage = Math.max(0, stock.quantityKg - weekDemand);
    const potLoss    = parseFloat((potWastage * stock.pricePerKg).toFixed(2));
    const action     = pred?.recommendedAction || (daysLeft < 0
      ? 'Remove expired stock.'
      : 'Monitor stock levels daily.');

    return { ...stock, daysLeft, risk, weekDemand, sugPrice, potWastage, potLoss, action,
      confidence: pred?.confidence || 65,
      demandLevel: pred?.demandLevel || 'Medium',
      fromAI: !!pred };
  }), [stocks, predictions]);

  // ── 4. Filter + sort ─────────────────────────────────────────────────
  const displayed = useMemo(() => {
    let list = [...enrichedStocks];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => s.vegetableName?.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (sortBy === 'highest-risk')  return (riskOrder[b.risk]||0) - (riskOrder[a.risk]||0);
      if (sortBy === 'highest-loss')  return b.potLoss - a.potLoss;
      if (sortBy === 'expiry-asc')    return a.daysLeft - b.daysLeft;
      if (sortBy === 'name')          return a.vegetableName?.localeCompare(b.vegetableName);
      return 0;
    });
    return list;
  }, [enrichedStocks, search, sortBy]);

  // ── 5. Quick actions ─────────────────────────────────────────────────
  const selectedStock = stocks.find(s => s.id == selectedStockId);

  useEffect(() => {
    if (selectedStock) {
      setPriceInput(selectedStock.pricePerKg);
      setStatusInput(selectedStock.status);
      setQtyInput(selectedStock.quantityKg);
    }
  }, [selectedStockId]);

  const patch = async (url, body, msg) => {
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        alert(msg);
        fetchStocks(farmerId);
        setQuickOpen(false);
      } else {
        let errMsg = 'Update failed.';
        try {
          const errData = await res.json();
          errMsg = errData.message || errData.error || errMsg;
        } catch {}
        alert('Error: ' + errMsg);
      }
    } catch (e) {
      alert('Network error: ' + e.message);
    }
  };

  const handleDelete = async (stockId) => {
    if (!window.confirm('Delete this stock?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/${stockId}`, { method:'DELETE' });
      if (res.ok) { setStocks(prev => prev.filter(s => s.id !== stockId)); }
      else alert('Failed to delete.');
    } catch { alert('Network error.'); }
  };

  const openOverview = async () => {
    setOverviewOpen(true);
    setOverviewData(enrichedStocks.map(s => ({
      vegetableName:   s.vegetableName,
      currentStock:    s.quantityKg,
      predictedDemand: s.weekDemand,
      suggestedPrice:  s.sugPrice,
      risk:            s.risk,
      fromAI:          s.fromAI,
    })));
  };

  // ── RENDER ────────────────────────────────────────────────────────────
  return (
    <main className="demand-page">

      {/* ── Header Banner ── */}
      <section className="demand-header">
        <div style={{ position:'relative', zIndex:1 }}>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'2rem', fontWeight:800, color:'white', marginBottom:6 }}>
            🤖 AI Demand & Predictions
          </h1>
          <p style={{ color:'rgba(255,255,255,0.75)', marginBottom:4 }}>
            Machine learning powered insights for your farm stocks
          </p>
          <p style={{ color:'rgba(255,255,255,0.55)', fontSize:'0.84rem', marginBottom:16 }}>
            Farmer: {farmerId}
          </p>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button onClick={openOverview} style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', color:'white', padding:'8px 18px', borderRadius:20, cursor:'pointer', fontSize:'0.84rem', fontWeight:600 }}>
              📊 Demand Overview
            </button>
            <button onClick={() => { if (stocks.length) { setSelectedStockId(String(stocks[0].id)); setQuickOpen(true); } }} style={{ background:'rgba(212,114,42,0.4)', border:'1px solid rgba(212,114,42,0.5)', color:'white', padding:'8px 18px', borderRadius:20, cursor:'pointer', fontSize:'0.84rem', fontWeight:600 }}>
              ⚡ Quick Actions
            </button>
            <button onClick={() => fetchStocks(farmerId)} style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'white', padding:'8px 18px', borderRadius:20, cursor:'pointer', fontSize:'0.84rem' }}>
              🔄 Refresh
            </button>
          </div>
        </div>
      </section>

      {/* ── Status bar ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', marginBottom:4, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, background: aiConnected?'#e8f5e9':'#fff3e0', border:`1px solid ${aiConnected?'#c8e6c9':'#ffd080'}`, padding:'6px 14px', borderRadius:20 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background: aiConnected?'#4a9e3f':'#e67e22', display:'inline-block', boxShadow: aiConnected?'0 0 0 3px rgba(74,158,63,0.2)':'' }}/>
            <span style={{ fontSize:'0.78rem', fontWeight:700, color: aiConnected?'#2d5a1b':'#7d5300' }}>
              {aiLoading ? 'Loading AI…' : aiConnected ? 'AI Connected — ML Model Active' : 'AI Offline — Rule-based Fallback'}
            </span>
          </div>
          <span style={{ fontSize:'0.84rem', color:'#8a9e8a' }}>{stocks.length} stock{stocks.length!==1?'s':''} loaded</span>
        </div>
      </div>

      {loading && <div style={{ textAlign:'center', padding:40, color:'#8a9e8a' }}>Loading stocks…</div>}
      {error && <div style={{ background:'#fdecea', border:'1px solid #f5c6cb', color:'#c0392b', borderRadius:12, padding:'12px 16px', marginBottom:16 }}>⚠ {error}</div>}

      {/* ── AI Prediction Cards ── */}
      {!loading && displayed.length > 0 && (
        <div style={{ marginBottom:32 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:12 }}>
            <div>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.3rem', color:'#1a3a0a', marginBottom:3 }}>AI Insights</h2>
              <p style={{ fontSize:'0.8rem', color:'#8a9e8a' }}>
                {aiConnected ? '✅ Predictions powered by trained ML model' : '⚠️ Using rule-based fallback — start AI server for ML predictions'}
              </p>
            </div>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ padding:'8px 14px', border:'1.5px solid #d0e8c8', borderRadius:10, fontSize:'0.86rem', background:'white', outline:'none' }}>
              <option value="highest-risk">Sort: Highest Risk First</option>
              <option value="highest-loss">Sort: Highest Financial Loss</option>
              <option value="expiry-asc">Sort: Expiring Soonest</option>
              <option value="name">Sort: A–Z</option>
            </select>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
            {displayed.map(item => (
              <div key={item.id} style={{
                background:'white', borderRadius:18, padding:'20px',
                border:`2px solid ${item.risk==='Expired'?'#1a1a1a':item.risk==='Critical'?'#c0392b':item.risk==='High'?'#e67e22':item.risk==='Medium'?'#e8a820':'#4a9e3f'}`,
                boxShadow:'0 2px 12px rgba(26,58,10,0.08)', transition:'transform 0.2s',
              }}>
                {/* Card header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                  <div>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.1rem', fontWeight:800, color:'#1a3a0a' }}>{item.vegetableName}</div>
                    <div style={{ fontSize:'0.74rem', color:'#8a9e8a', marginTop:2 }}>Stock #{item.id}</div>
                  </div>
                  <RiskBadge risk={item.risk} />
                </div>

                {/* Key stats grid */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
                  {[
                    ['📦 Stock', `${item.quantityKg} kg`],
                    ['📅 Expiry', item.daysLeft < 0 ? '⚠️ Expired' : item.daysLeft === 999 ? 'No date' : `${item.daysLeft} days`],
                    ['📈 Weekly Demand', `${item.weekDemand} kg`],
                    ['💡 Confidence', `${item.confidence}%`],
                  ].map(([label, val]) => (
                    <div key={label} style={{ background:'#f8fdf6', borderRadius:10, padding:'10px 12px', border:'1px solid #e0f0da' }}>
                      <div style={{ fontSize:'0.7rem', color:'#8a9e8a', marginBottom:3 }}>{label}</div>
                      <div style={{ fontWeight:700, color:'#1a3a0a', fontSize:'0.92rem' }}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* Price comparison */}
                <div style={{ background:'#f0faf0', borderRadius:12, padding:'12px 14px', marginBottom:14, border:'1px solid #c8e6c9' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:'0.8rem', color:'#4a5c4a' }}>Current Price</span>
                    <span style={{ fontWeight:700, color:'#1a3a0a' }}>Rs. {item.pricePerKg}/kg</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:'0.8rem', color:'#4a5c4a' }}>🤖 Suggested Price</span>
                    <span style={{ fontWeight:800, color:'#2980b9', fontSize:'1rem' }}>Rs. {item.sugPrice}/kg</span>
                  </div>
                  {item.potLoss > 0 && (
                    <div style={{ display:'flex', justifyContent:'space-between', paddingTop:6, borderTop:'1px dashed #c8e6c9' }}>
                      <span style={{ fontSize:'0.8rem', color:'#c0392b' }}>⚠ Potential Loss</span>
                      <span style={{ fontWeight:700, color:'#c0392b' }}>Rs. {item.potLoss}</span>
                    </div>
                  )}
                </div>

                {/* Action message */}
                <div style={{ background:'#fffde7', border:'1px solid #ffd080', borderRadius:10, padding:'10px 12px', marginBottom:14, fontSize:'0.82rem', color:'#7d5300', lineHeight:1.5 }}>
                  <strong>💡 Action:</strong> {item.action}
                </div>

                {/* Button */}
                <button onClick={() => { setSelectedStockId(String(item.id)); setPriceInput(item.sugPrice); setQuickOpen(true); }}
                  style={{ width:'100%', padding:'10px', borderRadius:10, border:'none',
                    background:'linear-gradient(135deg,#2d5a1b,#4a9e3f)', color:'white',
                    fontWeight:700, fontSize:'0.86rem', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                  ⚡ Apply Suggested Price
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && stocks.length === 0 && !error && (
        <div style={{ textAlign:'center', padding:'60px 20px', background:'white', borderRadius:18, border:'1px solid #e0f0da', marginBottom:24 }}>
          <div style={{ fontSize:'3rem', marginBottom:12 }}>📦</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.3rem', color:'#1a3a0a', marginBottom:8 }}>No Stocks Found</div>
          <div style={{ color:'#8a9e8a', fontSize:'0.9rem' }}>Add your first stock using the <strong>Add Stock</strong> tab to see AI predictions here.</div>
        </div>
      )}

      {/* ── Stock Details Table ── */}
      {!loading && stocks.length > 0 && (
        <section style={{ background:'white', borderRadius:18, border:'1px solid #e0f0da', overflow:'hidden', boxShadow:'0 2px 12px rgba(26,58,10,0.06)' }}>
          <div style={{ padding:'18px 22px', borderBottom:'1px solid #f0f5f0', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.1rem', fontWeight:800, color:'#1a3a0a' }}>Stock Details</div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search vegetable…"
              style={{ padding:'8px 14px', border:'1.5px solid #d0e8c8', borderRadius:10, fontSize:'0.86rem', outline:'none', minWidth:200 }}/>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.85rem' }}>
              <thead>
                <tr style={{ background:'#f0faf0' }}>
                  {['ID','Vegetable','Qty (kg)','Weekly Demand','Current Price','AI Price','Quality','Days Left','Risk','Status','Est. Loss','Actions'].map(h => (
                    <th key={h} style={{ padding:'12px 14px', textAlign:'left', fontSize:'0.72rem', fontWeight:800, color:'#1a3a0a', textTransform:'uppercase', letterSpacing:'0.4px', borderBottom:'2px solid #e0f0da', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 && (
                  <tr><td colSpan={12} style={{ textAlign:'center', padding:40, color:'#8a9e8a' }}>No results for "{search}"</td></tr>
                )}
                {displayed.map(s => (
                  <tr key={s.id} style={{ borderBottom:'1px solid #f0f5f0' }}
                    onMouseOver={e=>e.currentTarget.style.background='#f8fdf6'}
                    onMouseOut={e=>e.currentTarget.style.background=''}>
                    <td style={{ padding:'12px 14px', fontWeight:700, color:'#1a3a0a' }}>#{s.id}</td>
                    <td style={{ padding:'12px 14px', fontWeight:600 }}>{s.vegetableName}</td>
                    <td style={{ padding:'12px 14px' }}>{s.quantityKg} kg</td>
                    <td style={{ padding:'12px 14px', color:'#2d5a1b', fontWeight:700 }}>
                      {aiLoading ? '…' : `${s.weekDemand} kg`}
                      {s.fromAI && <span style={{ fontSize:'0.65rem', color:'#4a9e3f', marginLeft:4 }}>🤖</span>}
                    </td>
                    <td style={{ padding:'12px 14px' }}>Rs. {s.pricePerKg}</td>
                    <td style={{ padding:'12px 14px', color:'#2980b9', fontWeight:700 }}>
                      {aiLoading ? '…' : `Rs. ${s.sugPrice}`}
                    </td>
                    <td style={{ padding:'12px 14px' }}>{s.qualityGrade || '—'}</td>
                    <td style={{ padding:'12px 14px', color: s.daysLeft < 0 ? '#c0392b' : s.daysLeft <= 3 ? '#e67e22' : '#1a3a0a', fontWeight: s.daysLeft <= 3 ? 700 : 400 }}>
                      {s.daysLeft === 999 ? '—' : s.daysLeft < 0 ? '⚠ Expired' : `${s.daysLeft}d`}
                    </td>
                    <td style={{ padding:'12px 14px' }}><RiskBadge risk={s.risk}/></td>
                    <td style={{ padding:'12px 14px' }}>
                      <span style={{ background: s.status==='Available'?'#e8f5e9':s.status==='Low Stock'?'#fff3e0':'#fdecea', color: s.status==='Available'?'#2d5a1b':s.status==='Low Stock'?'#e67e22':'#c0392b', padding:'3px 10px', borderRadius:20, fontSize:'0.72rem', fontWeight:700 }}>{s.status}</span>
                    </td>
                    <td style={{ padding:'12px 14px', color: s.potLoss>0?'#c0392b':'#2d5a1b', fontWeight: s.potLoss>0?700:400 }}>
                      {s.potLoss > 0 ? `Rs. ${s.potLoss}` : '✓ None'}
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={() => { setSelectedStockId(String(s.id)); setQuickOpen(true); }}
                          style={{ padding:'5px 12px', borderRadius:7, border:'none', background:'#e8f5e9', color:'#2d5a1b', fontSize:'0.76rem', fontWeight:700, cursor:'pointer' }}>Edit</button>
                        <button onClick={() => handleDelete(s.id)}
                          style={{ padding:'5px 12px', borderRadius:7, border:'none', background:'#fdecea', color:'#c0392b', fontSize:'0.76rem', fontWeight:700, cursor:'pointer' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Quick Action Modal ── */}
      {quickOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)', padding:20 }}
          onClick={() => setQuickOpen(false)}>
          <div style={{ background:'white', borderRadius:20, padding:0, width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 80px rgba(0,0,0,0.25)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding:'22px 24px 16px', borderBottom:'2px solid #e8f5e9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.2rem', fontWeight:800, color:'#1a3a0a' }}>⚡ Quick Stock Actions</div>
              <button onClick={() => setQuickOpen(false)} style={{ background:'#f0f0f0', border:'none', borderRadius:'50%', width:32, height:32, cursor:'pointer', fontSize:'1rem' }}>✕</button>
            </div>

            <div style={{ padding:'18px 24px' }}>
              {/* Stock selector */}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'#4a5c4a', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:7 }}>Select Stock</label>
                <select value={selectedStockId} onChange={e=>setSelectedStockId(e.target.value)}
                  style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #d0e8c8', borderRadius:10, fontSize:'0.9rem', background:'white', outline:'none' }}>
                  <option value="">— Choose —</option>
                  {stocks.map(s => <option key={s.id} value={s.id}>{s.vegetableName} (#{s.id})</option>)}
                </select>
              </div>

              {selectedStock && (
                <div style={{ background:'#f0faf0', borderRadius:12, padding:'12px 16px', marginBottom:18, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[['Vegetable', selectedStock.vegetableName],['Qty', `${selectedStock.quantityKg} kg`],['Price', `Rs. ${selectedStock.pricePerKg}/kg`],['Status', selectedStock.status]].map(([l,v]) => (
                    <div key={l}><div style={{ fontSize:'0.7rem', color:'#8a9e8a', marginBottom:2 }}>{l}</div><div style={{ fontWeight:700, color:'#1a3a0a' }}>{v}</div></div>
                  ))}
                </div>
              )}

              {/* Three action cards */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                {/* Price */}
                <div style={{ background:'#f8fdf6', borderRadius:14, padding:14, border:'1px solid #e0f0da' }}>
                  <div style={{ fontSize:'0.72rem', fontWeight:800, color:'#1a3a0a', textTransform:'uppercase', marginBottom:10 }}>💰 Price</div>
                  <input type="number" step="0.01" min="0" value={priceInput} onChange={e=>setPriceInput(e.target.value)} placeholder="Rs./kg"
                    style={{ width:'100%', padding:'9px 10px', border:'1.5px solid #d0e8c8', borderRadius:8, fontSize:'0.88rem', marginBottom:8, boxSizing:'border-box' }}/>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:8 }}>
                    {[5,10,20].map(d => (
                      <button key={d} onClick={() => { const p = selectedStock?.pricePerKg; if(p) setPriceInput(+(p*(1-d/100)).toFixed(2)); }}
                        style={{ padding:'4px 8px', borderRadius:6, border:'1px solid #d0e8c8', background:'white', fontSize:'0.72rem', fontWeight:700, cursor:'pointer', color:'#2d5a1b' }}>
                        -{d}%
                      </button>
                    ))}
                  </div>
                  <button onClick={() => patch(`${API_BASE_URL}/${selectedStockId}/price`, { pricePerKg: priceInput }, 'Price updated!')}
                    style={{ width:'100%', padding:9, borderRadius:8, border:'none', background:'linear-gradient(135deg,#2d5a1b,#4a9e3f)', color:'white', fontWeight:700, fontSize:'0.82rem', cursor:'pointer' }}>
                    Update
                  </button>
                </div>

                {/* Status */}
                <div style={{ background:'#f8fdf6', borderRadius:14, padding:14, border:'1px solid #e0f0da' }}>
                  <div style={{ fontSize:'0.72rem', fontWeight:800, color:'#1a3a0a', textTransform:'uppercase', marginBottom:10 }}>📋 Status</div>
                  <select value={statusInput} onChange={e=>setStatusInput(e.target.value)}
                    style={{ width:'100%', padding:'9px 10px', border:'1.5px solid #d0e8c8', borderRadius:8, fontSize:'0.88rem', marginBottom:8 }}>
                    <option value="Available">Available</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                  <button onClick={() => patch(`${API_BASE_URL}/${selectedStockId}/status`, { availabilityStatus: statusInput }, 'Status updated!')}
                    style={{ width:'100%', padding:9, borderRadius:8, border:'none', background:'linear-gradient(135deg,#2980b9,#1a5c8a)', color:'white', fontWeight:700, fontSize:'0.82rem', cursor:'pointer', marginTop:42 }}>
                    Update
                  </button>
                </div>

                {/* Quantity */}
                <div style={{ background:'#f8fdf6', borderRadius:14, padding:14, border:'1px solid #e0f0da' }}>
                  <div style={{ fontSize:'0.72rem', fontWeight:800, color:'#1a3a0a', textTransform:'uppercase', marginBottom:10 }}>📦 Quantity</div>
                  <input type="number" step="0.1" min="0" value={qtyInput} onChange={e=>setQtyInput(e.target.value)} placeholder="kg"
                    style={{ width:'100%', padding:'9px 10px', border:'1.5px solid #d0e8c8', borderRadius:8, fontSize:'0.88rem', marginBottom:8, boxSizing:'border-box' }}/>
                  <button onClick={() => patch(`${API_BASE_URL}/${selectedStockId}/quantity`, { quantityKg: qtyInput }, 'Quantity updated!')}
                    style={{ width:'100%', padding:9, borderRadius:8, border:'none', background:'linear-gradient(135deg,#e67e22,#c9702a)', color:'white', fontWeight:700, fontSize:'0.82rem', cursor:'pointer', marginTop:42 }}>
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Demand Overview Modal ── */}
      {overviewOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)', padding:20 }}
          onClick={() => setOverviewOpen(false)}>
          <div style={{ background:'white', borderRadius:20, padding:0, width:'100%', maxWidth:700, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 80px rgba(0,0,0,0.25)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding:'22px 24px 16px', borderBottom:'2px solid #e8f5e9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.2rem', fontWeight:800, color:'#1a3a0a' }}>📊 Demand Overview</div>
              <button onClick={() => setOverviewOpen(false)} style={{ background:'#f0f0f0', border:'none', borderRadius:'50%', width:32, height:32, cursor:'pointer', fontSize:'1rem' }}>✕</button>
            </div>
            <div style={{ padding:'20px 24px' }}>
              <div style={{ fontSize:'0.82rem', color:'#8a9e8a', marginBottom:16 }}>
                {aiConnected ? '🤖 AI-powered predictions from ML model' : '⚠️ Rule-based fallback (start AI server for ML)'}
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.86rem' }}>
                  <thead>
                    <tr style={{ background:'#f0faf0' }}>
                      {['Vegetable','Current Stock','Weekly Demand','Suggested Price','Risk'].map(h => (
                        <th key={h} style={{ padding:'12px 14px', textAlign:'left', fontSize:'0.72rem', fontWeight:800, color:'#1a3a0a', textTransform:'uppercase', letterSpacing:'0.4px', borderBottom:'2px solid #e0f0da' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {overviewData.map((item, i) => (
                      <tr key={i} style={{ borderBottom:'1px solid #f0f5f0' }}>
                        <td style={{ padding:'12px 14px', fontWeight:700 }}>{item.vegetableName}</td>
                        <td style={{ padding:'12px 14px' }}>{item.currentStock} kg</td>
                        <td style={{ padding:'12px 14px', color:'#2d5a1b', fontWeight:700 }}>{item.predictedDemand} kg {item.fromAI && '🤖'}</td>
                        <td style={{ padding:'12px 14px', color:'#2980b9', fontWeight:700 }}>Rs. {item.suggestedPrice}/kg</td>
                        <td style={{ padding:'12px 14px' }}><RiskBadge risk={item.risk}/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default AIDemand;
