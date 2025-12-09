# Keyboard Navigation Flow Diagram

## Overview
This document outlines the keyboard navigation patterns and accessibility features in GuardiaVault.

## Keyboard Navigation Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    KEYBOARD NAVIGATION FLOW                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 1. PAGE LOAD                                                    │
│    • Tab: Focus lands on "Skip to main content" link            │
│    • Enter: Jump to main content                                │
│    • Tab: Continue to navigation items                          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. NAVIGATION BAR                                               │
│    • Tab: Navigate through nav items (Home, Dashboard, etc.)   │
│    • Enter/Space: Activate focused link                         │
│    • Cmd/Ctrl+K: Open Command Palette                          │
│    • Esc: Close any open dropdowns/menus                        │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. COMMAND PALETTE (Cmd/Ctrl+K)                                │
│    • Auto-focus: Search input field                            │
│    • Type: Filter commands                                      │
│    • Arrow Up/Down: Navigate through results                   │
│    • Enter: Execute selected command                           │
│    • Esc: Close palette                                         │
│    • Tab: Move between groups (if possible)                    │
│    ┌─────────────────────────────────────────────────────────┐ │
│    │ Focus Trap: Focus stays within dialog                    │ │
│    │ • Tab from last item → wraps to first item              │ │
│    │ • Shift+Tab from first → wraps to last                  │ │
│    └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. MODALS/DIALOGS                                               │
│    • Auto-focus: First interactive element (usually input)     │
│    • Tab: Navigate through form fields and buttons             │
│    • Shift+Tab: Navigate backwards                             │
│    • Enter: Submit form or activate button                     │
│    • Space: Activate button                                     │
│    • Esc: Close modal (returns focus to trigger)               │
│    ┌─────────────────────────────────────────────────────────┐ │
│    │ Focus Trap: Focus cannot escape modal                    │ │
│    │ • Tab from last element → wraps to first                  │ │
│    │ • Shift+Tab from first → wraps to last                    │ │
│    │ • Focus returns to trigger when closed                    │ │
│    └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. FORMS                                                        │
│    • Tab: Move between inputs                                   │
│    • Shift+Tab: Move backwards                                  │
│    • Enter: Submit form (if single input or submit button)     │
│    • Space: Toggle checkboxes/radio buttons                    │
│    • Arrow keys: Navigate radio groups/dropdowns                │
│    • Esc: Cancel/close form                                    │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. DATA TABLES/LISTS                                            │
│    • Tab: Move between interactive elements (buttons, links)   │
│    • Arrow Up/Down: Navigate list items (if implemented)       │
│    • Enter/Space: Activate selected item                       │
│    • Home/End: First/last item (if implemented)                │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. BUTTONS & INTERACTIVE ELEMENTS                               │
│    • Tab: Focus on button                                       │
│    • Enter: Activate button                                     │
│    • Space: Activate button                                     │
│    • Focus indicator: Visible outline/ring                     │
└─────────────────────────────────────────────────────────────────┘
```

## Critical Flows

### Flow 1: Login/Signup
```
1. Tab to email input
2. Tab to password input
3. Tab to "Remember me" checkbox (Space to toggle)
4. Tab to "Login" button
5. Enter/Space to submit
```

### Flow 2: Create Vault
```
1. Cmd/Ctrl+K → Command Palette
2. Type "create vault"
3. Arrow Down to select "Create Vault"
4. Enter to execute
5. Tab through form fields:
   - Vault name
   - Check-in interval
   - Grace period
   - Submit button
6. Enter to submit
```

### Flow 3: Add Guardian
```
1. Navigate to Guardians page
2. Tab to "Add Guardian" button
3. Enter/Space to open modal
4. Tab through form:
   - Name input
   - Email input
   - Phone input (optional)
   - Role dropdown (Arrow keys to navigate)
   - "Cancel" button
   - "Add Guardian" button
5. Enter to submit
6. Esc to close without saving
```

### Flow 4: Command Palette
```
1. Cmd/Ctrl+K (or button)
2. Search input auto-focused
3. Type to filter commands
4. Arrow Up/Down to navigate results
5. Enter to execute
6. Esc to close
```

### Flow 5: Settings Page
```
1. Tab through navigation
2. Enter on "Settings"
3. Tab through settings sections:
   - Profile
   - Security
   - Notifications
   - Preferences
4. Tab within each section to edit fields
5. Enter/Space to save changes
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open Command Palette |
| `Esc` | Close modal/dialog/dropdown |
| `Tab` | Next focusable element |
| `Shift + Tab` | Previous focusable element |
| `Enter` | Activate button/link |
| `Space` | Activate button, toggle checkbox |
| `Arrow Up/Down` | Navigate lists/menus (Command Palette) |
| `Home` | First item (if implemented) |
| `End` | Last item (if implemented) |

## Focus Management

### Focus Indicators
- All interactive elements have visible focus indicators
- Default: 2px solid outline with `--color-electric-blue`
- Custom focus rings for buttons and inputs
- Focus visible only on keyboard navigation (not mouse clicks)

### Focus Trapping
- **Modals**: Focus trapped within dialog
- **Command Palette**: Focus trapped within search/list
- **Dropdowns**: Focus returns to trigger when closed
- **Navigation**: Logical tab order maintained

### Skip Links
- "Skip to main content" link at page top
- Visible on keyboard focus
- Jumps past navigation to main content area

## Accessibility Checklist

- [x] All interactive elements keyboard accessible
- [x] Focus indicators visible
- [x] Focus trapping in modals
- [x] Escape closes modals/dropdowns
- [x] Logical tab order
- [x] Skip links implemented
- [x] Keyboard shortcuts documented
- [ ] Arrow key navigation in lists (partial)
- [ ] Home/End key support (partial)

## Testing Procedures

1. **Tab Navigation Test**: Tab through entire page, no broken flows
2. **Modal Test**: Open modal, verify focus trap, test Esc
3. **Command Palette Test**: Open with Cmd+K, navigate with arrows, execute with Enter
4. **Form Test**: Tab through all inputs, test Enter submission
5. **Skip Link Test**: Tab to skip link, verify it works

## Known Issues

1. Some custom components may need arrow key navigation
2. Complex forms may need better focus management
3. Dropdown menus should support arrow key navigation

