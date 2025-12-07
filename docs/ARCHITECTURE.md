# Architecture Decision Records (ADRs)

Architecture decisions and rationale for RegenX.

## ADR-001: WebSocket for Real-time Features

**Status**: Accepted  
**Date**: 2024-01-01  
**Context**: Need real-time updates for transactions, balances, and alerts.

**Decision**: Use WebSocket for all real-time features instead of polling.

**Rationale**:
- Lower latency than polling
- Reduced server load
- Better user experience
- Supports bidirectional communication

**Consequences**:
- Need WebSocket server infrastructure
- Requires connection management
- More complex than REST API

## ADR-002: TypeScript for Type Safety

**Status**: Accepted  
**Date**: 2024-01-01  
**Context**: Large codebase needs type safety.

**Decision**: Use TypeScript for all new code.

**Rationale**:
- Catch errors at compile time
- Better IDE support
- Self-documenting code
- Easier refactoring

**Consequences**:
- Slightly slower development initially
- Need type definitions for all libraries

## ADR-003: React Hooks for State Management

**Status**: Accepted  
**Date**: 2024-01-01  
**Context**: Need state management solution.

**Decision**: Use React hooks with Context API instead of Redux.

**Rationale**:
- Simpler than Redux
- Less boilerplate
- Built into React
- Sufficient for our needs

**Consequences**:
- May need Redux for complex state later
- Context can cause re-renders

## ADR-004: Vite for Build Tool

**Status**: Accepted  
**Date**: 2024-01-01  
**Context**: Need fast build tool.

**Decision**: Use Vite instead of Webpack.

**Rationale**:
- Much faster builds
- Better HMR
- Modern tooling
- Smaller bundle size

**Consequences**:
- Different plugin ecosystem
- Learning curve for team

## ADR-005: Jest + Vitest for Testing

**Status**: Accepted  
**Date**: 2024-01-01  
**Context**: Need testing framework.

**Decision**: Use Vitest for unit tests, Playwright for E2E.

**Rationale**:
- Vitest is fast and compatible with Jest
- Playwright has better browser support
- Good developer experience

**Consequences**:
- Two testing tools to maintain
- Different APIs to learn

## ADR-006: Sentry for Error Tracking

**Status**: Accepted  
**Date**: 2024-01-01  
**Context**: Need error tracking in production.

**Decision**: Use Sentry for error reporting.

**Rationale**:
- Industry standard
- Good React integration
- Source map support
- Good free tier

**Consequences**:
- External dependency
- Privacy considerations

## ADR-007: PostgreSQL for Database

**Status**: Accepted  
**Date**: 2024-01-01  
**Context**: Need relational database.

**Decision**: Use PostgreSQL instead of MongoDB.

**Rationale**:
- ACID compliance
- Better for financial data
- Strong consistency
- Mature ecosystem

**Consequences**:
- Need schema migrations
- Less flexible than NoSQL

## ADR-008: Redis for Caching

**Status**: Accepted  
**Date**: 2024-01-01  
**Context**: Need caching layer.

**Decision**: Use Redis for caching and session storage.

**Rationale**:
- Fast in-memory storage
- Pub/sub for real-time
- Widely used
- Good performance

**Consequences**:
- Additional infrastructure
- Memory usage

## ADR-009: Docker for Deployment

**Status**: Accepted  
**Date**: 2024-01-01  
**Context**: Need consistent deployment.

**Decision**: Use Docker for containerization.

**Rationale**:
- Consistent environments
- Easy scaling
- Good for CI/CD
- Industry standard

**Consequences**:
- Need Docker knowledge
- Additional complexity

## ADR-010: Monorepo Structure

**Status**: Accepted  
**Date**: 2024-01-01  
**Context**: Multiple related packages.

**Decision**: Use monorepo with separate packages.

**Rationale**:
- Code sharing
- Atomic commits
- Easier refactoring
- Single versioning

**Consequences**:
- More complex setup
- Need tooling (Lerna, Nx, etc.)

