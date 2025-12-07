/**
 * Settings Screen
 * App settings and preferences
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { walletService } from "../services/walletService";
import { biometricService } from "../services/biometricService";
import { notificationService } from "../services/notificationService";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { TabParamList } from "../navigation/AppNavigator";
import type { CompositeScreenProps } from "@react-navigation/native";

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "Settings">,
  React.ComponentProps<any>
>;

export function SettingsScreen({ navigation }: Props) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkSettings();
  }, []);

  const checkSettings = async () => {
    const available = await biometricService.isAvailable();
    setBiometricAvailable(available);
    setBiometricEnabled(available);
    
    // Check notification permissions
    const hasPermission = await notificationService.requestPermissions();
    setNotificationsEnabled(hasPermission);
  };

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      const hasPermission = await notificationService.requestPermissions();
      setNotificationsEnabled(hasPermission);
      if (!hasPermission) {
        Alert.alert("Permission Required", "Please enable notifications in device settings");
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  const handleDisconnectWallet = async () => {
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
            Alert.alert("Success", "Wallet disconnected");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <SettingItem
            title="Biometric Authentication"
            subtitle={biometricAvailable ? "Face ID / Touch ID" : "Not available"}
            rightComponent={
              <Switch
                value={biometricEnabled && biometricAvailable}
                onValueChange={setBiometricEnabled}
                disabled={!biometricAvailable}
              />
            }
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <SettingItem
            title="Push Notifications"
            subtitle="Check-in reminders and vault alerts"
            rightComponent={
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
              />
            }
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet</Text>
          
          {walletService.isConnected() ? (
            <>
              <SettingItem
                title="Connected Wallet"
                subtitle={walletService.getSession()?.address || ""}
                onPress={() => navigation.navigate("WalletConnect" as any)}
              />
              <SettingItem
                title="Disconnect Wallet"
                subtitle="Remove wallet connection"
                onPress={handleDisconnectWallet}
                danger
              />
            </>
          ) : (
            <SettingItem
              title="Connect Wallet"
              subtitle="Link your wallet to manage vaults"
              onPress={() => navigation.navigate("WalletConnect" as any)}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <SettingItem
            title="Version"
            subtitle="1.0.0"
          />
          
          <SettingItem
            title="Help & Support"
            subtitle="Get help with the app"
            onPress={() => Alert.alert("Help", "Contact support@guardiavault.com")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingItem({
  title,
  subtitle,
  rightComponent,
  onPress,
  danger,
}: {
  title: string;
  subtitle: string;
  rightComponent?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  const Component = onPress ? TouchableOpacity : View;
  
  return (
    <Component
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && styles.settingTitleDanger]}>
          {title}
        </Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      {rightComponent && <View>{rightComponent}</View>}
      {onPress && !rightComponent && <Text style={styles.settingArrow}>›</Text>}
    </Component>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#0f172a",
    marginBottom: 4,
  },
  settingTitleDanger: {
    color: "#ef4444",
  },
  settingSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  settingArrow: {
    fontSize: 24,
    color: "#cbd5e1",
    marginLeft: 12,
  },
});

