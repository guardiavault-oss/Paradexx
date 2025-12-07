# Mobile App Testing Guide

## Overview

Comprehensive testing suite for the GuardiaVault mobile app covering unit tests, component tests, and integration tests.

## Test Structure

```
mobile/tests/
├── setup.ts                    # Jest setup and mocks
├── utils/
│   └── test-utils.tsx         # Testing utilities and helpers
├── services/                  # Service unit tests
│   ├── walletService.test.ts
│   ├── biometricService.test.ts
│   ├── notificationService.test.ts
│   └── deepLinkingService.test.ts
├── screens/                    # Component tests
│   ├── WalletConnectScreen.test.tsx
│   ├── CheckInScreen.test.tsx
│   └── HomeScreen.test.tsx
├── navigation/                 # Navigation tests
│   └── AppNavigator.test.tsx
└── integration/               # Integration tests
    └── wallet-flow.test.tsx
```

## Running Tests

### All Tests
```bash
cd mobile
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm test -- --coverage
```

### From Root Directory
```bash
npm run test:mobile
npm run test:mobile:watch
npm run test:mobile:coverage
```

## Test Categories

### 1. Unit Tests (Services)

#### WalletService Tests
- Provider initialization
- Wallet connection/disconnection
- Session management
- Message signing
- Transaction sending
- Error handling

#### BiometricService Tests
- Availability detection
- Biometric type detection
- Authentication flow
- Error handling

#### NotificationService Tests
- Permission requests
- Push token management
- Local notifications
- Scheduled reminders
- Event listeners

#### DeepLinkingService Tests
- URL parsing
- URL building
- Wallet callback handling
- Navigation deep links

### 2. Component Tests (Screens)

#### WalletConnectScreen
- Rendering with/without connection
- Connection flow
- Biometric authentication
- Disconnection flow

#### CheckInScreen
- Wallet connection requirement
- Check-in flow
- Biometric verification
- Error handling

#### HomeScreen
- Wallet connection state
- Quick actions
- System status
- Navigation

### 3. Integration Tests

#### Wallet Flow
- Complete connection flow
- Check-in after connection
- Disconnection flow

## Test Utilities

### renderWithProviders
Custom render function that wraps components with:
- QueryClientProvider (React Query)
- NavigationContainer (optional)

```tsx
import { render } from "../tests/utils/test-utils";

const { getByText } = render(<Component />, {
  withNavigation: true,
  queryClient: customQueryClient,
});
```

### Mock Navigation
```tsx
import { mockNavigation, mockRoute } from "../tests/utils/test-utils";

const route = mockRoute({ vaultId: "test-id" });
```

## Mocking

### Expo Modules
All Expo modules are mocked in `tests/setup.ts`:
- `expo-local-authentication`
- `expo-notifications`
- `expo-secure-store`
- `expo-linking`
- `expo-constants`

### Services
Services are mocked individually in test files:
```tsx
jest.mock("../../services/walletService");
jest.mock("../../services/biometricService");
```

## Writing Tests

### Example: Service Test
```tsx
import { walletService } from "../../services/walletService";

describe("WalletService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should connect wallet", async () => {
    const mockSession = {
      address: "0x1234...",
      chainId: 11155111,
    };

    (walletService.connect as jest.Mock).mockResolvedValue(mockSession);

    const session = await walletService.connect();
    expect(session.address).toBe("0x1234...");
  });
});
```

### Example: Component Test
```tsx
import { render, fireEvent } from "../utils/test-utils";
import { MyScreen } from "../../screens/MyScreen";

describe("MyScreen", () => {
  it("should handle button press", () => {
    const { getByText } = render(<MyScreen />);
    const button = getByText("Press Me");
    fireEvent.press(button);
    // Assert expected behavior
  });
});
```

## Coverage Goals

- **Services**: 90%+ coverage
- **Screens**: 80%+ coverage
- **Integration**: Critical paths 100%

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Pre-commit hooks (optional)

## Troubleshooting

### Tests Failing Due to Mocks
- Check that all required mocks are set up in `tests/setup.ts`
- Verify mock implementations match actual API

### Navigation Tests
- Use `withNavigation: true` in render options
- Mock navigation hooks properly

### Async Tests
- Use `waitFor` from testing library
- Ensure proper async/await usage

## Best Practices

1. **Isolation**: Each test should be independent
2. **Clear Names**: Use descriptive test names
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Mock Wisely**: Only mock external dependencies
5. **Coverage**: Aim for high coverage but focus on quality

## Future Enhancements

- [ ] E2E tests with Detox
- [ ] Visual regression tests
- [ ] Performance tests
- [ ] Accessibility tests







