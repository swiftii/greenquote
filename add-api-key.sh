#!/bin/bash

# Simple script to add Google Maps API key to config files
# Usage: ./add-api-key.sh YOUR_API_KEY

API_KEY="$1"

if [ -z "$API_KEY" ]; then
    echo "❌ Error: No API key provided"
    echo ""
    echo "Usage: ./add-api-key.sh YOUR_API_KEY"
    echo ""
    echo "Example:"
    echo "  ./add-api-key.sh AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
    echo ""
    exit 1
fi

if [[ ! $API_KEY == AIza* ]]; then
    echo "⚠️  Warning: API key doesn't start with 'AIza'"
    echo "Google Maps API keys typically start with 'AIza'"
    echo ""
    read -p "Continue anyway? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 1
    fi
fi

echo "🔧 Adding API key to config files..."
echo ""

# Backup existing configs
if [ -f "configs/default.json" ]; then
    cp configs/default.json configs/default.json.backup
    echo "✓ Backed up configs/default.json"
fi

if [ -f "configs/example-lawn.json" ]; then
    cp configs/example-lawn.json configs/example-lawn.json.backup
    echo "✓ Backed up configs/example-lawn.json"
fi

# Update default.json
if [ -f "configs/default.json" ]; then
    sed -i.tmp "s|\"googleMapsApiKey\": \".*\"|\"googleMapsApiKey\": \"$API_KEY\"|g" configs/default.json
    rm -f configs/default.json.tmp
    echo "✓ Updated configs/default.json"
fi

# Update example-lawn.json
if [ -f "configs/example-lawn.json" ]; then
    sed -i.tmp "s|\"googleMapsApiKey\": \".*\"|\"googleMapsApiKey\": \"$API_KEY\"|g" configs/example-lawn.json
    rm -f configs/example-lawn.json.tmp
    echo "✓ Updated configs/example-lawn.json"
fi

echo ""
echo "✅ Success! Your Google Maps API key has been added."
echo ""
echo "Next steps:"
echo "  1. Test your widget locally"
echo "  2. Enter a real address in Step 2"
echo "  3. You should see the satellite view!"
echo ""
echo "To restore backups (if needed):"
echo "  mv configs/default.json.backup configs/default.json"
echo "  mv configs/example-lawn.json.backup configs/example-lawn.json"
echo ""
