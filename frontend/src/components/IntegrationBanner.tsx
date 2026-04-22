export default function IntegrationBanner() {
  return (
    <div style={{
      position: 'fixed',
      bottom: '100px',
      right: '20px',
      background: 'rgba(0,0,0,0.85)',
      border: '1px solid #333',
      borderRadius: '12px',
      padding: '16px',
      zIndex: 15,
      width: '220px'
    }}>
      <div style={{
        fontSize: '11px', color: '#888', marginBottom: '10px',
        textTransform: 'uppercase', letterSpacing: '1px'
      }}>
        Интеграции
      </div>

      {[
        { name: 'eGov.kz',    status: 'mockup',  color: '#10b981' },
        { name: 'Kaspi Bank', status: 'mockup',  color: '#f59e0b' },
        { name: 'Kundelik',   status: 'mockup',  color: '#3b82f6' },
        { name: 'Forte Bank', status: 'planned', color: '#6b7280' },
      ].map(integration => (
        <div key={integration.name} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 0',
          borderBottom: '1px solid #222'
        }}>
          <span style={{ fontSize: '13px', color: '#fff' }}>
            {integration.name}
          </span>
          <span style={{
            fontSize: '10px',
            color: integration.color,
            padding: '2px 6px',
            border: `1px solid ${integration.color}`,
            borderRadius: '4px'
          }}>
            {integration.status === 'mockup' ? 'Mockup' : 'Planned'}
          </span>
        </div>
      ))}
    </div>
  );
}
