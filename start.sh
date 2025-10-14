#!/bin/bash

# Da Nang Marine Creature Map - Master Start Script
# Starts both backend and frontend in separate terminal tabs/windows

echo "🐠 Da Nang Marine Creature Map - Starting Application..."
echo ""

# Detect OS and terminal
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "📱 Detected macOS - Opening in separate Terminal tabs..."

    # Start backend in new tab
    osascript -e 'tell application "Terminal"
        do script "cd \"'"$(pwd)"'/backend\" && ./start.sh"
    end tell'

    # Wait a moment for backend to initialize
    sleep 2

    # Start frontend in new tab
    osascript -e 'tell application "Terminal"
        do script "cd \"'"$(pwd)"'/frontend\" && ./start.sh"
        activate
    end tell'

    echo "✅ Backend starting at http://localhost:8000"
    echo "✅ Frontend starting at http://localhost:5173"
    echo ""
    echo "Check the new Terminal tabs for server output"

elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "🐧 Detected Linux - Starting servers..."

    # Try to detect terminal emulator
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal --tab -- bash -c "cd backend && ./start.sh; exec bash"
        sleep 2
        gnome-terminal --tab -- bash -c "cd frontend && ./start.sh; exec bash"
    elif command -v konsole &> /dev/null; then
        konsole --new-tab -e bash -c "cd backend && ./start.sh; exec bash" &
        sleep 2
        konsole --new-tab -e bash -c "cd frontend && ./start.sh; exec bash" &
    elif command -v xterm &> /dev/null; then
        xterm -e "cd backend && ./start.sh; exec bash" &
        sleep 2
        xterm -e "cd frontend && ./start.sh; exec bash" &
    else
        echo "⚠️  Could not detect terminal emulator"
        echo "Please run these commands manually in separate terminals:"
        echo ""
        echo "Terminal 1: cd backend && ./start.sh"
        echo "Terminal 2: cd frontend && ./start.sh"
        exit 1
    fi

    echo "✅ Backend starting at http://localhost:8000"
    echo "✅ Frontend starting at http://localhost:5173"

else
    echo "⚠️  Windows detected - Please run these commands manually:"
    echo ""
    echo "Terminal 1: cd backend && bash start.sh"
    echo "Terminal 2: cd frontend && bash start.sh"
    exit 1
fi

echo ""
echo "🎉 Application is starting! Wait a few seconds for servers to be ready."
