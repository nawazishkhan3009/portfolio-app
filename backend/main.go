package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"runtime"
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
)

// CloudStatus matches the dummy data we want to expose
type CloudStatus struct {
	Name      string `json:"name"`
	Provider  string `json:"provider"`
	Region    string `json:"region"`
	Online    bool   `json:"online"`
	LatencyMs int64  `json:"latencyMs"`
	Version   string `json:"version"`
}

func main() {
	http.HandleFunc("/api/status", statusHandler)
	http.HandleFunc("/api/metrics", metricsHandler)
	http.Handle("/metrics", promhttp.Handler()) // standard Prometheus scrape endpoint

	port := ":8080"
	log.Printf("Backend listening on %s\n", port)
	log.Fatal(http.ListenAndServe(port, nil))
}

func statusHandler(w http.ResponseWriter, r *http.Request) {
	// Dummy data – replace with real cluster health checks later
	clusters := []CloudStatus{
		{Name: "portfolio-azure", Provider: "Azure", Region: "westeurope", Online: true, LatencyMs: 12, Version: "v1.0.0"},
		{Name: "portfolio-gcp", Provider: "GCP", Region: "europe-west1", Online: true, LatencyMs: 8, Version: "v1.0.0"},
		{Name: "portfolio-aws", Provider: "AWS", Region: "eu-west-1", Online: true, LatencyMs: 15, Version: "v1.0.0"},
	}

	// Update Prometheus metric for each cluster
	for _, c := range clusters {
		val := 0.0
		if c.Online {
			val = 1.0
		}
		clusterUp.WithLabelValues(c.Provider, c.Region).Set(val)
	}

	online := 0
	for _, c := range clusters {
		if c.Online {
			online++
		}
	}

	resp := map[string]interface{}{
		"clusters":    clusters,
		"totalOnline": online,
		"totalCount":  len(clusters),
		"timestamp":   time.Now().Unix(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func metricsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain; version=0.0.4")
	uptime := time.Since(startTime).Seconds()
	fmt.Fprintf(w, "# HELP portfolio_backend_uptime_seconds Backend uptime in seconds\n")
	fmt.Fprintf(w, "# TYPE portfolio_backend_uptime_seconds gauge\n")
	fmt.Fprintf(w, "portfolio_backend_uptime_seconds %f\n", uptime)
	fmt.Fprintf(w, "# HELP portfolio_backend_go_goroutines Number of goroutines\n")
	fmt.Fprintf(w, "# TYPE portfolio_backend_go_goroutines gauge\n")
	fmt.Fprintf(w, "portfolio_backend_go_goroutines %d\n", runtime.NumGoroutine())
}
