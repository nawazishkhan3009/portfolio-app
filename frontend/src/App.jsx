import { useState, useEffect, useRef } from 'react'
import './App.css'
import config from './config'

const cloudLogos = {
  // Cloud provider logos
  Azure: 'https://www.vectorlogo.zone/logos/microsoft_azure/microsoft_azure-icon.svg',
  GCP: 'https://www.vectorlogo.zone/logos/google_cloud/google_cloud-icon.svg',
  AWS: 'https://www.vectorlogo.zone/logos/amazon_aws/amazon_aws-icon.svg',
  // Brand icons for contact section
  GitHub: 'https://www.vectorlogo.zone/logos/github/github-icon.svg',
  LinkedIn: 'https://www.vectorlogo.zone/logos/linkedin/linkedin-icon.svg',
  Xing: 'https://www.vectorlogo.zone/logos/xing/xing-icon.svg',
}

const cloudColors = {
  Azure: '#0089D6',
  GCP: '#34A853',
  AWS: '#FF9900',
}

// CONFIGURATION - Easily modify the update interval (in seconds)
const UPDATE_INTERVAL_SECONDS = 10 // Change this to adjust refresh rate

function App() {
  const [status, setStatus] = useState({
    clusters: [],
    totalOnline: 0,
    totalCount: 0,
    userLocation: 'Detecting...'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [countdown, setCountdown] = useState(UPDATE_INTERVAL_SECONDS)
  
  // Use ref to track if we're currently fetching
  const isFetchingRef = useRef(false)

  // Measure latency from browser to a cluster URL
  const measureLatency = async (url) => {
    if (!url) return -1
    
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
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    
    setIsLoading(true)
    try {
      // Get ALL cluster data from backend (single source of truth)
      const response = await fetch('/api/status')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Measure latency from browser to each cluster
      const clustersWithLatency = await Promise.all(
        data.clusters.map(async (cluster) => {
          let latency = -1
          if (cluster.online) {
            latency = await measureLatency(cluster.url)
          }
          return {
            ...cluster,
            latencyMs: latency
          }
        })
      )
      
      setStatus({
        clusters: clustersWithLatency,
        totalOnline: data.totalOnline || 0,
        totalCount: data.totalCount || 0,
        userLocation: data.userLocation || 'Unknown'
      })
    } catch (error) {
      console.error('Failed to fetch status:', error)
      setStatus({ clusters: [], totalOnline: 0, totalCount: 0, userLocation: 'Error' })
    } finally {
      setIsLoading(false)
      isFetchingRef.current = false
      // Reset countdown to full interval after fetch completes
      setCountdown(UPDATE_INTERVAL_SECONDS)
    }
  }

  // Fetch status on mount
  useEffect(() => {
    fetchStatus()
  }, [])

  // Set up the interval for periodic fetching
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStatus()
    }, UPDATE_INTERVAL_SECONDS * 1000)
    
    return () => clearInterval(interval)
  }, [])

  // Countdown timer - runs independently
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        // Only decrement if we're not loading and countdown > 0
        if (!isLoading && prev > 0) {
          return prev - 1
        }
        return prev
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [isLoading])

  // Helper functions
  const getProviderFromName = (clusterName) => {
    if (clusterName.includes('gke')) return 'GCP'
    if (clusterName.includes('azure') || clusterName.includes('aks')) return 'Azure'
    if (clusterName.includes('aws')) return 'AWS'
    return 'Azure'
  }

  const formatDistance = (distance) => {
    if (!distance || distance <= 0) return 'NA'
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

      <section id="status" className="status-section section-card">
        <h3 className="section-heading">
          Live Cluster Status
          <span className="user-location-badge">
            📍 {status.userLocation || 'Detecting...'}
          </span>
        </h3>
        <div className="status-summary">
          {isLoading ? (
            'Loading...'
          ) : status.totalCount > 0 ? (
            <>
              <span className="status-count">
                {status.totalOnline} / {status.totalCount} clusters online
              </span>
              <span className="status-update-timer">
                {countdown > 0 ? `⏳ Updating in ${countdown}s` : '🔄 Updating...'}
              </span>
            </>
          ) : (
            'Connecting...'
          )}
        </div>
        <div className="cluster-grid">
          {status.clusters.map(cluster => {
            const provider = getProviderFromName(cluster.name)
            
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
                    {cluster.display || cluster.name}
                  </h4>
                  <p className="region">
                    {cluster.emoji || '🌐'} {cluster.region}
                  </p>
                  <p className="status-text">
                    <span className={`dot ${cluster.online ? 'green' : 'red'}`}></span>
                    {cluster.online ? 'Online' : 'Offline'}
                  </p>
                  <div className="cluster-meta">
                    <span>
                      {cluster.online ? (
                        <span className="latency-tooltip-container">
                          <span className="latency-number">
                            {cluster.latencyMs && cluster.latencyMs > 0 ? `${cluster.latencyMs} ms` : '⏳ measuring'}
                          </span>
                          <span className="latency-tooltip-icon">ⓘ</span>
                          <span className="latency-tooltip-text">
                            <div className="tooltip-content">
                              <div className="tooltip-header">
                                <span>⚡ Network Performance</span>
                              </div>
                              <div className="tooltip-body">
                                <div className="tooltip-row">
                                  <span className="tooltip-label">📍 You:</span>
                                  <span className="tooltip-value">{status.userLocation || 'Unknown'}</span>
                                </div>
                                <div className="tooltip-row">
                                  <span className="tooltip-label">☁️ Cluster:</span>
                                  <span className="tooltip-value">{cluster.emoji || '🌐'} {cluster.region}</span>
                                </div>
                                <div className="tooltip-row">
                                  <span className="tooltip-label">📏 Distance:</span>
                                  <span className="tooltip-value">
                                    {formatDistance(cluster.distanceKm)}
                                  </span>
                                </div>
                                <div className="tooltip-divider"></div>
                                <div className="tooltip-row highlight">
                                  <span className="tooltip-label">⏱️ Measured RTT:</span>
                                  <span className="tooltip-value" style={{ color: '#60a5fa', fontWeight: 'bold' }}>
                                    {cluster.latencyMs && cluster.latencyMs > 0 ? `${cluster.latencyMs} ms` : 'measuring...'}
                                  </span>
                                </div>
                                <div className="tooltip-footer" style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                                  ⚡ Measured directly from your browser
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

      <section id="about" className="about-section section-card">
        <h3 className="section-heading">About Me</h3>
        <div className="about-content">
          <p className="about-text">
            I'm a Cloud & Platform Engineer with a passion for automation and observability.
            I specialize in building <span className="highlight">Kubernetes</span> clusters, 
            implementing <span className="highlight">GitOps</span> workflows, and designing 
            <span className="highlight"> multi-cloud</span> architectures — treating infrastructure 
            as code with the same rigor as application code.
          </p>
          <p className="about-text">
            This portfolio is a live demonstration of these principles in action, 
            deployed across four cloud providers using Terraform, Argo CD, and Flux CD.
          </p>
          <div className="about-tags">
            <span className="tag">AWS</span>
            <span className="tag">Azure</span>
            <span className="tag">GCP</span>
            <span className="tag">Terraform</span>
            <span className="tag">Kubernetes</span>
            <span className="tag">Argo CD</span>
            <span className="tag">Flux CD</span>
            <span className="tag">Prometheus</span>
            <span className="tag">Grafana</span>
          </div>
        </div>
      </section>

      <section id="project" className="project-section section-card">
        <h3 className="section-heading">Featured Project</h3>
        <div className="project-content">
          <div className="project-header">
            <h4>
              <a 
                href="https://github.com/nawazishkhan3009/portfolio-app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="project-link"
                title="View on GitHub"
              >
                Multi‑Cloud Portfolio Deployment
              </a>
            </h4>
            <span className="project-status">Live</span>
          </div>
          <p className="project-description">
            A production-grade portfolio deployed across <strong>AWS EKS</strong>, 
            <strong>Azure k3s</strong>, <strong>Azure AKS</strong>, and <strong>GCP GKE</strong>.
            Infrastructure provisioned with Terraform, CI/CD via GitHub Actions, 
            and GitOps managed through Argo CD and Flux CD.
          </p>
          <div className="project-tags">
            <span>Kubernetes</span>
            <span>Terraform</span>
            <span>Argo CD</span>
            <span>GitOps</span>
          </div>
        </div>
      </section>

      <section id="stack" className="stack-section section-card">
        <h3 className="section-heading">Tech Stack</h3>
        <div className="stack-grid">
          <div className="stack-card">
            <h4>Cloud</h4>
            <ul><li>AWS</li><li>Azure</li><li>GCP</li></ul>
          </div>
          <div className="stack-card">
            <h4>IaC & Containers</h4>
            <ul><li>Terraform</li><li>Kubernetes</li><li>Helm</li><li>Docker</li></ul>
          </div>
          <div className="stack-card">
            <h4>CI/CD & GitOps</h4>
            <ul><li>GitHub Actions</li><li>Argo CD</li><li>Flux CD</li></ul>
          </div>
          <div className="stack-card">
            <h4>Observability</h4>
            <ul><li>Prometheus</li><li>Grafana</li></ul>
          </div>
        </div>
      </section>

      <section id="contact" className="contact-section section-card">
        <h3 className="section-heading">Let's Connect</h3>
        <p className="contact-text">
          Open to Cloud, DevOps, SRE, and Platform Engineering opportunities.
        </p>
        <div className="contact-links">
          <a href={`mailto:${config.email}`} className="contact-link" title="Email">
            <span className="contact-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </span>
            Email
          </a>
          <a href={config.github} target="_blank" rel="noopener noreferrer" className="contact-link" title="GitHub">
            <span className="contact-icon">
              <img src={cloudLogos.GitHub} alt="GitHub" className="contact-icon-img" />
            </span>
            GitHub
          </a>
          <a href={config.linkedin} target="_blank" rel="noopener noreferrer" className="contact-link" title="LinkedIn">
            <span className="contact-icon">
              <img src={cloudLogos.LinkedIn} alt="LinkedIn" className="contact-icon-img" />
            </span>
            LinkedIn
          </a>
          <a href={config.xing} target="_blank" rel="noopener noreferrer" className="contact-link" title="Xing">
            <span className="contact-icon">
              <img src={cloudLogos.Xing} alt="Xing" className="contact-icon-img" />
            </span>
            Xing
          </a>
        </div>
      </section>

      <footer>
        <p>© 2026 Nawazish Khan · Built with React · Deployed via GitOps</p>
      </footer>
    </div>
  )
}

export default App