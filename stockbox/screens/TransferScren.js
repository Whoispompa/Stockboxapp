import React, { useState, useEffect } from "react";
import { addMovement } from "../utils/movementUtils"; // Ajusta la ruta según tu estructura
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Slider from "@react-native-community/slider";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://193.203.165.112:4000/api";

export default function TransferScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPart, setSelectedPart] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [toWarehouse, setToWarehouse] = useState(null);
  const [quantity, setQuantity] = useState(0);
  const [approver, setApprover] = useState(1);
  const [warehouses, setWarehouses] = useState([]);
  const [parts, setParts] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [authCode, setAuthCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const getToken = async () => {
    return await AsyncStorage.getItem("authToken");
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      // Obtener transferencias, almacenes y productos
      const [transfersRes, warehousesRes, productsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/stock/all-transfer`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/warehouse/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/product/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setPendingTransfers(transfersRes.data);
      setWarehouses(warehousesRes.data);
      setParts(productsRes.data);
    } catch (error) {
      Alert.alert("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (part) => {
    setSelectedPart(part);
    setQuantity(0);
    // Selecciona el primer almacén diferente al actual como destino
    const currentWarehouse = warehouses.find(
      (w) => w.name === part.warehouseName
    );
    const destinos = warehouses.filter((w) => w.id !== currentWarehouse?.id);
    setToWarehouse(destinos.length > 0 ? destinos[0].id : null);
    setApprover(1);
    setModalVisible(true);
  };

    const handleTransfer = async () => {
    if (!selectedPart) return;
    if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
      Alert.alert("Error", "Selecciona una cantidad válida.");
      return;
    }
    if (!toWarehouse) {
      Alert.alert("Error", "Selecciona un almacén destino.");
      return;
    }
    if (selectedPart.quantity < Number(quantity)) {
      Alert.alert("Error", "No hay suficiente stock disponible.");
      return;
    }
    const fromWarehouseId = warehouses.find(
      (w) => w.name === selectedPart.warehouseName
    )?.id;
    if (fromWarehouseId === toWarehouse) {
      Alert.alert(
        "Error",
        "El almacén destino debe ser diferente al de origen."
      );
      return;
    }
  
    try {
      setTransferring(true);
      const token = await getToken();
      await axios.post(
        `${API_BASE_URL}/stock/create-transfer`,
        {
          fromWarehouse: Number(fromWarehouseId),
          toWarehouse: Number(toWarehouse),
          userId: Number(approver),
          notes: "",
          details: [
            {
              stockId: Number(selectedPart.id),
              quantity: Number(quantity),
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Recarga la lista de transferencias desde el backend
      await fetchData();
      setModalVisible(false);
      setSelectedPart(null);
      setQuantity(0);
      setToWarehouse(null);
      Alert.alert("Éxito", "Traslado realizado correctamente");
      await addMovement({
        id: Date.now(),
        type: "traslado-pendiente",
        item: selectedPart.name,
        quantity: Number(quantity),
        from: selectedPart.warehouseName,
        to: warehouses.find(w => w.id === toWarehouse)?.name || "",
        date: new Date().toLocaleString(),
      });
    } catch (error) {
      Alert.alert("Error", "No se pudo realizar el traslado");
    } finally {
      setTransferring(false);
    }
  };
  const handleAuthorization = async () => {
    if (!selectedTransfer || !selectedTransfer.id) {
      Alert.alert(
        "Error",
        "No se ha seleccionado una transferencia para autorizar"
      );
      return;
    }

    try {
      setTransferring(true);
      const token = await getToken();

      const response = await axios.patch(
        `${API_BASE_URL}/stock/complete-transfer/${selectedTransfer.id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const updatedData =
        response.data &&
        typeof response.data === "object" &&
        !Array.isArray(response.data) &&
        response.data.id
          ? response.data
          : null;

      if (updatedData) {
        setPendingTransfers((prevTransfers) =>
          prevTransfers.map((transfer) =>
            transfer.id === selectedTransfer.id
              ? { ...transfer, ...updatedData }
              : transfer
          )
        );
      } else {
        // Si la respuesta no es válida, recarga la lista
        fetchData();
      }

      setAuthCode("");
      setShowAuthModal(false);
      setSelectedTransfer(null);

      Alert.alert("Éxito", "Traslado autorizado y completado exitosamente");
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Ocurrió un error inesperado al completar la transferencia"
      );
    } finally {
      setTransferring(false);
    }
  };
  const filteredParts = parts.filter(
    (part) =>
      part.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Ionicons name="arrow-back" size={24} color="#64748b" />
          <Text style={styles.backButtonText}>Menú</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Traslado de Refacciones</Text>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#6c757d" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por código o nombre..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Lista de refacciones */}
      <FlatList
        data={filteredParts}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={({ item }) => (
          <View style={styles.partCard}>
            <Text style={styles.partCode}>Código: {item.sku}</Text>
            <Text style={styles.partName}>{item.name}</Text>
            <Text style={styles.partDesc}>{item.description}</Text>
            <Text style={styles.partStock}>Categoría: {item.categoryName}</Text>
            <Text style={styles.partStock}>
              Ubicación: {item.warehouseName}
            </Text>
            <Text style={styles.partStock}>Cantidad: {item.quantity}</Text>
            <TouchableOpacity
              style={styles.transferButton}
              onPress={() => handleOpenModal(item)}
            >
              <Ionicons
                name="swap-horizontal-outline"
                size={20}
                color="#ffffff"
              />
              <Text style={styles.transferButtonText}>Trasladar</Text>
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

      {/* Transfer Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Realizar Traslado</Text>
              {selectedPart && (
                <>
                  <Text style={styles.modalSubtitle}>
                    Código: {selectedPart.sku}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    Nombre: {selectedPart.name}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    Descripción: {selectedPart.description}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    Categoría: {selectedPart.categoryName}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    Ubicación actual: {selectedPart.warehouseName}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    Cantidad disponible: {selectedPart.quantity}
                  </Text>
                  <Text style={styles.modalSubtitle}>Almacén destino</Text>
                  <View style={{ marginBottom: 15 }}>
                    <Picker
                      selectedValue={toWarehouse}
                      onValueChange={setToWarehouse}
                      style={styles.picker}
                    >
                      {warehouses
                        .filter((w) => w.name !== selectedPart.warehouseName)
                        .map((w) => (
                          <Picker.Item key={w.id} label={w.name} value={w.id} />
                        ))}
                    </Picker>
                  </View>
                  <Text style={styles.modalSubtitle}>
                    Cantidad a trasladar: {quantity}
                  </Text>
                  <Slider
                    style={{ width: "100%", height: 40, marginBottom: 15 }}
                    minimumValue={0}
                    maximumValue={selectedPart.quantity}
                    step={1}
                    value={quantity}
                    onValueChange={setQuantity}
                    minimumTrackTintColor="#007bff"
                    maximumTrackTintColor="#dee2e6"
                    thumbTintColor="#007bff"
                    disabled={selectedPart.quantity === 0}
                  />
                  <Text style={styles.modalSubtitle}>Autoriza</Text>
                  <View style={{ marginBottom: 15 }}>
                    <Picker
                      selectedValue={approver}
                      onValueChange={setApprover}
                      style={styles.picker}
                    >
                      <Picker.Item label="1" value={1} />
                      <Picker.Item label="2" value={2} />
                    </Picker>
                  </View>
                </>
              )}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleTransfer}
                disabled={!quantity}
              >
                <Ionicons name="checkmark-outline" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Confirmar Traslado</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close-outline" size={24} color="#6c757d" />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Lista de transferencias pendientes */}
      {pendingTransfers.length > 0 && (
        <View style={styles.pendingTransfersContainer}>
          <Text style={styles.pendingTitle}>Transferencias Pendientes</Text>
          <ScrollView style={styles.pendingList}>
            {pendingTransfers.map((transfer) => (
              <View key={transfer.id} style={styles.pendingCard}>
                <View style={styles.pendingInfo}>
                  <Text style={styles.pendingPartName}>
                    {transfer.details && transfer.details.length > 0
                      ? transfer.details[0]?.product?.name ||
                        transfer.details[0]?.productName ||
                        transfer.details[0]?.name ||
                        transfer.details[0]?.sku ||
                        `Stock ID: ${transfer.details[0]?.stockId ?? "N/A"}`
                      : "Producto no disponible"}
                  </Text>
                  <Text style={styles.pendingDetails}>
                    Cantidad:{" "}
                    {transfer.details && transfer.details.length > 0
                      ? transfer.details[0]?.quantity
                      : "N/A"}{" "}
                    • De: {transfer.from?.name || transfer.fromWarehouseName} •
                    A: {transfer.to?.name || transfer.toWarehouseName}
                  </Text>
                  <Text style={styles.pendingDate}>
                    {new Date(transfer.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                {transfer.status === "PENDING" && (
                  <TouchableOpacity
                    style={styles.authorizeButton}
                    onPress={() => {
                      setSelectedTransfer(transfer);
                      setShowAuthModal(true);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="shield-check"
                      size={24}
                      color="#2563eb"
                    />
                  </TouchableOpacity>
                )}
                {transfer.status === "APPROVED" && (
                  <View style={styles.approvedBadge}>
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={24}
                      color="#22c55e"
                    />
                    <Text style={styles.approvedText}>Aprobado</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Modal de autorización */}
      <Modal visible={showAuthModal} transparent={true} animationType="slide">
        <View style={styles.authModalContainer}>
          <View style={styles.authModalContent}>
            <View style={styles.authModalHeader}>
              <Text style={styles.authModalTitle}>Autorizar Traslado</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAuthModal(false);
                  setAuthCode("");
                }}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.authModalBody}>
              <Text style={styles.authModalSubtitle}>
                Ingrese el código de autorización
              </Text>
              <TextInput
                style={styles.authInput}
                value={authCode}
                onChangeText={setAuthCode}
                placeholder="Código de autorización"
                secureTextEntry
              />
              <TouchableOpacity
                style={styles.authButton}
                onPress={handleAuthorization}
              >
                <LinearGradient
                  colors={["#2563eb", "#1d4ed8"]}
                  style={styles.authButtonGradient}
                >
                  <Text style={styles.authButtonText}>Autorizar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginLeft: 8,
    color: "#64748b",
    fontSize: 16,
    fontWeight: "bold",
  },
  headerTitle: {
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
    marginBottom: 5,
  },
  partDesc: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 5,
  },
  partStock: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 2,
  },
  transferButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
  transferButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 20,
    width: "90%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 20,
  },
  modalSubtitle: {
    fontSize: 15,
    color: "#495057",
    marginBottom: 8,
  },
  picker: {
    height: 50,
    width: "100%",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
  },
  saveButton: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  closeButton: {
    alignSelf: "center",
    marginTop: 10,
  },
  pendingTransfersContainer: {
    marginTop: 16,
    paddingHorizontal: 0,
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  pendingList: {
    maxHeight: 200,
  },
  pendingCard: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pendingInfo: {
    flex: 1,
  },
  pendingPartName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  pendingDetails: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  pendingDate: {
    fontSize: 10,
    color: "#94a3b8",
  },
  authorizeButton: {
    padding: 8,
  },
  approvedBadge: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  approvedText: {
    marginLeft: 4,
    color: "#22c55e",
    fontSize: 12,
    fontWeight: "bold",
  },
  authModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  authModalContent: {
    width: "80%",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    overflow: "hidden",
  },
  authModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  authModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
  },
  authModalBody: {
    padding: 16,
  },
  authModalSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 16,
  },
  authInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    color: "#1e293b",
  },
  authButton: {
    height: 48,
    borderRadius: 4,
    overflow: "hidden",
  },
  authButtonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  authButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#64748b",
  },
});