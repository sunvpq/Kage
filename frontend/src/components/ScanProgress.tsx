interface ScanStatus {
  status: string;
  total: number;
  processed: number;
  services_found: number;
}

export default function ScanProgress({ status }: { status: ScanStatus | null }) {
  const progress = status && status.total > 0 ? status.processed / status.total : 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
    }}>
      <div style={{ color: '#fff', fontSize: 28, fontWeight: 700, fontFamily: 'sans-serif', letterSpacing: 8 }}>
        KAGE
      </div>
      <div style={{ color: '#6b7280', fontSize: 12, fontStyle: 'italic', fontFamily: 'sans-serif' }}>
        your digital shadow
      </div>

      <div style={{ color: '#4FC3F7', fontSize: 18, fontFamily: 'sans-serif', marginTop: 24 }}>
        {status ? 'Сканируем почту...' : 'Подключаемся...'}
      </div>

      {status && (
        <>
          <div style={{ color: '#9ca3af', fontSize: 14, fontFamily: 'sans-serif' }}>
            Найдено сервисов:{' '}
            <span style={{ color: '#fff', fontWeight: 600 }}>{status.services_found}</span>
          </div>

          <div style={{ width: 300, height: 4, background: '#1f2937', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              width: `${Math.round(progress * 100)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #4FC3F7, #a855f7)',
              borderRadius: 2,
              transition: 'width 0.4s ease',
            }} />
          </div>

          <div style={{ color: '#6b7280', fontSize: 12, fontFamily: 'sans-serif' }}>
            {status.processed} / {status.total || '…'} писем
          </div>

          {status.status === 'error' && (
            <div style={{ color: '#ff3355', fontSize: 13, fontFamily: 'sans-serif' }}>
              Ошибка сканирования. Попробуйте снова.
            </div>
          )}
        </>
      )}
    </div>
  );
}
