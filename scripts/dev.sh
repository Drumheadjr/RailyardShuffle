#!/bin/bash

# Development script for RailYard Shuffle
# This script provides convenient commands for Docker Compose operations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    echo "RailYard Shuffle Development Script"
    echo ""
    echo "Usage: ./scripts/dev.sh [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  up          Start the development environment"
    echo "  down        Stop the development environment"
    echo "  restart     Restart the development environment"
    echo "  build       Build the Docker images"
    echo "  rebuild     Rebuild images from scratch (no cache)"
    echo "  logs        Show container logs"
    echo "  shell       Open a shell in the container"
    echo "  install     Install npm dependencies"
    echo "  clean       Clean up containers and volumes"
    echo "  status      Show container status"
    echo "  help        Show this help message"
    echo ""
}

# Main script logic
case "${1:-help}" in
    "up")
        print_status "Starting development environment..."
        docker-compose up -d
        print_success "Development environment started! Visit http://localhost:3000"
        ;;
    
    "down")
        print_status "Stopping development environment..."
        docker-compose down
        print_success "Development environment stopped"
        ;;
    
    "restart")
        print_status "Restarting development environment..."
        docker-compose restart
        print_success "Development environment restarted"
        ;;
    
    "build")
        print_status "Building Docker images..."
        docker-compose build
        print_success "Docker images built successfully"
        ;;
    
    "rebuild")
        print_status "Rebuilding Docker images from scratch..."
        docker-compose build --no-cache
        print_success "Docker images rebuilt successfully"
        ;;
    
    "logs")
        print_status "Showing container logs..."
        docker-compose logs -f
        ;;
    
    "shell")
        print_status "Opening shell in container..."
        docker-compose exec railyard-shuffle /bin/bash
        ;;
    
    "install")
        print_status "Installing npm dependencies..."
        docker-compose exec railyard-shuffle npm install
        print_success "Dependencies installed successfully"
        ;;
    
    "clean")
        print_warning "This will remove all containers and volumes. Are you sure? (y/N)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            print_status "Cleaning up containers and volumes..."
            docker-compose down -v --remove-orphans
            docker system prune -f
            print_success "Cleanup completed"
        else
            print_status "Cleanup cancelled"
        fi
        ;;
    
    "status")
        print_status "Container status:"
        docker-compose ps
        ;;
    
    "help"|*)
        show_help
        ;;
esac
