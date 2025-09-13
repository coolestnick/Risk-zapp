#!/bin/bash
# Start RiskZap Frontend

echo "🚀 Starting RiskZap Frontend..."
echo "================================"

# Navigate to the project directory
cd /Users/nickkz/Downloads/Riskzap-main

# Check if node_modules exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "✅ Starting development server..."
echo "   Frontend will be available at: http://localhost:8081"
echo ""
echo "📋 Services:"
echo "   • Frontend: http://localhost:8081"
echo "   • Blockchain: Shardeum Testnet (via MetaMask)"
echo "   • Database: Supabase Cloud"
echo ""
echo "🔧 To stop the server, press Ctrl+C"
echo "================================"

# Start the development server
npm run dev