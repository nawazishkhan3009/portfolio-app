package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var startTime = time.Now()

// Prometheus metrics
var (
	clusterUp = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "cluster_up",
			Help: "Whether a cloud cluster is reachable (1 = up, 0 = down).",
		},
		[]string{"provider", "region"},
	)
	clusterLatency = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "cluster_latency_ms",
			Help: "Last measured latency to cluster health endpoint in milliseconds.",
		},
		[]string{"provider", "region"},
	)
)

// CloudStatus represents a single cluster's health
type CloudStatus struct {
	Name      string `json:"name"`
	Provider  string `json:"provider"`
	Region    string `json:"region"`
	Online    bool   `json:"online"`
	LatencyMs int64  `json:"latencyMs"`
	Version   string `json:"version"`
}

// clusterConfig defines where to probe each cluster
type clusterConfig struct {
	Name     string
	Provider string
	Region   string
	URL      string
	Version  string
}

// getClusters returns cluster configurations from environment variables,
// with sensible defaults for local development.
func getClusters() []clusterConfig {
	return []clusterConfig{
		{
			Name:     "portfolio-gke",
			Provider: "GCP",
			Region:   "asia-southeast1",
			URL:      getEnv("CLUSTER_GCP_URL", "https://gcp.nawazishkhan.click"),
			Version:  "v1.0.0",
		},
		{
			Name:     "portfolio-azure",
			Provider: "Azure",
			Region:   "westeurope",
			URL:      getEnv("CLUSTER_AZURE_URL", "https://azure.nawazishkhan.click"),
			Version:  "v1.0.1",
		},
		{
			Name:     "portfolio-aws",
			Provider: "AWS",
			Region:   "eu-east-1",
			URL:      getEnv("CLUSTER_AWS_URL", "https://aws.nawazishkhan.click"),
			Version:  "v1.0.0",
		},
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

func main() {
	http.HandleFunc("/api/status", statusHandler)

	http.Handle("/metrics", promhttp.Handler())

	port := ":8080"
	log.Printf("Backend listening on %s\n", port)
	log.Fatal(http.ListenAndServe(port, nil))
}

func statusHandler(w http.ResponseWriter, r *http.Request) {
	clusters := getClusters()
	var results []CloudStatus
	onlineCount := 0

	client := &http.Client{Timeout: 2 * time.Second}

	for _, c := range clusters {
		start := time.Now()
		resp, err := client.Get(c.URL)
		latency := time.Since(start).Milliseconds()

		online := false
		if err == nil && resp.StatusCode >= 200 && resp.StatusCode < 400 {
			online = true
			onlineCount++
		}
		if resp != nil {
			resp.Body.Close()
		}

		// Update Prometheus metrics
		if online {
			clusterUp.WithLabelValues(c.Provider, c.Region).Set(1)
		} else {
			clusterUp.WithLabelValues(c.Provider, c.Region).Set(0)
		}
		clusterLatency.WithLabelValues(c.Provider, c.Region).Set(float64(latency))

		results = append(results, CloudStatus{
			Name:      c.Name,
			Provider:  c.Provider,
			Region:    c.Region,
			Online:    online,
			LatencyMs: latency,
			Version:   c.Version,
		})
	}

	resp := map[string]interface{}{
		"clusters":    results,
		"totalOnline": onlineCount,
		"totalCount":  len(results),
		"timestamp":   time.Now().Unix(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
