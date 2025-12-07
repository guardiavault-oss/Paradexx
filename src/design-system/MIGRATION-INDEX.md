# Token Migration - Complete Index

Central hub for all migration resources and documentation.

---

## 📚 Documentation Files

| File | Description | Use When |
|------|-------------|----------|
| **[MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md)** | Complete migration guide with examples | Learning the migration process in detail |
| **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** | Fast lookup for common patterns | Actively migrating code |
| **[token-mapping.json](./token-mapping.json)** | Complete token mapping data | Need exact token equivalents |
| **[migrate-tokens.ts](./migrate-tokens.ts)** | Automated migration script | Running automated migration |
| **[run-migration.sh](./run-migration.sh)** | Easy-to-use migration runner | Quick migration commands |

---

## 🚀 Quick Start (3 Steps)

### Step 1: Preview Changes
```bash
# See what will change (safe - no modifications)
chmod +x design-system/run-migration.sh
./design-system/run-migration.sh preview
```

### Step 2: Run Migration
```bash
# Migrate with backups
./design-system/run-migration.sh migrate
```

### Step 3: Verify & Clean Up
```bash
# View migration report
./design-system/run-migration.sh report

# Test your application

# Remove backups after verification
find . -name '*.backup' -delete
```

---

## 📖 Learning Path

### For First-Time Migrators

1. **Start Here:** Read [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) (5 min)
   - Get familiar with common patterns
   - Understand the new token structure

2. **Understand the System:** Skim [tokens.ts](./tokens.ts) (10 min)
   - See all available tokens
   - Understand the organization

3. **Preview Migration:** Run dry run (2 min)
   ```bash
   ./design-system/run-migration.sh preview
   ```

4. **Deep Dive:** Read [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) (30 min)
   - Detailed examples
   - Common patterns
   - Troubleshooting

5. **Migrate:** Run the migration (5 min)
   ```bash
   ./design-system/run-migration.sh migrate
   ```

6. **Verify:** Test your application (30+ min)

### For Experienced Developers

1. Bookmark [QUICK-REFERENCE.md](./QUICK-REFERENCE.md)
2. Run `./design-system/run-migration.sh preview`
3. Review changes
4. Run migration if satisfied
5. Fix any edge cases manually using quick reference

---

## 🛠️ Migration Tools

### Automated Migration Script

**Location:** `design-system/migrate-tokens.ts`

**What it does:**
- Scans all `.tsx`, `.ts`, `.css` files
- Replaces old tokens with new equivalents
- Updates imports, styles, and colors
- Generates detailed JSON report
- Optionally creates backup files

**Usage:**
```bash
# Direct usage
npx tsx design-system/migrate-tokens.ts --dry-run --verbose

# Via convenience script
./design-system/run-migration.sh preview
```

**Options:**
- `--dry-run` - Preview without modifying
- `--verbose` - Detailed output
- `--backup` - Create .backup files
- `--path=<dir>` - Target specific directory

### Migration Runner Script

**Location:** `design-system/run-migration.sh`

**Commands:**
```bash
# Preview changes (recommended first step)
./run-migration.sh preview

# Full migration with backups
./run-migration.sh migrate

# Migrate only components
./run-migration.sh components

# Migrate only src directory
./run-migration.sh src

# Migrate custom path
./run-migration.sh custom

# View migration report
./run-migration.sh report

# Show help
./run-migration.sh help
```

---

## 📊 Token Mapping Reference

### Complete Mapping File

**Location:** `design-system/token-mapping.json`

**Contains:**
- TypeScript token mappings
- CSS variable mappings
- CSS class mappings
- Inline style patterns
- Color value conversions
- Gradient patterns
- Component prop changes
- Deprecated patterns to avoid

**Example:**
```json
{
  "typescript": {
    "tokens": {
      "colors.bg.base": "colors.background.primary",
      "colors.degen.primary": "palette.degen.primary"
    }
  },
  "cssVariables": {
    "mapping": {
      "--bg-base": "--bg-primary",
      "--glass-medium": "--bg-glass-medium"
    }
  }
}
```

---

## 🎯 Common Use Cases

### Use Case 1: Migrate Entire Project

```bash
# Preview all changes
./design-system/run-migration.sh preview

# Review output, then migrate
./design-system/run-migration.sh migrate

# Check report
./design-system/run-migration.sh report
```

### Use Case 2: Migrate Incrementally

```bash
# Migrate components first
./design-system/run-migration.sh components

# Test components

# Then migrate pages
npx tsx design-system/migrate-tokens.ts --path=./pages --backup
```

### Use Case 3: Manual Migration

1. Open [QUICK-REFERENCE.md](./QUICK-REFERENCE.md)
2. Keep it beside your code editor
3. Use find-and-replace for common patterns
4. Reference [token-mapping.json](./token-mapping.json) for exact mappings

### Use Case 4: Verify Migration

```bash
# After migration, check the report
cat design-system/migration-report.json | jq '.'

# Or use the script
./design-system/run-migration.sh report
```

---

## 🔍 Token Lookup

Need to find the new equivalent of a token? Check in order:

1. **Quick patterns:** [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) → "🔄 Find & Replace Shortcuts"
2. **Complete mapping:** [token-mapping.json](./token-mapping.json)
3. **Detailed examples:** [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) → "Manual Migration Reference"
4. **Source of truth:** [tokens.ts](./tokens.ts)

---

## 📝 Migration Workflow

### Recommended Workflow

```
1. Backup your code
   └─> git commit -am "Pre-migration checkpoint"

2. Preview migration
   └─> ./design-system/run-migration.sh preview

3. Review changes
   └─> Read through the dry run output
   └─> Check token-mapping.json for any questions

4. Run migration
   └─> ./design-system/run-migration.sh migrate

5. Review migration report
   └─> ./design-system/run-migration.sh report

6. Test application
   └─> Visual testing
   └─> Component testing
   └─> Mode switching (Degen/Regen)

7. Fix edge cases
   └─> Use QUICK-REFERENCE.md for manual fixes

8. Clean up
   └─> Remove backup files after verification
   └─> git commit -am "Migrated to new design system"
```

### Testing Checklist

After migration, verify:

- [ ] All colors match design specs
- [ ] Degen mode colors (red/orange) correct
- [ ] Regen mode colors (blue/green) correct
- [ ] Glassmorphism effects working
- [ ] Borders rendering correctly
- [ ] Shadows and glows working
- [ ] Typography scales properly
- [ ] Gradients displaying correctly
- [ ] Hover/active states functional
- [ ] Mode switching seamless
- [ ] No console errors
- [ ] Responsive behavior intact

---

## 🆘 Troubleshooting

### Issue: Can't run migration script

**Problem:** Permission denied or script not found

**Solution:**
```bash
# Make script executable
chmod +x design-system/run-migration.sh

# Ensure you're in project root
cd /path/to/project
```

---

### Issue: Migration changes wrong files

**Problem:** Migration script is modifying files it shouldn't

**Solution:**
```bash
# Use --path to target specific directory
npx tsx design-system/migrate-tokens.ts --path=./components --dry-run
```

---

### Issue: Need to undo migration

**Problem:** Migration didn't work as expected

**Solution:**
```bash
# If you used --backup flag
find . -name '*.backup' -exec sh -c 'mv "$1" "${1%.backup}"' _ {} \;

# Or restore from git
git checkout -- .

# Or restore specific file
git checkout -- path/to/file.tsx
```

---

### Issue: Can't find token equivalent

**Problem:** Don't know what token to use instead of old one

**Solution:**

1. Check [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) top patterns
2. Search [token-mapping.json](./token-mapping.json)
3. Search [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md)
4. Browse [tokens.ts](./tokens.ts) for semantic equivalent

---

## 📦 Migration Report

After running migration, a detailed report is generated at:
```
design-system/migration-report.json
```

**Report contains:**
- List of all modified files
- Line-by-line changes
- Change types (typescript, css, inline-style, color-value)
- Total change count

**View report:**
```bash
# Pretty print with jq
cat design-system/migration-report.json | jq '.'

# Or use the script
./design-system/run-migration.sh report

# Filter for specific file
cat design-system/migration-report.json | jq '.[] | select(.filePath | contains("Dashboard"))'
```

---

## 🎨 Design System Files

After migration, your design system lives in:

```
design-system/
├── tokens.ts              # All design tokens
├── globals.css            # CSS variables & utilities
├── components/
│   └── GlassCard.tsx      # Reusable components
├── index.ts               # Main export
└── [documentation]        # Guides and references
```

**Main imports:**
```typescript
// Tokens
import { 
  palette, 
  colors, 
  modeColors, 
  typography, 
  spacing, 
  radius, 
  shadows, 
  blur 
} from '@/design-system/tokens';

// Utilities
import { getAccentColor, getGradient, getGlow } from '@/design-system/tokens';

// Components
import { GlassCard } from '@/design-system/components/GlassCard';
```

---

## 📚 Additional Resources

### Documentation
- **Design System Philosophy:** [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)
- **Implementation Summary:** [IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md)
- **Visual Guide:** [VISUAL-GUIDE.md](./VISUAL-GUIDE.md)

### Token Files
- **All Tokens:** [tokens.ts](./tokens.ts)
- **CSS Variables:** [globals.css](./globals.css)
- **Component Exports:** [index.ts](./index.ts)

### Examples
- **GlassCard Component:** [components/GlassCard.tsx](./components/GlassCard.tsx)
- Check existing components for patterns

---

## 🔗 Quick Links

| Link | Purpose |
|------|---------|
| [tokens.ts](./tokens.ts) | All token definitions |
| [globals.css](./globals.css) | CSS variables & utilities |
| [token-mapping.json](./token-mapping.json) | Complete mappings |
| [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) | Detailed guide |
| [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) | Quick lookup |
| [migrate-tokens.ts](./migrate-tokens.ts) | Migration script |
| [run-migration.sh](./run-migration.sh) | Easy runner |

---

## 💡 Pro Tips

1. **Always run `--dry-run` first** - See changes before committing
2. **Use `--backup` flag** - Create safety net for modifications
3. **Migrate incrementally** - Do components, then pages, then utils
4. **Keep QUICK-REFERENCE open** - Saves time during manual fixes
5. **Test mode switching** - Ensure Degen/Regen colors work
6. **Check the report** - Review all changes after migration
7. **Commit often** - Before migration, after migration, after testing

---

## 📞 Support

If you're stuck:

1. Check [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) - Most common patterns
2. Search [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) - Detailed solutions
3. Read [token-mapping.json](./token-mapping.json) - Exact mappings
4. Review migration report - See what actually changed
5. Check [tokens.ts](./tokens.ts) - Source of truth

---

## ✅ Success Criteria

Migration is complete when:

- [ ] All files using old tokens have been migrated
- [ ] No import errors for old token files
- [ ] Visual appearance matches original design
- [ ] Degen mode displays correct colors
- [ ] Regen mode displays correct colors
- [ ] Mode switching works seamlessly
- [ ] No console errors or warnings
- [ ] All tests pass
- [ ] Responsive behavior intact
- [ ] Backup files removed (after verification)

---

**Version:** 1.0.0  
**Last Updated:** December 4, 2024  
**Maintained by:** Paradox Wallet Team
