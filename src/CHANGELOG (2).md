# Changelog

All notable changes to the Paradex project will be documented in this file.

## [Unreleased]

### Added
- Comprehensive documentation in `/docs` folder
- Component reference guide
- Architecture documentation
- Development workflow guide

### Changed
- Organized project structure
- Moved documentation to `/docs` folder
- Updated README with better organization

### Removed
- 36+ old markdown files from root directory
- Unused background shader components
- Duplicate import files

---

## [0.2.0] - 2024-12-05

### Added
- 3D tunnel landing page with GSAP animations
- Centered first/last card positioning in tunnel
- Water drop ripple effect on splash screen
- Wider logo on splash screen (w-72 mobile, w-96 desktop)

### Changed
- Tunnel position moved to middle-upper area (y-offset 0.15)
- Removed spinning ring from splash screen
- Standardized all degen colors to crimson red (#DC143C)

### Fixed
- Consistent color scheme across all degen components
- Removed pink colors in favor of crimson red

---

## [0.1.0] - 2024-12

### Added
- Initial project setup with React 18 and TypeScript
- Tailwind CSS v4 integration
- WebGL shader backgrounds (Menger sponge fractal)
- Dual identity system (Degen/Regen)
- Core components:
  - SplashScreen with logo animation
  - WalletEntry with chrome design
  - GlassOnboarding flow
  - TribeOnboarding (identity selection)
  - TunnelLanding (3D tunnel effect)
  - Dashboard (split-screen view)
  - DashboardNew (unified view)

### Core Features
- **Degen Hub**: Sniper bot, whale tracker, meme scanner
- **Regen Hub**: Wallet guard, portfolio analytics, inheritance vault
- **Security**: MEV protection, emergency protection, multi-sig
- **UI System**: 50+ reusable components with glass morphism
- **Effects**: 10+ visual effects (sparkles, beams, meteors, etc.)
- **Backend**: Supabase integration with Hono server

### Tech Stack
- React 18 with TypeScript
- Tailwind CSS v4
- Three.js for WebGL
- GSAP for animations
- Motion (Framer Motion) for transitions
- Supabase for backend
- Recharts for data visualization

### Design System
- Glass morphism aesthetic
- Crimson red (#DC143C) for Degen
- Purple/Blue for Regen
- Chrome metallic base colors
- Custom design tokens in `/styles/globals.css`

---

## Project Milestones

### Phase 1: Foundation ✅
- [x] Project setup and configuration
- [x] Core component architecture
- [x] Design system and styling
- [x] WebGL shader integration
- [x] Basic routing and state management

### Phase 2: Features ✅
- [x] Degen trading tools
- [x] Regen security features
- [x] Dashboard widgets
- [x] Onboarding flows
- [x] 3D tunnel landing

### Phase 3: Polish ✅
- [x] Color standardization (crimson red)
- [x] Splash screen improvements
- [x] Tunnel card positioning
- [x] Glass effect refinement
- [x] Mobile responsiveness

### Phase 4: Documentation ✅
- [x] Comprehensive README
- [x] Architecture documentation
- [x] Component reference guide
- [x] Development guide
- [x] Design system documentation

### Phase 5: Production (In Progress)
- [ ] Performance optimization
- [ ] Security audit
- [ ] User testing
- [ ] App store assets
- [ ] Deployment configuration

---

## Version History

### Version Naming Scheme
- **Major**: Breaking changes or major feature additions
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes and minor improvements

### Roadmap

**v0.3.0** (Planned)
- Settings page completion
- 2FA implementation
- Tribe switching functionality
- Privacy settings

**v0.4.0** (Planned)
- App store assets creation
- Legal pages (Terms, Privacy Policy)
- Analytics integration
- Performance monitoring

**v1.0.0** (Target)
- Production-ready release
- Security audit completed
- Full feature set implemented
- App store submission ready

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Version bumping
- Changelog updates
- Release process
- Git workflow

---

## Links

- **Repository**: [GitHub](https://github.com/your-username/paradex)
- **Documentation**: [/docs](./docs)
- **Issues**: [GitHub Issues](https://github.com/your-username/paradex/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/paradex/discussions)
