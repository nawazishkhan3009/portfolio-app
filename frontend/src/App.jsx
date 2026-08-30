import { useState, useEffect } from 'react'
import './App.css'
import config from './config'

// Official logos from vectorlogo.zone (hosted SVG)
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

function App() {
  const [status, setStatus] = useState({
    clusters: [],
    totalOnline: 0,
    totalCount: 0,
  })

  const fetchStatus = () => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => setStatus(data))
      .catch(() => setStatus({ clusters: [], totalOnline: 0, totalCount: 0 }))
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="app">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-brand">NK.DEV</div>
        <div className="nav-links">
          <a href="#about">About</a>
          <a href="#project">Project</a>
          <a href="#stack">Stack</a>
          <a href="#contact">Contact</a>
        </div>
      </nav>

      {/* Hero */}
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

      {/* Live Cloud Status */}
      <section id="status" className="status-section">
        <h3 className="section-heading">Live Cluster Status</h3>
        <div className="status-summary">
          {status.totalCount > 0
            ? `${status.totalOnline} / ${status.totalCount} clusters online`
            : 'Connecting...'}
        </div>
        <div className="cluster-grid">
          {status.clusters.map(cluster => {
            const provider = cluster.provider || 'Azure'   // "Azure", "GCP", or "AWS"
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
                  <p className="region">{cluster.region}</p>
                  <p className="status-text">
                    <span className={`dot ${cluster.online ? 'green' : 'red'}`}></span>
                    {cluster.online ? 'Online' : 'Offline'}
                  </p>
                  <div className="cluster-meta">
                    <span>{cluster.online ? `${cluster.latencyMs} ms` : 'NA'}</span>
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

      {/* About */}
      <section id="about" className="about-section">
        <h3 className="section-heading">About Me</h3>
        <p>
          I'm a Cloud & Platform Engineer with a passion for automation, observability, and
          GitOps. This site itself is a live demo of a multi‑cloud Kubernetes deployment
          managed entirely through Argo CD and Terraform. Every commit rolls out across
          AWS, Azure, and GCP without manual intervention.
        </p>
      </section>

      {/* Tech Stack */}
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

      {/* Featured Project */}
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

      {/* Contact */}
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

      {/* Footer */}
      <footer>
        <p>© 2026 Nawazish Khan · Built with React · Deployed via GitOps</p>
      </footer>
    </div>
  )
}

export default App