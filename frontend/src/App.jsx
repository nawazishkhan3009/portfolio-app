import { useState, useEffect } from 'react'
import './App.css'
import config from './config'

const cloudLogos = {
  Azure: 'https://www.vectorlogo.zone/logos/microsoft_azure/microsoft_azure-icon.svg',
  GCP: 'https://www.vectorlogo.zone/logos/google_cloud/google_cloud-icon.svg',
  AWS: 'https://www.vectorlogo.zone/logos/amazon_aws/amazon_aws-icon.svg',
}

const cloudColors = {
  Azure: '#0089D6',
  GCP: '#34A853',
  AWS: '#FF9900',
}

// Cluster URLs for latency testing
const CLUSTER_URLS = {
  GCP: 'https://gcp.nawazishkhan.click',
  Azure: 'https://azure.nawazishkhan.click',
  AWS: 'https://aws.nawazishkhan.click',
}

function App() {
  const [status, setStatus] = useState({
    clusters: [],
    totalOnline: 0,
    totalCount: 0,
  })
  const [userLocation, setUserLocation] = useState('Unknown Location')

  // Detect user's approximate location
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        const location = `${data.city}, ${data.country_name}`
        setUserLocation(location)
      })
      .catch(() => {
        setUserLocation('Unknown Location')
      })
  }, [])

  // Measure latency from user's browser
  const measureLatency = async (url) => {
    const start = performance.now()
    try {
      await fetch(`${url}?t=${Date.now()}`, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
      })
      const end = performance.now()
      return Math.round(end - start)
    } catch (error) {
      return -1
    }
  }

  const fetchStatus = async () => {
    try {
      // Get cluster health from backend
      const response = await fetch('/api/status')
      const data = await response.json()
      
      // Measure latency from client for each cluster
      const clustersWithLatency = await Promise.all(
        data.clusters.map(async (cluster) => {
          const url = CLUSTER_URLS[cluster.provider]
          const latency = await measureLatency(url)
          return {
            ...cluster,
            latencyMs: latency,
            online: latency >= 0
          }
        })
      )
      
      const onlineCount = clustersWithLatency.filter(c => c.online).length
      
      setStatus({
        clusters: clustersWithLatency,
        totalOnline: onlineCount,
        totalCount: clustersWithLatency.length,
      })
    } catch (error) {
      console.error('Failed to fetch status:', error)
      setStatus({ clusters: [], totalOnline: 0, totalCount: 0 })
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  // Helper function to get emoji for location
  const getLocationEmoji = (region) => {
    if (region.includes('asia')) return '🌏'
    if (region.includes('europe')) return '🌍'
    if (region.includes('us') || region.includes('america')) return '🌎'
    return '🌐'
  }

  // Helper function to get distance indicator
  const getDistanceIndicator = (region) => {
    const distances = {
      'asia-southeast1': '~5,000 km',
      'westeurope': '~6,500 km',
      'eu-east-1': '~12,000 km',
    }
    return distances[region] || '~8,000 km'
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">NK.DEV</div>
        <div className="nav-links">
          <a href="#about">About</a>
          <a href="#project">Project</a>
          <a href="#stack">Stack</a>
          <a href="#contact">Contact</a>
        </div>
      </nav>

      <section className="hero">
        <h1>Nawazish Khan</h1>
        <h2>Cloud & DevOps Engineer</h2>
        <p className="hero-description">
          I design and deploy resilient, observable, multi‑cloud infrastructure.
          GitOps practitioner. Kubernetes native. Terraform first.
        </p>
        <div className="hero-buttons">
          <a href="#project" className="btn-primary">View Project</a>
          <a href="#contact" className="btn-secondary">Contact Me</a>
        </div>
      </section>

      <section id="status" className="status-section">
        <h3 className="section-heading">
          Live Cluster Status
          <span className="user-location-badge">
            📍 {userLocation}
          </span>
        </h3>
        <div className="status-summary">
          {status.totalCount > 0
            ? `${status.totalOnline} / ${status.totalCount} clusters online`
            : 'Connecting...'}
        </div>
        <div className="cluster-grid">
          {status.clusters.map(cluster => {
            const provider = cluster.provider || 'Azure'
            const locationEmoji = getLocationEmoji(cluster.region)
            const distance = getDistanceIndicator(cluster.region)
            
            return (
              <div
                key={cluster.name}
                className={`cluster-card ${cluster.online ? 'online' : 'offline'}`}
                style={{
                  borderColor: cluster.online ? cloudColors[provider] : '#ef4444',
                }}
              >
                <div className="cluster-icon">
                  <img
                    src={cloudLogos[provider] || cloudLogos.Azure}
                    alt={provider}
                  />
                </div>
                <div className="cluster-info">
                  <h4 style={{ color: cloudColors[provider] || '#fff' }}>
                    {provider}
                  </h4>
                  <p className="region">
                    {locationEmoji} {cluster.region}
                  </p>
                  <p className="status-text">
                    <span className={`dot ${cluster.online ? 'green' : 'red'}`}></span>
                    {cluster.online ? 'Online' : 'Offline'}
                  </p>
                  <div className="cluster-meta">
                    <span>
                      {cluster.online ? (
                        <span className="latency-tooltip-container">
                          <span className="latency-number">{cluster.latencyMs} ms</span>
                          <span className="latency-tooltip-icon">ⓘ</span>
                          <span className="latency-tooltip-text">
                            <div className="tooltip-content">
                              <div className="tooltip-header">
                                <span>⚡ Latency Measurement</span>
                              </div>
                              <div className="tooltip-body">
                                <div className="tooltip-row">
                                  <span className="tooltip-label">📍 Your Location:</span>
                                  <span className="tooltip-value">{userLocation}</span>
                                </div>
                                <div className="tooltip-row">
                                  <span className="tooltip-label">☁️ Cluster Location:</span>
                                  <span className="tooltip-value">{locationEmoji} {cluster.region}</span>
                                </div>
                                <div className="tooltip-row">
                                  <span className="tooltip-label">📏 Approx. Distance:</span>
                                  <span className="tooltip-value">{distance}</span>
                                </div>
                                <div className="tooltip-divider"></div>
                                <div className="tooltip-row highlight">
                                  <span className="tooltip-label">⏱️ Round-trip Time:</span>
                                  <span className="tooltip-value" style={{ color: '#60a5fa', fontWeight: 'bold' }}>
                                    {cluster.latencyMs} ms
                                  </span>
                                </div>
                                <div className="tooltip-footer">
                                  <span>🌐 Real-time measurement from your browser</span>
                                </div>
                              </div>
                            </div>
                          </span>
                        </span>
                      ) : (
                        <span className="latency-na">NA</span>
                      )}
                    </span>
                    <span className="version">{cluster.version}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="metrics-links">
          <a href="/metrics" target="_blank" rel="noopener noreferrer">Prometheus Metrics</a>
        </div>
      </section>

      <section id="about" className="about-section">
        <h3 className="section-heading">About Me</h3>
        <p>
          I'm a Cloud & Platform Engineer with a passion for automation, observability, and
          GitOps. This site itself is a live demo of a multi‑cloud Kubernetes deployment
          managed entirely through Argo CD and Terraform. Every commit rolls out across
          AWS, Azure, and GCP without manual intervention.
        </p>
      </section>

      <section id="stack" className="stack-section">
        <h3 className="section-heading">Tech Stack</h3>
        <div className="stack-grid">
          <div className="stack-card">
            <h4>☁️ Cloud</h4>
            <ul><li>AWS</li><li>Azure</li><li>GCP</li></ul>
          </div>
          <div className="stack-card">
            <h4>⚙️ IaC & Containers</h4>
            <ul><li>Terraform</li><li>K8s and K3s</li><li>Helm</li><li>Docker</li><li>Minikube</li></ul>
          </div>
          <div className="stack-card">
            <h4>🔄 CI/CD & GitOps</h4>
            <ul><li>GitHub Actions</li><li>Argo CD</li><li>FluxCD</li></ul>
          </div>
          <div className="stack-card">
            <h4>📊 Observability</h4>
            <ul><li>Prometheus</li><li>Grafana</li></ul>
          </div>
        </div>
      </section>

      <section id="project" className="project-section">
        <h3 className="section-heading">Featured Project</h3>
        <div className="project-card">
          <h4>Multi‑Cloud Portfolio Deployment</h4>
          <p>
            This website is deployed simultaneously on AWS (EKS), Azure (AKS), and Google Cloud (GKE).
            Infrastructure provisioned with Terraform. CI/CD via GitHub Actions and Argo CD.
            Real‑time metrics streamed to Prometheus and Grafana.
          </p>
          <div className="project-tags">
            <span>Kubernetes</span><span>Terraform</span><span>Argo CD</span><span>GitOps</span>
          </div>
        </div>
      </section>

      <section id="contact" className="contact-section">
        <h3 className="section-heading">Let's Connect</h3>
        <p>Open to Cloud, DevOps, SRE, and Platform Engineering opportunities.</p>
        <div className="contact-links">
          <a href={`mailto:${config.email}`}>Email</a>
          <a href={config.github} target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href={config.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href={config.xing} target="_blank" rel="noopener noreferrer">Xing</a>
        </div>
      </section>

      <footer>
        <p>© 2026 Nawazish Khan · Built with React · Deployed via GitOps</p>
      </footer>
    </div>
  )
}

export default App