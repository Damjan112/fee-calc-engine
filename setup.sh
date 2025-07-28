#!/bin/bash

# Fee Calculation Engine - Quick Setup Script
# This script will get you running in under 5 minutes!

set -e  # Exit on any error

echo "🚀 Fee Calculation Engine - Quick Setup"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    echo "   Please upgrade Node.js from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if MySQL is running
if ! command -v mysql &> /dev/null; then
    echo "⚠️  MySQL client not found. Make sure MySQL 8.0+ is installed and running."
    echo "   You can continue if MySQL is running on a different machine."
else
    echo "✅ MySQL client detected"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "📄 Setting up environment..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env file from .env.example"
        echo "⚠️  Please edit .env file with your database credentials before continuing."
        echo ""
        echo "Press Enter when you've configured your .env file..."
        read -r
    else
        echo "⚠️  No .env.example found. Creating basic .env file..."
        cat > .env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=fee_calc
DB_SYNCHRONIZE=true
DB_LOGGING=true

# Application Port
PORT=3000
EOF
        echo "✅ Created basic .env file"
        echo "⚠️  Please edit .env file with your database credentials before continuing."
        echo ""
        echo "Press Enter when you've configured your .env file..."
        read -r
    fi
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🗄️  Setting up database..."

# Try to run migrations
echo "Running database migrations..."
if npm run migration:run; then
    echo "✅ Database migrations completed"
else
    echo "❌ Database migration failed. Please check:"
    echo "   1. MySQL is running"
    echo "   2. Database credentials in .env are correct"
    echo "   3. Database 'fee_calc' exists (or create it manually)"
    exit 1
fi

# Try to seed rules
echo ""
echo "🌱 Seeding initial rules..."
if npm run seed:rules; then
    echo "✅ Initial rules seeded successfully"
else
    echo "⚠️  Rule seeding failed, but you can continue. Rules can be added via API."
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "🚀 To start the service:"
echo "   npm run start:dev"
echo ""
echo "📖 Once running, the service will be available at:"
echo "   http://localhost:3000"
echo ""
echo "📚 Documentation:"
echo "   • README.md - Complete setup and usage guide"
echo "   • API_SAMPLES.md - Ready-to-use API examples"
echo ""
echo "🧪 Quick test (after starting the service):"
echo "   curl -X POST http://localhost:3000/transactions/calculate-fee-pure \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"transaction\":{\"type\":\"POS\",\"amount\":75,\"currency\":\"EUR\"},\"client\":{\"name\":\"Test\",\"creditScore\":300,\"segment\":\"standard\"}}'"
echo ""
echo "Happy calculating! 💰"