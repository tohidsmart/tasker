#!/bin/bash
set -e
HOST=airtasker.demo
NAMESPACE=airtasker
echo "Starting deployment..."


# Install NGINX Ingress Controller
echo "Installing NGINX Ingress Controller..."
helm upgrade --install ingress-nginx ingress-nginx \
  --repo https://kubernetes.github.io/ingress-nginx \
  --namespace ingress-nginx --create-namespace

# Wait for webhook to be ready
echo "⏳ Waiting for admission webhook to be ready..."
kubectl wait --for=condition=available \
  --timeout=300s deployment/ingress-nginx-controller \
   -n ingress-nginx

# Deploy the application
echo "Deploying airtasker-app..."
helm upgrade --install airtasker-app ./charts/airtasker-app \
    --namespace ${NAMESPACE} --create-namespace

echo "🚀 Deployment completed successfully!"

# Show status and next steps
echo ""
echo "📋 Deployment Status:"
echo "-------------------"

echo "Waiting for ingress IP to be assigned..."

# Check if running on Minikube
if command -v minikube &> /dev/null && minikube status &> /dev/null; then
    echo "📍 Detected Minikube environment"
    
    # Check if tunnel is running
    if ! pgrep -f "minikube tunnel" > /dev/null; then
        echo "⚠️  Minikube tunnel not detected. Starting tunnel..."
        echo "💡 You may need to enter your password for tunnel creation"
        minikube tunnel &
        TUNNEL_PID=$!
        echo "🔗 Tunnel started with PID: $TUNNEL_PID"
        sleep 5
    fi
fi

# Wait for IP assignment
for i in {1..30}; do
    INGRESS_IP=$(kubectl get ingress -n ${NAMESPACE} -o jsonpath='{.items[0].status.loadBalancer.ingress[0].ip}' 2>/dev/null)
    
    if [ -n "$INGRESS_IP" ] && [ "$INGRESS_IP" != "null" ]; then
        echo "✅ Ingress IP assigned: $INGRESS_IP"
        break
    fi
    
    echo "⏳ Attempt $i/30: Waiting for ingress IP..."
    sleep 10
    
    if [ $i -eq 30 ]; then
        echo "❌ Failed to get ingress IP. Using minikube IP as fallback."
        INGRESS_IP=$(minikube ip 2>/dev/null || echo "127.0.0.1")
        echo "🔄 Using fallback IP: $INGRESS_IP"
    fi
done

echo ""
echo "🔗 Access your application at: http://${HOST}"
echo "💡 Add '${HOST}' to your /etc/hosts if testing locally"
echo "💡 OR Run: curl http://airtasker.demo/ --resolve airtasker.demo:80:${INGRESS_IP}"