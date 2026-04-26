// Reusable VegLife logo — leaf SVG + wordmark
export default function VegLifeLogo({ size = 'md', dark = false }) {
  const sizes = {
    sm: { icon: 32, font: '1.1rem', sub: '0.65rem' },
    md: { icon: 44, font: '1.5rem', sub: '0.75rem' },
    lg: { icon: 56, font: '2rem',   sub: '0.85rem' },
  };
  const s = sizes[size] || sizes.md;
  const color = dark ? '#1a3a0a' : 'white';
  const subColor = dark ? '#6a8a6a' : 'rgba(255,255,255,0.65)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: s.icon, height: s.icon,
        background: dark ? '#e8f5e9' : 'rgba(255,255,255,0.12)',
        border: `2px solid ${dark ? '#c8e6c9' : 'rgba(255,255,255,0.25)'}`,
        borderRadius: Math.round(s.icon * 0.3),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width={s.icon * 0.6} height={s.icon * 0.6} viewBox="0 0 80 80" fill="none">
          <path
            d="M40 8C40 8,68 18,68 42C68 62,54 72,40 74C26 72,12 62,12 42C12 18,40 8,40 8Z"
            fill={dark ? 'rgba(45,90,27,0.25)' : 'rgba(255,255,255,0.3)'}
            stroke={dark ? 'rgba(45,90,27,0.7)' : 'rgba(255,255,255,0.7)'}
            strokeWidth="2"
          />
          <path d="M40 8L40 74" stroke={dark ? 'rgba(45,90,27,0.8)' : 'rgba(255,255,255,0.8)'} strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M40 30L56 40M40 30L24 40" stroke={dark ? 'rgba(45,90,27,0.6)' : 'rgba(255,255,255,0.6)'} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <div>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: s.font, fontWeight: 800,
          color, letterSpacing: '0.3px', lineHeight: 1.1,
        }}>
          VegLife <span style={{ fontSize: '0.7em', fontWeight: 700, opacity: 0.8 }}>LK</span>
        </div>
        {size !== 'sm' && (
          <div style={{ fontSize: s.sub, color: subColor, lineHeight: 1, marginTop: 2 }}>
            Farm-to-Table Platform
          </div>
        )}
      </div>
    </div>
  );
}
