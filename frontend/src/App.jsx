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

// Cluster information with short display names
const CLUSTER_INFO = {
  'asia-southeast1': { 
    lat: 1.3521, 
    lng: 103.8198, 
    display: 'Singapore',  // Short name for display
    emoji: '🌏' 
  },
  'westeurope': { 
    lat: 52.3702, 
    lng: 4.8952, 
    display: 'Netherlands',  // Short name for display
    emoji: '🌍' 
  },
  'eu-east-1': { 
    lat: 38.9072, 
    lng: -77.0369, 
    display: 'Virginia',  // Short name for display
    emoji: '🌎' 
  },
}

// Haversine formula for distance calculation
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

function App() {
  const [status, setStatus] = useState({
    clusters: [],
    totalOnline: 0,
    totalCount: 0,
  })
  const [userInfo, setUserInfo] = useState({
    location: 'Detecting...',
    lat: 0,
    lng: 0
  })

  // Get user location with coordinates
  useEffect(() => {
    fetch('http://ip-api.com/json/')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setUserInfo({
            location: `${data.city}, ${data.country}`,
            lat: data.lat,
            lng: data.lon
          })
        } else {
          setUserInfo({ location: 'Unknown Location', lat: 0, lng: 0 })
        }
      })
      .catch(() => {
        setUserInfo({ location: 'Unknown Location', lat: 0, lng: 0 })
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
      const response = await fetch('/api/status')
      const data = await response.json()
      
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

  // Helper functions
  const getClusterInfo = (region) => {
    return CLUSTER_INFO[region] || { display: region, emoji: '🌐', lat: 0, lng: 0 }
  }

  const formatDistance = (distance) => {
    if (!distance) return 'Unknown'
    if (distance < 1000) {
      return `${Math.round(distance)} km`
    } else {
      return `${(distance / 1000).toFixed(1)}k km`
    }
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
            📍 {userInfo.location}
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
            const clusterInfo = getClusterInfo(cluster.region)
            
            // Calculate distance from user to cluster
            let distance = null
            if (userInfo.lat && userInfo.lng && clusterInfo.lat && clusterInfo.lng) {
              distance = getDistance(
                userInfo.lat, 
                userInfo.lng, 
                clusterInfo.lat, 
                clusterInfo.lng
              )
            }
            
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
                    {clusterInfo.emoji} {clusterInfo.display}
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
                                <span>⚡ Latency from your browser</span>
                              </div>
                              <div className="tooltip-body">
                                <div className="tooltip-row">
                                  <span className="tooltip-label">📍 You:</span>
                                  <span className="tooltip-value">{userInfo.location}</span>
                                </div>
                                <div className="tooltip-row">
                                  <span className="tooltip-label">☁️ Cluster:</span>
                                  <span className="tooltip-value">{clusterInfo.emoji} {clusterInfo.display}</span>
                                </div>
                                <div className="tooltip-row">
                                  <span className="tooltip-label">📏 Distance:</span>
                                  <span className="tooltip-value">{formatDistance(distance)}</span>
                                </div>
                                <div className="tooltip-divider"></div>
                                <div className="tooltip-row highlight">
                                  <span className="tooltip-label">⏱️ Round-trip:</span>
                                  <span className="tooltip-value" style={{ color: '#60a5fa', fontWeight: 'bold' }}>
                                    {cluster.latencyMs} ms
                                  </span>
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
            <ul><li>Terraform</li><li>Kubernetes</li><li>Helm</li><li>Docker</li></ul>
          </div>
          <div className="stack-card">
            <h4>🔄 CI/CD & GitOps</h4>
            <ul><li>GitHub Actions</li><li>Argo CD</li></ul>
          </div>
          <div className="stack-card">
            <h4>📊 Observability</h4>
            <ul><li>Prometheus</li><li>Grafana</li><li>AlertManager</li></ul>
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