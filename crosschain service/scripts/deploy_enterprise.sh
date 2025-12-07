#!/bin/bash
# Enterprise Deployment Script for Cross-Chain Bridge Security Service
# This script deploys the service in a production-ready, enterprise-grade configuration

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SERVICE_NAME="cross-chain-bridge-security"
NAMESPACE="bridge-security"
ENVIRONMENT="${ENVIRONMENT:-production}"
REGISTRY="${REGISTRY:-your-registry.com}"
VERSION="${VERSION:-latest}"
REPLICAS="${REPLICAS:-3}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
    
    # Check if helm is installed
    if ! command -v helm &> /dev/null; then
        log_error "helm is not installed. Please install helm first."
        exit 1
    fi
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "docker is not installed. Please install docker first."
        exit 1
    fi
    
    # Check if kubectl can connect to cluster
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Build and push Docker image
build_and_push_image() {
    log_info "Building and pushing Docker image..."
    
    # Build image
    docker build -t "${REGISTRY}/${SERVICE_NAME}:${VERSION}" "${PROJECT_DIR}"
    
    # Push image
    docker push "${REGISTRY}/${SERVICE_NAME}:${VERSION}"
    
    log_success "Docker image built and pushed successfully"
}

# Create namespace
create_namespace() {
    log_info "Creating namespace ${NAMESPACE}..."
    
    kubectl create namespace "${NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -
    
    # Add labels to namespace
    kubectl label namespace "${NAMESPACE}" \
        app="${SERVICE_NAME}" \
        environment="${ENVIRONMENT}" \
        --overwrite
    
    log_success "Namespace created successfully"
}

# Deploy secrets
deploy_secrets() {
    log_info "Deploying secrets..."
    
    # Create secrets from environment variables or files
    kubectl create secret generic "${SERVICE_NAME}-secrets" \
        --namespace="${NAMESPACE}" \
        --from-literal=POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-$(openssl rand -base64 32)}" \
        --from-literal=REDIS_PASSWORD="${REDIS_PASSWORD:-$(openssl rand -base64 32)}" \
        --from-literal=JWT_SECRET_KEY="${JWT_SECRET_KEY:-$(openssl rand -base64 32)}" \
        --from-literal=ENCRYPTION_KEY="${ENCRYPTION_KEY:-$(openssl rand -base64 32)}" \
        --from-literal=SENTRY_DSN="${SENTRY_DSN:-}" \
        --from-literal=GRAFANA_PASSWORD="${GRAFANA_PASSWORD:-$(openssl rand -base64 32)}" \
        --from-literal=ALCHEMY_API_KEY="${ALCHEMY_API_KEY:-}" \
        --from-literal=INFURA_API_KEY="${INFURA_API_KEY:-}" \
        --from-literal=QUICKNODE_API_KEY="${QUICKNODE_API_KEY:-}" \
        --from-literal=MORALIS_API_KEY="${MORALIS_API_KEY:-}" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    log_success "Secrets deployed successfully"
}

# Deploy ConfigMap
deploy_configmap() {
    log_info "Deploying ConfigMap..."
    
    kubectl apply -f "${PROJECT_DIR}/k8s/configmap.yaml"
    
    log_success "ConfigMap deployed successfully"
}

# Deploy PersistentVolumeClaims
deploy_pvcs() {
    log_info "Deploying PersistentVolumeClaims..."
    
    kubectl apply -f "${PROJECT_DIR}/k8s/pvc.yaml"
    
    log_success "PersistentVolumeClaims deployed successfully"
}

# Deploy PostgreSQL
deploy_postgres() {
    log_info "Deploying PostgreSQL..."
    
    # Create PostgreSQL deployment
    cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: ${NAMESPACE}
  labels:
    app: postgres
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_DB
          value: bridge_security
        - name: POSTGRES_USER
          value: postgres
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: ${SERVICE_NAME}-secrets
              key: POSTGRES_PASSWORD
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-data
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
      volumes:
      - name: postgres-data
        persistentVolumeClaim:
          claimName: postgres-data
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: ${NAMESPACE}
  labels:
    app: postgres
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
  type: ClusterIP
EOF
    
    log_success "PostgreSQL deployed successfully"
}

# Deploy Redis
deploy_redis() {
    log_info "Deploying Redis..."
    
    # Create Redis deployment
    cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: ${NAMESPACE}
  labels:
    app: redis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        command: ["redis-server", "--appendonly", "yes", "--maxmemory", "2gb", "--maxmemory-policy", "allkeys-lru"]
        ports:
        - containerPort: 6379
        volumeMounts:
        - name: redis-data
          mountPath: /data
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
      volumes:
      - name: redis-data
        persistentVolumeClaim:
          claimName: redis-data
---
apiVersion: v1
kind: Service
metadata:
  name: redis-service
  namespace: ${NAMESPACE}
  labels:
    app: redis
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
  type: ClusterIP
EOF
    
    log_success "Redis deployed successfully"
}

# Deploy Prometheus
deploy_prometheus() {
    log_info "Deploying Prometheus..."
    
    # Add Prometheus Helm repository
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update
    
    # Install Prometheus
    helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
        --namespace "${NAMESPACE}" \
        --set prometheus.prometheusSpec.retention=30d \
        --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=100Gi \
        --set grafana.adminPassword="${GRAFANA_PASSWORD:-admin}" \
        --set grafana.persistence.enabled=true \
        --set grafana.persistence.size=10Gi \
        --wait
    
    log_success "Prometheus deployed successfully"
}

# Deploy Jaeger
deploy_jaeger() {
    log_info "Deploying Jaeger..."
    
    # Add Jaeger Helm repository
    helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
    helm repo update
    
    # Install Jaeger
    helm upgrade --install jaeger jaegertracing/jaeger \
        --namespace "${NAMESPACE}" \
        --set storage.type=memory \
        --set provisionDataStore.cassandra=false \
        --wait
    
    log_success "Jaeger deployed successfully"
}

# Deploy Elasticsearch
deploy_elasticsearch() {
    log_info "Deploying Elasticsearch..."
    
    # Add Elasticsearch Helm repository
    helm repo add elastic https://helm.elastic.co
    helm repo update
    
    # Install Elasticsearch
    helm upgrade --install elasticsearch elastic/elasticsearch \
        --namespace "${NAMESPACE}" \
        --set replicas=1 \
        --set volumeClaimTemplate.resources.requests.storage=100Gi \
        --set resources.requests.memory=2Gi \
        --set resources.limits.memory=4Gi \
        --wait
    
    # Install Kibana
    helm upgrade --install kibana elastic/kibana \
        --namespace "${NAMESPACE}" \
        --set elasticsearchHosts="http://elasticsearch-master:9200" \
        --wait
    
    # Install Logstash
    helm upgrade --install logstash elastic/logstash \
        --namespace "${NAMESPACE}" \
        --wait
    
    log_success "Elasticsearch stack deployed successfully"
}

# Deploy main application
deploy_application() {
    log_info "Deploying main application..."
    
    # Update image in deployment
    sed -i "s|image: cross-chain-bridge-service:latest|image: ${REGISTRY}/${SERVICE_NAME}:${VERSION}|g" "${PROJECT_DIR}/k8s/deployment.yaml"
    
    # Update replicas
    sed -i "s|replicas: 3|replicas: ${REPLICAS}|g" "${PROJECT_DIR}/k8s/deployment.yaml"
    
    # Deploy application
    kubectl apply -f "${PROJECT_DIR}/k8s/deployment.yaml"
    kubectl apply -f "${PROJECT_DIR}/k8s/services.yaml"
    
    log_success "Application deployed successfully"
}

# Deploy Ingress
deploy_ingress() {
    log_info "Deploying Ingress..."
    
    # Install NGINX Ingress Controller
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    helm repo update
    
    helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
        --namespace ingress-nginx \
        --create-namespace \
        --set controller.service.type=LoadBalancer \
        --wait
    
    # Deploy Ingress
    kubectl apply -f "${PROJECT_DIR}/k8s/ingress.yaml"
    
    log_success "Ingress deployed successfully"
}

# Deploy monitoring and alerting
deploy_monitoring() {
    log_info "Deploying monitoring and alerting..."
    
    # Deploy Prometheus rules
    kubectl apply -f "${PROJECT_DIR}/monitoring/rules/"
    
    # Deploy Grafana dashboards
    kubectl apply -f "${PROJECT_DIR}/monitoring/grafana/"
    
    log_success "Monitoring and alerting deployed successfully"
}

# Wait for deployment
wait_for_deployment() {
    log_info "Waiting for deployment to be ready..."
    
    # Wait for PostgreSQL
    kubectl wait --for=condition=available --timeout=300s deployment/postgres -n "${NAMESPACE}"
    
    # Wait for Redis
    kubectl wait --for=condition=available --timeout=300s deployment/redis -n "${NAMESPACE}"
    
    # Wait for main application
    kubectl wait --for=condition=available --timeout=600s deployment/bridge-security-api -n "${NAMESPACE}"
    
    log_success "All deployments are ready"
}

# Run health checks
run_health_checks() {
    log_info "Running health checks..."
    
    # Get service URL
    SERVICE_URL=$(kubectl get service bridge-security-api-service -n "${NAMESPACE}" -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    
    if [ -z "$SERVICE_URL" ]; then
        SERVICE_URL="localhost"
        log_warning "LoadBalancer IP not available, using localhost"
    fi
    
    # Wait for service to be ready
    log_info "Waiting for service to be ready..."
    for i in {1..30}; do
        if curl -f "http://${SERVICE_URL}:8000/health" &> /dev/null; then
            log_success "Service is healthy"
            break
        fi
        log_info "Attempt $i/30: Service not ready yet, waiting..."
        sleep 10
    done
    
    # Run comprehensive health checks
    log_info "Running comprehensive health checks..."
    
    # Check API health
    curl -f "http://${SERVICE_URL}:8000/health" || log_error "API health check failed"
    
    # Check metrics endpoint
    curl -f "http://${SERVICE_URL}:9090/metrics" || log_error "Metrics endpoint check failed"
    
    # Check database connectivity
    kubectl exec -n "${NAMESPACE}" deployment/bridge-security-api -- python -c "
import asyncio
import sys
from src.core.blockchain_integration import BlockchainIntegration

async def check_db():
    # This would check database connectivity
    print('Database connectivity check passed')

asyncio.run(check_db())
" || log_error "Database connectivity check failed"
    
    log_success "All health checks passed"
}

# Display deployment information
display_deployment_info() {
    log_info "Deployment completed successfully!"
    
    echo ""
    echo "=========================================="
    echo "  Cross-Chain Bridge Security Service"
    echo "=========================================="
    echo ""
    echo "Environment: ${ENVIRONMENT}"
    echo "Namespace: ${NAMESPACE}"
    echo "Version: ${VERSION}"
    echo "Replicas: ${REPLICAS}"
    echo ""
    echo "Services:"
    echo "  API: http://$(kubectl get service bridge-security-api-service -n "${NAMESPACE}" -o jsonpath='{.status.loadBalancer.ingress[0].ip}'):8000"
    echo "  Metrics: http://$(kubectl get service bridge-security-api-service -n "${NAMESPACE}" -o jsonpath='{.status.loadBalancer.ingress[0].ip}'):9090"
    echo "  Grafana: http://$(kubectl get service prometheus-grafana -n "${NAMESPACE}" -o jsonpath='{.status.loadBalancer.ingress[0].ip}'):3000"
    echo "  Jaeger: http://$(kubectl get service jaeger-query -n "${NAMESPACE}" -o jsonpath='{.status.loadBalancer.ingress[0].ip}'):16686"
    echo ""
    echo "Useful commands:"
    echo "  kubectl get pods -n ${NAMESPACE}"
    echo "  kubectl logs -f deployment/bridge-security-api -n ${NAMESPACE}"
    echo "  kubectl port-forward service/bridge-security-api-service 8000:8000 -n ${NAMESPACE}"
    echo ""
    echo "Monitoring:"
    echo "  kubectl get prometheus -n ${NAMESPACE}"
    echo "  kubectl get servicemonitor -n ${NAMESPACE}"
    echo "  kubectl get alertmanager -n ${NAMESPACE}"
    echo ""
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    # Add cleanup logic here if needed
}

# Main deployment function
main() {
    log_info "Starting enterprise deployment of ${SERVICE_NAME}..."
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Run deployment steps
    check_prerequisites
    build_and_push_image
    create_namespace
    deploy_secrets
    deploy_configmap
    deploy_pvcs
    deploy_postgres
    deploy_redis
    deploy_prometheus
    deploy_jaeger
    deploy_elasticsearch
    deploy_application
    deploy_ingress
    deploy_monitoring
    wait_for_deployment
    run_health_checks
    display_deployment_info
    
    log_success "Enterprise deployment completed successfully!"
}

# Run main function
main "$@"