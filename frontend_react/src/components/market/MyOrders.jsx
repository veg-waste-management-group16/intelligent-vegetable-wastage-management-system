import { useState, useEffect } from 'react';

const PAY_API = '/api/payments';

const statusColor = s => {
  if (!s) return { bg:'#f0f0f0', color:'#8a9e8a' };
  const u = s.toUpperCase();
  if (u==='SUCCESS'||u==='PAID')           return { bg:'#e8f5e9', color:'#2d5a1b' };
  if (u==='APPROVED')                       return { bg:'#e3f2fd', color:'#2980b9' };
  if (u==='FAILED'||u==='PAYMENT_FAILED')  return { bg:'#fdecea', color:'#c0392b' };
  if (u==='REJECTED')                       return { bg:'#fdecea', color:'#c0392b' };
  if (u==='ASSIGNED')                       return { bg:'#f3e5f5', color:'#7b1fa2' };
  if (u==='OUT_FOR_DELIVERY')               return { bg:'#e3f2fd', color:'#1976d2' };
  if (u==='DELIVERED')                      return { bg:'#e8f5e9', color:'#2d5a1b' };
  return { bg:'#fff3e0', color:'#e67e22' };
};

const Pill = ({ v }) => {
  const { bg, color } = statusColor(v);
  return (
    <span style={{ background:bg, color, fontSize:'0.72rem', fontWeight:700,
      padding:'3px 10px', borderRadius:20, textTransform:'uppercase', display:'inline-block' }}>
      {v || 'PENDING'}
    </span>
  );
};

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-LK',{day:'numeric',month:'short',year:'numeric'});
}

// ── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ order, onClose, onSuccess }) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry]         = useState('');
  const [cvv, setCvv]               = useState('');
  const [method, setMethod]         = useState('Credit/Debit Card');
  const [err, setErr]               = useState('');
  const [loading, setLoading]       = useState(false);

  const submit = async e => {
    e.preventDefault();
    setErr('');
    const digits = cardNumber.replace(/\s/g,'');
    if (!/^\d{12,19}$/.test(digits))               { setErr('Card number must be 12–19 digits.'); return; }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) { setErr('Expiry must be MM/YY.'); return; }
    const [m,y] = expiry.split('/').map(Number);
    if (new Date(2000+y, m, 0) < new Date())        { setErr('Card is expired.'); return; }
    if (!/^\d{3,4}$/.test(cvv.trim()))              { setErr('CVV must be 3–4 digits.'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${PAY_API}/process`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ orderId: order.orderId, paymentMethod: method,
          cardNumber: digits, expiryDate: expiry.trim(), cvv: cvv.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.paymentStatus === 'SUCCESS') { onSuccess(data); }
      else { setErr(data.message || 'Payment failed. Check your card details.'); }
    } catch { setErr('Network error. Please try again.'); }
    setLoading(false);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:600,
      display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)', padding:20 }}>
      <div style={{ background:'white', borderRadius:20, padding:'32px', width:'100%', maxWidth:460,
        boxShadow:'0 20px 80px rgba(0,0,0,0.25)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
          marginBottom:20, paddingBottom:16, borderBottom:'2px solid #e8f5e9' }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.3rem', fontWeight:800, color:'#1a3a0a' }}>
            💳 Complete Payment
          </div>
          <button onClick={onClose} style={{ background:'#f0f0f0', border:'none', borderRadius:'50%',
            width:32, height:32, cursor:'pointer', fontSize:'1rem' }}>✕</button>
        </div>

        <div style={{ background:'#f0faf0', borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
          <div style={{ fontSize:'0.78rem', color:'#8a9e8a', marginBottom:4 }}>ORDER TOTAL</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.6rem', fontWeight:800, color:'#1a3a0a' }}>
            Rs. {Number(order.totalAmount||0).toLocaleString()}
          </div>
          <div style={{ fontSize:'0.76rem', color:'#8a9e8a', marginTop:2 }}>Order #{order.orderId}</div>
          <div style={{ fontSize:'0.76rem', color:'#4a9e3f', marginTop:4 }}>
            ✓ Includes 5% service charge + Rs. 350 delivery charge
          </div>
        </div>

        <form onSubmit={submit} noValidate>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'#4a5c4a',
              textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Payment Method</label>
            <select value={method} onChange={e=>setMethod(e.target.value)}
              style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #d0e8c8',
                borderRadius:10, fontSize:'0.9rem', background:'#fafcfa', outline:'none', cursor:'pointer' }}>
              <option>Credit/Debit Card</option>
            </select>
          </div>

          {[
            ['Card Number','cardNumber','text','**** **** **** ****',19,
              v=>{ const d=v.replace(/\D/g,'').slice(0,19); setCardNumber(d.replace(/(\d{4})(?=\d)/g,'$1 ')); }],
            ['Expiry Date (MM/YY)','expiry','text','MM/YY',5,
              v=>{ const d=v.replace(/\D/g,'').slice(0,4); setExpiry(d.length>=3?`${d.slice(0,2)}/${d.slice(2)}`:d); }],
            ['CVV','cvv','password','•••',4,
              v=>setCvv(v.replace(/\D/g,'').slice(0,4))],
          ].map(([label, id, type, ph, max, handler]) => (
            <div key={id} style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'#4a5c4a',
                textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>{label}</label>
              <input type={type}
                value={id==='cardNumber'?cardNumber:id==='expiry'?expiry:cvv}
                onChange={e=>handler(e.target.value)} placeholder={ph} maxLength={max}
                style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #d0e8c8',
                  borderRadius:10, fontSize:'0.9rem', background:'#fafcfa', outline:'none', boxSizing:'border-box' }}/>
            </div>
          ))}

          {err && (
            <div style={{ background:'#fdecea', border:'1px solid #f5c6cb', color:'#c0392b',
              borderRadius:10, padding:'10px 14px', fontSize:'0.84rem', marginBottom:14 }}>
              ⚠️ {err}
            </div>
          )}

          <div style={{ display:'flex', gap:10, marginTop:4 }}>
            <button type="button" onClick={onClose}
              style={{ flex:1, padding:'12px', borderRadius:10, border:'1.5px solid #d0e8c8',
                background:'white', color:'#4a5c4a', fontSize:'0.88rem', fontWeight:600, cursor:'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              style={{ flex:2, padding:'12px', borderRadius:10, border:'none',
                background: loading ? '#6b9e62' : 'linear-gradient(135deg,#2d5a1b,#4a9e3f)',
                color:'white', fontSize:'0.88rem', fontWeight:700,
                cursor: loading?'not-allowed':'pointer', boxShadow:'0 4px 14px rgba(45,90,27,0.3)' }}>
              {loading ? 'Processing…' : '🔒 Pay Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Success Receipt Modal ─────────────────────────────────────────────────────
function ReceiptModal({ payment, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:700,
      display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)', padding:20 }}>
      <div style={{ background:'white', borderRadius:20, padding:'36px', width:'100%', maxWidth:420,
        textAlign:'center', boxShadow:'0 20px 80px rgba(0,0,0,0.25)' }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#2d5a1b,#4a9e3f)',
          margin:'0 auto 20px', display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'2rem', boxShadow:'0 8px 24px rgba(45,90,27,0.3)' }}>✓</div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.6rem', fontWeight:800, color:'#1a3a0a', marginBottom:6 }}>
          Payment Successful!
        </div>
        <div style={{ fontSize:'0.86rem', color:'#8a9e8a', marginBottom:24 }}>Your transaction is complete. Thank you!</div>
        <div style={{ background:'#f0faf0', borderRadius:12, padding:'18px', marginBottom:24, textAlign:'left' }}>
          {[
            ['Transaction ID', payment.transactionId],
            ['Amount Paid', `Rs. ${Number(payment.amountPaid||0).toLocaleString()}`],
            ['Method', payment.paymentMethod],
            ['Date', fmt(payment.paymentDate)],
          ].map(([l,v])=>(
            <div key={l} style={{ display:'flex', justifyContent:'space-between',
              padding:'8px 0', borderBottom:'1px solid #e0f0da', fontSize:'0.86rem' }}>
              <span style={{ color:'#8a9e8a', fontWeight:600 }}>{l}</span>
              <span style={{ fontWeight:700, color:'#1a3a0a' }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={()=>window.print()}
            style={{ flex:1, padding:'12px', borderRadius:10, border:'1.5px solid #d0e8c8',
              background:'white', color:'#2d5a1b', fontSize:'0.88rem', fontWeight:700, cursor:'pointer' }}>
            🖨️ Print
          </button>
          <button onClick={onClose}
            style={{ flex:2, padding:'12px', borderRadius:10, border:'none',
              background:'linear-gradient(135deg,#2d5a1b,#4a9e3f)', color:'white',
              fontSize:'0.88rem', fontWeight:700, cursor:'pointer' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}


// ── Customer Order Detail / Bill Modal ───────────────────────────────────────
function CustomerBillModal({ orderId, onClose }) {
  const [bill, setBill]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState('');

  useEffect(() => {
    fetch(`${PAY_API}/orders/${orderId}/bill`)
      .then(r => r.json())
      .then(d => { setBill(d); setLoading(false); })
      .catch(() => { setErr('Could not load order details.'); setLoading(false); });
  }, [orderId]);

  const sc = s => {
    if (!s) return { bg:'#f0f0f0', color:'#8a9e8a' };
    const u = s.toUpperCase();
    if (u==='SUCCESS'||u==='PAID')           return { bg:'#e8f5e9', color:'#2d5a1b' };
    if (u==='APPROVED')                       return { bg:'#e3f2fd', color:'#2980b9' };
    if (u==='FAILED'||u==='PAYMENT_FAILED')  return { bg:'#fdecea', color:'#c0392b' };
    if (u==='REJECTED')                       return { bg:'#fdecea', color:'#c0392b' };
    if (u==='ASSIGNED')                       return { bg:'#f3e5f5', color:'#7b1fa2' };
    if (u==='OUT_FOR_DELIVERY')               return { bg:'#e3f2fd', color:'#1976d2' };
    if (u==='DELIVERED'||u==='COMPLETED')     return { bg:'#e8f5e9', color:'#2d5a1b' };
    return { bg:'#fff3e0', color:'#e67e22' };
  };
  const SPill = ({ v }) => {
    const { bg, color } = sc(v);
    return <span style={{ background:bg, color, fontSize:'0.72rem', fontWeight:700,
      padding:'3px 10px', borderRadius:20, textTransform:'uppercase', display:'inline-block' }}>{v||'PENDING'}</span>;
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:700,
      display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)', padding:20 }}>
      <div style={{ background:'white', borderRadius:20, width:'100%', maxWidth:620,
        maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 80px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#1a3a0a,#2d5a1b)', padding:'20px 24px',
          borderRadius:'20px 20px 0 0', display:'flex', justifyContent:'space-between', alignItems:'center',
          position:'sticky', top:0, zIndex:1 }}>
          <div>
            <div style={{ color:'rgba(255,255,255,0.7)', fontSize:'0.75rem', fontWeight:700,
              textTransform:'uppercase', letterSpacing:'1px', marginBottom:2 }}>Order Details</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.3rem', fontWeight:800, color:'white' }}>
              ORD{orderId}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none',
            borderRadius:'50%', width:34, height:34, cursor:'pointer', color:'white', fontSize:'1rem' }}>✕</button>
        </div>

        <div style={{ padding:'22px 24px' }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:40, color:'#8a9e8a' }}>Loading order details…</div>
          ) : err ? (
            <div style={{ color:'#c0392b', padding:20 }}>⚠️ {err}</div>
          ) : bill && (
            <>
              {/* Status row */}
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:18 }}>
                <div style={{ background:'#f8fdf6', borderRadius:10, padding:'10px 14px', flex:1, minWidth:140 }}>
                  <div style={{ fontSize:'0.68rem', fontWeight:700, color:'#8a9e8a', textTransform:'uppercase', marginBottom:4 }}>Order Status</div>
                  <SPill v={bill.status}/>
                </div>
                <div style={{ background:'#f8fdf6', borderRadius:10, padding:'10px 14px', flex:1, minWidth:140 }}>
                  <div style={{ fontSize:'0.68rem', fontWeight:700, color:'#8a9e8a', textTransform:'uppercase', marginBottom:4 }}>Payment</div>
                  <SPill v={bill.payment ? bill.payment.status : 'NOT PAID'}/>
                </div>
                <div style={{ background:'#f8fdf6', borderRadius:10, padding:'10px 14px', flex:1, minWidth:140 }}>
                  <div style={{ fontSize:'0.68rem', fontWeight:700, color:'#8a9e8a', textTransform:'uppercase', marginBottom:4 }}>Order Date</div>
                  <div style={{ fontWeight:700, color:'#1a3a0a', fontSize:'0.86rem' }}>
                    {bill.orderDate ? new Date(bill.orderDate).toLocaleDateString('en-LK',{day:'numeric',month:'short',year:'numeric'}) : '—'}
                  </div>
                </div>
              </div>

              {/* Payment ref */}
              {bill.payment && (
                <div style={{ background:'#e8f5e9', borderRadius:10, padding:'10px 14px', marginBottom:16,
                  display:'flex', justifyContent:'space-between', fontSize:'0.84rem', flexWrap:'wrap', gap:8 }}>
                  <div><span style={{ color:'#8a9e8a', fontWeight:600 }}>Transaction: </span>
                    <span style={{ fontFamily:'monospace', fontWeight:700, color:'#1a3a0a' }}>{bill.payment.transactionId}</span></div>
                  <div><span style={{ color:'#8a9e8a', fontWeight:600 }}>Method: </span>{bill.payment.method}</div>
                  <div><span style={{ color:'#8a9e8a', fontWeight:600 }}>Date: </span>
                    {bill.payment.date ? new Date(bill.payment.date).toLocaleDateString('en-LK',{day:'numeric',month:'short',year:'numeric'}) : '—'}
                  </div>
                </div>
              )}

              {/* Delivery Address */}
              {bill.customer?.deliveryAddress && (
                <div style={{ background:'#fff3e0', border:'1px solid #ffe0b2', borderRadius:10,
                  padding:'10px 14px', marginBottom:16, fontSize:'0.84rem' }}>
                  <span style={{ color:'#8a9e8a', fontWeight:600 }}>📍 Delivery Address: </span>
                  <span style={{ color:'#1a3a0a', fontWeight:600 }}>{bill.customer.deliveryAddress}</span>
                </div>
              )}

              {/* Items */}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontWeight:800, color:'#1a3a0a', marginBottom:10, fontSize:'0.88rem' }}>🥦 Your Items</div>
                {!bill.items || bill.items.length === 0 ? (
                  <div style={{ color:'#8a9e8a', fontSize:'0.84rem', background:'#f8fdf6', borderRadius:10, padding:'16px', textAlign:'center' }}>
                    Item details unavailable for this order.
                  </div>
                ) : (
                  <div style={{ border:'1px solid #e0f0da', borderRadius:12, overflow:'hidden' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.84rem' }}>
                      <thead>
                        <tr style={{ background:'#f8fdf6' }}>
                          {['Item','Qty','Price/kg','Subtotal'].map(h => (
                            <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:'0.7rem',
                              fontWeight:800, color:'#1a3a0a', textTransform:'uppercase',
                              borderBottom:'1px solid #e0f0da' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bill.items.map((item, i) => (
                          <tr key={i} style={{ borderBottom:'1px solid #f0f5f0' }}>
                            <td style={{ padding:'10px 14px', fontWeight:700, color:'#1a3a0a' }}>{item.vegetableName}</td>
                            <td style={{ padding:'10px 14px', color:'#4a5c4a' }}>{item.quantityKg} kg</td>
                            <td style={{ padding:'10px 14px', color:'#4a5c4a' }}>Rs. {Number(item.pricePerKg).toLocaleString()}</td>
                            <td style={{ padding:'10px 14px', fontWeight:700, color:'#2d5a1b' }}>Rs. {Number(item.totalAmount).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Delivery agent (no pickup date shown to customer) */}
              {bill.deliveryAgent && (
                <div style={{ background:'#f0faf0', border:'1px solid #c8e6c9', borderRadius:12,
                  padding:'14px 18px', marginBottom:16 }}>
                  <div style={{ fontWeight:800, color:'#1a3a0a', marginBottom:10, fontSize:'0.88rem' }}>🚚 Delivery Information</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 16px', fontSize:'0.85rem', color:'#4a5c4a' }}>
                    <div><span style={{ color:'#8a9e8a', fontWeight:600 }}>Agent: </span>{bill.deliveryAgent.name}</div>
                    <div><span style={{ color:'#8a9e8a', fontWeight:600 }}>Phone: </span>{bill.deliveryAgent.phone}</div>
                    <div><span style={{ color:'#8a9e8a', fontWeight:600 }}>Vehicle: </span>{bill.deliveryAgent.vehicle}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ color:'#8a9e8a', fontWeight:600 }}>Status: </span>
                      <SPill v={bill.deliveryAgent.deliveryStatus}/>
                    </div>
                  </div>
                </div>
              )}

              {/* Grand total */}
              <div style={{ background:'linear-gradient(135deg,#1a3a0a,#2d5a1b)', borderRadius:12,
                padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ color:'rgba(255,255,255,0.8)', fontWeight:700 }}>Total Paid</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.4rem', fontWeight:800, color:'white' }}>
                  Rs. {Number(bill.totalAmount||0).toLocaleString()}
                </div>
              </div>

              <div style={{ display:'flex', gap:10, marginTop:14 }}>
                <button onClick={() => window.print()}
                  style={{ flex:1, padding:'11px', borderRadius:10, border:'1.5px solid #d0e8c8',
                    background:'white', color:'#2d5a1b', fontSize:'0.86rem', fontWeight:700, cursor:'pointer' }}>
                  🖨️ Print
                </button>
                <button onClick={onClose}
                  style={{ flex:1, padding:'11px', borderRadius:10, border:'none',
                    background:'linear-gradient(135deg,#2d5a1b,#4a9e3f)', color:'white',
                    fontSize:'0.86rem', fontWeight:700, cursor:'pointer' }}>
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

// ── Delivery Info Card ────────────────────────────────────────────────────────
function DeliveryCard({ order }) {
  if (!order.agentName) return null;
  return (
    <div style={{ background:'#f0faf0', border:'1px solid #c8e6c9', borderRadius:12,
      padding:'14px 16px', marginTop:12, fontSize:'0.84rem' }}>
      <div style={{ fontWeight:800, color:'#1a3a0a', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
        🚚 Delivery Information
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 16px', color:'#4a5c4a' }}>
        <div><span style={{ color:'#8a9e8a', fontWeight:600 }}>Agent: </span>{order.agentName}</div>
        <div><span style={{ color:'#8a9e8a', fontWeight:600 }}>Phone: </span>{order.agentPhone}</div>
        <div><span style={{ color:'#8a9e8a', fontWeight:600 }}>Vehicle: </span>{order.agentVehicle}</div>
        {order.deliveryStatus && (
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ color:'#8a9e8a', fontWeight:600 }}>Status: </span>
            <Pill v={order.deliveryStatus}/>
          </div>
        )}
      </div>
      {/* NOTE: pickup date is for farmer only — not shown to customer */}
    </div>
  );
}

// ── Main MyOrders Component ───────────────────────────────────────────────────
export default function MyOrders({ user }) {
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [payingOrder, setPayingOrder] = useState(null);
  const [receipt, setReceipt]         = useState(null);
  const [viewingBill, setViewingBill] = useState(null);

  const loadOrders = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`${PAY_API}/orders/user/${user.id}`);
      if (res.ok) setOrders(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { loadOrders(); }, [user?.id]);

  const handlePaySuccess = result => {
    setPayingOrder(null);
    setReceipt(result);
    loadOrders();
  };

  return (
    <div className="animate-fade" style={{ maxWidth:900, margin:'0 auto', padding:'0 24px' }}>
      <div className="page-header">
        <div>
          <div className="page-title">My Orders</div>
          <div className="page-sub">Track your orders and complete payments after admin approval</div>
        </div>
        <button className="btn btn-ghost" onClick={loadOrders} style={{ fontSize:'0.84rem' }}>
          🔄 Refresh
        </button>
      </div>

      <div style={{ background:'#e3f2fd', border:'1px solid #bbdefb', borderRadius:12,
        padding:'14px 18px', marginBottom:20, fontSize:'0.84rem', color:'#1a5c8a',
        display:'flex', gap:10, alignItems:'flex-start' }}>
        <span style={{ flexShrink:0 }}>ℹ️</span>
        <span>After placing an order, admin must approve it before payment is available.
          Approved orders show a <strong>Pay Now</strong> button. Delivery info will appear once an agent is assigned.</span>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'#8a9e8a' }}>Loading orders…</div>
      ) : orders.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'48px 36px' }}>
          <div style={{ fontSize:'3rem', marginBottom:14 }}>📦</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.2rem', color:'var(--green-deep)', marginBottom:8 }}>No orders yet</div>
          <div style={{ color:'var(--text-light)', fontSize:'0.9rem' }}>Add vegetables to your cart and checkout to place an order.</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {orders.map(order => (
            <div key={order.orderId} className="card"
              onClick={() => setViewingBill(order.orderId)}
              style={{ padding:'20px 24px', border:'1px solid #e0f0da', cursor:'pointer', transition:'box-shadow 0.2s' }}
              onMouseOver={e => e.currentTarget.style.boxShadow='0 4px 20px rgba(26,58,10,0.12)'}
              onMouseOut={e => e.currentTarget.style.boxShadow=''}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between',
                flexWrap:'wrap', gap:16 }}>
                <div>
                  <div style={{ fontWeight:800, color:'#1a3a0a', fontSize:'0.96rem', marginBottom:4 }}>
                    Order #ORD{order.orderId}
                  </div>
                  <div style={{ fontSize:'0.82rem', color:'#8a9e8a', marginBottom:8 }}>
                    Placed: {fmt(order.orderDate)}
                  </div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                    <Pill v={order.status}/>
                    {order.paymentStatus && <Pill v={order.paymentStatus}/>}
                    {order.deliveryStatus && <Pill v={order.deliveryStatus}/>}
                    {order.transactionId && (
                      <span style={{ fontFamily:'monospace', fontSize:'0.76rem', color:'#8a9e8a' }}>
                        {order.transactionId}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.3rem', fontWeight:800, color:'#1a3a0a' }}>
                      Rs. {Number(order.totalAmount||0).toLocaleString()}
                    </div>
                    <div style={{ fontSize:'0.74rem', color:'#8a9e8a' }}>incl. service & delivery charge</div>
                  </div>
                  {order.status === 'APPROVED' && order.paymentStatus !== 'SUCCESS' ? (
                    <button onClick={e => { e.stopPropagation(); setPayingOrder(order); }}
                      style={{ padding:'10px 22px', borderRadius:10, border:'none',
                        background:'linear-gradient(135deg,#2d5a1b,#4a9e3f)', color:'white',
                        fontSize:'0.88rem', fontWeight:700, cursor:'pointer',
                        boxShadow:'0 4px 14px rgba(45,90,27,0.3)', whiteSpace:'nowrap' }}>
                      💳 Pay Now
                    </button>
                  ) : order.paymentStatus === 'SUCCESS' ? (
                    <span style={{ fontSize:'0.84rem', color:'#2d5a1b', fontWeight:700 }}>✅ Paid</span>
                  ) : (
                    <span style={{ fontSize:'0.82rem', color:'#8a9e8a', fontStyle:'italic' }}>
                      {order.status==='REJECTED' ? '❌ Rejected' : '⏳ Awaiting Approval'}
                    </span>
                  )}
                </div>
              </div>

              {/* Delivery info — shown to customer after agent is assigned */}
              <DeliveryCard order={order}/>
            </div>
          ))}
        </div>
      )}

      {viewingBill && (
        <CustomerBillModal orderId={viewingBill} onClose={() => setViewingBill(null)}/>
      )}

      {payingOrder && (
        <PaymentModal order={payingOrder} onClose={() => setPayingOrder(null)} onSuccess={handlePaySuccess}/>
      )}

      {receipt && (
        <ReceiptModal payment={receipt} onClose={() => setReceipt(null)}/>
      )}
    </div>
  );
}
