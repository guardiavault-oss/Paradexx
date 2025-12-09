/**
 * Dashboard Screen
 * Main dashboard with real data fetching
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiClient, API_ENDPOINTS } from "../services/apiClient";
import { useAuth } from "../contexts/AuthContext";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Dashboard">;

interface Vault {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

interface VaultsResponse {
  vaults: Vault[];
}

interface YieldData {
  apy?: number;
  yieldAccumulated?: string;
  principal?: string;
  totalValue?: string;
  asset?: string;
  stakingProtocol?: string;
}

export function DashboardScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch vaults
  const { data: vaultsData, isLoading: vaultsLoading, refetch: refetchVaults } = useQuery<VaultsResponse>({
    queryKey: ["vaults"],
    queryFn: async () => {
      return apiClient.get<VaultsResponse>(API_ENDPOINTS.vaults.list);
    },
    retry: 2,
  });

  const [yieldData, setYieldData] = useState<YieldData | null>(null);
  const [yieldLoading, setYieldLoading] = useState(false);

  // Fetch yield data for first vault
  useEffect(() => {
    const vault = vaultsData?.vaults?.[0];
    if (vault?.id) {
      setYieldLoading(true);
      apiClient
        .get<YieldData>(`/api/vaults/${vault.id}/yield`)
        .then((data) => {
          setYieldData(data);
          setYieldLoading(false);
        })
        .catch(() => {
          setYieldData(null);
          setYieldLoading(false);
        });
    }
  }, [vaultsData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchVaults();
    setRefreshing(false);
  };

  const vaults = vaultsData?.vaults || [];
  const totalPortfolioValue = yieldData?.totalValue
    ? parseFloat(yieldData.totalValue) * 3000
    : 0;
  const totalEarnings = yieldData?.yieldAccumulated
    ? parseFloat(yieldData.yieldAccumulated) * 3000
    : 0;
  const currentAPY = yieldData?.apy || 0;

  const quickActions = [
    {
      label: "Yield Vaults",
      icon: "trending-up",
      screen: "YieldVaults",
      color: "#10b981",
    },
    {
      label: "Create Vault",
      icon: "add-circle",
      screen: "CreateVault",
      color: "#3b82f6",
    },
    {
      label: "Guardians",
      icon: "people",
      screen: "Guardians",
      color: "#8b5cf6",
    },
    {
      label: "Settings",
      icon: "settings",
      screen: "Settings",
      color: "#f59e0b",
    },
  ];

  if (vaultsLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          {user && (
            <Text style={styles.subtitle}>{user.email}</Text>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Portfolio Value</Text>
            <Text style={styles.statValue}>
              ${totalPortfolioValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Earnings</Text>
            <Text style={styles.statValue}>
              ${totalEarnings.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Current APY</Text>
            <Text style={styles.statValue}>
              {yieldLoading ? "..." : `${currentAPY.toFixed(2)}%`}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active Vaults</Text>
            <Text style={styles.statValue}>{vaults.length}</Text>
          </View>
        </View>

        {/* Vaults List */}
        {vaults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Vaults</Text>
            {vaults.map((vault) => (
              <TouchableOpacity
                key={vault.id}
                style={styles.vaultCard}
                onPress={() => navigation.navigate("Vaults" as any)}
              >
                <View style={styles.vaultIcon}>
                  <Ionicons name="lock-closed" size={24} color="#4f46e5" />
                </View>
                <View style={styles.vaultContent}>
                  <Text style={styles.vaultName}>{vault.name || "Unnamed Vault"}</Text>
                  <Text style={styles.vaultStatus}>{vault.status}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.screen}
              style={styles.actionCard}
              onPress={() => navigation.navigate(action.screen as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                <Ionicons name={action.icon as any} size={24} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>
          ))}
        </View>

        {vaults.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="lock-closed-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Vaults Yet</Text>
            <Text style={styles.emptyText}>
              Create your first vault to start protecting your crypto legacy
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate("CreateVault")}
            >
              <Text style={styles.createButtonText}>Create Vault</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statLabel: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 16,
  },
  vaultCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  vaultIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#4f46e520",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  vaultContent: {
    flex: 1,
  },
  vaultName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 4,
  },
  vaultStatus: {
    fontSize: 14,
    color: "#64748b",
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  actionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#0f172a",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#0f172a",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: "#4f46e5",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  createButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
