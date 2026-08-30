# Add the ArgoCD Helm repository
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update

# Create a values file for ArgoCD
cat > argocd-values.yaml <<EOF
server:
  service:
    type: NodePort
  ingress:
    enabled: true
    className: nginx
    hosts:
      - argocd.local
  extraArgs:
    - --insecure
  config:
    # Disable TLS for simplicity
    url: http://argocd.local
EOF

# Install ArgoCD using Helm
helm install argocd argo/argo-cd \
  --namespace argocd \
  --create-namespace \
  -f argocd-values.yaml

# Wait for ArgoCD to be ready
kubectl wait --namespace argocd \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/name=argocd-server \
  --timeout=120s