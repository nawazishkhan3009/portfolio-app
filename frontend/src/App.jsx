import { useState, useEffect } from 'react'
import './App.css'
import config from './config'

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
          {status.clusters.map(cluster => (
            <div key={cluster.name} className={`cluster-card ${cluster.online ? 'online' : 'offline'}`}>
              <div className="cluster-icon">{cloudLogos[cluster.Provider] || '🖥️'}</div>
              <div className="cluster-info">
                <h4>{cluster.Provider}</h4>
                <p className="region">{cluster.Region}</p>
                <p className="status-text">
                  <span className={`dot ${cluster.online ? 'green' : 'red'}`}></span>
                  {cluster.online ? 'Online' : 'Offline'}
                </p>
                <div className="cluster-meta">
                  <span>{cluster.latencyMs} ms</span>
                  <span className="version">{cluster.version}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="metrics-links">
          <a href="/api/metrics" target="_blank" rel="noopener noreferrer">Custom Metrics</a>
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
            <ul>
              <li>AWS</li>
              <li>Azure</li>
              <li>GCP</li>
            </ul>
          </div>
          <div className="stack-card">
            <h4>⚙️ IaC & Containers</h4>
            <ul>
              <li>Terraform</li>
              <li>Kubernetes</li>
              <li>Helm</li>
              <li>Docker</li>
            </ul>
          </div>
          <div className="stack-card">
            <h4>🔄 CI/CD & GitOps</h4>
            <ul>
              <li>GitHub Actions</li>
              <li>Argo CD</li>
            </ul>
          </div>
          <div className="stack-card">
            <h4>📊 Observability</h4>
            <ul>
              <li>Prometheus</li>
              <li>Grafana</li>
              <li>AlertManager</li>
            </ul>
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
            <span>Kubernetes</span>
            <span>Terraform</span>
            <span>Argo CD</span>
            <span>GitOps</span>
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