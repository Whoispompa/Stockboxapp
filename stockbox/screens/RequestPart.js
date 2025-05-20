import React, { useState, useEffect } from "react";
import Slider from "@react-native-community/slider";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SearchScreen({ navigation }) {
  const [parts, setParts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState(["Todas"]);
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedStockLevel, setSelectedStockLevel] = useState("Todos");
  const [warehouses, setWarehouses] = useState([]);
  // Estados para el modal de solicitar
  const [solicitarModalVisible, setSolicitarModalVisible] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [solicitarCantidad, setSolicitarCantidad] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        // Productos
        const response = await axios.get(
          "http://193.203.165.112:4000/api/product/all",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setParts(response.data);

        // Categorías
        const catRes = await axios.get(
          "http://193.203.165.112:4000/api/category",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setCategories(["Todas", ...catRes.data.map((c) => c.name)]);

        // Almacenes
        const warehousesRes = await axios.get(
          "http://193.203.165.112:4000/api/warehouse/all",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setWarehouses(warehousesRes.data);
      } catch (error) {
        Alert.alert("Error", "No se pudieron cargar los datos");
      }
    };
    fetchData();
  }, []);

  const STOCK_LEVELS = ["Todos", "Bajo", "Normal", "Alto"];

  const getStockLevel = (quantity) => {
    if (quantity <= 5) return "Bajo";
    if (quantity <= 15) return "Normal";
    return "Alto";
  };

  const filteredParts = parts.filter((part) => {
    const matchesSearch =
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "Todas" || part.categoryName === selectedCategory;
    const stockLevel = getStockLevel(part.quantity);
    const matchesStockLevel =
      selectedStockLevel === "Todos" || stockLevel === selectedStockLevel;
    return matchesSearch && matchesCategory && matchesStockLevel;
  });

  // Modal: solicitar refacción
  const handleSolicitar = async () => {
    if (!selectedPart) return;
    if (solicitarCantidad < 1 || solicitarCantidad > selectedPart.quantity) {
      Alert.alert("Error", "Cantidad inválida.");
      return;
    }

    const warehouseId =
      selectedPart.warehouseId ||
      selectedPart.warehouse_id ||
      warehouses.find((w) => w.name === selectedPart.warehouseName)?.id;

    if (!warehouseId) {
      Alert.alert("Error", "No se encontró el almacén de la refacción.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("authToken");
      const response = await axios.post(
        "http://193.203.165.112:4000/api/stock/withdraw",
        {
          warehouseId,
          stockId: selectedPart.id,
          quantity: solicitarCantidad,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      Alert.alert("Éxito", "Solicitud realizada correctamente");
      setSolicitarModalVisible(false);
    } catch (error) {
      console.log("Error al solicitar:", error.response?.data || error.message);
      Alert.alert(
        "Error",
        error.response?.data?.message || "No se pudo realizar la solicitud"
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Modal para solicitar */}
      <Modal
        visible={solicitarModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSolicitarModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Solicitar Refacción</Text>
            {selectedPart && (
              <>
                <Text style={styles.modalSubtitle}>{selectedPart.name}</Text>
                <Text style={styles.modalSubtitle}>
                  Stock disponible: {selectedPart.quantity}
                </Text>
                <Text style={styles.modalSubtitle}>
                  Cantidad a solicitar: {solicitarCantidad}
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={selectedPart.quantity}
                  step={1}
                  value={solicitarCantidad}
                  minimumTrackTintColor="#2563eb"
                  maximumTrackTintColor="#e2e8f0"
                  thumbTintColor="#2563eb"
                  onValueChange={setSolicitarCantidad}
                />
                <TouchableOpacity
                  style={styles.bigButton}
                  onPress={handleSolicitar}
                >
                  <Text style={styles.bigButtonText}>Confirmar Solicitud</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.bigButton,
                    { backgroundColor: "#6c757d", marginTop: 10 },
                  ]}
                  onPress={() => setSolicitarModalVisible(false)}
                >
                  <Text style={styles.bigButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Ionicons name="arrow-back" size={24} color="#007bff" />
          <Text style={styles.backButtonText}>Menú</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Solicitar Refacción</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#6c757d" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar refacciones..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity onPress={() => setSearchQuery("")}>
          <Ionicons name="close-outline" size={20} color="#6c757d" />
        </TouchableOpacity>
      </View>

      {/* Parts List */}
      <FlatList
        data={filteredParts}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={({ item }) => (
          <View style={styles.partCard}>
            <Text style={styles.partCode}>{item.sku}</Text>
            <Text style={styles.partName}>{item.name}</Text>
            <Text style={styles.partDescription}>{item.description}</Text>
            <View style={styles.partDetails}>
              <Text style={styles.partDetail}>📦 {item.categoryName}</Text>
              <Text style={styles.partDetail}>📍 {item.warehouseName}</Text>
              <Text style={styles.partDetail}>
                📊 Stock: {item.quantity} ({getStockLevel(item.quantity)})
              </Text>
            </View>
            <TouchableOpacity
              style={styles.solicitarButton}
              onPress={() => {
                setSelectedPart(item);
                setSolicitarCantidad(1);
                setSolicitarModalVisible(true);
              }}
            >
              <Text style={styles.solicitarButtonText}>Solicitar</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text
            style={{ textAlign: "center", color: "#6c757d", marginTop: 40 }}
          >
            No hay refacciones disponibles.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  backButtonText: {
    color: "#007bff",
    fontSize: 16,
    marginLeft: 5,
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212529",
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#495057",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 10,
  },
  filterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  filterButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#e9ecef",
    marginRight: 10,
    marginBottom: 10,
  },
  activeFilterButton: {
    backgroundColor: "#007bff",
  },
  filterText: {
    fontSize: 14,
    color: "#495057",
  },
  activeFilterText: {
    color: "#ffffff",
  },
  partCard: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  partCode: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#007bff",
  },
  partName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212529",
    marginTop: 5,
  },
  partDescription: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 10,
  },
  partDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  partDetail: {
    fontSize: 14,
    color: "#6c757d",
    marginRight: 10,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    justifyContent: "center",
  },
  transferButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
  },
  actionText: {
    fontSize: 14,
    color: "#ffffff",
    marginLeft: 5,
  },
  solicitarButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  solicitarButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    width: "85%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#212529",
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 10,
    color: "#495057",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    padding: 10,
    width: 80,
    textAlign: "center",
    marginBottom: 15,
    fontSize: 16,
    color: "#212529",
  },
  // ...en tu objeto styles...
  slider: {
    width: "100%",
    height: 40,
    marginBottom: 20,
  },
  bigButton: {
    backgroundColor: "#007bff",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    width: "100%",
  },
  bigButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
});
