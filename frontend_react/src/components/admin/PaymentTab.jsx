import { useState, useEffect, useMemo } from 'react';

const API = '/api/payments';

const statusColor = s => {
  if (!s) return { bg:'#f0f0f0', color:'#8a9e8a' };
  s = s.toUpperCase();
  if (s==='SUCCESS'||s==='PAID')         return { bg:'#e8f5e9', color:'#2d5a1b' };
  if (s==='APPROVED')                    return { bg:'#e3f2fd', color:'#2980b9' };
  if (s==='FAILED'||s==='PAYMENT_FAILED')return { bg:'#fdecea', color:'#c0392b' };
  if (s==='REJECTED')                    return { bg:'#fdecea', color:'#c0392b' };
  if (s==='PENDING'||s==='PENDING_APPROVAL') return { bg:'#fff3e0', color:'#e67e22' };
  if (s==='ASSIGNED')                    return { bg:'#f3e5f5', color:'#7b1fa2' };
  if (s==='OUT_FOR_DELIVERY')            return { bg:'#e3f2fd', color:'#1976d2' };
  if (s==='DELIVERED')                   return { bg:'#e8f5e9', color:'#2d5a1b' };
  if (s==='COMPLETED')                   return { bg:'#e8f5e9', color:'#1a5c2b' };
  return { bg:'#f0f0f0', color:'#8a9e8a' };
};

const Pill = ({ v }) => {
  const { bg, color } = statusColor(v);
  return (
    <span style={{ background:bg, color, fontSize:'0.72rem', fontWeight:700,
      padding:'3px 10px', borderRadius:20, textTransform:'uppercase', letterSpacing:'0.3px', display:'inline-block' }}>
      {v || 'UNKNOWN'}
    </span>
  );
};

function fmt(iso) {
  if (!iso) return '\u2014';
  return new Date(iso).toLocaleDateString('en-LK',{day:'numeric',month:'short',year:'numeric'})
    + ' ' + new Date(iso).toLocaleTimeString('en-LK',{hour:'2-digit',minute:'2-digit'});
}
function fmtDate(iso) {
  if (!iso) return '\u2014';
  return new Date(iso).toLocaleDateString('en-LK',{day:'numeric',month:'short',year:'numeric'});
}

// ── Bill Modal (Admin) ────────────────────────────────────────────────────────
function BillModal({ orderId, onClose }) {
  const [bill, setBill]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState('');

  useEffect(() => {
    fetch(`${API}/admin/orders/${orderId}/bill`)
      .then(r => r.json())
      .then(d => { setBill(d); setLoading(false); })
      .catch(() => { setErr('Could not load bill.'); setLoading(false); });
  }, [orderId]);

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:900,
      display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)', padding:20 }}>
      <div style={{ background:'white', borderRadius:20, width:'100%', maxWidth:680,
        maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 80px rgba(0,0,0,0.3)' }}>
        <div style={{ background:'linear-gradient(135deg,#1a3a0a,#2d5a1b)', padding:'22px 28px',
          borderRadius:'20px 20px 0 0', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:1 }}>
          <div>
            <div style={{ color:'rgba(255,255,255,0.7)', fontSize:'0.78rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', marginBottom:4 }}>Order Bill</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.4rem', fontWeight:800, color:'white' }}>ORD{orderId}</div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none',
            borderRadius:'50%', width:36, height:36, cursor:'pointer', fontSize:'1.1rem', color:'white' }}>x</button>
        </div>

        <div style={{ padding:'24px 28px' }}>
          {loading ? <div style={{ textAlign:'center', padding:40, color:'#8a9e8a' }}>Loading bill...</div>
          : err ? <div style={{ color:'#c0392b', padding:20 }}>!!! {err}</div>
          : bill && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
                {[['Order Date', fmtDate(bill.orderDate)],['Payment', bill.payment ? bill.payment.status : 'NOT PAID'],
                  ['Transaction ID', bill.payment ? bill.payment.transactionId : '\u2014'],['Payment Method', bill.payment ? bill.payment.method : '\u2014']].map(([label,val]) => (
                  <div key={label} style={{ background:'#f8fdf6', borderRadius:10, padding:'12px 14px' }}>
                    <div style={{ fontSize:'0.7rem', fontWeight:700, color:'#8a9e8a', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>{label}</div>
                    <div style={{ fontWeight:700, color:'#1a3a0a', fontSize:'0.9rem' }}>{val}</div>
                  </div>
                ))}
              </div>

              <div style={{ background:'#f8fdf6', borderRadius:10, padding:'12px 14px', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ fontSize:'0.7rem', fontWeight:700, color:'#8a9e8a', textTransform:'uppercase', letterSpacing:'0.5px' }}>Order Status</div>
                <Pill v={bill.status}/>
              </div>

              <div style={{ background:'#f0faf0', borderRadius:12, padding:'14px 18px', marginBottom:16 }}>
                <div style={{ fontWeight:800, color:'#1a3a0a', marginBottom:10, fontSize:'0.88rem' }}>Customer Details</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 16px', fontSize:'0.85rem', color:'#4a5c4a' }}>
                  <div><span style={{ color:'#8a9e8a', fontWeight:600 }}>Name: </span>{bill.customer ? bill.customer.name : '\u2014'}</div>
                  <div><span style={{ color:'#8a9e8a', fontWeight:600 }}>Email: </span>{bill.customer ? bill.customer.email : '\u2014'}</div>
                  <div><span style={{ color:'#8a9e8a', fontWeight:600 }}>Phone: </span>{bill.customer ? (bill.customer.phone || '\u2014') : '\u2014'}</div>
                  <div><span style={{ color:'#8a9e8a', fontWeight:600 }}>Delivery Address: </span>{bill.customer ? (bill.customer.deliveryAddress || '\u2014') : '\u2014'}</div>
                </div>
              </div>

              <div style={{ marginBottom:16 }}>
                <div style={{ fontWeight:800, color:'#1a3a0a', marginBottom:10, fontSize:'0.88rem' }}>Ordered Items (from Farmers)</div>
                {!bill.items || bill.items.length === 0 ? (
                  <div style={{ color:'#8a9e8a', fontSize:'0.84rem', padding:'12px 0' }}>No item details found (orders placed more than 10 minutes apart from payment).</div>
                ) : (
                  <div style={{ border:'1px solid #e0f0da', borderRadius:12, overflow:'hidden' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.84rem' }}>
                      <thead>
                        <tr style={{ background:'#f8fdf6' }}>
                          {['Vegetable','Farmer ID','Qty (kg)','Price/kg','Subtotal','Status'].map(h => (
                            <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:'0.7rem',
                              fontWeight:800, color:'#1a3a0a', textTransform:'uppercase', letterSpacing:'0.5px',
                              borderBottom:'1px solid #e0f0da' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bill.items.map((item, i) => (
                          <tr key={i} style={{ borderBottom:'1px solid #f0f5f0' }}>
                            <td style={{ padding:'10px 14px', fontWeight:700, color:'#1a3a0a' }}>{item.vegetableName}</td>
                            <td style={{ padding:'10px 14px', fontFamily:'monospace', color:'#4a9e3f', fontWeight:700 }}>{item.farmerId}</td>
                            <td style={{ padding:'10px 14px', color:'#4a5c4a' }}>{item.quantityKg} kg</td>
                            <td style={{ padding:'10px 14px', color:'#4a5c4a' }}>Rs. {Number(item.pricePerKg).toLocaleString()}</td>
                            <td style={{ padding:'10px 14px', fontWeight:700, color:'#2d5a1b' }}>Rs. {Number(item.totalAmount).toLocaleString()}</td>
                            <td style={{ padding:'10px 14px' }}><Pill v={item.orderStatus}/></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {bill.deliveryAgent && (
                <div style={{ background:'#f3e5f5', borderRadius:12, padding:'14px 18px', marginBottom:16 }}>
                  <div style={{ fontWeight:800, color:'#7b1fa2', marginBottom:10, fontSize:'0.88rem' }}>Delivery Agent</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 16px', fontSize:'0.85rem' }}>
                    <div><span style={{ color:'#8a9e8a', fontWeight:600 }}>Agent: </span>{bill.deliveryAgent.name}</div>
                    <div><span style={{ color:'#8a9e8a', fontWeight:600 }}>Phone: </span>{bill.deliveryAgent.phone}</div>
                    <div><span style={{ color:'#8a9e8a', fontWeight:600 }}>Vehicle: </span>{bill.deliveryAgent.vehicle}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ color:'#8a9e8a', fontWeight:600 }}>Status: </span><Pill v={bill.deliveryAgent.deliveryStatus}/>
                    </div>
                    {bill.deliveryAgent.pickupDate && (
                      <div><span style={{ color:'#8a9e8a', fontWeight:600 }}>Pickup Date: </span>{bill.deliveryAgent.pickupDate}</div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ background:'linear-gradient(135deg,#1a3a0a,#2d5a1b)', borderRadius:12,
                padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ color:'rgba(255,255,255,0.8)', fontWeight:700, fontSize:'0.9rem' }}>Grand Total</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.5rem', fontWeight:800, color:'white' }}>
                  Rs. {Number(bill.totalAmount||0).toLocaleString()}
                </div>
              </div>

              <div style={{ display:'flex', gap:10, marginTop:16 }}>
                <button onClick={() => window.print()}
                  style={{ flex:1, padding:'11px', borderRadius:10, border:'1.5px solid #d0e8c8',
                    background:'white', color:'#2d5a1b', fontSize:'0.88rem', fontWeight:700, cursor:'pointer' }}>
                  Print Bill
                </button>
                <button onClick={onClose}
                  style={{ flex:1, padding:'11px', borderRadius:10, border:'none',
                    background:'linear-gradient(135deg,#2d5a1b,#4a9e3f)', color:'white',
                    fontSize:'0.88rem', fontWeight:700, cursor:'pointer' }}>
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DeliveryAgentModal({ order, onClose, onSaved }) {
  const [agentName, setAgentName]       = useState(order.agentName || '');
  const [agentPhone, setAgentPhone]     = useState(order.agentPhone || '');
  const [agentVehicle, setAgentVehicle] = useState(order.agentVehicle || '');
  const [deliveryStatus, setDeliveryStatus] = useState(order.deliveryStatus || 'ASSIGNED');
  const [pickupDate, setPickupDate]     = useState(order.pickupDate || '');
  const [saving, setSaving]             = useState(false);
  const [err, setErr]                   = useState('');

  const save = async () => {
    if (!agentName.trim())    { setErr('Agent name is required.'); return; }
    if (!agentPhone.trim())   { setErr('Phone number is required.'); return; }
    if (!agentVehicle.trim()) { setErr('Vehicle number is required.'); return; }
    if (!pickupDate)          { setErr('Pickup date is required.'); return; }
    setSaving(true); setErr('');
    try {
      const res = await fetch(`${API}/admin/orders/${order.orderId}/delivery-agent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentName, agentPhone, agentVehicle, deliveryStatus, pickupDate }),
      });
      if (!res.ok) throw new Error();
      onSaved();
    } catch { setErr('Failed to save. Please try again.'); }
    setSaving(false);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:800,
      display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)', padding:20 }}>
      <div style={{ background:'white', borderRadius:20, padding:32, width:'100%', maxWidth:480,
        boxShadow:'0 20px 80px rgba(0,0,0,0.25)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20,
          paddingBottom:16, borderBottom:'2px solid #e8f5e9' }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.2rem', fontWeight:800, color:'#1a3a0a' }}>
            Assign Delivery Agent - ORD{order.orderId}
          </div>
          <button onClick={onClose} style={{ background:'#f0f0f0', border:'none', borderRadius:'50%',
            width:32, height:32, cursor:'pointer', fontSize:'1rem' }}>x</button>
        </div>
        {[['Agent Name', agentName, setAgentName, 'text', 'e.g. Kamal Perera'],
          ['Telephone Number', agentPhone, setAgentPhone, 'tel', 'e.g. 0771234567'],
          ['Vehicle Number Plate', agentVehicle, setAgentVehicle, 'text', 'e.g. WP-CAB-1234'],
        ].map(([label, val, setter, type, ph]) => (
          <div key={label} style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'#4a5c4a',
              textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>{label}</label>
            <input type={type} value={val} onChange={e => setter(e.target.value)} placeholder={ph}
              style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #d0e8c8', borderRadius:10,
                fontSize:'0.9rem', outline:'none', boxSizing:'border-box', background:'#fafcfa' }}/>
          </div>
        ))}
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'#4a5c4a',
            textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Pickup Date for Farmer</label>
          <input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)}
            style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #d0e8c8', borderRadius:10,
              fontSize:'0.9rem', outline:'none', boxSizing:'border-box', background:'#fafcfa' }}/>
        </div>
        <div style={{ marginBottom:18 }}>
          <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'#4a5c4a',
            textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Delivery Status</label>
          <select value={deliveryStatus} onChange={e => setDeliveryStatus(e.target.value)}
            style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #d0e8c8', borderRadius:10,
              fontSize:'0.9rem', outline:'none', background:'#fafcfa', cursor:'pointer' }}>
            <option value="ASSIGNED">Assigned</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
          </select>
        </div>
        {err && <div style={{ background:'#fdecea', border:'1px solid #f5c6cb', color:'#c0392b',
          borderRadius:10, padding:'10px 14px', fontSize:'0.84rem', marginBottom:14 }}>!!! {err}</div>}
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'12px', borderRadius:10,
            border:'1.5px solid #d0e8c8', background:'white', color:'#4a5c4a',
            fontSize:'0.88rem', fontWeight:600, cursor:'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ flex:2, padding:'12px', borderRadius:10,
            border:'none', background:'linear-gradient(135deg,#2d5a1b,#4a9e3f)',
            color:'white', fontSize:'0.88rem', fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving...' : 'Save Assignment'}
          </button>
        </div>
      </div>
    </div>
  );
}

const ORDER_STATUSES = ['PENDING_APPROVAL','APPROVED','PAID','REJECTED','DELIVERED','COMPLETED'];

function StatusEditor({ order, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const update = async newStatus => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/admin/orders/${order.orderId}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) onUpdated();
    } catch {}
    setSaving(false); setEditing(false);
  };
  if (saving) return <span style={{ fontSize:'0.78rem', color:'#8a9e8a' }}>Saving...</span>;
  if (!editing) return (
    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
      <Pill v={order.orderStatus}/>
      <button onClick={() => setEditing(true)}
        style={{ fontSize:'0.68rem', padding:'2px 8px', borderRadius:6, border:'1px solid #d0e8c8',
          background:'#f8fdf6', color:'#4a5c4a', cursor:'pointer', fontWeight:600 }}>Edit</button>
    </div>
  );
  return (
    <select autoFocus defaultValue={order.orderStatus}
      onChange={e => update(e.target.value)} onBlur={() => setEditing(false)}
      style={{ padding:'5px 8px', borderRadius:8, border:'1.5px solid #4a9e3f',
        fontSize:'0.8rem', background:'white', cursor:'pointer', outline:'none' }}>
      {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}

function OrderSection({ title, icon, color, orders, onApprove, onReject, onAssignAgent, onViewBill, onUpdated }) {
  return (
    <div style={{ background:'white', borderRadius:16, border:`2px solid ${color}33`,
      boxShadow:'0 2px 12px rgba(26,58,10,0.06)', marginBottom:20 }}>
      <div style={{ padding:'16px 22px', borderBottom:'1px solid #f0f5f0', display:'flex',
        justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:'1.2rem' }}>{icon}</span>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.05rem', fontWeight:800, color:'#1a3a0a' }}>{title}</div>
        </div>
        <span style={{ background:`${color}22`, color, fontSize:'0.76rem', fontWeight:700,
          padding:'4px 12px', borderRadius:20, border:`1px solid ${color}44` }}>
          {orders.length} order{orders.length !== 1 ? 's' : ''}
        </span>
      </div>
      {orders.length === 0 ? (
        <div style={{ textAlign:'center', padding:'28px', color:'#8a9e8a', fontSize:'0.88rem' }}>No orders in this category</div>
      ) : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.86rem' }}>
            <thead>
              <tr style={{ background:'#f8fdf6' }}>
                {['Order ID','Customer','Amount','Status','Payment','Delivery Agent','Actions'].map(h => (
                  <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:'0.72rem',
                    fontWeight:800, color:'#1a3a0a', textTransform:'uppercase', letterSpacing:'0.5px',
                    borderBottom:'2px solid #e0f0da', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(r => {
                const approved = r.orderStatus==='APPROVED';
                const rejected = r.orderStatus==='REJECTED';
                const paid     = r.paymentStatus==='SUCCESS' || r.orderStatus==='PAID';
                return (
                  <tr key={r.orderId} style={{ borderBottom:'1px solid #f0f5f0' }}
                    onMouseOver={e=>e.currentTarget.style.background='#f8fdf6'}
                    onMouseOut={e=>e.currentTarget.style.background=''}>
                    <td style={{ padding:'12px 16px', fontWeight:700, color:'#1a3a0a' }}>ORD{r.orderId}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ fontWeight:700, color:'#1a3a0a' }}>{r.customerName}</div>
                      <div style={{ fontSize:'0.76rem', color:'#8a9e8a' }}>{r.customerEmail}</div>
                    </td>
                    <td style={{ padding:'12px 16px', fontWeight:700, color:'#2d5a1b' }}>
                      Rs. {Number(r.amount||0).toLocaleString()}
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <StatusEditor order={r} onUpdated={onUpdated}/>
                    </td>
                    <td style={{ padding:'12px 16px' }}><Pill v={r.paymentStatus}/></td>
                    <td style={{ padding:'12px 16px' }}>
                      {r.agentName ? (
                        <div style={{ fontSize:'0.8rem', lineHeight:1.5 }}>
                          <div style={{ fontWeight:700, color:'#1a3a0a' }}>{r.agentName}</div>
                          <div style={{ color:'#8a9e8a' }}>Ph: {r.agentPhone}</div>
                          <div style={{ color:'#8a9e8a' }}>Veh: {r.agentVehicle}</div>
                          {r.deliveryStatus && <div style={{ marginTop:3 }}><Pill v={r.deliveryStatus}/></div>}
                          {r.pickupDate && <div style={{ color:'#4a9e3f', fontSize:'0.76rem', marginTop:2 }}>Pickup: {r.pickupDate}</div>}
                        </div>
                      ) : (
                        <span style={{ color:'#c0c0c0', fontSize:'0.8rem', fontStyle:'italic' }}>Not assigned</span>
                      )}
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex', flexDirection:'column', gap:6, minWidth:130 }}>
                        <button onClick={() => onViewBill(r.orderId)}
                          style={{ padding:'5px 12px', borderRadius:8, border:'1px solid #2980b9',
                            background:'#e3f2fd', color:'#2980b9', fontSize:'0.76rem', fontWeight:700, cursor:'pointer' }}>
                          View Bill
                        </button>
                        {!approved && !rejected && !paid && (
                          <div style={{ display:'flex', gap:6 }}>
                            <button onClick={() => onApprove(r.orderId)}
                              style={{ flex:1, padding:'5px 8px', borderRadius:8, border:'none', fontSize:'0.76rem',
                                fontWeight:700, cursor:'pointer', background:'#e8f5e9', color:'#2d5a1b' }}>Approve</button>
                            <button onClick={() => onReject(r.orderId)}
                              style={{ flex:1, padding:'5px 8px', borderRadius:8, border:'none', fontSize:'0.76rem',
                                fontWeight:700, cursor:'pointer', background:'#fdecea', color:'#c0392b' }}>Reject</button>
                          </div>
                        )}
                        {(approved || paid) && (
                          <button onClick={() => onAssignAgent(r)}
                            style={{ padding:'5px 12px', borderRadius:8, border:'none', fontSize:'0.76rem',
                              fontWeight:700, cursor:'pointer',
                              background: r.agentName ? '#f3e5f5' : 'linear-gradient(135deg,#7b1fa2,#9c27b0)',
                              color: r.agentName ? '#7b1fa2' : 'white' }}>
                            {r.agentName ? 'Edit Agent' : 'Assign Agent'}
                          </button>
                        )}
                        {rejected && <span style={{ color:'#c0392b', fontSize:'0.8rem' }}>Rejected</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function PaymentTab() {
  const [overview, setOverview]       = useState(null);
  const [requests, setRequests]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState('ALL');
  const [actionMsg, setActionMsg]     = useState('');
  const [search, setSearch]           = useState('');
  const [agentModal, setAgentModal]   = useState(null);
  const [billOrderId, setBillOrderId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [ov, req] = await Promise.all([
        fetch(`${API}/overview`).then(r=>r.json()),
        fetch(`${API}/admin/requests`).then(r=>r.json()),
      ]);
      setOverview(ov);
      setRequests(Array.isArray(req) ? req : []);
    } catch { setActionMsg('Could not load payment data. Is backend running?'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const flash = msg => { setActionMsg(msg); setTimeout(()=>setActionMsg(''), 4000); };

  const approve = async id => {
    try { await fetch(`${API}/admin/requests/${id}/approve`, {method:'POST'}); flash('Order approved.'); load(); }
    catch { flash('Failed to approve.'); }
  };
  const reject = async id => {
    if (!window.confirm('Reject this order?')) return;
    try { await fetch(`${API}/admin/requests/${id}/reject`, {method:'POST'}); flash('Order rejected.'); load(); }
    catch { flash('Failed to reject.'); }
  };

  const filteredTx = useMemo(() => {
    if (!overview?.transactionHistory) return [];
    let list = overview.transactionHistory;
    if (filter !== 'ALL') list = list.filter(t => t.paymentStatus === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => String(t.orderId).includes(q) || (t.transactionId||'').toLowerCase().includes(q));
    }
    return list;
  }, [overview, filter, search]);

  const pendingOrders   = requests.filter(r => r.orderStatus==='PENDING_APPROVAL' || r.orderStatus==='PENDING');
  const ongoingOrders   = requests.filter(r =>
    (r.orderStatus==='APPROVED' || (r.paymentStatus==='SUCCESS' && r.orderStatus!=='DELIVERED' && r.orderStatus!=='COMPLETED'))
    && r.orderStatus!=='REJECTED'
  );
  const completedOrders = requests.filter(r =>
    r.orderStatus==='DELIVERED' || r.orderStatus==='COMPLETED' ||
    (r.paymentStatus==='SUCCESS' && r.orderStatus==='PAID')
  );

  const stats = [
    { label:'Total Transactions', value: overview?.totalTransactions ?? 0, color:'#2980b9', icon:'credit card', key:'ALL' },
    { label:'Successful', value: overview?.successfulTransactions ?? 0, color:'#4a9e3f', icon:'check', key:'SUCCESS' },
    { label:'Failed', value: overview?.failedTransactions ?? 0, color:'#c0392b', icon:'x', key:'FAILED' },
  ];

  return (
    <div className="animate-fade">
      <div style={{ background:'linear-gradient(135deg,#1a3a0a,#2d5a1b)', borderRadius:18,
        padding:'28px 32px', marginBottom:24, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0,
          backgroundImage:'radial-gradient(circle at 1px 1px,rgba(255,255,255,0.05) 1px,transparent 0)',
          backgroundSize:'28px 28px' }}/>
        <div style={{ position:'relative', zIndex:1, display:'flex', justifyContent:'space-between',
          alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>
          <div>
            <div style={{ display:'inline-block', background:'rgba(212,114,42,0.25)', border:'1px solid rgba(212,114,42,0.4)',
              color:'#ffc87a', fontSize:'0.75rem', fontWeight:700, padding:'4px 14px', borderRadius:20, marginBottom:8 }}>
              Payment and Delivery Management
            </div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.8rem', fontWeight:800, color:'white', margin:'0 0 4px' }}>
              Order Management
            </h2>
            <p style={{ color:'rgba(255,255,255,0.65)', fontSize:'0.88rem', margin:0 }}>
              Approve orders - Edit status - Assign delivery agents - View bills
            </p>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={load} style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)',
              color:'white', padding:'9px 18px', borderRadius:10, cursor:'pointer', fontSize:'0.84rem', fontWeight:700 }}>
              Refresh
            </button>
            <a href={`${API}/admin/report`} style={{ background:'linear-gradient(135deg,#2980b9,#1a5c8a)', color:'white',
              padding:'9px 18px', borderRadius:10, fontSize:'0.84rem', fontWeight:700, textDecoration:'none', display:'inline-block' }}>
              CSV Report
            </a>
          </div>
        </div>
      </div>

      {actionMsg && (
        <div style={{ background:'#e8f5e9', border:'1px solid #c8e6c9', color:'#2d5a1b',
          borderRadius:10, padding:'12px 16px', marginBottom:16, fontWeight:600, fontSize:'0.86rem' }}>
          {actionMsg}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'#8a9e8a' }}>Loading order data...</div>
      ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16, marginBottom:28 }}>
            {stats.map(s => (
              <div key={s.key} onClick={()=>setFilter(s.key)} style={{
                background:'white', borderRadius:16, padding:'20px', cursor:'pointer',
                border:`2px solid ${filter===s.key ? s.color : '#e0f0da'}`,
                boxShadow: filter===s.key ? `0 4px 16px ${s.color}33` : '0 2px 8px rgba(26,58,10,0.06)',
                transition:'all 0.2s' }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'2rem', fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:'0.78rem', color:'#8a9e8a', marginTop:4, fontWeight:600 }}>{s.label}</div>
              </div>
            ))}
            <div style={{ background:'white', borderRadius:16, padding:'20px', border:'1px solid #e0f0da', boxShadow:'0 2px 8px rgba(26,58,10,0.06)' }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'2rem', fontWeight:800, color:'#e67e22', lineHeight:1 }}>{pendingOrders.length}</div>
              <div style={{ fontSize:'0.78rem', color:'#8a9e8a', marginTop:4, fontWeight:600 }}>Pending Approval</div>
            </div>
          </div>

          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.35rem', fontWeight:800, color:'#1a3a0a', marginBottom:16 }}>
            Order Management
          </div>

          <OrderSection title="Pending Approval" icon="pending" color="#e67e22"
            orders={pendingOrders} onApprove={approve} onReject={reject}
            onAssignAgent={setAgentModal} onViewBill={setBillOrderId} onUpdated={load}/>

          <OrderSection title="Ongoing - Approved and Awaiting Delivery" icon="ongoing" color="#2980b9"
            orders={ongoingOrders} onApprove={approve} onReject={reject}
            onAssignAgent={setAgentModal} onViewBill={setBillOrderId} onUpdated={load}/>

          <OrderSection title="Completed Orders" icon="completed" color="#4a9e3f"
            orders={completedOrders} onApprove={approve} onReject={reject}
            onAssignAgent={setAgentModal} onViewBill={setBillOrderId} onUpdated={load}/>

          <div style={{ background:'white', borderRadius:16, border:'1px solid #e0f0da',
            boxShadow:'0 2px 12px rgba(26,58,10,0.06)', marginTop:8 }}>
            <div style={{ padding:'18px 22px', borderBottom:'1px solid #f0f5f0', display:'flex',
              justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.1rem', fontWeight:800, color:'#1a3a0a' }}>
                Transaction History
              </div>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search order ID or transaction..."
                style={{ padding:'8px 14px', border:'1.5px solid #d0e8c8', borderRadius:10, fontSize:'0.86rem', outline:'none', minWidth:220 }}/>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.86rem' }}>
                <thead>
                  <tr style={{ background:'#f8fdf6' }}>
                    {['Transaction ID','Order ID','Amount','Method','Status','Date'].map(h=>(
                      <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:'0.72rem',
                        fontWeight:800, color:'#1a3a0a', textTransform:'uppercase', letterSpacing:'0.5px',
                        borderBottom:'2px solid #e0f0da', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTx.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:'#8a9e8a' }}>
                      No transactions{filter!=='ALL'?` with status ${filter}`:''}
                    </td></tr>
                  ) : filteredTx.map((t,i) => (
                    <tr key={`${t.transactionId||i}-${t.orderId}`} style={{ borderBottom:'1px solid #f0f5f0' }}
                      onMouseOver={e=>e.currentTarget.style.background='#f8fdf6'}
                      onMouseOut={e=>e.currentTarget.style.background=''}>
                      <td style={{ padding:'12px 16px', fontFamily:'monospace', fontSize:'0.82rem', color:'#1a3a0a' }}>{t.transactionId||'—'}</td>
                      <td style={{ padding:'12px 16px', fontWeight:700 }}>ORD{t.orderId}</td>
                      <td style={{ padding:'12px 16px', fontWeight:700, color:'#2d5a1b' }}>Rs. {Number(t.amountPaid||0).toLocaleString()}</td>
                      <td style={{ padding:'12px 16px', color:'#4a5c4a' }}>{t.paymentMethod||'—'}</td>
                      <td style={{ padding:'12px 16px' }}><Pill v={t.paymentStatus}/></td>
                      <td style={{ padding:'12px 16px', color:'#8a9e8a', fontSize:'0.82rem' }}>{fmt(t.paymentDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {agentModal && (
        <DeliveryAgentModal order={agentModal} onClose={() => setAgentModal(null)}
          onSaved={() => { setAgentModal(null); flash('Delivery agent assigned successfully!'); load(); }}/>
      )}
      {billOrderId && <BillModal orderId={billOrderId} onClose={() => setBillOrderId(null)}/>}
    </div>
  );
}
