#!/bin/bash
echo "🎓 ExamSeat Backend Setup"
echo "========================="

cd "$(dirname "$0")"

# Create virtual environment
if [ ! -d "venv" ]; then
  echo "📦 Creating virtual environment..."
  python3 -m venv venv
fi

# Activate and install
echo "📥 Installing dependencies..."
source venv/bin/activate
pip install -r requirements.txt -q

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Starting Flask server on http://localhost:5000"
echo "   Default login: superadmin / Admin@1234"
echo ""
python app.py
