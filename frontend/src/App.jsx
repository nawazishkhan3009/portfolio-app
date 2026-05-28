import { useState, useEffect } from 'react'

function App() {
  const [backendStatus, setBackendStatus] = useState('checking...')

  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => setBackendStatus(data.status))
      .catch(() => setBackendStatus('unreachable'))
  }, [])

  return (
    <div style={{ fontFamily: 'system-ui', maxWidth: 600, margin: '2rem auto' }}>
      <h1>Nawazish Khan</h1>
      <h2>Cloud & DevOps Engineer</h2>
      <p>Multi-cloud portfolio project — React + Go + Kubernetes + GitOps</p>
      <p>Backend status: <strong>{backendStatus}</strong></p>
      <p>
        <a href="/api/metrics" target="_blank">Metrics (Prometheus)</a>
      </p>
    </div>
  )
}

export default App