import { useState, useEffect } from 'react';

export function useBreaches() {
  const [breaches, setBreaches] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/analyze/breaches')
      .then(r => r.json())
      .then(data => {
        setBreaches(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { breaches, loading };
}
