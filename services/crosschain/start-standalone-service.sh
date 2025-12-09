#!/bin/bash
# Universal Standalone Service Startup Script
# ===========================================
# This script provides a unified way to start any Scorpius service in standalone mode

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")" 2>/dev/null || PROJECT_DIR="$SCRIPT_DIR"
SERVICE_NAME="${SERVICE_NAME:-$(basename "$PROJECT_DIR")}"
VENV_DIR="$PROJECT_DIR/venv"
LOG_DIR="$PROJECT_DIR/logs"
DATA_DIR="$PROJECT_DIR/data"

# Default configuration
DEFAULT_HOST="0.0.0.0"
DEFAULT_PORT="8000"
DEFAULT_REQUIREMENTS="requirements.txt"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_banner() {
    echo -e "${BLUE}"
    echo "🚀 Scorpius Standalone Service Launcher"
    echo "========================================"
    echo -e "${NC}"
    echo "Service: $SERVICE_NAME"
    echo "Directory: $PROJECT_DIR"
    echo ""
}

check_python() {
    log_info "Checking Python installation..."
    
    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 is not installed. Please install Python 3.11 or higher."
        exit 1
    fi
    
    PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
    if [[ $(echo "$PYTHON_VERSION < 3.8" | python3 -c "import sys; print(float(input()) < 3.8)") == "True" ]]; then
        log_warning "Python $PYTHON_VERSION detected. Python 3.11+ is recommended."
    else
        log_success "Python $PYTHON_VERSION detected"
    fi
}

setup_environment() {
    log_info "Setting up service environment..."
    
    # Create necessary directories
    mkdir -p "$LOG_DIR" "$DATA_DIR"
    
    # Copy environment template if needed
    if [ ! -f "$PROJECT_DIR/.env" ] && [ -f "$PROJECT_DIR/.env.example" ]; then
        log_info "Creating .env file from template..."
        cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
        log_warning "Please review and update .env file with your configuration"
    fi
    
    log_success "Environment setup complete"
}

setup_virtual_environment() {
    log_info "Setting up Python virtual environment..."
    
    if [ ! -d "$VENV_DIR" ]; then
        log_info "Creating virtual environment..."
        python3 -m venv "$VENV_DIR"
        log_success "Virtual environment created"
    else
        log_success "Virtual environment already exists"
    fi
    
    # Activate virtual environment
    source "$VENV_DIR/bin/activate"
    log_success "Virtual environment activated"
    
    # Upgrade pip
    pip install --upgrade pip --quiet
}

install_dependencies() {
    log_info "Installing dependencies..."
    
    # Try standalone requirements first, then fall back to regular
    if [ -f "$PROJECT_DIR/requirements-standalone.txt" ]; then
        REQUIREMENTS_FILE="requirements-standalone.txt"
    elif [ -f "$PROJECT_DIR/$DEFAULT_REQUIREMENTS" ]; then
        REQUIREMENTS_FILE="$DEFAULT_REQUIREMENTS"
    else
        log_warning "No requirements file found, skipping dependency installation"
        return
    fi
    
    log_info "Using requirements file: $REQUIREMENTS_FILE"
    
    if pip install -r "$PROJECT_DIR/$REQUIREMENTS_FILE" --quiet; then
        log_success "Dependencies installed successfully"
    else
        log_error "Failed to install dependencies"
        log_info "Trying with --no-deps flag..."
        pip install -r "$PROJECT_DIR/$REQUIREMENTS_FILE" --no-deps --quiet || true
    fi
}

find_main_script() {
    # Look for main entry points in common locations
    local main_scripts=(
        "main.py"
        "app.py" 
        "run.py"
        "src/main.py"
        "src/api/main.py"
        "app/main.py"
        "app/wallet_guard.py"
        "src/reporting_service.py"
    )
    
    for script in "${main_scripts[@]}"; do
        if [ -f "$PROJECT_DIR/$script" ]; then
            echo "$script"
            return 0
        fi
    done
    
    return 1
}

start_service() {
    log_info "Starting $SERVICE_NAME service..."
    
    cd "$PROJECT_DIR"
    
    # Try to find the main script
    MAIN_SCRIPT=$(find_main_script)
    if [ $? -eq 0 ]; then
        log_info "Found main script: $MAIN_SCRIPT"
        
        # Set environment variables
        export HOST=${HOST:-$DEFAULT_HOST}
        export PORT=${PORT:-$DEFAULT_PORT}
        export PYTHONPATH="${PYTHONPATH}:$PROJECT_DIR:$PROJECT_DIR/src"
        
        log_success "Service starting on http://$HOST:$PORT"
        log_info "Health check: http://$HOST:$PORT/health"
        log_info "API docs: http://$HOST:$PORT/docs"
        echo ""
        
        # Start the service
        python "$MAIN_SCRIPT"
    else
        log_error "Could not find main script. Please specify manually."
        log_info "Searched for: main.py, app.py, run.py, src/main.py, src/api/main.py, app/main.py"
        exit 1
    fi
}

health_check() {
    local url="http://${HOST:-$DEFAULT_HOST}:${PORT:-$DEFAULT_PORT}/health"
    log_info "Performing health check on $url..."
    
    for i in {1..10}; do
        if curl -f "$url" &>/dev/null; then
            log_success "Service is healthy!"
            return 0
        fi
        log_info "Waiting for service... (attempt $i/10)"
        sleep 2
    done
    
    log_warning "Health check failed or service not responding"
    return 1
}

show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --help          Show this help message"
    echo "  --check-health  Perform health check only"
    echo "  --install-only  Install dependencies only"
    echo "  --no-venv       Skip virtual environment setup"
    echo "  --host HOST     Override host (default: $DEFAULT_HOST)"
    echo "  --port PORT     Override port (default: $DEFAULT_PORT)"
    echo ""
    echo "Environment variables:"
    echo "  SERVICE_NAME    Override service name"
    echo "  HOST            Override host"
    echo "  PORT            Override port"
    echo ""
}

main() {
    local install_only=false
    local check_health_only=false
    local use_venv=true
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help)
                show_usage
                exit 0
                ;;
            --check-health)
                check_health_only=true
                shift
                ;;
            --install-only)
                install_only=true
                shift
                ;;
            --no-venv)
                use_venv=false
                shift
                ;;
            --host)
                HOST="$2"
                shift 2
                ;;
            --port)
                PORT="$2"
                shift 2
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    print_banner
    
    if [ "$check_health_only" = true ]; then
        health_check
        exit $?
    fi
    
    check_python
    setup_environment
    
    if [ "$use_venv" = true ]; then
        setup_virtual_environment
    fi
    
    install_dependencies
    
    if [ "$install_only" = true ]; then
        log_success "Dependencies installation completed"
        exit 0
    fi
    
    start_service
}

# Handle Ctrl+C gracefully
trap 'log_info "Shutting down..."; exit 0' SIGINT SIGTERM

# Run main function
main "$@"