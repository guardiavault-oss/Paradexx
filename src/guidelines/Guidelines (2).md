# Paradox Wallet - Figma Design System Guidelines

## Core Design Philosophy

* **Dual Identity System**: Every component must support both Degen and Regen modes with distinct visual personalities
* **Premium Crypto Aesthetic**: Apple-level polish meets Web3 sophistication - no generic crypto UI
* **Production Ready**: Enterprise-grade designs only. No MVP or prototype-quality work
* **Glassmorphism First**: Heavy use of blur effects, transparency, and layered depth
* **Trust Through Design**: Security features should feel premium and reassuring, never alarming

---

## Color System

### Degen Mode
* **Primary**: Electric/neon purples and magentas (#8B5CF6, #A855F7, #C026D3)
* **Accent**: High-energy greens for gains (#10B981, #34D399)
* **Accent Secondary**: Warning reds for losses (#EF4444, #F87171)
* **Background**: Deep dark purples/blacks with subtle gradients (#0A0118, #1A0B2E)
* **Glass Effects**: 20-40% opacity whites with heavy blur (20-40px)

### Regen Mode
* **Primary**: Natural greens and earth tones (#059669, #10B981, #047857)
* **Accent**: Warm golds for highlights (#F59E0B, #FBBF24)
* **Accent Secondary**: Calming blues (#3B82F6, #60A5FA)
* **Background**: Soft gradients from cream to sage (#FAFAF9, #F0FDF4, #ECFDF5)
* **Glass Effects**: 10-25% opacity with softer blurs (12-24px)

### Universal
* **Text Primary**: White (#FFFFFF) for Degen, Dark gray (#1F2937) for Regen
* **Text Secondary**: 70% opacity of primary text color
* **Success**: Green (#10B981)
* **Warning**: Amber (#F59E0B)
* **Error**: Red (#EF4444)
* **Info**: Blue (#3B82F6)

---

## Typography

### Font Stack
* **Primary**: SF Pro Display / Inter (headings, UI)
* **Mono**: JetBrains Mono / SF Mono (addresses, transaction hashes, amounts)
* **Numbers**: Tabular figures always enabled for financial data

### Scale
* **Hero**: 48px / 600 weight (landing page headers)
* **H1**: 32px / 600 weight (page titles)
* **H2**: 24px / 600 weight (section headers)
* **H3**: 20px / 600 weight (card headers)
* **Body Large**: 16px / 400 weight (primary content)
* **Body**: 14px / 400 weight (default text)
* **Body Small**: 12px / 400 weight (labels, captions)
* **Micro**: 10px / 500 weight (badges, tags)

### Financial Data
* **Token Amounts**: Mono font, 16-20px, tabular figures
* **USD Values**: Regular font, 14px, 50% opacity secondary color
* **Percentage Changes**: 14px, bold (600), color-coded (green/red)
* **Wallet Addresses**: Mono font, 12px, truncated with copy button

---

## Layout & Spacing

### Grid System
* **Desktop**: 12-column grid, 24px gutters, 80px margins
* **Tablet**: 8-column grid, 20px gutters, 40px margins
* **Mobile**: 4-column grid, 16px gutters, 20px margins

### Spacing Scale (8pt system)
* **4px**: Micro spacing (icon padding, tight elements)
* **8px**: Compact spacing (related items)
* **16px**: Standard spacing (most UI elements)
* **24px**: Section spacing (cards, groups)
* **32px**: Large spacing (major sections)
* **48px**: Extra large (page sections)
* **64px**: Hero spacing (landing sections)

### Component Sizing
* **Buttons**: 48px height (primary), 40px (secondary), 32px (small)
* **Input Fields**: 48px height minimum for touch targets
* **Cards**: 16px padding minimum, 24px recommended
* **Bottom Navigation**: 72px height on mobile
* **Top Navigation**: 64px height

---

## Glassmorphism Effects

### Degen Mode Glass
* **Background**: Linear gradient with opacity 15-25%
* **Blur**: 40px backdrop blur
* **Border**: 1px solid white at 20% opacity
* **Shadow**: Multiple layers - soft glow + sharp edge
  - `0 8px 32px rgba(139, 92, 246, 0.4)`
  - `0 0 0 1px rgba(255, 255, 255, 0.1) inset`

### Regen Mode Glass
* **Background**: Linear gradient with opacity 8-15%
* **Blur**: 24px backdrop blur
* **Border**: 1px solid white at 30% opacity
* **Shadow**: Soft, natural elevation
  - `0 4px 24px rgba(0, 0, 0, 0.08)`
  - `0 0 0 1px rgba(255, 255, 255, 0.2) inset`

### Glass Card Hierarchy
* **Level 1** (Background cards): 15% opacity, 20px blur
* **Level 2** (Interactive cards): 20% opacity, 30px blur
* **Level 3** (Modals, dropdowns): 25% opacity, 40px blur

---

## Component Library

### Buttons

#### Primary Button
* **Degen**: Gradient background (purple to magenta), white text, glass border
* **Regen**: Solid green background, white text, subtle shadow
* **Height**: 48px
* **Padding**: 24px horizontal
* **Border Radius**: 16px (Degen), 12px (Regen)
* **Hover State**: 10% brightness increase + scale(1.02)
* **Active State**: 10% brightness decrease + scale(0.98)
* **Disabled**: 40% opacity, no interaction

#### Secondary Button
* **Style**: Glass effect with colored border
* **Degen**: Purple border (2px), transparent background
* **Regen**: Green border (2px), white background at 50% opacity
* **Same sizing as Primary**

#### Ghost Button
* **Style**: Text only with hover glass effect
* **Use**: Tertiary actions, cancel operations
* **Height**: 40px

#### Icon Button
* **Size**: 40px × 40px (standard), 32px × 32px (compact)
* **Style**: Glass circle with icon
* **Use**: Single action buttons, nav items

### Input Fields

#### Text Input
* **Height**: 48px
* **Background**: Glass effect (lighter than cards)
* **Border**: 1px solid, 30% white opacity (Degen), 40% gray (Regen)
* **Focus State**: Border changes to primary color, glow effect
* **Padding**: 16px horizontal
* **Border Radius**: 12px
* **Label**: Floating label pattern, 12px above input when focused

#### Token Amount Input
* **Font**: Mono, large size (24px)
* **Alignment**: Right-aligned numbers
* **USD Value**: Below in 14px, secondary color
* **Max Button**: Integrated on right side

#### Search Input
* **Icon**: Magnifying glass left-aligned
* **Clear Button**: X icon appears on input
* **Suggestions**: Dropdown glass panel below

### Cards

#### Token Card (List Item)
* **Layout**: Icon left, symbol/name, amount right, USD value below
* **Height**: 72px
* **Background**: Glass effect
* **Hover**: Lift effect (4px translate up, enhanced shadow)
* **Border Radius**: 16px
* **Padding**: 16px

#### Portfolio Card
* **Size**: Full width, dynamic height
* **Background**: Gradient glass
* **Content**: Total balance (large), 24h change, chart preview
* **Border Radius**: 20px
* **Padding**: 24px

#### Transaction Card
* **Layout**: Icon + type left, amount + status right
* **Status Badges**: Pill shape, 6px height colored bar
* **Timestamp**: 12px, secondary color
* **Border Radius**: 12px

#### NFT Card
* **Aspect Ratio**: 1:1 or 4:5
* **Image**: Rounded corners, glass overlay on hover
* **Info**: Collection name, floor price
* **Border Radius**: 16px

### Navigation

#### Bottom Tab Bar (Mobile)
* **Height**: 72px
* **Background**: Heavy glass blur
* **Items**: 4 max - Wallet, Swap, Inheritance, Settings
* **Active State**: Primary color icon + label
* **Inactive**: 60% opacity
* **Border**: Top border 1px at 20% opacity

#### Top Navigation
* **Height**: 64px
* **Background**: Glass or transparent
* **Logo**: Left-aligned, 32px height
* **Mode Toggle**: Degen/Regen switch on right
* **Network Selector**: Dropdown with chain icons

#### Sidebar (Desktop)
* **Width**: 240px collapsed, 280px expanded
* **Background**: Glass panel
* **Sections**: Wallet, DeFi, Security, Settings
* **Hover**: Glass highlight effect

### Modals & Overlays

#### Modal Dialog
* **Background Overlay**: 60% black opacity
* **Modal Background**: Heavy glass blur (40px)
* **Max Width**: 480px (mobile-first)
* **Border Radius**: 24px
* **Padding**: 32px
* **Header**: Close button top-right
* **Actions**: Primary + Secondary buttons at bottom

#### Bottom Sheet (Mobile)
* **Background**: Glass with handle on top
* **Border Radius**: 24px top corners only
* **Handle**: 4px × 40px rounded bar
* **Swipe Dismiss**: Gesture enabled

#### Dropdown Menu
* **Background**: Glass panel
* **Items**: 40px height, 12px horizontal padding
* **Hover**: Background highlight
* **Border Radius**: 12px
* **Shadow**: Elevated (16px blur)

### Badges & Tags

#### Status Badge
* **Height**: 24px
* **Padding**: 8px horizontal
* **Border Radius**: 12px (pill shape)
* **Font**: 11px, 600 weight, uppercase
* **Colors**: Success (green), Warning (amber), Error (red), Info (blue)

#### Chain Badge
* **Size**: 20px × 20px icon + label
* **Style**: Chain color + logo
* **Use**: Network indicators

#### Percentage Badge
* **Style**: + or - prefix, color-coded
* **Green**: Positive changes
* **Red**: Negative changes
* **Font**: 12px, 600 weight

### Data Visualization

#### Charts
* **Line Charts**: Smooth curves, gradient fill below line
* **Colors**: Primary color for lines, 20% opacity fill
* **Grid**: Subtle (10% opacity), horizontal only
* **Tooltip**: Glass panel on hover with exact values
* **Height**: 200px (card), 400px (full view)

#### Progress Indicators
* **Circular**: Glassmorphic ring, gradient stroke
* **Linear**: Rounded bar, gradient fill, glass track
* **Percentage**: Centered in circular, right-aligned in linear

#### Portfolio Allocation Pie
* **Colors**: Use primary palette with distinct hues
* **Legend**: Right side, with percentages
* **Interactive**: Hover to highlight segment

---

## Iconography

### Style
* **Stroke Weight**: 2px (Degen), 1.5px (Regen)
* **Size**: 24px standard, 20px small, 32px large
* **Style**: Rounded corners, consistent stroke
* **Source**: Lucide, Phosphor, or custom

### Common Icons
* **Wallet**: Minimalist wallet outline
* **Swap**: Rotating arrows or exchange symbol
* **Send**: Arrow up-right
* **Receive**: Arrow down-left
* **Inheritance**: Shield with heart or vault
* **Settings**: Gear icon
* **Copy**: Overlapping squares
* **External Link**: Arrow out of box
* **Success**: Checkmark circle
* **Error**: X circle
* **Warning**: Alert triangle

---

## Animation Principles

### Timing
* **Fast**: 150ms (micro-interactions, hovers)
* **Standard**: 250ms (UI transitions)
* **Slow**: 400ms (page transitions, modals)
* **Easing**: Cubic bezier (0.4, 0, 0.2, 1) - smooth deceleration

### Transitions
* **Button Hover**: Scale 1.02, brightness increase, 150ms
* **Card Hover**: Translate Y -4px, shadow enhance, 250ms
* **Modal Enter**: Fade in + scale from 0.95, 300ms
* **Page Transition**: Slide + fade, 400ms
* **Loading States**: Skeleton shimmer or pulse animation

### GSAP/Framer Motion Ready
* Design with animation in mind
* Mark interactive elements clearly
* Document animation sequences in component notes

---

## Security & Trust Visual Language

### Inheritance Features
* **Color Theme**: Gold accents on glass
* **Icons**: Shield, vault, family symbols
* **Style**: Premium, reassuring, not alarming
* **Copy**: Warm, protective language

### Security Indicators
* **Verified**: Green checkmark badge
* **Warning**: Amber with triangle icon
* **Critical**: Red with clear action required
* **Secure Connection**: Lock icon with green indicator

### Transaction Confirmation
* **Layout**: Large, clear summary of action
* **From/To**: Clearly separated with arrows
* **Amounts**: Large, bold, impossible to miss
* **Fees**: Transparent, prominently displayed
* **Approve Button**: Requires clear interaction

---

## Responsive Behavior

### Desktop (1920px+)
* **Sidebar**: Always visible, expanded
* **Cards**: Multi-column grid (2-3 columns)
* **Modals**: Centered, max-width 600px
* **Hover States**: Full interaction

### Tablet (1024px - 1919px)
* **Sidebar**: Collapsible to icons only
* **Cards**: 2-column grid
* **Touch Targets**: 44px minimum

### Mobile (375px - 1023px)
* **Navigation**: Bottom tab bar
* **Cards**: Single column, full width
* **Modals**: Bottom sheets preferred
* **Spacing**: Reduced margins (16px)
* **Font Sizes**: Slightly larger for readability

---

## Accessibility

### Color Contrast
* **Text**: Minimum 4.5:1 ratio against backgrounds
* **Interactive**: Minimum 3:1 ratio for interactive elements
* **Glass Effects**: Ensure sufficient contrast despite transparency

### Touch Targets
* **Minimum Size**: 44px × 44px (iOS), 48px × 48px (Android)
* **Spacing**: 8px minimum between interactive elements

### States
* **Focus**: Clear outline or glow (3px, primary color)
* **Disabled**: 40% opacity, cursor not-allowed
* **Loading**: Skeleton or spinner with ARIA labels

---

## Design System Management

### Component Organization
* **Atomic Structure**: Atoms → Molecules → Organisms → Templates
* **Variants**: Use Figma variants for mode switching (Degen/Regen)
* **Auto-Layout**: All components must use auto-layout
* **Constraints**: Proper constraints for responsive behavior

### Naming Conventions
* **Components**: PascalCase (e.g., `TokenCard`, `SwapButton`)
* **Variants**: Property=Value (e.g., `Mode=Degen`, `State=Hover`)
* **Layers**: Descriptive names (e.g., `Background/Glass`, `Text/Primary`)
* **Colors**: Semantic names (e.g., `Degen/Primary`, `Regen/Accent`)

### Variables & Tokens
* **Colors**: Use Figma variables for all colors
* **Spacing**: 8pt scale as variables
* **Typography**: Text styles for all text
* **Effects**: Reusable blur/shadow styles

### Documentation
* **Component Notes**: Include usage guidelines, do's and don'ts
* **Changelog**: Track major design system updates
* **Examples**: Show component in context, all states
* **Developer Handoff**: Include exact values, animation specs

---

## Degen vs Regen Mode Switching

### Toggle Design
* **Position**: Top right corner
* **Style**: Pill toggle with labels
* **Animation**: Smooth slide, 300ms
* **Haptic**: Subtle feedback on mobile

### Transition Between Modes
* **Duration**: 500-800ms
* **Effect**: Crossfade colors + blur intensity shift
* **Preserve State**: Don't reset user's position/scroll

### Mode-Specific Elements
* **Degen Only**: Meme token support, high-risk warnings, ape mode features
* **Regen Only**: Carbon footprint, donation features, ESG indicators
* **Shared**: All core wallet functions

---

## Launch & Marketing Assets

### Landing Page
* **Hero**: Full-screen with animated background (particles/gradients)
* **Mode Preview**: Side-by-side comparison
* **Features**: Glass cards in grid layout
* **CTA**: Large, prominent download/connect buttons

### App Store Assets
* **Screenshots**: Show both modes clearly
* **Icon**: Dual-identity visible even at 1024px
* **Banner**: Premium, distinctive, not generic crypto

---

## Critical Don'ts

* ❌ Never use generic crypto gradients (blue to purple)
* ❌ No comic sans or unprofessional fonts
* ❌ No cluttered interfaces - whitespace is premium
* ❌ No MVP-quality components - everything production-ready
* ❌ No hard edges on Degen mode - always glass/blur
* ❌ No harsh shadows on Regen mode - soft and natural
* ❌ No untruncated wallet addresses without copy button
* ❌ No hidden fees or unclear transaction costs
* ❌ No alarming security messaging - reassuring only
* ❌ No auto-play videos or annoying animations

---

## Development Handoff Notes

* Export all assets at 1x, 2x, 3x for mobile
* Provide exact RGBA values for glass effects
* Include animation timing curves and sequences
* Specify exact blur pixel values (not just "blur")
* Document hover, active, focus, disabled states
* Include exact shadow values for each layer
* Provide breakpoint specifications
* Note any custom fonts required