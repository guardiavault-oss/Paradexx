# Shared Code

This directory contains code shared between the web and React Native mobile applications.

## Structure

```
shared/
├── config/          # Shared configuration
│   └── api.ts       # API endpoints configuration
├── services/        # Platform-agnostic services
│   └── apiClient.ts # HTTP client for web and mobile
├── hooks/           # Shared React hooks
│   └── useWallet.ts # Platform-agnostic wallet hook
├── utils/           # Utility functions
│   └── platform.ts  # Platform detection and abstractions
└── schema.ts        # Database schema (shared types)
```

## Usage

### Web
```typescript
import { apiClient } from "@shared/services/apiClient";
import { storage } from "@shared/utils/platform";
```

### Mobile
```typescript
import { apiClient } from "@shared/services/apiClient";
import { storage } from "@shared/utils/platform";
```

The same imports work in both platforms thanks to path aliases configured in `tsconfig.json` and `mobile/babel.config.js`.

## Platform Detection

Use the `Platform` utility to detect the current platform:

```typescript
import { Platform } from "@shared/utils/platform";

if (Platform.isWeb) {
  // Web-specific code
} else if (Platform.isNative) {
  // React Native-specific code
}
```

## Storage Abstraction

The `storage` utility automatically uses:
- `localStorage` on web
- `AsyncStorage` on React Native

```typescript
import { storage } from "@shared/utils/platform";

await storage.setItem("key", "value");
const value = await storage.getItem("key");
await storage.removeItem("key");
```

