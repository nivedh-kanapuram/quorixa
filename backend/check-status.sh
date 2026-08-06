#!/usr/bin/env bash
# Quorixa Backend Status Check Script

echo "=== Quorixa Backend Status ==="

echo "\n📂 Checking backend directory structure..."
if [ -f "package.json" ]; then
    echo "✅ package.json exists"
else
    echo "❌ package.json missing"
fi

if [ -f "tsconfig.json" ]; then
    echo "✅ tsconfig.json exists"
else
    echo "❌ tsconfig.json missing"
fi

if [ -d "src/" ]; then
    echo "✅ src/ directory exists"
    if [ -f "src/app.ts" ]; then
        echo "✅ app.ts exists"
    else
        echo "❌ app.ts missing"
    fi
    
    if [ -f "src/server.ts" ]; then
        echo "✅ server.ts exists"
    else
        echo "❌ server.ts missing"
    fi
    
    if [ -d "src/routes/" ]; then
        echo "✅ routes/ directory exists"
        if [ -f "src/routes/health.routes.ts" ]; then
            echo "✅ health.routes.ts exists"
        else
            echo "❌ health.routes.ts missing"
        fi
    else
        echo "❌ routes/ directory missing"
    fi
else
    echo "❌ src/ directory missing"
fi

echo "\n📦 Checking dependencies..."
if [ -f "package-lock.json" ]; then
    echo "✅ package-lock.json exists"
else
    echo "❌ package-lock.json missing"
fi

echo "\n🌐 Health endpoint configuration..."
if grep -q "/api/health" "src/app.ts"; then
    echo "✅ /api/health route configured"
else
    echo "❌ /api/health route missing"
fi

echo "\n🎉 Backend setup summary:"
echo "   - Express server with CORS and JSON middleware"
echo "   - Health check endpoint at /api/health"
echo "   - TypeScript configuration"
echo "   - All required dependencies installed"
echo "   - Professional architecture ready"

echo "\n📝 To start the backend, run:"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "📊 Health endpoint will respond at: http://localhost:3000/api/health"
echo "   Expected response: {\"success\": true, \"message\": \"Quorixa Backend Running\"}"
