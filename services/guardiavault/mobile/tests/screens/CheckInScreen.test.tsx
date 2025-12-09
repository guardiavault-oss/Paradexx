/**
 * CheckInScreen Tests
 * Component tests for check-in screen
 */

import React from "react";
import { Alert } from "react-native";
import { render, waitFor, fireEvent } from "../../tests/utils/test-utils";
import { CheckInScreen } from "../../screens/CheckInScreen";
import { walletService } from "../../services/walletService";
import { biometricService } from "../../services/biometricService";
import { apiClient } from "@shared/services/apiClient";

jest.mock("../../services/walletService");
jest.mock("../../services/biometricService");
jest.mock("@shared/services/apiClient");
jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  RN.Alert.alert = jest.fn();
  return RN;
});

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: { vaultId: "test-vault-id" },
  }),
}));

describe("CheckInScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (walletService.isConnected as jest.Mock).mockReturnValue(false);
  });

  it("should render check-in screen", () => {
    const { getByText } = render(<CheckInScreen navigation={{} as any} route={{} as any} />);

    expect(getByText("Vault Check-In")).toBeTruthy();
    expect(getByText("Verify your vault is active")).toBeTruthy();
  });

  it("should show wallet not connected state", () => {
    const { getByText } = render(<CheckInScreen navigation={{} as any} route={{} as any} />);

    expect(getByText("Not Connected")).toBeTruthy();
    expect(getByText("Connect Wallet")).toBeTruthy();
  });

  it("should show wallet connected state", () => {
    (walletService.isConnected as jest.Mock).mockReturnValue(true);

    const { getByText, queryByText } = render(
      <CheckInScreen navigation={{} as any} route={{} as any} />
    );

    expect(getByText("Connected")).toBeTruthy();
    expect(queryByText("Connect Wallet")).toBeNull();
    expect(getByText("Check In")).toBeTruthy();
  });

  it("should prompt to connect wallet if not connected", async () => {
    (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      if (buttons && buttons[1] && buttons[1].onPress) {
        buttons[1].onPress();
      }
    });

    const { getByText } = render(<CheckInScreen navigation={{} as any} route={{} as any} />);

    const checkInButton = getByText("Check In");
    fireEvent.press(checkInButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Wallet Required",
        expect.any(String),
        expect.any(Array)
      );
    });
  });

  it("should perform check-in when wallet connected", async () => {
    (walletService.isConnected as jest.Mock).mockReturnValue(true);
    (walletService.getSession as jest.Mock).mockReturnValue({
      address: "0x1234567890123456789012345678901234567890",
      chainId: 11155111,
    });
    (biometricService.authenticate as jest.Mock).mockResolvedValue({ success: true });
    (walletService.signMessage as jest.Mock).mockResolvedValue("0xsignature");
    (apiClient.post as jest.Mock).mockResolvedValue({ success: true });

    const { getByText } = render(<CheckInScreen navigation={{} as any} route={{} as any} />);

    const checkInButton = getByText("Check In");
    fireEvent.press(checkInButton);

    await waitFor(() => {
      expect(biometricService.authenticate).toHaveBeenCalled();
      expect(walletService.signMessage).toHaveBeenCalled();
      expect(apiClient.post).toHaveBeenCalledWith("/api/vaults/checkin", expect.any(Object));
    });
  });

  it("should handle biometric authentication failure", async () => {
    (walletService.isConnected as jest.Mock).mockReturnValue(true);
    (walletService.getSession as jest.Mock).mockReturnValue({
      address: "0x1234",
      chainId: 11155111,
    });
    (biometricService.authenticate as jest.Mock).mockResolvedValue({
      success: false,
      error: "Authentication failed",
    });

    const { getByText } = render(<CheckInScreen navigation={{} as any} route={{} as any} />);

    const checkInButton = getByText("Check In");
    fireEvent.press(checkInButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Authentication Failed", "Authentication failed");
    });
  });

  it("should handle check-in errors", async () => {
    (walletService.isConnected as jest.Mock).mockReturnValue(true);
    (walletService.getSession as jest.Mock).mockReturnValue({
      address: "0x1234",
      chainId: 11155111,
    });
    (biometricService.authenticate as jest.Mock).mockResolvedValue({ success: true });
    (walletService.signMessage as jest.Mock).mockRejectedValue(new Error("Signing failed"));

    const { getByText } = render(<CheckInScreen navigation={{} as any} route={{} as any} />);

    const checkInButton = getByText("Check In");
    fireEvent.press(checkInButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Check-In Failed", expect.any(String));
    });
  });

  it("should navigate to wallet connect screen", () => {
    const { getByText } = render(<CheckInScreen navigation={{} as any} route={{} as any} />);

    const connectButton = getByText("Connect Wallet");
    fireEvent.press(connectButton);

    expect(mockNavigate).toHaveBeenCalledWith("WalletConnect");
  });

  it("should display check-in steps", () => {
    (walletService.isConnected as jest.Mock).mockReturnValue(true);

    const { getByText } = render(<CheckInScreen navigation={{} as any} route={{} as any} />);

    expect(getByText("What happens during check-in:")).toBeTruthy();
    expect(getByText(/Biometric verification/)).toBeTruthy();
    expect(getByText(/Wallet signature verification/)).toBeTruthy();
    expect(getByText(/Confirmation sent to vault/)).toBeTruthy();
  });
});







