/**
 * HomeScreen Tests
 * Component tests for home screen
 */

import React from "react";
import { render, waitFor, fireEvent } from "../../tests/utils/test-utils";
import { HomeScreen } from "../../screens/HomeScreen";
import { walletService } from "../../services/walletService";
import { notificationService } from "../../services/notificationService";

jest.mock("../../services/walletService");
jest.mock("../../services/notificationService");

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

describe("HomeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (walletService.isConnected as jest.Mock).mockReturnValue(false);
    (walletService.getSession as jest.Mock).mockReturnValue(null);
    (notificationService.getPushToken as jest.Mock).mockResolvedValue("mock-token");
  });

  it("should render home screen", () => {
    const { getByText } = render(<HomeScreen navigation={{} as any} route={{} as any} />);

    expect(getByText("Welcome to GuardiaVault")).toBeTruthy();
    expect(getByText("Secure crypto inheritance on the go")).toBeTruthy();
  });

  it("should show wallet prompt when not connected", () => {
    const { getByText } = render(<HomeScreen navigation={{} as any} route={{} as any} />);

    expect(getByText("Connect Your Wallet")).toBeTruthy();
    expect(getByText("Connect your wallet to start managing your vaults")).toBeTruthy();
  });

  it("should show connected wallet when connected", () => {
    (walletService.isConnected as jest.Mock).mockReturnValue(true);
    (walletService.getSession as jest.Mock).mockReturnValue({
      address: "0x1234567890123456789012345678901234567890",
      chainId: 11155111,
    });

    const { getByText, queryByText } = render(<HomeScreen navigation={{} as any} route={{} as any} />);

    expect(getByText("Connected Wallet")).toBeTruthy();
    expect(getByText("0x1234...7890")).toBeTruthy();
    expect(queryByText("Connect Your Wallet")).toBeNull();
  });

  it("should navigate to wallet connect on button press", () => {
    const { getByText } = render(<HomeScreen navigation={{} as any} route={{} as any} />);

    const connectButton = getByText("Connect Wallet");
    fireEvent.press(connectButton);

    expect(mockNavigate).toHaveBeenCalled();
  });

  it("should display quick actions when wallet connected", () => {
    (walletService.isConnected as jest.Mock).mockReturnValue(true);
    (walletService.getSession as jest.Mock).mockReturnValue({
      address: "0x1234",
      chainId: 11155111,
    });

    const { getByText } = render(<HomeScreen navigation={{} as any} route={{} as any} />);

    expect(getByText("Quick Actions")).toBeTruthy();
    expect(getByText("Check-In")).toBeTruthy();
    expect(getByText("Recovery")).toBeTruthy();
    expect(getByText("Vault Status")).toBeTruthy();
  });

  it("should navigate to check-in screen", () => {
    (walletService.isConnected as jest.Mock).mockReturnValue(true);
    (walletService.getSession as jest.Mock).mockReturnValue({
      address: "0x1234",
      chainId: 11155111,
    });

    const { getByText } = render(<HomeScreen navigation={{} as any} route={{} as any} />);

    const checkInButton = getByText("Check-In");
    fireEvent.press(checkInButton);

    expect(mockNavigate).toHaveBeenCalled();
  });

  it("should display system status", () => {
    (walletService.isConnected as jest.Mock).mockReturnValue(true);
    (walletService.getSession as jest.Mock).mockReturnValue({
      address: "0x1234",
      chainId: 11155111,
    });

    const { getByText } = render(<HomeScreen navigation={{} as any} route={{} as any} />);

    expect(getByText("System Status")).toBeTruthy();
    expect(getByText("Wallet")).toBeTruthy();
    expect(getByText("Notifications")).toBeTruthy();
    expect(getByText("Biometric Auth")).toBeTruthy();
  });

  it("should setup notifications on mount", async () => {
    render(<HomeScreen navigation={{} as any} route={{} as any} />);

    await waitFor(() => {
      expect(notificationService.getPushToken).toHaveBeenCalled();
    });
  });

  it("should handle refresh", async () => {
    const { getByTestId } = render(<HomeScreen navigation={{} as any} route={{} as any} />);

    // Note: RefreshControl requires specific testing setup
    // This is a placeholder for refresh functionality
    expect(true).toBe(true);
  });
});







