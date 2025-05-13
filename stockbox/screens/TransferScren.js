import React, { useState, useEffect } from "react";
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
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { toast } from "sonner-native";
import axios from "axios";

const API_BASE_URL = "http://193.203.165.112:4000/api";
const TOKEN =  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzQ3MTIxMTQ5LCJleHAiOjE3NDcxMjQ3NDl9.cvUrafUQPhivmmWtAvSCTo6veKOaTaNAiIajJTmR2nI"

// Configurar Axios con el token
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.headers.common["Authorization"] = `Bearer ${TOKEN}`;

export default function TransferScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPart, setSelectedPart] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [sourceWarehouse, setSourceWarehouse] = useState(null);
  const [targetWarehouse, setTargetWarehouse] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [authCode, setAuthCode] = useState("");
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);

  // Simular códigos de autorización válidos
  const validAuthCodes = {
    ADMIN123: "admin",
    SUPER456: "supervisor",
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Obtener almacenes y productos
      const [transfersRes, warehousesRes, productsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/stock/all-transfer`),
        axios.get(`${API_BASE_URL}/warehouse/all`),
        axios.get(`${API_BASE_URL}/product/all`),
      ]);

      setPendingTransfers(transfersRes.data);
      setWarehouses(warehousesRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const filteredParts = products.filter(
    (part) =>
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTransfer = async () => {
    // Validaciones
    if (!sourceWarehouse || !targetWarehouse) {
      Alert.alert("Selecciona los almacenes de origen y destino");
      return;
    }

    if (sourceWarehouse === targetWarehouse) {
      Alert.alert("Los almacenes deben ser diferentes");
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert("Ingresa una cantidad válida");
      return;
    }

    try {
      setTransferring(true);

      // Crear la transferencia
      const transferData = {
        fromWarehouse: sourceWarehouse, // ID del almacén de origen
        toWarehouse: targetWarehouse, // ID del almacén de destino
        userId: 1, // ID del usuario (ajusta según corresponda)
        notes: notes || "", // Notas opcionales
        details: [
          {
            productId: selectedPart.id, // ID del producto
            quantity: qty, // Cantidad a transferir
          },
        ],
      };

      console.log("Datos enviados:", transferData); // Depuración

      // Llamada al endpoint para crear la transferencia
      const response = await axios.post(
        `${API_BASE_URL}/stock/create-transfer`,
        transferData
      );

      // Actualizar la lista de transferencias
      setPendingTransfers([response.data, ...pendingTransfers]);
      setModalVisible(false);
      resetForm();
      Alert.alert("Solicitud de traslado creada. Esperando autorización.");
    } catch (error) {
      console.error(
        "Error creating transfer:",
        error.response?.data || error.message
      );
      Alert.alert(
        error.response?.data?.message || "Error al crear la transferencia"
      );
    } finally {
      setTransferring(false);
    }
  };

    const handleAuthorization = async () => {
    if (!authCode) {
      Alert.alert("Error", "Ingrese el ID del usuario que autoriza");
      return;
    }
  
    try {
      // Mostrar indicador de carga
      setTransferring(true);
  
      // Llamada al endpoint para completar la transferencia
      const response = await axios.patch(
        `${API_BASE_URL}/stock/complete-transfer/${selectedTransfer.id}`,
        { approvedBy: authCode } // Enviar el ID del usuario como código de autorización
      );
  
      // Actualizar el estado local de las transferencias
      setPendingTransfers((prevTransfers) =>
        prevTransfers.map((transfer) =>
          transfer.id === selectedTransfer.id
            ? { ...transfer, ...response.data } // Actualizar con los datos devueltos por el servidor
            : transfer
        )
      );
  
      // Restablecer el estado del modal y el código de autorización
      setAuthCode("");
      setShowAuthModal(false);
      setSelectedTransfer(null);
  
      // Mostrar mensaje de éxito
      Alert.alert("Éxito", "Traslado autorizado y completado exitosamente");
    } catch (error) {
      console.error(
        "Error completing transfer:",
        error.response?.data || error.message
      );
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Ocurrió un error inesperado al completar la transferencia"
      );
    } finally {
      // Ocultar indicador de carga
      setTransferring(false);
    }
  };

  const resetForm = () => {
    setSelectedPart(null);
    setSourceWarehouse(null);
    setTargetWarehouse(null);
    setQuantity("");
    setNotes("");
  };

  const getStockColor = (stock) => {
    if (stock <= 2) return "#ef4444";
    if (stock <= 5) return "#f59e0b";
    return "#22c55e";
  };

  const getProductStock = (productId, warehouseId) => {
    // Busca el producto por su ID
    const product = products.find((p) => p.id === productId);

    if (!product) {
      return 0; // Si no se encuentra el producto, devuelve 0
    }

    // Verifica si el producto pertenece al almacén especificado
    const warehouse = warehouses.find((w) => w.id === warehouseId);
    if (!warehouse || product.warehouseName !== warehouse.name) {
      return 0; // Si el almacén no coincide, devuelve 0
    }

    return product.quantity; // Devuelve la cantidad del producto en el almacén
  };

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
          <MaterialCommunityIcons name="arrow-left" size={24} color="#64748b" />
          <Text style={styles.backButtonText}>Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Traslado de Refacciones</Text>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={24} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por código o nombre..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Lista de refacciones */}
      <ScrollView style={styles.partsList}>
        {filteredParts.map((part) => (
          <View key={part.id} style={styles.partCard}>
            <View style={styles.partInfo}>
              <Text style={styles.partCode}>{part.sku}</Text>
              <Text style={styles.partName}>{part.name}</Text>
              <View style={styles.stockContainer}>
                {warehouses.map((warehouse) => (
                  <View key={warehouse.id} style={styles.stockItem}>
                    <Text style={styles.warehouseName}>{warehouse.name}:</Text>
                    <Text
                      style={[
                        styles.stockValue,
                        {
                          color: getStockColor(
                            getProductStock(part.id, warehouse.id)
                          ),
                        },
                      ]}
                    >
                      {getProductStock(part.id, warehouse.id)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            <TouchableOpacity
              style={styles.transferButton}
              onPress={() => {
                setSelectedPart(part);
                setModalVisible(true);
              }}
            >
              <LinearGradient
                colors={["#2563eb", "#1d4ed8"]}
                style={styles.transferGradient}
              >
                <MaterialCommunityIcons
                  name="transfer"
                  size={24}
                  color="#ffffff"
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Lista de transferencias pendientes */}
      {pendingTransfers.length > 0 && (
        <View style={styles.pendingTransfersContainer}>
          <Text style={styles.pendingTitle}>Transferencias Pendientes</Text>
          <ScrollView style={styles.pendingList}>
            {pendingTransfers.map((transfer) => (
              <View key={transfer.id} style={styles.pendingCard}>
                <View style={styles.pendingInfo}>
                  <Text style={styles.pendingPartName}>
                    {transfer.details[0]?.product?.name ||
                      "Producto no disponible"}
                  </Text>
                  <Text style={styles.pendingDetails}>
                    Cantidad: {transfer.details[0]?.quantity} • De:{" "}
                    {transfer.from?.name} • A: {transfer.to?.name}
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

      {/* Modal de transferencia */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Realizar Traslado</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>

            {selectedPart && (
              <View style={styles.modalBody}>
                <Text style={styles.selectedPartInfo}>
                  {selectedPart.sku} - {selectedPart.name}
                </Text>

                {/* Selección de almacén origen */}
                <Text style={styles.inputLabel}>Almacén Origen</Text>
                <View style={styles.warehouseButtons}>
                  {warehouses.map((warehouse) => (
                    <TouchableOpacity
                      key={warehouse.id}
                      style={[
                        styles.warehouseButton,
                        sourceWarehouse === warehouse.id &&
                          styles.warehouseButtonSelected,
                      ]}
                      onPress={() => setSourceWarehouse(warehouse.id)}
                    >
                      <Text
                        style={[
                          styles.warehouseButtonText,
                          sourceWarehouse === warehouse.id &&
                            styles.warehouseButtonTextSelected,
                        ]}
                      >
                        {warehouse.name}
                      </Text>
                      <Text
                        style={[
                          styles.warehouseStock,
                          sourceWarehouse === warehouse.id &&
                            styles.warehouseButtonTextSelected,
                        ]}
                      >
                        Stock: {getProductStock(selectedPart.id, warehouse.id)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Selección de almacén destino */}
                <Text style={styles.inputLabel}>Almacén Destino</Text>
                <View style={styles.warehouseButtons}>
                  {warehouses.map((warehouse) => (
                    <TouchableOpacity
                      key={warehouse.id}
                      style={[
                        styles.warehouseButton,
                        targetWarehouse === warehouse.id &&
                          styles.warehouseButtonSelected,
                      ]}
                      onPress={() => setTargetWarehouse(warehouse.id)}
                    >
                      <Text
                        style={[
                          styles.warehouseButtonText,
                          targetWarehouse === warehouse.id &&
                            styles.warehouseButtonTextSelected,
                        ]}
                      >
                        {warehouse.name}
                      </Text>
                      <Text
                        style={[
                          styles.warehouseStock,
                          targetWarehouse === warehouse.id &&
                            styles.warehouseButtonTextSelected,
                        ]}
                      >
                        Stock: {getProductStock(selectedPart.id, warehouse.id)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Cantidad a transferir */}
                <Text style={styles.inputLabel}>Cantidad</Text>
                <TextInput
                  style={styles.quantityInput}
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="Ingrese cantidad"
                />

                {/* Notas */}
                <Text style={styles.inputLabel}>Notas (opcional)</Text>
                <TextInput
                  style={styles.notesInput}
                  multiline
                  numberOfLines={3}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Agregar notas adicionales..."
                />

                {/* Botón de transferencia */}
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleTransfer}
                  disabled={transferring}
                >
                  <LinearGradient
                    colors={["#2563eb", "#1d4ed8"]}
                    style={styles.confirmGradient}
                  >
                    {transferring ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.confirmButtonText}>
                        Realizar Traslado
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  backButtonText: {
    marginLeft: 8,
    color: "#64748b",
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: "#1e293b",
  },
  partsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  partCard: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  partInfo: {
    flex: 1,
  },
  partCode: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  partName: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
  },
  stockContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  stockItem: {
    flexDirection: "row",
    marginRight: 16,
    marginBottom: 4,
  },
  warehouseName: {
    fontSize: 12,
    color: "#64748b",
    marginRight: 4,
  },
  stockValue: {
    fontSize: 12,
    fontWeight: "bold",
  },
  transferButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  transferGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pendingTransfersContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    maxHeight: "90%",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  selectedPartInfo: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
  },
  warehouseButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  warehouseButton: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  warehouseButtonSelected: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  warehouseButtonText: {
    fontSize: 12,
    color: "#64748b",
  },
  warehouseButtonTextSelected: {
    color: "#2563eb",
    fontWeight: "bold",
  },
  warehouseStock: {
    fontSize: 10,
    color: "#94a3b8",
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    color: "#1e293b",
  },
  notesInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    color: "#1e293b",
    textAlignVertical: "top",
  },
  confirmButton: {
    height: 48,
    borderRadius: 4,
    overflow: "hidden",
  },
  confirmGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonText: {
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
