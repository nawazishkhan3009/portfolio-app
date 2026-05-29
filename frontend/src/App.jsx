import { useState, useEffect } from 'react'

const cloudLogos = {
  Azure: '☁️',
  GCP:   '🔵',
  AWS:   '🟠',
}

function App() {
  const [status, setStatus] = useState({
    clusters: [],
    totalOnline: 0,
    totalCount: 0,
  })

  useEffect(() => {
    const fetchStatus = () => {
      fetch('/api/status')
        .then(res => res.json())
        .then(data => setStatus(data))
        .catch(() => setStatus({ clusters: [], totalOnline: 0, totalCount: 0 }))
    }
    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <style>{`
        body { margin: 0; background: #1a1a2e; color: white; font-family: system-ui; }
        .App { text-align: center; min-height: 100vh; padding: 2rem; }
        .dashboard { display: flex; justify-content: center; gap: 1.5rem; flex-wrap: wrap; margin-top: 2rem; }
        .card {
          background: #16213e; border-radius: 12px; padding: 1.5rem; width: 220px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: border 0.2s;
        }
        .card.online { border: 2px solid #00ff88; }
        .card.offline { border: 2px solid #ff5555; }
        .logo { font-size: 2.5rem; display: block; margin-bottom: 0.5rem; }
        .dot { height: 12px; width: 12px; border-radius: 50%; display: inline-block; margin-right: 6px; }
        .green { background-color: #00ff88; }
        .red { background-color: #ff5555; }
        .metrics-link { margin-top: 2rem; }
        .metrics-link a { color: #aaa; }
      `}</style>

      <div className="App">
        <h1>Nawazish Khan</h1>
        <h2>Cloud & DevOps Engineer</h2>
        <p>Multi‑cloud portfolio — React + Go + Kubernetes + GitOps</p>
        <p>Live cluster status — {status.totalOnline}/{status.totalCount} online</p>

        <div className="dashboard">
          {status.clusters.map(cluster => (
            <div key={cluster.name} className={`card ${cluster.online ? 'online' : 'offline'}`}>
              <span className="logo">{cloudLogos[cluster.Provider] || '🖥️'}</span>
              <h3>{cluster.Provider}</h3>
              <p>{cluster.Region}</p>
              <div className="status">
                <span className={`dot ${cluster.online ? 'green' : 'red'}`}></span>
                {cluster.online ? 'Online' : 'Offline'}
              </div>
              <p>Latency: {cluster.latencyMs}ms</p>
              <p>Version: {cluster.version}</p>
            </div>
          ))}
        </div>

        <div className="metrics-link">
          <a href="/api/metrics" target="_blank" rel="noopener noreferrer">Custom metrics (Prometheus)</a>
          <br />
          <a href="/metrics" target="_blank" rel="noopener noreferrer">Standard metrics (Prometheus)</a>
        </div>
      </div>
    </>
  )
}

export default App