#!/bin/bash

# Define log file
LOGFILE="server.log"
PORT=4000

# Function to check if the port is in use and kill the process
kill_process_on_port() {
  local PORT=$1
  local PID=$(sudo lsof -t -i:$PORT)
  if [ ! -z "$PID" ]; then
    echo "Process with PID $PID is using port $PORT. Terminating it..."
    sudo kill -9 $PID
  else
    echo "No process found using port $PORT."
  fi
}

# Kill any process using the specified port
kill_process_on_port $PORT

# Start the Node.js server and redirect both stdout and stderr to the log file
npm start > $LOGFILE 2>&1 &

# Get the process ID of the npm start command
PID=$!

# Print the process ID to the console
echo "Server is running with PID: $PID"
