/**
 * Check-In Screen
 * Allows users to perform vault check-ins with biometric verification
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { walletService } from "../services/walletService";
import { biometricService } from "../services/biometricService";
import { notificationService } from "../services/notificationService";
import { apiClient } from "@shared/services/apiClient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "CheckIn">;

export function CheckInScreen({ route, navigation }: Props) {
  const { vaultId } = route.params || {};
  const [checkingIn, setCheckingIn] = useState(false);
  const [biometricCollecting, setBiometricCollecting] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = () => {
    const isConnected = walletService.isConnected();
    setWalletConnected(isConnected);
  };

  const handleCheckIn = async () => {
    if (!walletConnected) {
      Alert.alert(
        "Wallet Required",
        "Please connect your wallet first to perform check-ins.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Connect Wallet", onPress: () => navigation.navigate("WalletConnect") },
        ]
      );
      return;
    }

    setCheckingIn(true);
    setBiometricCollecting(true);

    try {
      // Step 1: Biometric authentication
      const biometricResult = await biometricService.authenticate(
        "Verify your identity to check in"
      );

      if (!biometricResult.success) {
        Alert.alert("Authentication Failed", biometricResult.error);
        setCheckingIn(false);
        setBiometricCollecting(false);
        return;
      }

      setBiometricCollecting(false);

      // Step 2: Get wallet signature
      const session = walletService.getSession();
      if (!session) {
        throw new Error("Wallet session not found");
      }

      // Create check-in message
      const timestamp = Date.now();
      const message = `GuardiaVault Check-In\n\nVault: ${vaultId || "default"}\nTimestamp: ${timestamp}\n\nPlease sign to verify your vault is active.`;

      // Sign message with wallet
      const signature = await walletService.signMessage(message);

      // Step 3: Submit check-in to backend
      const checkInData = {
        vaultId: vaultId || "default",
        signature,
        message,
        timestamp,
        biometricVerified: true,
      };

      await apiClient.post("/api/vaults/checkin", checkInData);

      Alert.alert("Success", "Check-in completed successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert("Check-In Failed", error?.message || "Failed to complete check-in");
    } finally {
      setCheckingIn(false);
      setBiometricCollecting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Vault Check-In</Text>
          <Text style={styles.subtitle}>
            Verify your vault is active by completing a check-in
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Wallet Status</Text>
            <View style={[styles.statusBadge, walletConnected && styles.statusBadgeConnected]}>
              <Text style={[styles.statusText, walletConnected && styles.statusTextConnected]}>
                {walletConnected ? "Connected" : "Not Connected"}
              </Text>
            </View>
          </View>

          {!walletConnected && (
            <TouchableOpacity
              style={styles.connectButton}
              onPress={() => navigation.navigate("WalletConnect")}
            >
              <Text style={styles.connectButtonText}>Connect Wallet</Text>
            </TouchableOpacity>
          )}

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>What happens during check-in:</Text>
            <CheckInStep number={1} text="Biometric verification (Face ID/Touch ID)" />
            <CheckInStep number={2} text="Wallet signature verification" />
            <CheckInStep number={3} text="Confirmation sent to vault" />
          </View>

          {walletConnected && (
            <TouchableOpacity
              style={[styles.checkInButton, (checkingIn || biometricCollecting) && styles.checkInButtonDisabled]}
              onPress={handleCheckIn}
              disabled={checkingIn || biometricCollecting}
            >
              {checkingIn || biometricCollecting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.checkInButtonText}>Check In</Text>
              )}
            </TouchableOpacity>
          )}

          {biometricCollecting && (
            <View style={styles.collectingIndicator}>
              <Text style={styles.collectingText}>
                Verifying biometric authentication...
              </Text>
            </View>
          )}
        </View>

        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>Why check-ins matter</Text>
          <Text style={styles.helpText}>
            Regular check-ins help ensure your vault remains active. If you miss check-ins
            and don't respond to reminders, your vault may activate the inheritance process.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CheckInStep({ number, text }: { number: number; text: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    lineHeight: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 16,
    color: "#475569",
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  statusBadgeConnected: {
    backgroundColor: "#ecfdf5",
  },
  statusText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
  },
  statusTextConnected: {
    color: "#059669",
  },
  connectButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  connectButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  infoSection: {
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#4f46e5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepNumberText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  stepText: {
    fontSize: 15,
    color: "#475569",
    flex: 1,
  },
  checkInButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  checkInButtonDisabled: {
    opacity: 0.6,
  },
  checkInButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  collectingIndicator: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    alignItems: "center",
  },
  collectingText: {
    fontSize: 14,
    color: "#92400e",
  },
  helpCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
});

