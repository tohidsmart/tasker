#!/bin/bash
set -e

echo "📋 Current Helm releases:"
helm list --all-namespaces

echo ""
read -p "⚠️  Uninstall all releases? (y/N): " confirm

if [[ $confirm =~ ^[Yy]$ ]]; then
    helm list --all-namespaces | tail -n +2 | awk '{print $1, $2}' | while read -r release namespace; do
        echo "Uninstalling $release from $namespace..."
        helm uninstall "$release" -n "$namespace"
        kubectl delete ns "$namespace"
    done
    echo "✅ Done"
fi