import { useState } from 'react';
import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './CartDrawer.module.css';

const FARMER_ORDER_API  = '/api/farmer/orders';
const PAYMENT_ORDER_API = '/api/payments/orders/create';

export default function CartDrawer({ setCurrentPage }) {
  const { cart, cartOpen, setCartOpen, removeFromCart, updateQty,
          cartTotal, cartCount, showToast, user } = useApp();

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes]   = useState('');
  const [placing, setPlacing] = useState(false);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [customDelivery, setCustomDelivery] = useState('');

  if (!cartOpen) return null;

  const discount = cart.reduce(
    (sum, i) => sum + (i.suggested_discount || 0) * i.price_per_kg * i.qty / 100, 0
  );
  const SERVICE_CHARGE_RATE = 0.05;
  const DELIVERY_CHARGE = 350;
  const subtotalAfterDiscount = cartTotal;
  const serviceCharge = Math.round(subtotalAfterDiscount * SERVICE_CHARGE_RATE);
  const grandTotal = subtotalAfterDiscount + serviceCharge + DELIVERY_CHARGE;
  const customerName = user?.name || 'Guest';
  const customerId   = user?.id ? String(user.id) : 'guest';
  const billingAddr  = user?.billingAddress || user?.deliveryAddress || '';
  const deliveryAddr = sameAsBilling ? billingAddr : (customDelivery.trim() || billingAddr);

  const placeOrders = async () => {
    if (!deliveryAddr && !sameAsBilling && !customDelivery.trim()) {
      showToast('Please add a billing or delivery address in your profile first.', 'error');
      return;
    }
    if (!billingAddr && !customDelivery.trim()) {
      showToast('Please add a billing address in your profile or enter a delivery address.', 'error');
      return;
    }
    setPlacing(true);
    let successCount = 0;
    let failCount = 0;

    for (const item of cart) {
      try {
        const finalDelivery = sameAsBilling
          ? billingAddr
          : (customDelivery.trim() || user?.deliveryAddress || billingAddr);
        const farmerPayload = {
          farmerId:        item.farmer_id ? `F${String(item.farmer_id).padStart(3,'0')}` : 'F001',
          stockId:         item.listing_id,
          vegetableName:   item.title,
          customerName,
          customerId,
          quantityKg:      item.qty,
          pricePerKg:      item.price_per_kg,
          paymentMethod,
          deliveryAddress: finalDelivery,
          notes,
        };
        const res = await fetch(FARMER_ORDER_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(farmerPayload),
        });
        if (res.ok) successCount++;
        else failCount++;
      } catch { failCount++; }
    }

    // Create a single payment order record for the entire cart
    if (successCount > 0 && user?.id) {
      try {
        await fetch(PAYMENT_ORDER_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, totalAmount: grandTotal }),
        });
      } catch { /* payment order creation is non-blocking */ }
    }

    setPlacing(false);
    if (successCount > 0) {
      showToast(`✅ ${successCount} order${successCount > 1 ? 's' : ''} placed! Check My Orders for payment. 🎉`);
      cart.forEach(item => removeFromCart(item.listing_id));
      setCheckoutOpen(false);
      setCartOpen(false);
    }
    if (failCount > 0) {
      showToast(`⚠️ ${failCount} item(s) could not be ordered. Check farmer backend.`, 'error');
    }
  };

  return (
    <>
      <div className={styles.overlay} onClick={() => setCartOpen(false)} />
      <div className={styles.drawer}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <ShoppingBag size={22} />
            <span>Your Cart</span>
            {cartCount > 0 && <span className={styles.countBadge}>{cartCount}</span>}
          </div>
          <button className={styles.closeBtn} onClick={() => setCartOpen(false)}><X size={20} /></button>
        </div>

        {cart.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyEmoji}>🛒</div>
            <p className={styles.emptyTitle}>Your cart is empty</p>
            <p className={styles.emptySub}>ඔබගේ කූඩය හිස්ය</p>
            <button className={styles.shopBtn}
              onClick={() => { setCartOpen(false); setCurrentPage('market'); }}>
              Browse Market
            </button>
          </div>
        ) : !checkoutOpen ? (
          <>
            <div className={styles.items}>
              {cart.map(item => (
                <div className={styles.item} key={item.listing_id}>
                  <img src={item.image} alt={item.title} className={styles.itemImg}
                    onError={e => e.target.src='https://images.unsplash.com/photo-1540420773420-3366772f4999?w=80&q=60'}/>
                  <div className={styles.itemInfo}>
                    <div className={styles.itemName}>{item.title}</div>
                    <div className={styles.itemFarmer}>📍 {item.farmer_location}</div>
                    <div className={styles.itemPrice}>Rs. {item.price_per_kg}/kg</div>
                  </div>
                  <div className={styles.itemRight}>
                    <div className={styles.qtyControl}>
                      <button onClick={() => updateQty(item.listing_id, item.qty - 1)}><Minus size={13}/></button>
                      <span>{item.qty}</span>
                      <button onClick={() => updateQty(item.listing_id, item.qty + 1)}><Plus size={13}/></button>
                    </div>
                    <div className={styles.itemSubtotal}>Rs. {(item.price_per_kg * item.qty).toLocaleString()}</div>
                    <button className={styles.removeBtn} onClick={() => removeFromCart(item.listing_id)}>
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span><span>Rs. {(cartTotal + discount).toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className={`${styles.summaryRow} ${styles.savings}`}>
                  <span>🔥 Savings</span><span>- Rs. {discount.toFixed(0)}</span>
                </div>
              )}
              <div className={styles.summaryRow}>
                <span>Service Charge (5%)</span><span>Rs. {serviceCharge.toLocaleString()}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>🚚 Delivery Charge</span><span>Rs. {DELIVERY_CHARGE.toLocaleString()}</span>
              </div>
              <div className={styles.summaryDivider}/>
              <div className={`${styles.summaryRow} ${styles.total}`}>
                <span>Total</span><span>Rs. {grandTotal.toLocaleString()}</span>
              </div>
              <button className={styles.checkoutBtn} onClick={() => setCheckoutOpen(true)}>
                🛍️ Checkout — Rs. {grandTotal.toLocaleString()}
              </button>
              <p className={styles.secureNote}>🔒 Secure · Fast delivery across SL</p>
            </div>
          </>
        ) : (
          <div className={styles.checkoutForm}>
            <div className={styles.checkoutHeader}>
              <button className={styles.backBtn} onClick={() => setCheckoutOpen(false)}>← Back</button>
              <span className={styles.checkoutTitle}>Confirm Order</span>
            </div>
            <div className={styles.checkoutBody}>
              <div className={styles.orderSummaryBox}>
                <div className={styles.orderSummaryTitle}>📦 {cart.length} item{cart.length>1?'s':''} · Rs. {grandTotal.toLocaleString()}</div>
                {cart.map(item => (
                  <div key={item.listing_id} className={styles.orderItem}>
                    <span>{item.title}</span>
                    <span>{item.qty} kg · Rs. {(item.price_per_kg * item.qty).toLocaleString()}</span>
                  </div>
                ))}
                <div style={{borderTop:'1px solid #e0f0da',marginTop:8,paddingTop:8,fontSize:'0.8rem',color:'#4a5c4a'}}>
                  <div style={{display:'flex',justifyContent:'space-between'}}><span>Service Charge (5%)</span><span>Rs. {serviceCharge.toLocaleString()}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between'}}><span>Delivery Charge</span><span>Rs. {DELIVERY_CHARGE.toLocaleString()}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontWeight:800,color:'#1a3a0a',marginTop:4}}><span>Grand Total</span><span>Rs. {grandTotal.toLocaleString()}</span></div>
                </div>
              </div>

              {/* Payment info notice */}
              <div style={{ background:'#fff3e0', border:'1px solid #ffd080', borderRadius:10,
                padding:'12px 14px', fontSize:'0.82rem', color:'#7d5300', lineHeight:1.6 }}>
                💡 Your order will be sent to the farmers. Once admin approves it, you can complete
                payment from <strong>My Orders</strong> tab.
              </div>

              {/* Billing Address (from profile — read only) */}
              <div className={styles.checkoutField}>
                <label>🏠 Billing Address</label>
                {billingAddr
                  ? <div className={styles.checkoutReadonly}>{billingAddr}</div>
                  : <div style={{ fontSize:'0.82rem', color:'#c0392b', background:'#fdecea',
                      borderRadius:8, padding:'8px 12px' }}>
                      ⚠️ No billing address saved. Please update your profile first.
                    </div>}
              </div>

              {/* Same as billing checkbox */}
              <div style={{ display:'flex', alignItems:'center', gap:10, margin:'-4px 0 10px', cursor:'pointer' }}
                onClick={() => setSameAsBilling(v => !v)}>
                <div style={{ width:18, height:18, borderRadius:5, border:'2px solid #4a9e3f', flexShrink:0,
                  background: sameAsBilling ? '#4a9e3f' : 'white', display:'flex', alignItems:'center',
                  justifyContent:'center', transition:'all 0.15s' }}>
                  {sameAsBilling && <span style={{ color:'white', fontSize:'0.75rem', fontWeight:900 }}>✓</span>}
                </div>
                <span style={{ fontSize:'0.83rem', color:'#4a5c4a', fontWeight:500, userSelect:'none' }}>
                  Deliver to my billing address
                </span>
              </div>

              {/* Custom delivery address — shown when not same as billing */}
              {!sameAsBilling && (
                <div className={styles.checkoutField}>
                  <label>🚚 Delivery Address</label>
                  {user?.deliveryAddress && user.deliveryAddress !== billingAddr ? (
                    <>
                      <div className={styles.checkoutReadonly} style={{ marginBottom:8 }}>
                        📍 {user.deliveryAddress}
                        <span style={{ fontSize:'0.76rem', color:'#4a9e3f', marginLeft:8 }}>(from profile)</span>
                      </div>
                      <div style={{ fontSize:'0.78rem', color:'#8a9e8a', marginBottom:6 }}>Or enter a different address:</div>
                    </>
                  ) : null}
                  <textarea className={styles.checkoutTextarea} rows={2}
                    placeholder={user?.deliveryAddress && user.deliveryAddress !== billingAddr
                      ? 'Leave blank to use profile delivery address…'
                      : 'Enter delivery address…'}
                    value={customDelivery}
                    onChange={e => setCustomDelivery(e.target.value)}/>
                </div>
              )}

              {/* Notes */}
              <div className={styles.checkoutField}>
                <label>Notes (optional)</label>
                <textarea className={styles.checkoutTextarea} rows={2}
                  placeholder="Any special delivery instructions…"
                  value={notes} onChange={e => setNotes(e.target.value)}/>
              </div>

              <button className={styles.placeOrderBtn} onClick={placeOrders} disabled={placing}>
                {placing ? 'Placing order…' : `✅ Place Order — Rs. ${grandTotal.toLocaleString()}`}
              </button>
              <p className={styles.secureNote}>Payment will be collected after admin approval</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
