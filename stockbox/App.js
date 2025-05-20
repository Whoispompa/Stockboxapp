import "react-native-gesture-handler";
import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Text, View, StyleSheet } from "react-native";
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import UserScreen from "./screens/UserScreen";
import PartsManagementScreen from "./screens/PartsManagement";
import ReportScreen from "./screens/ReportScreen";
import TransferScreen from "./screens/TransferScren";
import SearchScreen from "./screens/SearchScreen";
import { TouchableOpacity } from "react-native";
import RequestPartScreen from "./screens/RequestPart";

const Stack = createStackNavigator();

// Componente Error Boundary
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error Boundary caught:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>¡Algo salió mal!</Text>
          <Text style={styles.errorText}>
            {this.state.error?.toString() || "Error desconocido"}
          </Text>
          <TouchableOpacity
            style={styles.reloadButton}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={styles.reloadButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <NavigationContainer>
      <ErrorBoundary>
        <Stack.Navigator>
          {!isLoggedIn ? (
            <Stack.Screen name="Login" options={{ headerShown: false }}>
              {(props) => (
                <LoginScreen {...props} setIsLoggedIn={setIsLoggedIn} />
              )}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="Home" options={{ headerShown: false }}>
                {(props) => (
                  <HomeScreen {...props} setIsLoggedIn={setIsLoggedIn} />
                )}
              </Stack.Screen>
              <Stack.Screen
                name="User"
                component={UserScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="AgregarRefaccion"
                component={PartsManagementScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Reportes"
                component={ReportScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Traslado"
                component={TransferScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Buscar"
                component={SearchScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="RequestPart"
                component={RequestPartScreen}
                options={{ headerShown: false }}
              />
            </>
          )}
        </Stack.Navigator>
      </ErrorBoundary>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8d7da",
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#721c24",
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: "#721c24",
    marginBottom: 20,
    textAlign: "center",
  },
  reloadButton: {
    backgroundColor: "#721c24",
    padding: 10,
    borderRadius: 5,
  },
  reloadButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
