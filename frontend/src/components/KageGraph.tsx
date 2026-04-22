import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { getEdgeColor, getProblemColors } from '../lib/colors';

interface Node { id: string; name: string; dataMass: number; isCenter?: boolean; problems?: string[]; dataFields?: string[]; x?: number; y?: number; fx?: number; fy?: number; }
interface Link { source: string | Node; target: string | Node; problems: string[]; }
interface GraphData { nodes: Node[]; links: Link[]; }

export default function KageGraph({ graphData, onNodeClick }: { graphData: GraphData; onNodeClick?: (node: Node) => void }) {
  const fgRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight });

  // Track container size explicitly — avoids the "empty right zone" artefact
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setDims({ w: width, h: height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Apply forces AFTER mount so d3 simulation is ready
  useEffect(() => {
    if (!fgRef.current || !graphData) return;

    const youNode = graphData.nodes.find(n => n.id === 'you');
    if (youNode) {
      youNode.fx = 0;
      youNode.fy = 0;
    }

    fgRef.current.d3Force('charge')?.strength(-800);
    fgRef.current.d3Force('link')?.distance(200);
    fgRef.current.d3Force('center')?.strength(0.1);

    // Никогда не останавливаем симуляцию
    fgRef.current.d3Force('simulation')?.alphaDecay(0);
  }, [fgRef, graphData]);

  // Постоянное медленное движение нод
  useEffect(() => {
    if (!fgRef.current) return;

    let animationId: ReturnType<typeof setTimeout>;

    const animate = () => {
      if (!fgRef.current) return;

      const nodes = fgRef.current.graphData().nodes;
      nodes.forEach((node: any) => {
        if (node.id === 'you') return;

        node.vx = (node.vx || 0) + (Math.random() - 0.5) * 0.3;
        node.vy = (node.vy || 0) + (Math.random() - 0.5) * 0.3;

        const maxV = 1.5;
        node.vx = Math.max(-maxV, Math.min(maxV, node.vx));
        node.vy = Math.max(-maxV, Math.min(maxV, node.vy));
      });

      fgRef.current.d3ReheatSimulation();

      animationId = setTimeout(animate, 100);
    };

    const startId = setTimeout(() => {
      animate();
    }, 2000);

    return () => {
      clearTimeout(startId);
      clearTimeout(animationId);
    };
  }, [fgRef]);

  // Pin "you" to graph origin (0,0) — library centres that point on screen
  const pinnedData = useMemo(() => ({
    nodes: graphData.nodes.map(n => n.isCenter ? { ...n, fx: 0, fy: 0 } : n),
    links: graphData.links,
  }), [graphData]);

  const drawNode = useCallback((node: object, ctx: CanvasRenderingContext2D) => {
    const n = node as Node;
    const nodeSize = n.isCenter ? 15 : n.dataMass + 2;
    ctx.beginPath();
    ctx.arc(n.x!, n.y!, nodeSize, 0, 2 * Math.PI);
    ctx.fillStyle = n.isCenter ? '#00d4ff' : '#4a9eff';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(n.name, n.x!, n.y! + nodeSize + 4);
  }, []);

  const drawPulse = useCallback((link: object, ctx: CanvasRenderingContext2D) => {
    const l = link as Link;
    const src = l.source as Node, tgt = l.target as Node;
    if (src.x == null || tgt.x == null) return;

    const isBreached = l.problems?.includes('breach');

    if (isBreached) {
      const pulse = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
      ctx.save();
      ctx.strokeStyle = `rgba(255, 51, 85, ${0.5 + pulse * 0.5})`;
      ctx.lineWidth = 2 + pulse * 3;
      ctx.beginPath();
      ctx.moveTo(src.x, src.y!);
      ctx.lineTo(tgt.x, tgt.y!);
      ctx.stroke();
      ctx.restore();
    } else {
      const colors = getProblemColors(l.problems);
      const p = Math.sin(Date.now() / 450);
      ctx.save();
      ctx.globalAlpha = 0.55 + 0.45 * p;
      ctx.lineWidth = 2.5 + 1.5 * Math.abs(p);
      const grad = ctx.createLinearGradient(src.x, src.y!, tgt.x, tgt.y!);
      grad.addColorStop(0, colors[0]); grad.addColorStop(1, colors[1] ?? colors[0]);
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(src.x, src.y!); ctx.lineTo(tgt.x, tgt.y!);
      ctx.stroke(); ctx.restore();
    }
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'fixed', inset: 0, background: '#000' }}>
      <ForceGraph2D
        ref={fgRef}
        graphData={pinnedData}
        width={dims.w}
        height={dims.h}
        backgroundColor="#000000"
        nodeCanvasObject={drawNode}
        nodeCanvasObjectMode={() => 'replace'}
        nodeVal={(n: any) => (n as Node).isCenter ? 22 : (n as Node).dataMass * 2}
        nodeLabel={(n: any) => (n as Node).name}
        linkColor={(l: any) => getEdgeColor((l as Link).problems)}
        linkWidth={(l: any) => {
          const t = l.target;
          const m = typeof t === 'object' && t !== null ? (t as Node).dataMass : 5;
          return 1 + (m / 10) * 4;
        }}
        linkCanvasObject={drawPulse}
        linkCanvasObjectMode={(l: any) => ((l as Link).problems.includes('breach') || (l as Link).problems.length >= 2) ? 'replace' : undefined}
        onNodeClick={(node) => onNodeClick?.(node as Node)}
        d3VelocityDecay={0.6}
        d3AlphaDecay={0.01}
        d3AlphaMin={0.001}
        warmupTicks={0}
        cooldownTicks={Infinity}
        nodeRelSize={8}
      />
    </div>
  );
}
