import { useState } from 'react';
import { ShoppingCart, Star, MapPin, Clock, Eye } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './ProductCard.module.css';

const RISK_CONFIG = {
  HIGH: { label: '🔥 Hot Deal', cls: 'high', bg: '#d4722a' },
  MEDIUM: { label: '⚡ Good Deal', cls: 'medium', bg: '#e8a820' },
  LOW: { label: '✓ Fresh', cls: 'low', bg: '#4a9e3f' },
};

const STATUS_CONFIG = {
  available: { label: 'In Stock', color: '#4a9e3f' },
  low: { label: 'Low Stock', color: '#e8a820' },
  out_of_stock: { label: 'Out of Stock', color: '#c0392b' },
};

export default function ProductCard({ product, onDetail }) {
  const { addToCart } = useApp();
  const [imgErr, setImgErr] = useState(false);
  const [adding, setAdding] = useState(false);

  const risk = RISK_CONFIG[product.risk_level] || RISK_CONFIG.LOW;
  const status = STATUS_CONFIG[product.availability_status] || STATUS_CONFIG.available;
  const isOut = product.availability_status === 'out_of_stock';

  const discountedPrice = product.suggested_discount > 0
    ? product.price_per_kg * (1 - product.suggested_discount / 100)
    : null;

  const handleAdd = (e) => {
    e.stopPropagation();
    if (isOut) return;
    setAdding(true);
    addToCart(product);
    setTimeout(() => setAdding(false), 800);
  };

  const timeAgo = () => {
    const ms = Date.now() - new Date(product.listed_at).getTime();
    const h = Math.floor(ms / 3600000);
    if (h < 1) return 'Just now';
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className={styles.card} onClick={() => onDetail(product)}>
      {/* Image section */}
      <div className={styles.imgWrap}>
        <img
          src={imgErr ? 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80' : product.image}
          alt={product.title}
          className={styles.img}
          onError={() => setImgErr(true)}
        />
        {/* Badges */}
        <div className={styles.topBadges}>
          <span className={`${styles.riskBadge} ${styles[risk.cls]}`}>{risk.label}</span>
          {product.suggested_discount > 0 && (
            <span className={styles.discountBadge}>{product.suggested_discount}% OFF</span>
          )}
        </div>
        <div className={styles.categoryChip}>{product.category}</div>
        {/* Hover overlay */}
        <div className={styles.hoverOverlay}>
          <button className={styles.viewBtn}>
            <Eye size={16} /> Quick View
          </button>
        </div>
      </div>

      {/* Info */}
      <div className={styles.info}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{product.title}</h3>
          <div className={styles.rating}>
            <Star size={13} fill="#e8a820" color="#e8a820" />
            <span>{product.rating}</span>
          </div>
        </div>

        <div className={styles.meta}>
          <span className={styles.location}><MapPin size={12} /> {product.farmer_location}</span>
          <span className={styles.time}><Clock size={12} /> {timeAgo()}</span>
        </div>

        <div className={styles.farmerName}>by {product.farmer_name}</div>

        <div className={styles.priceRow}>
          <div className={styles.priceBlock}>
            {discountedPrice ? (
              <>
                <span className={styles.oldPrice}>Rs. {product.price_per_kg}</span>
                <span className={styles.price}>Rs. {Math.round(discountedPrice)}</span>
                <span className={styles.perKg}>/kg</span>
              </>
            ) : (
              <>
                <span className={styles.price}>Rs. {product.price_per_kg}</span>
                <span className={styles.perKg}>/kg</span>
              </>
            )}
          </div>
          <span className={styles.stock} style={{ color: status.color }}>
            {status.label}
          </span>
        </div>

        <div className={styles.qty}>
          🥬 {product.quantity_kg} kg available
        </div>

        <button
          className={`${styles.addBtn} ${isOut ? styles.disabled : ''} ${adding ? styles.adding : ''}`}
          onClick={handleAdd}
          disabled={isOut}
        >
          {adding ? (
            <>✓ Added!</>
          ) : isOut ? (
            'Out of Stock'
          ) : (
            <><ShoppingCart size={16} /> Add to Cart</>
          )}
        </button>
      </div>
    </div>
  );
}
