import { EDGE_COLORS } from '../lib/colors';

const ITEMS = [
  { color: EDGE_COLORS.breach,    label: 'Утечка данных' },
  { color: EDGE_COLORS.broker,    label: 'Продаёт данные' },
  { color: EDGE_COLORS.zombie,    label: 'Забытый 2+ года' },
  { color: EDGE_COLORS.overreach, label: 'Избыточный доступ' },
  { color: EDGE_COLORS.normal,    label: 'Норма' },
];

export default function Legend() {
  return (
    <div style={{
      position: 'fixed', top: 16, right: 16, zIndex: 10,
      background: 'rgba(0,0,0,0.72)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8, padding: 16,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {ITEMS.map(({ color, label }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 6px ${color}` }} />
          <span style={{ color: '#e5e7eb', fontSize: 13, fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>{label}</span>
        </div>
      ))}
    </div>
  );
}
