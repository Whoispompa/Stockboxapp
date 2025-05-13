import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const DashboardCard = ({ title, value, icon, color }) => (
  <View style={[styles.card, { borderLeftColor: color }]}>
    <View style={styles.cardContent}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={[styles.cardValue, { color }]}>{value}</Text>
    </View>
  </View>
);

const QuickActionButton = ({ title, icon, onPress, color }) => (
  <TouchableOpacity style={styles.quickActionButton} onPress={onPress}>
    <LinearGradient
      colors={[color, color.replace("1)", "0.8)")]}
      style={styles.quickActionGradient}
    >
      <MaterialCommunityIcons name={icon} size={24} color="white" />
      <Text style={styles.quickActionText}>{title}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

export default function HomeScreen({ navigation }) {
  const recentMovements = [
    { id: 1, type: 'entrada', item: 'Motor 3HP', quantity: 5, date: '23/02/2024' },
    { id: 2, type: 'salida', item: 'Filtro Aire', quantity: 2, date: '23/02/2024' },
    { id: 3, type: 'traslado', item: 'Bomba Hidráulica', quantity: 1, date: '22/02/2024' },
  ];

  return (
    <ScrollView style={styles.dashboardContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.welcomeText}>StockBox</Text>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <MaterialCommunityIcons name="logout" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </View>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <DashboardCard
          title="Stock Total"
          value="1,234"
          icon="package-variant"
          color="rgba(37, 99, 235, 1)"
        />
        <DashboardCard
          title="Alertas"
          value="5"
          icon="alert-circle"
          color="rgba(239, 68, 68, 1)"
        />
        <DashboardCard
          title="Movimientos"
          value="28"
          icon="trending-up"
          color="rgba(34, 197, 94, 1)"
        />
      </View>

      {/* Acciones rápidas */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.quickActionsGrid}>
          <QuickActionButton
            title="Agregar Refacción"
            icon="plus-circle"
            color="rgb(11, 121, 191)"
            onPress={() => navigation.navigate('AgregarRefaccion')}
          />
          <QuickActionButton
            title="Buscar"
            icon="magnify"
            color="rgb(11, 121, 191)"
            onPress={() => navigation.navigate('Buscar')}
          />
          <QuickActionButton
            title="Traslado"
            icon="transfer"
            color="rgb(11, 121, 191)"
            onPress={() => navigation.navigate('Traslado')}
          />
          <QuickActionButton
            title="Reportes"
            icon="file-chart"
            color="rgb(11, 121, 191)"
            onPress={() => navigation.navigate('Reportes')}
          />
          <QuickActionButton
            title="Usuarios"
            icon="account-multiple"
           color="rgb(11, 121, 191)"
            onPress={() => navigation.navigate('User')} // Navegación corregida
          />
        </View>
      </View>

      {/* Movimientos recientes */}
      <View style={styles.recentMovementsContainer}>
        <Text style={styles.sectionTitle}>Movimientos Recientes</Text>
        {recentMovements.map((movement) => (
          <View key={movement.id} style={styles.movementItem}>
            <MaterialCommunityIcons
              name={
                movement.type === 'entrada' ? 'arrow-down-circle' :
                movement.type === 'salida' ? 'arrow-up-circle' :
                'arrow-left-right-circle'
              }
              size={24}
              color={
                movement.type === 'entrada' ? '#22c55e' :
                movement.type === 'salida' ? '#ef4444' :
                '#f59e0b'
              }
            />
            <View style={styles.movementInfo}>
              <Text style={styles.movementTitle}>{movement.item}</Text>
              <Text style={styles.movementSubtitle}>
                Cantidad: {movement.quantity} • {movement.date}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 5,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    marginBottom: 10,
    paddingHorizontal: 15,
    height: 55,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
  },
  showPasswordButton: {
    padding: 5,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#2563eb",
    fontSize: 14,
  },
  loginButton: {
    width: "100%",
    height: 55,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerText: {
    color: "#64748b",
    fontSize: 14,
  },
  registerLink: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "bold",
  },
  // Dashboard styles
  dashboardContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    padding: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
  },
  dateText: {
    fontSize: 14,
    color: "#64748b",
    textTransform: "capitalize",
  },
  statsContainer: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 15,
    width: "31%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
  },
  cardContent: {
    alignItems: "flex-start",
  },
  cardTitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 8,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 4,
  },
  quickActionsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 15,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickActionButton: {
    width: "48%",
    marginBottom: 15,
  },
  quickActionGradient: {
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  quickActionText: {
    color: "#ffffff",
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  recentMovementsContainer: {
    padding: 20,
  },
  movementItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  movementInfo: {
    marginLeft: 15,
    flex: 1,
  },
  movementTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
  },
  movementSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
});
