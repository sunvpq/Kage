import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import KageGraph from '../components/KageGraph';
import Legend from '../components/Legend';
import ServicePanel from '../components/ServicePanel';
import IntegrationBanner from '../components/IntegrationBanner';
import UserJourney from '../components/UserJourney';
import { useBreaches } from '../hooks/useBreaches';

interface GraphData {
  nodes: any[];
  links: any[];
}

export default function Graph() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const { breaches } = useBreaches();

  const handleDelete = (node: any) => {
    alert(`Письмо на удаление для ${node.name}:\n\nУважаемые ${node.name},\n\nПрошу удалить все мои персональные данные согласно ст.25 закона РК №94-V.\n\nС уважением`);
  };

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const url = sessionId
          ? `http://localhost:8000/api/graph?session_id=${sessionId}`
          : `http://localhost:8000/api/graph/demo`;

        const res = await fetch(url);
        const data = await res.json();
        setGraphData(data);
      } catch (err) {
        console.error('Failed to fetch graph:', err);
        const res = await fetch('http://localhost:8000/api/graph/demo');
        const data = await res.json();
        setGraphData(data);
      } finally {
        setLoading(false);
      }
    };

    fetchGraph();
  }, [sessionId]);

  if (loading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: '#000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#fff',
        fontSize: '20px'
      }}>
        Подключаемся...
      </div>
    );
  }

  if (!graphData) {
    return <div>Error loading graph</div>;
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#000',
      position: 'relative'
    }}>
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 10,
        color: '#fff'
      }}>
        <h1 style={{ margin: '0', fontSize: '24px' }}>KAGE</h1>
        <p style={{ margin: '0', fontSize: '12px', color: '#888' }}>
          your digital shadow
        </p>
      </div>

      <Legend />
      <IntegrationBanner />
      <UserJourney />
      <KageGraph graphData={graphData} onNodeClick={setSelectedNode} />
      <ServicePanel
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        onDelete={handleDelete}
        breach={selectedNode ? breaches[selectedNode.id] : null}
      />
    </div>
  );
}
