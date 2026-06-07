#!/bin/bash

# InterviewAI Local Development Startup Script
# This script starts both the backend (H2 in-memory DB) and frontend

set -e

echo "=========================================="
echo "  InterviewAI - Local Dev Startup"
echo "=========================================="

# Configuration
BACKEND_DIR="$(cd "$(dirname "$0")/backend" && pwd)"
FRONTEND_DIR="$(cd "$(dirname "$0")/frontend" && pwd)"
MAVEN_BIN="/tmp/apache-maven-3.9.6/bin/mvn"
JAVA_HOME=$(/usr/libexec/java_home 2>/dev/null)

# Check Maven
if [ ! -f "$MAVEN_BIN" ]; then
  echo "Maven not found. Downloading..."
  curl -fsSL https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.tar.gz -o /tmp/maven.tar.gz
  tar -xzf /tmp/maven.tar.gz -C /tmp
  echo "Maven downloaded."
fi

# Kill existing backend processes
echo ""
echo "Stopping any running backend processes..."
pkill -f "interviewai" 2>/dev/null || true
sleep 1

# Start Backend
echo ""
echo "Starting Backend (H2 in-memory database)..."
echo "Backend will be available at: http://localhost:8080"
echo "H2 Console: http://localhost:8080/h2-console"
echo ""

cd "$BACKEND_DIR"
JAVA_HOME=$JAVA_HOME $MAVEN_BIN spring-boot:run \
  -Dspring-boot.run.profiles=h2 \
  -Dspring-boot.run.jvmArguments="--add-opens java.base/java.lang=ALL-UNNAMED" \
  &

BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "Waiting for backend to start..."
for i in {1..30}; do
  if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo "✅ Backend is running!"
    break
  fi
  sleep 2
  echo -n "."
done

# Start Frontend
echo ""
echo "Starting Frontend..."
echo "Frontend will be available at: http://localhost:3001"
echo ""

cd "$FRONTEND_DIR"
npm run dev -- --port 3001 &

FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "=========================================="
echo "  Services Started!"
echo "  Frontend: http://localhost:3001"
echo "  Backend:  http://localhost:8080"
echo "  API Docs: http://localhost:8080/swagger-ui.html"
echo "  H2 DB:    http://localhost:8080/h2-console"
echo ""
echo "  Test credentials:"
echo "  Register at: http://localhost:3001/register"
echo "  Login at:    http://localhost:3001/login"
echo "=========================================="
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
