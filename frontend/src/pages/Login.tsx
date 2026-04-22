import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = () => {
    const mockSessionId = 'demo-' + Date.now();
    navigate(`/graph?session_id=${mockSessionId}`);
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#fff'
    }}>
      <h1 style={{ fontSize: '64px', margin: '0 0 20px 0' }}>KAGE</h1>
      <p style={{ fontSize: '14px', color: '#888', margin: '0 0 40px 0' }}>
        your digital shadow
      </p>
      <button
        onClick={handleLogin}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          background: '#fff',
          color: '#000',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600'
        }}
      >
        Сканировать мою почту
      </button>
      <p style={{
        fontSize: '12px',
        color: '#666',
        marginTop: '20px',
        textAlign: 'center',
        maxWidth: '300px'
      }}>
        (демо режим — используются примеры данных)
      </p>
    </div>
  );
}
