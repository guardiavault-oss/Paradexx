#!/bin/bash

# Token Migration Runner Script
# Provides easy presets for common migration scenarios

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print banner
print_banner() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                                                    ║${NC}"
    echo -e "${BLUE}║        Paradox Wallet Token Migration Tool        ║${NC}"
    echo -e "${BLUE}║                                                    ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Print help
print_help() {
    echo "Usage: ./run-migration.sh [command]"
    echo ""
    echo "Commands:"
    echo "  preview       - Dry run with verbose output (safe to run)"
    echo "  migrate       - Run full migration with backups"
    echo "  components    - Migrate only /components directory"
    echo "  src           - Migrate only /src directory"
    echo "  custom        - Migrate custom path (will prompt)"
    echo "  report        - View last migration report"
    echo "  help          - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./run-migration.sh preview"
    echo "  ./run-migration.sh migrate"
    echo "  ./run-migration.sh components"
    echo ""
}

# Check if tsx is available
check_dependencies() {
    if ! command -v npx &> /dev/null; then
        echo -e "${RED}Error: npx is not installed${NC}"
        echo "Please install Node.js and npm first"
        exit 1
    fi
}

# Dry run preview
run_preview() {
    echo -e "${YELLOW}Running migration preview (dry run)...${NC}"
    echo "This will show what would be changed without modifying files"
    echo ""
    npx tsx design-system/migrate-tokens.ts --dry-run --verbose
    echo ""
    echo -e "${GREEN}Preview complete!${NC}"
    echo -e "Review the changes above. To apply them, run: ${BLUE}./run-migration.sh migrate${NC}"
}

# Full migration with backup
run_migrate() {
    echo -e "${YELLOW}⚠️  WARNING: This will modify your files!${NC}"
    echo ""
    echo "A backup of each modified file will be created with .backup extension"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo -e "${RED}Migration cancelled${NC}"
        exit 0
    fi
    
    echo ""
    echo -e "${GREEN}Starting migration with backups...${NC}"
    echo ""
    npx tsx design-system/migrate-tokens.ts --backup --verbose
    echo ""
    echo -e "${GREEN}✅ Migration complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review the migration report: ./run-migration.sh report"
    echo "2. Test your application thoroughly"
    echo "3. Check for any visual regressions"
    echo "4. Remove backup files once verified: find . -name '*.backup' -delete"
}

# Migrate components directory only
run_components() {
    echo -e "${YELLOW}Migrating /components directory...${NC}"
    echo ""
    read -p "Create backups? (yes/no): " backup
    
    if [ "$backup" = "yes" ]; then
        npx tsx design-system/migrate-tokens.ts --path=./components --backup --verbose
    else
        npx tsx design-system/migrate-tokens.ts --path=./components --verbose
    fi
    
    echo ""
    echo -e "${GREEN}✅ Components migration complete!${NC}"
}

# Migrate src directory only
run_src() {
    if [ ! -d "./src" ]; then
        echo -e "${RED}Error: /src directory not found${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Migrating /src directory...${NC}"
    echo ""
    read -p "Create backups? (yes/no): " backup
    
    if [ "$backup" = "yes" ]; then
        npx tsx design-system/migrate-tokens.ts --path=./src --backup --verbose
    else
        npx tsx design-system/migrate-tokens.ts --path=./src --verbose
    fi
    
    echo ""
    echo -e "${GREEN}✅ Src migration complete!${NC}"
}

# Migrate custom path
run_custom() {
    echo -e "${YELLOW}Custom path migration${NC}"
    echo ""
    read -p "Enter path to migrate (e.g., ./app): " custom_path
    
    if [ ! -d "$custom_path" ]; then
        echo -e "${RED}Error: Directory not found: $custom_path${NC}"
        exit 1
    fi
    
    read -p "Create backups? (yes/no): " backup
    
    echo ""
    echo -e "${YELLOW}Migrating $custom_path...${NC}"
    echo ""
    
    if [ "$backup" = "yes" ]; then
        npx tsx design-system/migrate-tokens.ts --path="$custom_path" --backup --verbose
    else
        npx tsx design-system/migrate-tokens.ts --path="$custom_path" --verbose
    fi
    
    echo ""
    echo -e "${GREEN}✅ Custom path migration complete!${NC}"
}

# View migration report
view_report() {
    REPORT_FILE="design-system/migration-report.json"
    
    if [ ! -f "$REPORT_FILE" ]; then
        echo -e "${RED}No migration report found${NC}"
        echo "Run a migration first to generate a report"
        exit 1
    fi
    
    echo -e "${BLUE}Migration Report${NC}"
    echo ""
    
    # Check if jq is installed for pretty printing
    if command -v jq &> /dev/null; then
        cat "$REPORT_FILE" | jq '.'
    else
        cat "$REPORT_FILE"
        echo ""
        echo -e "${YELLOW}Tip: Install 'jq' for prettier JSON output${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}Report location: $REPORT_FILE${NC}"
}

# Main script logic
main() {
    print_banner
    check_dependencies
    
    case "$1" in
        preview)
            run_preview
            ;;
        migrate)
            run_migrate
            ;;
        components)
            run_components
            ;;
        src)
            run_src
            ;;
        custom)
            run_custom
            ;;
        report)
            view_report
            ;;
        help|--help|-h|"")
            print_help
            ;;
        *)
            echo -e "${RED}Unknown command: $1${NC}"
            echo ""
            print_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
