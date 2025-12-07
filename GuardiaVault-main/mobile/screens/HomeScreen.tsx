/**
 * Home Screen
 * Main dashboard showing vault status and quick actions
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { walletService } from "../services/walletService";
import { notificationService } from "../services/notificationService";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { TabParamList, RootStackParamList } from "../navigation/AppNavigator";
import type { CompositeScreenProps } from "@react-navigation/native";

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "Home">,
  React.ComponentProps<any>
>;

export function HomeScreen({ navigation }: Props) {
  const [refreshing, setRefreshing] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    loadWalletStatus();
    setupNotifications();
  }, []);

  const loadWalletStatus = () => {
    const isConnected = walletService.isConnected();
    const session = walletService.getSession();
    setWalletConnected(isConnected);
    setWalletAddress(session?.address || null);
  };

  const setupNotifications = async () => {
    const token = await notificationService.getPushToken();
    if (token) {
      console.log("Push token:", token);
      // Send token to backend for server-side notifications
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    loadWalletStatus();
    // Add more refresh logic here
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome to GuardiaVault</Text>
          <Text style={styles.tagline}>Secure crypto inheritance on the go</Text>
        </View>

        {!walletConnected ? (
          <View style={styles.walletPrompt}>
            <Text style={styles.walletPromptTitle}>Connect Your Wallet</Text>
            <Text style={styles.walletPromptText}>
              Connect your wallet to start managing your vaults
            </Text>
            <TouchableOpacity
              style={styles.walletPromptButton}
              onPress={() => navigation.navigate("WalletConnect" as any)}
            >
              <Text style={styles.walletPromptButtonText}>Connect Wallet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.walletCard}>
              <Text style={styles.walletCardLabel}>Connected Wallet</Text>
              <Text style={styles.walletCardAddress} selectable>
                {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : ""}
              </Text>
            </View>

            <View style={styles.quickActions}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              
              <QuickActionButton
                icon="🔐"
                title="Check-In"
                subtitle="Verify vault status"
                onPress={() => navigation.navigate("CheckIn" as any)}
              />
              
              <QuickActionButton
                icon="🔑"
                title="Recovery"
                subtitle="Access recovery features"
                onPress={() => navigation.navigate("Recovery" as any)}
              />
              
              <QuickActionButton
                icon="📊"
                title="Vault Status"
                subtitle="View all vaults"
                onPress={() => navigation.navigate("Vaults" as any)}
              />
            </View>

            <View style={styles.statusCard}>
              <Text style={styles.statusCardTitle}>System Status</Text>
              <StatusItem label="Wallet" status="Connected" statusColor="#10b981" />
              <StatusItem label="Notifications" status="Active" statusColor="#10b981" />
              <StatusItem label="Biometric Auth" status="Available" statusColor="#10b981" />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickActionButton({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickActionButton} onPress={onPress}>
      <Text style={styles.quickActionIcon}>{icon}</Text>
      <View style={styles.quickActionContent}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.quickActionArrow}>›</Text>
    </TouchableOpacity>
  );
}

function StatusItem({
  label,
  status,
  statusColor,
}: {
  label: string;
  status: string;
  statusColor: string;
}) {
  return (
    <View style={styles.statusItem}>
      <Text style={styles.statusItemLabel}>{label}</Text>
      <View style={[styles.statusBadge, { borderColor: statusColor }]}>
        <Text style={[styles.statusBadgeText, { color: statusColor }]}>{status}</Text>
      </View>
    </View>
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
  greeting: {
    fontSize: 32,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: "#64748b",
  },
  walletPrompt: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 24,
  },
  walletPromptTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 8,
  },
  walletPromptText: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 20,
  },
  walletPromptButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  walletPromptButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  walletCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  walletCardLabel: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
  },
  walletCardAddress: {
    fontSize: 18,
    fontFamily: "monospace",
    color: "#0f172a",
    fontWeight: "600",
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 16,
  },
  quickActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  quickActionArrow: {
    fontSize: 24,
    color: "#cbd5e1",
  },
  statusCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  statusCardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusItemLabel: {
    fontSize: 15,
    color: "#475569",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

