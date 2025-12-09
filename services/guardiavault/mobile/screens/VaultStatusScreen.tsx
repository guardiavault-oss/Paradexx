/**
 * Vault Status Screen
 * Shows all user's vaults and their status
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { TabParamList } from "../navigation/AppNavigator";
import type { CompositeScreenProps } from "@react-navigation/native";

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "Vaults">,
  React.ComponentProps<any>
>;

export function VaultStatusScreen({ navigation }: Props) {
  // TODO: Fetch vaults from API
  const [vaults] = useState<any[]>([]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>My Vaults</Text>
        </View>

        {vaults.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🔒</Text>
            <Text style={styles.emptyStateTitle}>No Vaults Yet</Text>
            <Text style={styles.emptyStateText}>
              Create your first vault to get started with secure crypto inheritance
            </Text>
          </View>
        ) : (
          vaults.map((vault) => (
            <VaultCard key={vault.id} vault={vault} navigation={navigation} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function VaultCard({ vault, navigation }: { vault: any; navigation: any }) {
  return (
    <TouchableOpacity style={styles.vaultCard}>
      <View style={styles.vaultHeader}>
        <Text style={styles.vaultName}>{vault.name || "Vault"}</Text>
        <View style={[styles.vaultStatusBadge, vault.status === "active" && styles.vaultStatusActive]}>
          <Text style={styles.vaultStatusText}>{vault.status || "Unknown"}</Text>
        </View>
      </View>
      <Text style={styles.vaultAddress} selectable>
        {vault.address || "N/A"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
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
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    maxWidth: 280,
  },
  vaultCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  vaultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  vaultName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
  },
  vaultStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  vaultStatusActive: {
    backgroundColor: "#ecfdf5",
  },
  vaultStatusText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
  },
  vaultAddress: {
    fontSize: 14,
    fontFamily: "monospace",
    color: "#64748b",
  },
});

