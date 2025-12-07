/**
 * WalletConnectScreen Tests
 * Component tests for wallet connection screen
 */

import React from "react";
import { Alert } from "react-native";
import { render, waitFor, fireEvent } from "../../tests/utils/test-utils";
import { WalletConnectScreen } from "../../screens/WalletConnectScreen";
import { walletService } from "../../services/walletService";
import { biometricService } from "../../services/biometricService";

jest.mock("../../services/walletService");
jest.mock("../../services/biometricService");
jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  RN.Alert.alert = jest.fn();
  return RN;
});

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}));

describe("WalletConnectScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (walletService.getSession as jest.Mock).mockReturnValue(null);
    (walletService.isConnected as jest.Mock).mockReturnValue(false);
    (biometricService.isAvailable as jest.Mock).mockResolvedValue(true);
  });

  it("should render wallet connect screen", () => {
    const { getByText } = render(<WalletConnectScreen navigation={{} as any} route={{} as any} />);

    expect(getByText("Connect Your Wallet")).toBeTruthy();
    expect(getByText("Connect wallet using WalletConnect")).toBeTruthy();
  });

  it("should show connected state when wallet is connected", () => {
    (walletService.getSession as jest.Mock).mockReturnValue({
      address: "0x1234567890123456789012345678901234567890",
      chainId: 11155111,
    });

    const { getByText } = render(<WalletConnectScreen navigation={{} as any} route={{} as any} />);

    expect(getByText("Connected")).toBeTruthy();
    expect(getByText("0x1234...7890")).toBeTruthy();
  });

  it("should show connect button when not connected", () => {
    const { getByText } = render(<WalletConnectScreen navigation={{} as any} route={{} as any} />);

    expect(getByText("Connect Wallet")).toBeTruthy();
  });

  it("should handle wallet connection", async () => {
    const mockSession = {
      address: "0x1234567890123456789012345678901234567890",
      chainId: 11155111,
    };

    (walletService.initialize as jest.Mock).mockResolvedValue(undefined);
    (walletService.connect as jest.Mock).mockResolvedValue(mockSession);
    (biometricService.authenticate as jest.Mock).mockResolvedValue({ success: true });

    const { getByText } = render(<WalletConnectScreen navigation={{} as any} route={{} as any} />);

    const connectButton = getByText("Connect Wallet");
    fireEvent.press(connectButton);

    await waitFor(() => {
      expect(walletService.initialize).toHaveBeenCalled();
      expect(walletService.connect).toHaveBeenCalled();
    });
  });

  it("should require biometric authentication before connecting", async () => {
    (walletService.initialize as jest.Mock).mockResolvedValue(undefined);
    (walletService.connect as jest.Mock).mockResolvedValue({
      address: "0x1234",
      chainId: 11155111,
    });
    (biometricService.authenticate as jest.Mock).mockResolvedValue({ success: false, error: "Cancelled" });

    const { getByText } = render(<WalletConnectScreen navigation={{} as any} route={{} as any} />);

    const connectButton = getByText("Connect Wallet");
    fireEvent.press(connectButton);

    await waitFor(() => {
      expect(biometricService.authenticate).toHaveBeenCalledWith(
        "Authenticate to connect your wallet"
      );
      expect(walletService.connect).not.toHaveBeenCalled();
    });
  });

  it("should handle disconnect", async () => {
    (walletService.getSession as jest.Mock).mockReturnValue({
      address: "0x1234567890123456789012345678901234567890",
      chainId: 11155111,
    });
    (walletService.disconnect as jest.Mock).mockResolvedValue(undefined);

    // Mock Alert.alert to trigger disconnect
    (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      if (buttons && buttons[1] && buttons[1].onPress) {
        buttons[1].onPress();
      }
    });

    const { getByText } = render(<WalletConnectScreen navigation={{} as any} route={{} as any} />);

    const disconnectButton = getByText("Disconnect");
    fireEvent.press(disconnectButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });
  });

  it("should show biometric info when available", async () => {
    (biometricService.isAvailable as jest.Mock).mockResolvedValue(true);

    const { findByText } = render(<WalletConnectScreen navigation={{} as any} route={{} as any} />);

    const biometricInfo = await findByText(/Biometric authentication enabled/);
    expect(biometricInfo).toBeTruthy();
  });
});







