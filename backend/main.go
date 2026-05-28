package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"runtime"
	"time"
)

var startTime = time.Now()

func main() {
	http.HandleFunc("/api/status", statusHandler)
	http.HandleFunc("/api/metrics", metricsHandler)

	port := ":8080"
	log.Printf("Backend listening on %s\n", port)
	log.Fatal(http.ListenAndServe(port, nil))
}

func statusHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
		"time":   time.Now().UTC().Format(time.RFC3339),
	})
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
