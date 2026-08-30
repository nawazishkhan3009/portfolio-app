#!/bin/bash
# Reset everything and start fresh

echo "🧹 Cleaning up minikube..."
minikube delete
rm -rf ~/.minikube

echo "📦 Checking Docker..."
sudo systemctl restart docker

echo "🚀 Starting minikube with minimal config..."
minikube start --cpus=4 --memory=4096 --driver=docker --addons=false

echo "⏳ Waiting for cluster to be ready..."
kubectl wait --namespace kube-system \
  --for=condition=ready pod \
  --selector=k8s-app=kube-dns \
  --timeout=120s

echo "🔌 Enabling ingress..."
minikube addons enable ingress

echo "⏳ Waiting for ingress controller..."
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

echo "✅ Minikube is ready!"
minikube status
kubectl get nodes
kubectl get pods -n ingress-nginx