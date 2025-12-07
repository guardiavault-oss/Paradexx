/**
 * Main Navigation Structure
 * React Navigation setup matching website routes
 */

import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";

// Tab Screens
import { HomeScreen } from "../screens/HomeScreen";
import { VaultStatusScreen } from "../screens/VaultStatusScreen";
import { SettingsScreen } from "../screens/SettingsScreen";

// Stack Screens - Auth
import { LoginScreen } from "../screens/LoginScreen";
import { SignupScreen } from "../screens/SignupScreen";

// Stack Screens - Main
import { DashboardScreen } from "../screens/DashboardScreen";
import { WalletConnectScreen } from "../screens/WalletConnectScreen";
import { CheckInScreen } from "../screens/CheckInScreen";
import { RecoveryScreen } from "../screens/RecoveryScreen";
import { CreateVaultScreen } from "../screens/CreateVaultScreen";
import { GuardiansScreen } from "../screens/GuardiansScreen";
import { BeneficiariesScreen } from "../screens/BeneficiariesScreen";
import { KeyFragmentsScreen } from "../screens/KeyFragmentsScreen";
import { YieldVaultsScreen } from "../screens/YieldVaultsScreen";
import { SmartWillScreen } from "../screens/SmartWillScreen";
import { CheckInsScreen } from "../screens/CheckInsScreen";
import { ClaimsScreen } from "../screens/ClaimsScreen";
import { LegacyMessagesScreen } from "../screens/LegacyMessagesScreen";
import { RecoverVaultScreen } from "../screens/RecoverVaultScreen";
import { SetupRecoveryScreen } from "../screens/SetupRecoveryScreen";
import { RecoveryKeyPortalScreen } from "../screens/RecoveryKeyPortalScreen";
import { GuardianPortalScreen } from "../screens/GuardianPortalScreen";
import { AcceptInviteScreen } from "../screens/AcceptInviteScreen";
import { HelpSupportScreen } from "../screens/HelpSupportScreen";

export type RootStackParamList = {
  // Auth
  Login: undefined;
  Signup: undefined;
  
  // Main Tabs
  MainTabs: undefined;
  
  // Stack Screens
  Dashboard: undefined;
  WalletConnect: undefined;
  CreateVault: undefined;
  CheckIn: { vaultId?: string };
  Recovery: { vaultId?: string };
  RecoverVault: undefined;
  SetupRecovery: undefined;
  RecoveryKeyPortal: { token?: string };
  GuardianPortal: undefined;
  AcceptInvite: { token?: string };
  
  // Dashboard Sections
  Guardians: undefined;
  Beneficiaries: undefined;
  KeyFragments: undefined;
  YieldVaults: undefined;
  SmartWill: undefined;
  CheckIns: undefined;
  Claims: undefined;
  LegacyMessages: undefined;
  HelpSupport: undefined;
};

export type TabParamList = {
  Home: undefined;
  Vaults: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#4f46e5",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e2e8f0",
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Vaults"
        component={VaultStatusScreen}
        options={{
          tabBarLabel: "Vaults",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="lock-closed" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: "#ffffff",
          },
          headerTintColor: "#0f172a",
          headerTitleStyle: {
            fontWeight: "600",
          },
        }}
      >
        {!isAuthenticated ? (
          <>
            {/* Auth Screens - shown when not authenticated */}
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Signup"
              component={SignupScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            {/* Main Tabs - shown when authenticated */}
            <Stack.Screen
              name="MainTabs"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
        
            {/* Dashboard */}
            <Stack.Screen
              name="Dashboard"
              component={DashboardScreen}
              options={{ title: "Dashboard" }}
            />
            
            {/* Wallet & Vault Management */}
            <Stack.Screen
              name="WalletConnect"
              component={WalletConnectScreen}
              options={{
                title: "Connect Wallet",
                presentation: "modal",
              }}
            />
            <Stack.Screen
              name="CreateVault"
              component={CreateVaultScreen}
              options={{ title: "Create Vault" }}
            />
            <Stack.Screen
              name="CheckIn"
              component={CheckInScreen}
              options={{ title: "Check-In" }}
            />
            
            {/* Recovery Screens */}
            <Stack.Screen
              name="Recovery"
              component={RecoveryScreen}
              options={{ title: "Recovery" }}
            />
            <Stack.Screen
              name="RecoverVault"
              component={RecoverVaultScreen}
              options={{ title: "Recover Vault" }}
            />
            <Stack.Screen
              name="SetupRecovery"
              component={SetupRecoveryScreen}
              options={{ title: "Setup Recovery" }}
            />
            <Stack.Screen
              name="RecoveryKeyPortal"
              component={RecoveryKeyPortalScreen}
              options={{ title: "Recovery Portal" }}
            />
            <Stack.Screen
              name="GuardianPortal"
              component={GuardianPortalScreen}
              options={{ title: "Guardian Portal" }}
            />
            <Stack.Screen
              name="AcceptInvite"
              component={AcceptInviteScreen}
              options={{ title: "Accept Invitation" }}
            />
            
            {/* Dashboard Sections */}
            <Stack.Screen
              name="Guardians"
              component={GuardiansScreen}
              options={{ title: "Guardians" }}
            />
            <Stack.Screen
              name="Beneficiaries"
              component={BeneficiariesScreen}
              options={{ title: "Beneficiaries" }}
            />
            <Stack.Screen
              name="KeyFragments"
              component={KeyFragmentsScreen}
              options={{ title: "Key Fragments" }}
            />
            <Stack.Screen
              name="YieldVaults"
              component={YieldVaultsScreen}
              options={{ title: "Yield Vaults" }}
            />
            <Stack.Screen
              name="SmartWill"
              component={SmartWillScreen}
              options={{ title: "Smart Will" }}
            />
            <Stack.Screen
              name="CheckIns"
              component={CheckInsScreen}
              options={{ title: "Check-Ins" }}
            />
            <Stack.Screen
              name="Claims"
              component={ClaimsScreen}
              options={{ title: "Claims" }}
            />
            <Stack.Screen
              name="LegacyMessages"
              component={LegacyMessagesScreen}
              options={{ title: "Legacy Messages" }}
            />
            <Stack.Screen
              name="HelpSupport"
              component={HelpSupportScreen}
              options={{ title: "Help & Support" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
});
