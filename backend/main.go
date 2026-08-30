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

var (
	clusterUp = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "cluster_up",
			Help: "Whether a cloud cluster is reachable (1 = up, 0 = down).",
		},
		[]string{"provider", "region"},
	)
)

type CloudStatus struct {
	Name     string `json:"name"`
	Provider string `json:"provider"`
	Region   string `json:"region"`
	Online   bool   `json:"online"`
	Version  string `json:"version"`
	// No LatencyMs - frontend measures it
}

type clusterConfig struct {
	Name     string
	Provider string
	Region   string
	URL      string
	Version  string
}

func getClusters() []clusterConfig {
	// Get environment variables for URLs with defaults
	gcpURL := getEnv("CLUSTER_GCP_URL", "https://gcp.nawazishkhan.click")
	azureURL := getEnv("CLUSTER_AZURE_URL", "https://azure.nawazishkhan.click")
	aksURL := getEnv("CLUSTER_AKS_URL", "https://aks.nawazishkhan.click")
	awsURL := getEnv("CLUSTER_AWS_URL", "https://aws.nawazishkhan.click")

	return []clusterConfig{
		{
			Name:     "portfolio-gke",
			Provider: "GCP",
			Region:   "asia-southeast1",
			URL:      gcpURL,
			Version:  "v1.0.0",
		},
		{
			Name:     "portfolio-azure",
			Provider: "Azure",
			Region:   "westeurope",
			URL:      azureURL,
			Version:  "v1.0.1",
		},
		{
			Name:     "portfolio-aks",
			Provider: "Azure",
			Region:   "westeurope",
			URL:      aksURL,
			Version:  "v0.0.0",
		},
		{
			Name:     "portfolio-aws",
			Provider: "AWS",
			Region:   "eu-east-1",
			URL:      awsURL,
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
		resp, err := client.Get(c.URL)
		online := err == nil && resp.StatusCode >= 200 && resp.StatusCode < 400

		if resp != nil {
			resp.Body.Close()
		}

		if online {
			onlineCount++
			clusterUp.WithLabelValues(c.Provider, c.Region).Set(1)
		} else {
			clusterUp.WithLabelValues(c.Provider, c.Region).Set(0)
		}

		results = append(results, CloudStatus{
			Name:     c.Name,
			Provider: c.Provider,
			Region:   c.Region,
			Online:   online,
			Version:  c.Version,
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
