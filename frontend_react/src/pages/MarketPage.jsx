import { useState, useMemo, useRef, useEffect, forwardRef } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '../components/market/ProductCard';
import ProductModal from '../components/market/ProductModal';
import { CATEGORIES, SORT_OPTIONS } from '../data/products';
import { useApp } from '../context/AppContext';
import styles from './MarketPage.module.css';

const API_BASE = '/api/listings';

const MarketPage = forwardRef(function MarketPage(props, searchRef) {
  const { sharedListings } = useApp();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('default');
  const [detailProduct, setDetailProduct] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [apiOk, setApiOk] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(`${API_BASE}/filter/visible`, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
          setApiOk(true);
        } else {
          setProducts(sharedListings || []);
        }
      })
      .catch(() => setProducts(sharedListings || []))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []); // eslint-disable-line

  useEffect(() => {
    if (sharedListings) {
      setProducts(sharedListings.filter(l => l.is_visible !== false));
    }
  }, [sharedListings]);

  const handleSearch = (val) => {
    setSearch(val);
    if (apiOk && val.trim().length > 1) {
      fetch(`${API_BASE}/search?keyword=${encodeURIComponent(val)}`)
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setProducts(data); })
        .catch(() => {});
    } else if (!val.trim()) {
      setProducts(sharedListings || []);
    }
  };

  const filtered = useMemo(() => {
    let list = [...products];
    if (category === 'deals') list = list.filter(p => p.suggested_discount > 0);
    else if (category !== 'all') list = list.filter(p => p.category === category);
    if (search.trim() && !apiOk) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.farmer_location?.toLowerCase().includes(q)
      );
    }
    list = list.filter(p => p.price_per_kg >= priceRange[0] && p.price_per_kg <= priceRange[1]);
    switch (sort) {
      case 'price_asc': list.sort((a, b) => a.price_per_kg - b.price_per_kg); break;
      case 'price_desc': list.sort((a, b) => b.price_per_kg - a.price_per_kg); break;
      case 'discount': list.sort((a, b) => b.suggested_discount - a.suggested_discount); break;
      case 'rating': list.sort((a, b) => b.rating - a.rating); break;
      case 'fresh': list.sort((a, b) => new Date(b.listed_at) - new Date(a.listed_at)); break;
      default: list.sort((a, b) => {
        const riskOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return riskOrder[a.risk_level] - riskOrder[b.risk_level];
      });
    }
    return list;
  }, [products, category, search, sort, priceRange, apiOk]);

  const hotDeals = products.filter(p => p.suggested_discount >= 30).slice(0, 4);

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div>
            <div className={styles.headerBadge}>🛒 Live Marketplace</div>
            <h1 className={styles.headerTitle}>Fresh Vegetable Market</h1>
            <p className={styles.headerSub}>
              <span className={styles.sinhala}>ළිඳෙන් නැඟූ නැවුම් කූරගම</span> — Straight from Sri Lankan farms
            </p>
          </div>
          <div className={styles.searchWrap} ref={searchRef}>
            <Search size={20} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search veggies, location... (e.g. kankun, Jaffna)"
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
            {search && (
              <button className={styles.searchClear} onClick={() => handleSearch('')}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* HOT DEALS STRIP */}
      {hotDeals.length > 0 && category === 'all' && !search && (
        <div className={styles.hotStrip}>
          <div className={styles.hotStripLabel}>🔥 Hot Deals — Expiring Soon!</div>
          <div className={styles.hotScrollRow}>
            {hotDeals.map(p => (
              <button key={p.listing_id} className={styles.hotChip} onClick={() => setDetailProduct(p)}>
                <span>{p.title}</span>
                <span className={styles.hotChipOff}>{p.suggested_discount}% OFF</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.mainArea}>
        {/* SIDEBAR FILTERS */}
        <aside className={`${styles.sidebar} ${showFilters ? styles.sidebarOpen : ''}`}>
          <div className={styles.sidebarHeader}>
            <strong>🔎 Filters</strong>
            <button className={styles.closeSidebar} onClick={() => setShowFilters(false)}><X size={18} /></button>
          </div>

          <div className={styles.filterSection}>
            <div className={styles.filterTitle}>Category</div>
            <div className={styles.filterOptions}>
              {CATEGORIES.map(c => (
                <button
                  key={c.key}
                  className={`${styles.filterChip} ${category === c.key ? styles.filterChipActive : ''}`}
                  onClick={() => setCategory(c.key)}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterSection}>
            <div className={styles.filterTitle}>Sort By</div>
            <select className={styles.sortSelect} value={sort} onChange={e => setSort(e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </div>

          <div className={styles.filterSection}>
            <div className={styles.filterTitle}>Price per kg (Rs.)</div>
            <div className={styles.rangeWrap}>
              <input
                type="range" min={0} max={1000} step={10}
                value={priceRange[1]}
                onChange={e => setPriceRange([priceRange[0], +e.target.value])}
                className={styles.rangeSlider}
              />
              <div className={styles.rangeLabels}>
                <span>Rs. 0</span><span>Rs. {priceRange[1]}</span>
              </div>
            </div>
          </div>

          <button className={styles.resetBtn} onClick={() => {
            setCategory('all'); setSort('default'); setPriceRange([0, 1000]);
            setSearch(''); setProducts(sharedListings || []);
          }}>
            Reset Filters
          </button>
        </aside>

        {/* CONTENT AREA */}
        <div className={styles.content}>
          <div className={styles.mobileControls}>
            <button className={styles.filterToggle} onClick={() => setShowFilters(true)}>
              <SlidersHorizontal size={16} /> Filters
            </button>
            <select className={styles.sortSelectMobile} value={sort} onChange={e => setSort(e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </div>

          <div className={styles.catPills}>
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                className={`${styles.catPill} ${category === c.key ? styles.catPillActive : ''}`}
                onClick={() => setCategory(c.key)}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>

          <div className={styles.resultBar}>
            <span>
              {loading ? 'Loading...' : `${filtered.length} item${filtered.length !== 1 ? 's' : ''} found`}
              {search && <span className={styles.resultSearch}> for "{search}"</span>}
            </span>
            {!apiOk && <span className={styles.demoNote}>📋 Demo data — connect your backend</span>}
          </div>

          {loading ? (
            <div className={styles.loadingGrid}>
              {[...Array(8)].map((_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={`${styles.skeletonImg} skeleton`} />
                  <div style={{ padding: '16px' }}>
                    <div className={`${styles.skeletonLine} skeleton`} style={{ width: '70%' }} />
                    <div className={`${styles.skeletonLine} skeleton`} style={{ width: '50%' }} />
                    <div className={`${styles.skeletonLine} skeleton`} style={{ width: '85%' }} />
                    <div className={`${styles.skeletonBtn} skeleton`} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyEmoji}>🔍</div>
              <h3>No vegetables found</h3>
              <p>Try adjusting your search or filters.</p>
              <button className={styles.emptyBtn} onClick={() => {
                setCategory('all'); setSearch(''); setProducts(sharedListings || []);
              }}>
                Clear & Browse All
              </button>
            </div>
          ) : (
            <div className={styles.grid}>
              {filtered.map(p => (
                <ProductCard key={p.listing_id} product={p} onDetail={setDetailProduct} />
              ))}
            </div>
          )}
        </div>
      </div>

      <ProductModal product={detailProduct} onClose={() => setDetailProduct(null)} />
    </div>
  );
});

export default MarketPage;
