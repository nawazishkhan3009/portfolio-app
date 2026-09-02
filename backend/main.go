package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"os"
	"strings"
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
	Name       string  `json:"name"`
	Provider   string  `json:"provider"`
	Region     string  `json:"region"`
	Online     bool    `json:"online"`
	Version    string  `json:"version"`
	URL        string  `json:"url"`        // For frontend latency measurement
	Display    string  `json:"display"`    // Display name (e.g., "GKE", "EKS")
	Emoji      string  `json:"emoji"`      // Region emoji
	DistanceKm float64 `json:"distanceKm"` // Distance from user to cluster
	UserRegion string  `json:"userRegion"` // User's detected region
}

type clusterConfig struct {
	Name     string
	Provider string
	Region   string
	URL      string
	Version  string
	Display  string
	Emoji    string
}

// Cluster location coordinates (latitude, longitude)
var clusterLocations = map[string]struct {
	Lat float64
	Lng float64
}{
	"asia-southeast1": {Lat: 1.3521, Lng: 103.8198},
	"westeurope":      {Lat: 52.3702, Lng: 4.8952},
	"eu-east-1":       {Lat: 38.9072, Lng: -77.0369},
}

// Haversine formula for distance calculation
func haversine(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371 // Earth's radius in kilometers

	dLat := (lat2 - lat1) * math.Pi / 180
	dLon := (lon2 - lon1) * math.Pi / 180

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
			math.Sin(dLon/2)*math.Sin(dLon/2)

	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}

func getClusters() []clusterConfig {
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
			Display:  "GKE",
			Emoji:    "🌏",
		},
		{
			Name:     "portfolio-azure",
			Provider: "Azure",
			Region:   "westeurope",
			URL:      azureURL,
			Version:  "v1.0.2",
			Display:  "Azure k3s",
			Emoji:    "🌍",
		},
		{
			Name:     "portfolio-aks",
			Provider: "Azure",
			Region:   "eastus",
			URL:      aksURL,
			Version:  "v0.0.0",
			Display:  "Azure AKS",
			Emoji:    "🌍",
		},
		{
			Name:     "portfolio-aws",
			Provider: "AWS",
			Region:   "eu-east-1",
			URL:      awsURL,
			Version:  "v1.0.0",
			Display:  "EKS",
			Emoji:    "🌎",
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
	// Get user location from IP
	userLat, userLng, userRegion := getLocationFromIP(r)
	log.Printf("📍 User location: %s (lat: %.4f, lng: %.4f)", userRegion, userLat, userLng)

	clusters := getClusters()
	var results []CloudStatus
	onlineCount := 0

	client := &http.Client{Timeout: 2 * time.Second}

	// Check cluster health and calculate distances
	for _, c := range clusters {
		// Check if cluster is online
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

		// Calculate distance from user to cluster
		var distance float64
		clusterLoc, exists := clusterLocations[c.Region]
		if exists && userLat != 0 && userLng != 0 {
			distance = haversine(userLat, userLng, clusterLoc.Lat, clusterLoc.Lng)
		}

		results = append(results, CloudStatus{
			Name:       c.Name,
			Provider:   c.Provider,
			Region:     c.Region,
			Online:     online,
			Version:    c.Version,
			URL:        c.URL,
			Display:    c.Display,
			Emoji:      c.Emoji,
			DistanceKm: distance,
			UserRegion: userRegion,
		})
	}

	resp := map[string]interface{}{
		"clusters":     results,
		"totalOnline":  onlineCount,
		"totalCount":   len(results),
		"timestamp":    time.Now().Unix(),
		"userLocation": userRegion,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// Get location from IP address
func getLocationFromIP(r *http.Request) (float64, float64, string) {
	// Check for TEST_IP environment variable (for local development)
	if testIP := os.Getenv("TEST_IP"); testIP != "" {
		log.Printf("🧪 TEST MODE: Using TEST_IP=%s for location detection", testIP)
		return getLocationFromIPAddress(testIP)
	}

	ip := r.Header.Get("X-Forwarded-For")
	if ip == "" {
		ip = r.RemoteAddr
	}

	// Remove port if present
	if idx := strings.Index(ip, ":"); idx != -1 {
		ip = ip[:idx]
	}

	// If localhost, use a default test IP (Berlin)
	if ip == "127.0.0.1" || ip == "::1" {
		log.Println("🔧 Localhost detected, using Berlin IP for testing")
		return getLocationFromIPAddress("85.214.0.0")
	}

	return getLocationFromIPAddress(ip)
}

// Get location from a specific IP address using ip-api.com
func getLocationFromIPAddress(ip string) (float64, float64, string) {
	url := fmt.Sprintf("http://ip-api.com/json/%s", ip)
	resp, err := http.Get(url)
	if err != nil {
		log.Printf("Error calling IP API: %v", err)
		return 0, 0, "unknown"
	}
	defer resp.Body.Close()

	var data struct {
		Status  string  `json:"status"`
		Lat     float64 `json:"lat"`
		Lon     float64 `json:"lon"`
		City    string  `json:"city"`
		Country string  `json:"country"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil || data.Status != "success" {
		log.Printf("Error parsing IP API response: %v", err)
		return 0, 0, "unknown"
	}

	location := fmt.Sprintf("%s, %s", data.City, data.Country)
	log.Printf("📍 IP %s detected as: %s (lat: %.4f, lng: %.4f)", ip, location, data.Lat, data.Lon)

	return data.Lat, data.Lon, location
}
