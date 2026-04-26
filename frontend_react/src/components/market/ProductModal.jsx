import { useState } from 'react';
import { X, ShoppingCart, Star, MapPin, Phone, Leaf, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './ProductModal.module.css';

export default function ProductModal({ product, onClose }) {
  const { addToCart } = useApp();
  const [qty, setQty] = useState(1);

  if (!product) return null;

  const discountedPrice = product.suggested_discount > 0
    ? product.price_per_kg * (1 - product.suggested_discount / 100)
    : null;

  const total = Math.round((discountedPrice || product.price_per_kg) * qty);

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>

        <div className={styles.body}>
          {/* Image */}
          <div className={styles.imgSection}>
            <img src={product.image} alt={product.title} className={styles.img} />
            {product.suggested_discount > 0 && (
              <div className={styles.discountBanner}>
                🔥 {product.suggested_discount}% Off — Limited Time!
              </div>
            )}
          </div>

          {/* Details */}
          <div className={styles.details}>
            <div className={styles.category}>{product.category}</div>
            <h2 className={styles.title}>{product.title}</h2>
            <div className={styles.rating}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16}
                  fill={i < Math.floor(product.rating) ? '#e8a820' : 'none'}
                  color="#e8a820" />
              ))}
              <span>{product.rating} ({product.reviews} reviews)</span>
            </div>

            <p className={styles.desc}>{product.description}</p>

            {/* Farmer info */}
            <div className={styles.farmerCard}>
              <div className={styles.farmerAvatar}>{product.farmer_name?.[0]}</div>
              <div>
                <div className={styles.farmerName}>{product.farmer_name}</div>
                <div className={styles.farmerLoc}><MapPin size={12} /> {product.farmer_location}</div>
              </div>
            </div>

            {/* Info chips */}
            <div className={styles.chips}>
              <div className={styles.chip}>
                <Leaf size={14} /> Organic
              </div>
              <div className={styles.chip}>
                <Clock size={14} /> Fresh Today
              </div>
              <div className={styles.chip}>
                📦 {product.quantity_kg}kg Available
              </div>
            </div>

            {/* Price */}
            <div className={styles.priceSection}>
              {discountedPrice ? (
                <>
                  <span className={styles.oldPrice}>Rs. {product.price_per_kg}/kg</span>
                  <span className={styles.price}>Rs. {Math.round(discountedPrice)}<small>/kg</small></span>
                </>
              ) : (
                <span className={styles.price}>Rs. {product.price_per_kg}<small>/kg</small></span>
              )}
            </div>

            {/* Qty + Add */}
            <div className={styles.actions}>
              <div className={styles.qtyWrap}>
                <span className={styles.qtyLabel}>Qty (kg)</span>
                <div className={styles.qtyControl}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                  <span>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.quantity_kg, q + 1))}>+</button>
                </div>
              </div>
              <div className={styles.totalLine}>
                Total: <strong>Rs. {total.toLocaleString()}</strong>
              </div>
            </div>

            <button className={styles.addBtn} onClick={() => { addToCart(product); onClose(); }}>
              <ShoppingCart size={18} /> Add {qty}kg to Cart — Rs. {total.toLocaleString()}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
