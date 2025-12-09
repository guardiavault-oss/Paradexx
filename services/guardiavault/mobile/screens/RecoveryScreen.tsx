/**
 * Recovery Screen
 * Access recovery features for vault inheritance
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { walletService } from "../services/walletService";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Recovery">;

export function RecoveryScreen({ route, navigation }: Props) {
  const { vaultId } = route.params || {};

  const handleRecoveryAccess = () => {
    if (!walletService.isConnected()) {
      Alert.alert(
        "Wallet Required",
        "Please connect your wallet to access recovery features.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Connect Wallet", onPress: () => navigation.navigate("WalletConnect") },
        ]
      );
      return;
    }

    Alert.alert(
      "Recovery Access",
      "Recovery features allow you to claim inheritance from activated vaults. This feature requires guardian verification."
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Vault Recovery</Text>
          <Text style={styles.subtitle}>
            Access recovery features for activated vaults
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How Recovery Works</Text>
          <Text style={styles.infoText}>
            When a vault is activated (inheritance triggered), authorized guardians
            and beneficiaries can access recovery features to claim assets.
          </Text>
        </View>

        <View style={styles.requirementsCard}>
          <Text style={styles.requirementsTitle}>Requirements</Text>
          <RequirementItem text="Connected wallet" />
          <RequirementItem text="Guardian or beneficiary status" />
          <RequirementItem text="Multi-party verification (2-of-3)" />
          <RequirementItem text="Time-lock period completed" />
        </View>

        <TouchableOpacity
          style={styles.recoveryButton}
          onPress={handleRecoveryAccess}
        >
          <Text style={styles.recoveryButtonText}>Access Recovery</Text>
        </TouchableOpacity>

        <View style={styles.warningCard}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Recovery features are only available for vaults that have been activated.
            Contact support if you need assistance with the recovery process.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RequirementItem({ text }: { text: string }) {
  return (
    <View style={styles.requirementItem}>
      <Text style={styles.requirementBullet}>•</Text>
      <Text style={styles.requirementText}>{text}</Text>
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
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: "#64748b",
    lineHeight: 22,
  },
  requirementsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  requirementsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 16,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  requirementBullet: {
    fontSize: 18,
    color: "#4f46e5",
    marginRight: 12,
  },
  requirementText: {
    fontSize: 15,
    color: "#475569",
    flex: 1,
  },
  recoveryButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  recoveryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  warningCard: {
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningText: {
    fontSize: 14,
    color: "#92400e",
    flex: 1,
    lineHeight: 20,
  },
});

