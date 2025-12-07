# GuardiaVault Design Guidelines

## Design Approach

**Reference-Based Approach**: Apple minimalism meets Chainlink cryptographic trust, inspired by high-security vault interfaces. Drawing from:
- **Apple**: Clean typography, generous whitespace, intuitive flows
- **Chainlink/Crypto platforms**: Technical precision, data visualization, trust indicators
- **Vault/Security UIs**: Dark themes, glowing accents, status indicators, control center aesthetics

**Core Principles**:
1. Extreme clarity - users must understand security implications instantly
2. Trust through visual hierarchy and precise information architecture
3. Minimal cognitive load - one primary action per screen
4. Futuristic elegance without overwhelming users

## Visual Theme

**Vault Control Center Aesthetic**:
- Sophisticated dark interface with depth and layering
- Glowing accent elements for active/critical status
- Clean geometric shapes suggesting security and precision
- Subtle gradients and shadows for depth without distraction
- High contrast for readability and focus

## Typography System

**Font Families**:
- **Primary**: Inter (all weights) - exceptional readability, modern tech aesthetic
- **Display/Headers**: Space Grotesk - distinctive, technical feel for hero sections and major headings
- **Monospace**: JetBrains Mono - for wallet addresses, fragment IDs, technical data

**Type Scale**:
- Hero Display: 72px/bold - landing page hero
- H1: 48px/semibold - page titles, major sections
- H2: 36px/semibold - section headers, dashboard panels
- H3: 24px/medium - card titles, subsection headers
- Body Large: 18px/regular - primary content, important descriptions
- Body: 16px/regular - standard text, form labels
- Body Small: 14px/regular - secondary info, metadata
- Caption: 12px/medium - timestamps, status labels, helper text

## Layout System

**Spacing Primitives**: Use Tailwind units of 1, 2, 4, 6, 8, 12, 16, 24 for consistent rhythm

**Grid Structure**:
- Desktop: 12-column grid with max-width of 1400px
- Tablet: 8-column grid with max-width of 1024px
- Mobile: 4-column grid with full-width containers

**Page Layouts**:
- **Landing Page**: Full-width hero (85vh), asymmetric feature sections with mixed column counts, trust indicators footer
- **Dashboard**: Persistent left sidebar (280px), main content area with card grid, right panel for activity feed (320px on XL screens)
- **Wizard Flows**: Centered single-column (max-width 640px), progress indicator top, actions bottom

## Component Library

### Navigation

**Top Navigation Bar**:
- Fixed position, translucent backdrop with blur
- Logo left, wallet connection status right
- Subtle border bottom with glow effect when scrolled
- Height: 72px desktop, 64px mobile

**Sidebar Navigation** (Dashboard):
- 280px width, full-height fixed
- Grouped menu items with icons
- Active state: Subtle glow accent on left border
- Collapsed state on tablet: 80px icon-only

### Hero Section (Landing)

**Layout**: Asymmetric split - 60% left content, 40% right visual
- Large display headline with gradient text effect
- Subtitle (Body Large) with maximum 2 lines
- Primary CTA button with secondary link below
- Animated "lifeline" visualization showing system pulse
- Background: Subtle grid pattern with radial gradient overlay
- Include hero image: Abstract 3D vault visualization with glowing energy streams

### The Lifeline Visual

**Primary Interactive Element** - appears throughout dashboard:
- Circular progress ring showing days until next check-in
- Glowing effect intensifies as deadline approaches
- Center displays countdown (large numerals)
- Outer ring segments for completed check-ins history
- Size: 280px diameter on desktop, 200px mobile
- Pulsing animation when action required

### Dashboard Cards

**Vault Status Cards**:
- Grid layout: 3 columns desktop, 2 tablet, 1 mobile
- Padding: 24px all sides
- Rounded corners: 16px
- Subtle border with glow accent on hover
- Icon top-left (32px), metric large center, label below
- Include status badge (Active/Warning/Critical)

**Guardian/Beneficiary Cards**:
- List layout with avatar, name, role, status
- Padding: 16px vertical, 20px horizontal
- Hover state: Subtle lift with increased glow
- Action buttons right-aligned (icon buttons)
- Status indicator: Colored dot with label

### Wizard Components

**Step Progress Indicator**:
- Horizontal stepper top of page
- Numbers in circles, connecting lines
- Active step: Glowing accent, others muted
- Completed: Checkmark icon
- Spacing: 24px between steps

**Form Fields**:
- Label above input (14px/medium)
- Input height: 48px
- Rounded corners: 8px
- Focus state: Glowing border accent
- Helper text below (12px)
- Error state: Red glow with message

**File Upload/Fragment Display**:
- Dashed border container
- Icon centered with instruction text
- Uploaded: Solid border with file preview
- Size: Minimum 200px height

### Buttons

**Primary CTA**:
- Height: 56px desktop, 48px mobile
- Padding: 24px horizontal
- Rounded: 12px
- Bold text (16px/semibold)
- Glowing effect on hover
- Disabled: Reduced opacity, no glow

**Secondary Button**:
- Same dimensions, outline style
- Subtle border, no fill
- Hover: Border glow

**Icon Buttons**:
- 40px square
- Rounded: 8px
- Icon 20px
- Hover: Background fill with glow

### Modals & Overlays

**Modal Container**:
- Max-width: 560px
- Padding: 32px
- Rounded: 20px
- Backdrop: Dark overlay with blur
- Header with close button top-right
- Footer with aligned action buttons

**Toast Notifications**:
- Fixed bottom-right
- Width: 400px max
- Padding: 16px
- Rounded: 12px
- Icon left, message center, close right
- Auto-dismiss after 5 seconds
- Success/Warning/Error variants with appropriate glows

### Data Display

**Tables**:
- Header row: Sticky, subtle background
- Row height: 64px
- Alternating row subtle background
- Hover: Glow effect
- Sortable columns with icon indicators

**Status Badges**:
- Inline pill shape
- Padding: 4px 12px
- Rounded: 20px (full pill)
- Text: 12px/semibold uppercase
- Variants: Active (green glow), Pending (yellow), Inactive (gray), Critical (red glow)

## Images

### Hero Image
- **Location**: Landing page hero section, right side (40% width)
- **Description**: 3D rendered vault door slightly ajar with glowing blue/cyan energy streams flowing outward, representing secure data transfer. Ethereal light particles floating in space. Futuristic, high-tech aesthetic with metallic surfaces and glass-like transparency effects.
- **Style**: Abstract, modern CGI render with depth of field

### Feature Section Images
- **Guardian Visualization**: Network diagram showing encrypted fragment distribution with glowing nodes
- **Time-Lock Illustration**: Hourglass-meets-blockchain visual with countdown elements
- **Security Shield**: Layered shield graphic with cryptographic symbols

### Trust Section
- **Partner Logos**: Grayscale logos of security auditors, legal partners (placeholder boxes with subtle borders)
- **Team Photos**: Not included in MVP - use initials in circles with gradient backgrounds

## Responsive Behavior

**Breakpoints**:
- Mobile: < 768px (single column, stacked layouts)
- Tablet: 768px - 1024px (2 column grids, condensed sidebar)
- Desktop: 1024px - 1440px (full layouts)
- XL: > 1440px (max-width constraints, optional right panels)

**Mobile Adaptations**:
- Navigation becomes bottom tab bar
- Sidebar converts to slide-out drawer
- Card grids stack to single column
- Lifeline visual scales to 200px
- Hero becomes full-width single column

## Accessibility

- Minimum touch target: 44px x 44px
- Focus indicators: Glowing outline on all interactive elements
- Aria labels on all icon-only buttons
- Keyboard navigation: Tab order follows visual hierarchy
- High contrast mode support: Increased border weights and reduced transparency