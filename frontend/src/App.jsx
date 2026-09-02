import { useState, useEffect, useRef } from 'react'
import './App.css'
import { useLanguage } from './components/LanguageContext'
import { useScrollAnimation } from './hooks/useScrollAnimation'
import config from './config'

const cloudLogos = {
  Azure: 'https://www.vectorlogo.zone/logos/microsoft_azure/microsoft_azure-icon.svg',
  GCP: 'https://www.vectorlogo.zone/logos/google_cloud/google_cloud-icon.svg',
  AWS: 'https://www.vectorlogo.zone/logos/amazon_aws/amazon_aws-icon.svg',
  GitHub: 'https://www.vectorlogo.zone/logos/github/github-icon.svg',
  LinkedIn: 'https://www.vectorlogo.zone/logos/linkedin/linkedin-icon.svg',
  Xing: 'https://www.vectorlogo.zone/logos/xing/xing-icon.svg',
}

const cloudColors = {
  Azure: '#0089D6',
  GCP: '#34A853',
  AWS: '#FF9900',
}

const UPDATE_INTERVAL_SECONDS = 10

function App() {
  const { language, setLanguage } = useLanguage()
  
  const [status, setStatus] = useState({
    clusters: [],
    totalOnline: 0,
    totalCount: 0,
    userLocation: 'Detecting...'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [countdown, setCountdown] = useState(UPDATE_INTERVAL_SECONDS)
  const isFetchingRef = useRef(false)

  // Scroll animation refs
  const aboutRef = useScrollAnimation(0.15)
  const certificationsRef = useScrollAnimation(0.15)
  const projectRef = useScrollAnimation(0.15)
  const stackRef = useScrollAnimation(0.15)
  const contactRef = useScrollAnimation(0.15)

  // Function to check if a PDF file exists - improved version
  const checkPdfExists = async (filePath) => {
    try {
      const response = await fetch(filePath, { method: 'HEAD' })
      const contentType = response.headers.get('content-type')
      return response.ok && contentType && contentType.includes('application/pdf')
    } catch {
      return false
    }
  }

  // State to track which PDFs exist
  const [pdfExists, setPdfExists] = useState({
    azureAdmin: false,
    azureDevops: false,
    awsSa: false,
    telcC1: false
  })

  // Check which PDFs exist on mount
  useEffect(() => {
    const checkAllPdfs = async () => {
      const [azureAdmin, azureDevops, awsSa, telcC1] = await Promise.all([
        checkPdfExists('/certs/azure-admin.pdf'),
        checkPdfExists('/certs/azure-devops.pdf'),
        checkPdfExists('/certs/aws-sa.pdf'),
        checkPdfExists('/certs/telc-c1.pdf')
      ])
      setPdfExists({ azureAdmin, azureDevops, awsSa, telcC1 })
    }
    checkAllPdfs()
  }, [])

  // Translations
  const t = {
    en: {
      nav: ['About', 'Certifications', 'Project', 'Stack', 'Contact'],
      hero: {
        title: 'Nawazish Khan',
        subtitle: 'Cloud & DevOps Engineer',
        description: 'Automating infrastructure, optimizing deployments, and building scalable cloud solutions across AWS, Azure, and GCP.',
        projectBtn: 'View Project',
        contactBtn: 'Contact Me',
        resumeBtn: '📄 View Resume'
      },
      status: {
        title: 'Live Cluster Status',
        online: 'clusters online',
        updating: 'Updating in',
        connecting: 'Connecting...',
        loading: 'Loading...'
      },
      about: {
        title: 'About Me',
        text1: "I'm a Cloud & Platform Engineer with a passion for automation and observability. I specialize in building Kubernetes clusters, implementing GitOps workflows, and designing multi-cloud architectures — treating infrastructure as code with the same rigor as application code.",
        language: '🇩🇪 Fluent in English and German (C1 level) — I thrive in international, collaborative environments.'
      },
      certifications: {
        title: 'Certifications & Languages',
        microsoft: '🏅 Microsoft Certified',
        azure: 'Azure Administrator – Associate',
        azureFile: '/certs/azure-admin.pdf',
        azureDate: '08.2026 – 08.2027',
        devops: 'DevOps Engineer – Expert',
        devopsFile: '/certs/azure-devops.pdf',
        devopsDate: '09.2026 – 09.2027',
        aws: '☁️ AWS Certified',
        awsCert: 'Solutions Architect – Associate',
        awsFile: '/certs/aws-sa.pdf',
        awsDate: '03.2026 – 03.2029',
        german: '🇩🇪 German Language',
        telc: 'telc C1 German – General',
        telcFile: '/certs/telc-c1.pdf',
        telcDate: '08.2026',
        note: 'Continuously improving through conversational courses and visiting Sprachtandems.',
        show: 'Show'
      },
      project: {
        title: 'Featured Project',
        name: 'Multi‑Cloud Portfolio Deployment',
        description: 'A production-grade portfolio deployed across AWS EKS, Azure k3s, Azure AKS, and GCP GKE. Infrastructure provisioned with Terraform, CI/CD via GitHub Actions, and GitOps managed through Argo CD and Flux CD.',
        tags: ['Kubernetes', 'Terraform', 'Argo CD', 'GitOps'],
        status: 'Live'
      },
      stack: {
        title: 'Tech Stack',
        cloud: 'Cloud',
        iaac: 'IaC & Containers',
        cicd: 'CI/CD & GitOps',
        observability: 'Observability'
      },
      contact: {
        title: "Let's Connect",
        text: 'Open to Cloud, DevOps, SRE, and Platform Engineering opportunities.'
      },
      footer: '© 2026 Nawazish Khan · Built with React · Deployed via GitOps'
    },
    de: {
      nav: ['Über mich', 'Zertifikate', 'Projekt', 'Tech-Stack', 'Kontakt'],
      hero: {
        title: 'Nawazish Khan',
        subtitle: 'Cloud & DevOps Engineer',
        description: 'Automatisierung von Infrastruktur, Optimierung von Deployments und Aufbau skalierbarer Cloud-Lösungen auf AWS, Azure und GCP.',
        projectBtn: 'Projekt ansehen',
        contactBtn: 'Kontakt',
        resumeBtn: '📄 Lebenslauf anzeigen'
      },
      status: {
        title: 'Live-Cluster-Status',
        online: 'Cluster online',
        updating: 'Aktualisierung in',
        connecting: 'Verbinde...',
        loading: 'Lade...'
      },
      about: {
        title: 'Über mich',
        text1: 'Ich bin Cloud- & Platform-Engineer mit einer Leidenschaft für Automatisierung und Observability. Ich spezialisiere mich auf den Aufbau von Kubernetes-Clustern, die Implementierung von GitOps-Workflows und die Gestaltung von Multi-Cloud-Architekturen — Infrastructure as Code mit derselben Sorgfalt wie Anwendungscode.',
        language: '🇩🇪 Fließend in Englisch und Deutsch (C1-Niveau) — ich arbeite gerne in internationalen, kollaborativen Umgebungen.'
      },
      certifications: {
        title: 'Zertifizierungen & Sprachen',
        microsoft: '🏅 Microsoft-zertifiziert',
        azure: 'Azure Administrator – Associate',
        azureFile: '/certs/azure-admin.pdf',
        azureDate: '08.2026 – 08.2027',
        devops: 'DevOps Engineer – Expert',
        devopsFile: '/certs/azure-devops.pdf',
        devopsDate: '09.2026 – 09.2027',
        aws: '☁️ AWS-zertifiziert',
        awsCert: 'Solutions Architect – Associate',
        awsFile: '/certs/aws-sa.pdf',
        awsDate: '03.2026 – 03.2029',
        german: '🇩🇪 Deutschkenntnisse',
        telc: 'telc Deutsch C1 – Allgemein',
        telcFile: '/certs/telc-c1.pdf',
        telcDate: '08.2026',
        note: 'Kontinuierliche Verbesserung durch Konversationskurse und Sprachtandems.',
        show: 'Anzeigen'
      },
      project: {
        title: 'Ausgezeichnetes Projekt',
        name: 'Multi-Cloud-Portfolio-Bereitstellung',
        description: 'Ein produktionsreifes Portfolio, bereitgestellt auf AWS EKS, Azure k3s, Azure AKS und GCP GKE. Infrastruktur mit Terraform bereitgestellt, CI/CD über GitHub Actions und GitOps gesteuert durch Argo CD und Flux CD.',
        tags: ['Kubernetes', 'Terraform', 'Argo CD', 'GitOps'],
        status: 'Live'
      },
      stack: {
        title: 'Tech-Stack',
        cloud: 'Cloud',
        iaac: 'IaC & Container',
        cicd: 'CI/CD & GitOps',
        observability: 'Observability'
      },
      contact: {
        title: 'Kontakt',
        text: 'Offen für Cloud-, DevOps-, SRE- und Platform-Engineering-Möglichkeiten.'
      },
      footer: '© 2026 Nawazish Khan · Entwickelt mit React · Bereitgestellt via GitOps'
    }
  }

  const lang = language === 'en' ? t.en : t.de

  const measureLatency = async (url) => {
    if (!url) return -1
    const start = performance.now()
    try {
      await fetch(`${url}?t=${Date.now()}`, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
      })
      return Math.round(performance.now() - start)
    } catch {
      return -1
    }
  }

  const fetchStatus = async () => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    setIsLoading(true)
    try {
      const response = await fetch('/api/status')
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      
      const clustersWithLatency = await Promise.all(
        data.clusters.map(async (cluster) => {
          const latency = cluster.online ? await measureLatency(cluster.url) : -1
          return { ...cluster, latencyMs: latency }
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
      setCountdown(UPDATE_INTERVAL_SECONDS)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  useEffect(() => {
    const interval = setInterval(fetchStatus, UPDATE_INTERVAL_SECONDS * 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (!isLoading && prev > 0) ? prev - 1 : prev)
    }, 1000)
    return () => clearInterval(timer)
  }, [isLoading])

  const getProviderFromName = (clusterName) => {
    if (clusterName.includes('gke')) return 'GCP'
    if (clusterName.includes('azure') || clusterName.includes('aks')) return 'Azure'
    if (clusterName.includes('aws')) return 'AWS'
    return 'Azure'
  }

  const formatDistance = (distance) => {
    if (!distance || distance <= 0) return 'NA'
    return distance < 1000 ? `${Math.round(distance)} km` : `${(distance / 1000).toFixed(1)}k km`
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">Cloud | DevOps | Platform</div>
        <div className="nav-links">
          <a href="#about">{lang.nav[0]}</a>
          <a href="#certifications">{lang.nav[1]}</a>
          <a href="#project">{lang.nav[2]}</a>
          <a href="#stack">{lang.nav[3]}</a>
          <a href="#contact">{lang.nav[4]}</a>
          <button 
            onClick={() => setLanguage(language === 'en' ? 'de' : 'en')} 
            className="lang-switcher"
          >
            {language === 'en' ? '🇩🇪 DE' : '🇬🇧 EN'}
          </button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>{lang.hero.title}</h1>
            <h2>{lang.hero.subtitle}</h2>
            <p className="hero-description">{lang.hero.description}</p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">3</span>
                <span className="stat-label">Cloud Providers</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">99.9%</span>
                <span className="stat-label">Uptime Maintained</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">4+</span>
                <span className="stat-label">Certifications</span>
              </div>
            </div>
            <div className="hero-buttons">
              <a href="#project" className="btn-primary">{lang.hero.projectBtn}</a>
              <a href="#contact" className="btn-secondary">{lang.hero.contactBtn}</a>
              <a href={language === 'en' ? '/myResume.pdf' : '/myLebenslauf.pdf'} target="_blank" rel="noopener noreferrer" className="btn-tertiary">
                {lang.hero.resumeBtn}
              </a>
            </div>
          </div>
          <div className="hero-photo">
            <img src="/myPhoto.jpeg" alt="Nawazish Khan" />
          </div>
        </div>
      </section>

      <section id="status" className="status-section section-card">
        <h3 className="section-heading">
          {lang.status.title}
          <span className="user-location-badge">📍 {status.userLocation || 'Detecting...'}</span>
        </h3>
        <div className="status-summary">
          {isLoading ? (
            lang.status.loading
          ) : status.totalCount > 0 ? (
            <>
              <span className="status-count">{status.totalOnline} / {status.totalCount} {lang.status.online}</span>
              <span className="status-update-timer">
                {countdown > 0 ? `⏳ ${lang.status.updating} ${countdown}s` : '🔄 Updating...'}
              </span>
            </>
          ) : (
            lang.status.connecting
          )}
        </div>
        <div className="cluster-grid">
          {status.clusters.map(cluster => {
            const provider = getProviderFromName(cluster.name)
            return (
              <div
                key={cluster.name}
                className={`cluster-card ${cluster.online ? 'online' : 'offline'}`}
                style={{ borderColor: cluster.online ? cloudColors[provider] : '#ef4444' }}
              >
                <div className="cluster-icon">
                  <img src={cloudLogos[provider] || cloudLogos.Azure} alt={provider} />
                </div>
                <div className="cluster-info">
                  <h4 style={{ color: cloudColors[provider] || '#fff' }}>{cluster.display || cluster.name}</h4>
                  <p className="region">{cluster.emoji || '🌐'} {cluster.region}</p>
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
                              <div className="tooltip-header">⚡ Network Performance</div>
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
                                  <span className="tooltip-value">{formatDistance(cluster.distanceKm)}</span>
                                </div>
                                <div className="tooltip-divider"></div>
                                <div className="tooltip-row highlight">
                                  <span className="tooltip-label">⏱️ Measured RTT:</span>
                                  <span className="tooltip-value" style={{ color: '#60a5fa', fontWeight: 'bold' }}>
                                    {cluster.latencyMs && cluster.latencyMs > 0 ? `${cluster.latencyMs} ms` : 'measuring...'}
                                  </span>
                                </div>
                                <div className="tooltip-footer">⚡ Measured directly from your browser</div>
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

      <section 
        id="about" 
        className={`about-section section-card animate-on-scroll ${aboutRef.isVisible ? 'visible' : ''}`}
        ref={aboutRef.ref}
      >
        <h3 className="section-heading">{lang.about.title}</h3>
        <div className="about-content">
          <p className="about-text">{lang.about.text1}</p>
          <p className="about-text highlight-text">{lang.about.language}</p>
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

      <section 
        id="certifications" 
        className={`certifications-section section-card animate-on-scroll ${certificationsRef.isVisible ? 'visible' : ''}`}
        ref={certificationsRef.ref}
      >
        <h3 className="section-heading">{lang.certifications.title}</h3>
        <div className="cert-grid">
          <div className="cert-card">
            <h4>{lang.certifications.microsoft}</h4>
            <ul>
              <li>
                <strong>{lang.certifications.azure}</strong>
                <span className="cert-date">{lang.certifications.azureDate}</span>
                {pdfExists.azureAdmin && (
                  <a 
                    href={lang.certifications.azureFile} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="cert-link"
                  >
                    {lang.certifications.show}
                  </a>
                )}
              </li>
              <li>
                <strong>{lang.certifications.devops}</strong>
                <span className="cert-date">{lang.certifications.devopsDate}</span>
                {pdfExists.azureDevops && (
                  <a 
                    href={lang.certifications.devopsFile} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="cert-link"
                  >
                    {lang.certifications.show}
                  </a>
                )}
              </li>
            </ul>
          </div>
          <div className="cert-card">
            <h4>{lang.certifications.aws}</h4>
            <ul>
              <li>
                <strong>{lang.certifications.awsCert}</strong>
                <span className="cert-date">{lang.certifications.awsDate}</span>
                {pdfExists.awsSa && (
                  <a 
                    href={lang.certifications.awsFile} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="cert-link"
                  >
                    {lang.certifications.show}
                  </a>
                )}
              </li>
            </ul>
          </div>
          <div className="cert-card">
            <h4>{lang.certifications.german}</h4>
            <ul>
              <li>
                <strong>{lang.certifications.telc}</strong>
                <span className="cert-date">{lang.certifications.telcDate}</span>
                {pdfExists.telcC1 && (
                  <a 
                    href={lang.certifications.telcFile} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="cert-link"
                  >
                    {lang.certifications.show}
                  </a>
                )}
              </li>
            </ul>
            <p className="cert-note">{lang.certifications.note}</p>
          </div>
        </div>
      </section>

      <section 
        id="project" 
        className={`project-section section-card animate-on-scroll ${projectRef.isVisible ? 'visible' : ''}`}
        ref={projectRef.ref}
      >
        <h3 className="section-heading">{lang.project.title}</h3>
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
                {lang.project.name}
              </a>
            </h4>
            <span className="project-status">{lang.project.status}</span>
          </div>
          <p className="project-description">{lang.project.description}</p>
          <div className="project-tags">
            {lang.project.tags.map(tag => <span key={tag}>{tag}</span>)}
          </div>
        </div>
      </section>

      <section 
        id="stack" 
        className={`stack-section section-card animate-on-scroll ${stackRef.isVisible ? 'visible' : ''}`}
        ref={stackRef.ref}
      >
        <h3 className="section-heading">{lang.stack.title}</h3>
        <div className="stack-grid">
          <div className="stack-card">
            <h4>{lang.stack.cloud}</h4>
            <ul><li>AWS</li><li>Azure</li><li>GCP</li></ul>
          </div>
          <div className="stack-card">
            <h4>{lang.stack.iaac}</h4>
            <ul><li>Terraform</li><li>Kubernetes</li><li>Helm</li><li>Docker</li></ul>
          </div>
          <div className="stack-card">
            <h4>{lang.stack.cicd}</h4>
            <ul><li>GitHub Actions</li><li>Argo CD</li><li>Flux CD</li></ul>
          </div>
          <div className="stack-card">
            <h4>{lang.stack.observability}</h4>
            <ul><li>Prometheus</li><li>Grafana</li></ul>
          </div>
        </div>
      </section>

      <section 
        id="contact" 
        className={`contact-section section-card animate-on-scroll ${contactRef.isVisible ? 'visible' : ''}`}
        ref={contactRef.ref}
      >
        <h3 className="section-heading">{lang.contact.title}</h3>
        <p className="contact-text">{lang.contact.text}</p>
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
            <span className="contact-icon"><img src={cloudLogos.GitHub} alt="GitHub" className="contact-icon-img" /></span>
            GitHub
          </a>
          <a href={config.linkedin} target="_blank" rel="noopener noreferrer" className="contact-link" title="LinkedIn">
            <span className="contact-icon"><img src={cloudLogos.LinkedIn} alt="LinkedIn" className="contact-icon-img" /></span>
            LinkedIn
          </a>
          <a href={config.xing} target="_blank" rel="noopener noreferrer" className="contact-link" title="Xing">
            <span className="contact-icon"><img src={cloudLogos.Xing} alt="Xing" className="contact-icon-img" /></span>
            Xing
          </a>
        </div>
      </section>

      <footer>
        <p>{lang.footer}</p>
      </footer>
    </div>
  )
}

export default App