import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ReportScreen = ({ navigation }) => {
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const reportData = {
    stockBajo: 5,
    transferencias: 28,
    entradas: 45,
    salidas: 32,
  };

  const reportTypes = [
    {
      title: "Stock Bajo",
      value: reportData.stockBajo,
      icon: "alert-circle",
      color: "#ef4444",
      description: "Refacciones con stock crítico",
    },
    {
      title: "Transferencias",
      value: reportData.transferencias,
      icon: "transfer",
      color: "#2563eb",
      description: "Total de transferencias realizadas",
    },
    {
      title: "Entradas",
      value: reportData.entradas,
      icon: "arrow-down-circle",
      color: "#22c55e",
      description: "Total de entradas al almacén",
    },
    {
      title: "Salidas",
      value: reportData.salidas,
      icon: "arrow-up-circle",
      color: "#f59e0b",
      description: "Total de salidas del almacén",
    },
  ];

  const timePeriods = [
    { id: "week", label: "Última Semana" },
    { id: "month", label: "Último Mes" },
    { id: "year", label: "Último Año" },
  ];

  const handleExportPDF = async () => {
    setIsGeneratingPDF(true);
    console.log("Exportar PDF: función llamada");
    try {
      const token = await AsyncStorage.getItem("authToken");
      const response = await axios.get(
        "http://193.203.165.112:4000/api/product/all",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const products = response.data;
      const currentDate = new Date().toLocaleDateString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // HTML mejor formateado para el PDF
      const html = `
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial; padding: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              h1 { color: #2563eb; margin-bottom: 5px; }
              .subtitle { color: #64748b; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #2563eb; color: white; padding: 10px; text-align: left; }
              td { padding: 8px; border-bottom: 1px solid #ddd; }
              tr:nth-child(even) { background-color: #f2f2f2; }
              .footer { margin-top: 30px; text-align: right; font-size: 12px; color: #64748b; }
              .warning { background-color: #fef2f2; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Reporte de Refacciones</h1>
              <div class="subtitle">Período: ${
                timePeriods.find((p) => p.id === selectedPeriod).label
              }</div>
              <div class="subtitle">Generado: ${currentDate}</div>
            </div>
            
            <table>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Almacén</th>
                <th>Cantidad</th>
              </tr>
              ${products
                .map(
                  (p) => `
                <tr ${p.quantity < 5 ? 'class="warning"' : ""}>
                  <td>${p.sku || "-"}</td>
                  <td>${p.name || "-"}</td>
                  <td>${p.categoryName || "-"}</td>
                  <td>${p.warehouseName || "-"}</td>
                  <td>${p.quantity || 0}</td>
                </tr>
              `
                )
                .join("")}
            </table>
            
            <div class="footer">
              StockBox App - ${new Date().getFullYear()}
            </div>
          </body>
        </html>
      `;

      // Generar el PDF
      const { uri } = await Print.printToFileAsync({
        html,
        width: 842, // Ancho A4 en puntos (1/72 pulgada)
        height: 1190, // Alto A4
        base64: false,
      });

      // Compartir el PDF
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Compartir Reporte PDF",
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      console.error("Error al generar PDF:", error);
      Alert.alert(
        "Error",
        "No se pudo generar el PDF. Verifica tu conexión e intenta nuevamente.",
        [{ text: "OK" }]
      );
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const ReportCard = ({ title, value, icon, color, description }) => (
    <TouchableOpacity style={styles.reportCard}>
      <LinearGradient
        colors={[`${color}15`, `${color}05`]}
        style={styles.gradientBackground}
      >
        <View style={styles.reportCardContent}>
          <View style={styles.reportCardHeader}>
            <MaterialCommunityIcons name={icon} size={24} color={color} />
            <Text style={[styles.reportValue, { color }]}>{value}</Text>
          </View>
          <Text style={styles.reportTitle}>{title}</Text>
          <Text style={styles.reportDescription}>{description}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("Home")}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#64748b" />
          <Text style={styles.backButtonText}>Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reportes</Text>
      </View>

      {/* Filtro de Período */}
      <View style={styles.periodFilter}>
        {timePeriods.map((period) => (
          <TouchableOpacity
            key={period.id}
            style={[
              styles.periodButton,
              selectedPeriod === period.id && styles.periodButtonSelected,
            ]}
            onPress={() => setSelectedPeriod(period.id)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period.id && styles.periodButtonTextSelected,
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Reportes */}
      <ScrollView style={styles.reportsContainer}>
        <View style={styles.reportsGrid}>
          {reportTypes.map((report, index) => (
            <ReportCard key={index} {...report} />
          ))}
        </View>

        {/* Acciones de Reportes */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleExportPDF}
            disabled={isGeneratingPDF}
          >
            <LinearGradient
              colors={["#2563eb", "#1d4ed8"]}
              style={styles.actionGradient}
            >
              <MaterialCommunityIcons
                name="file-pdf-box"
                size={24}
                color="white"
              />
              <Text style={styles.actionButtonText}>
                {isGeneratingPDF ? "Generando..." : "Exportar PDF"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} disabled>
            <LinearGradient
              colors={["#22c55e", "#16a34a"]}
              style={[styles.actionGradient, { opacity: 0.6 }]}
            >
              <MaterialCommunityIcons
                name="microsoft-excel"
                size={24}
                color="white"
              />
              <Text style={styles.actionButtonText}>Exportar Excel</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    padding: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#64748b",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
  },
  periodFilter: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: "#f1f5f9",
  },
  periodButtonSelected: {
    backgroundColor: "#eff6ff",
  },
  periodButtonText: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 14,
  },
  periodButtonTextSelected: {
    color: "#2563eb",
    fontWeight: "500",
  },
  reportsContainer: {
    flex: 1,
    padding: 15,
  },
  reportsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  reportCard: {
    width: "48%",
    marginBottom: 15,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradientBackground: {
    padding: 15,
  },
  reportCardContent: {
    alignItems: "flex-start",
  },
  reportCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 8,
  },
  reportValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 12,
    color: "#64748b",
  },
  actionsContainer: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
    overflow: "hidden",
  },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
});

export default ReportScreen;
