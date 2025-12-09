/**
 * Wallet Flow Integration Tests
 * End-to-end flow tests for wallet connection
 */

import React from "react";
import { render, waitFor, fireEvent } from "../utils/test-utils";
import { WalletConnectScreen } from "../../screens/WalletConnectScreen";
import { CheckInScreen } from "../../screens/CheckInScreen";
import { HomeScreen } from "../../screens/HomeScreen";
import { walletService } from "../../services/walletService";
import { biometricService } from "../../services/biometricService";

jest.mock("../../services/walletService");
jest.mock("../../services/biometricService");

describe("Wallet Flow Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should complete full wallet connection flow", async () => {
    const mockSession = {
      address: "0x1234567890123456789012345678901234567890",
      chainId: 11155111,
    };

    (walletService.initialize as jest.Mock).mockResolvedValue(undefined);
    (walletService.connect as jest.Mock).mockResolvedValue(mockSession);
    (biometricService.authenticate as jest.Mock).mockResolvedValue({ success: true });
    (biometricService.isAvailable as jest.Mock).mockResolvedValue(true);

    // Start with home screen - wallet not connected
    (walletService.isConnected as jest.Mock).mockReturnValue(false);
    (walletService.getSession as jest.Mock).mockReturnValue(null);

    const homeScreen = render(<HomeScreen navigation={{} as any} route={{} as any} />);

    expect(homeScreen.getByText("Connect Your Wallet")).toBeTruthy();

    // Navigate to wallet connect and connect
    const walletScreen = render(<WalletConnectScreen navigation={{} as any} route={{} as any} />);
    const connectButton = walletScreen.getByText("Connect Wallet");
    fireEvent.press(connectButton);

    await waitFor(() => {
      expect(walletService.connect).toHaveBeenCalled();
    });

    // Update wallet state
    (walletService.isConnected as jest.Mock).mockReturnValue(true);
    (walletService.getSession as jest.Mock).mockReturnValue(mockSession);

    // Verify home screen shows connected state
    const updatedHomeScreen = render(<HomeScreen navigation={{} as any} route={{} as any} />);
    expect(updatedHomeScreen.getByText("Connected Wallet")).toBeTruthy();
  });

  it("should perform check-in after wallet connection", async () => {
    const mockSession = {
      address: "0x1234567890123456789012345678901234567890",
      chainId: 11155111,
    };

    (walletService.isConnected as jest.Mock).mockReturnValue(true);
    (walletService.getSession as jest.Mock).mockReturnValue(mockSession);
    (walletService.signMessage as jest.Mock).mockResolvedValue("0xsignature");
    (biometricService.authenticate as jest.Mock).mockResolvedValue({ success: true });

    const checkInScreen = render(<CheckInScreen navigation={{} as any} route={{} as any} />);

    expect(checkInScreen.getByText("Check In")).toBeTruthy();

    const checkInButton = checkInScreen.getByText("Check In");
    fireEvent.press(checkInButton);

    await waitFor(() => {
      expect(biometricService.authenticate).toHaveBeenCalled();
      expect(walletService.signMessage).toHaveBeenCalled();
    });
  });

  it("should handle wallet disconnection flow", async () => {
    const mockSession = {
      address: "0x1234567890123456789012345678901234567890",
      chainId: 11155111,
    };

    (walletService.isConnected as jest.Mock).mockReturnValue(true);
    (walletService.getSession as jest.Mock).mockReturnValue(mockSession);
    (walletService.disconnect as jest.Mock).mockResolvedValue(undefined);

    // Start connected
    const walletScreen = render(<WalletConnectScreen navigation={{} as any} route={{} as any} />);
    expect(walletScreen.getByText("Connected")).toBeTruthy();

    // Disconnect
    (walletService.isConnected as jest.Mock).mockReturnValue(false);
    (walletService.getSession as jest.Mock).mockReturnValue(null);

    const disconnectedScreen = render(<WalletConnectScreen navigation={{} as any} route={{} as any} />);
    expect(disconnectedScreen.getByText("Connect Wallet")).toBeTruthy();
  });
});







