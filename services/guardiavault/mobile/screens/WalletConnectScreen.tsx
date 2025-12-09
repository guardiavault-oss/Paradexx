/**
 * Wallet Connection Screen
 * Allows users to connect their wallet via WalletConnect
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { walletService } from "../services/walletService";
import { biometricService } from "../services/biometricService";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "WalletConnect">;

export function WalletConnectScreen({ navigation }: Props) {
  const [connecting, setConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkWalletStatus();
    checkBiometric();
  }, []);

  const checkWalletStatus = async () => {
    const session = walletService.getSession();
    if (session) {
      setAddress(session.address);
    }
  };

  const checkBiometric = async () => {
    const available = await biometricService.isAvailable();
    setBiometricAvailable(available);
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      // Request biometric authentication if available
      if (biometricAvailable) {
        const biometricResult = await biometricService.authenticate(
          "Authenticate to connect your wallet"
        );
        if (!biometricResult.success) {
          Alert.alert("Authentication Failed", biometricResult.error);
          setConnecting(false);
          return;
        }
      }

      // Initialize and connect wallet
      await walletService.initialize();
      const session = await walletService.connect();

      setAddress(session.address);
      Alert.alert("Success", "Wallet connected successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert("Connection Failed", error?.message || "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      "Disconnect Wallet",
      "Are you sure you want to disconnect your wallet?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            await walletService.disconnect();
            setAddress(null);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Connect Your Wallet</Text>
          <Text style={styles.subtitle}>
            Connect your wallet to manage your vaults and perform check-ins
          </Text>
        </View>

        {address ? (
          <View style={styles.connectedCard}>
            <Text style={styles.connectedLabel}>Connected</Text>
            <Text style={styles.address} selectable>
              {address.slice(0, 6)}...{address.slice(-4)}
            </Text>
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={handleDisconnect}
            >
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.connectCard}>
            <Text style={styles.connectDescription}>
              Connect your wallet using WalletConnect. This allows you to:
            </Text>
            <View style={styles.featureList}>
              <FeatureItem text="Sign transactions securely" />
              <FeatureItem text="Perform vault check-ins" />
              <FeatureItem text="Access recovery features" />
              <FeatureItem text="Manage your vault settings" />
            </View>

            <TouchableOpacity
              style={[styles.connectButton, connecting && styles.connectButtonDisabled]}
              onPress={handleConnect}
              disabled={connecting}
            >
              {connecting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.connectButtonText}>Connect Wallet</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {biometricAvailable && (
          <View style={styles.biometricInfo}>
            <Text style={styles.biometricText}>
              🔒 Biometric authentication enabled
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureBullet}>✓</Text>
      <Text style={styles.featureText}>{text}</Text>
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
  connectCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  connectDescription: {
    fontSize: 16,
    color: "#475569",
    marginBottom: 20,
  },
  featureList: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureBullet: {
    fontSize: 18,
    color: "#10b981",
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    color: "#475569",
    flex: 1,
  },
  connectButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  connectButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  connectedCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    alignItems: "center",
  },
  connectedLabel: {
    fontSize: 14,
    color: "#10b981",
    fontWeight: "600",
    marginBottom: 12,
  },
  address: {
    fontSize: 18,
    fontFamily: "monospace",
    color: "#0f172a",
    marginBottom: 20,
  },
  disconnectButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  disconnectButtonText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "600",
  },
  biometricInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#ecfdf5",
    borderRadius: 8,
    alignItems: "center",
  },
  biometricText: {
    fontSize: 14,
    color: "#059669",
  },
});

