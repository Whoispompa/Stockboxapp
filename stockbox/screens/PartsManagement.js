import React, { useState, useEffect } from "react"; // Añade useEffect aquí
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  RefreshControl, // Añade este import
   Alert, // ¡Añade esto!
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { toast } from "sonner-native";

const API_BASE_URL = "http://193.203.165.112:4000/api/product";
const PRODUCTS_ENDPOINT = `${API_BASE_URL}/all`;
const CATEGORY_API_URL = "http://193.203.165.112:4000/api/category";

const warehouses = [
  { id: 1, name: "Almacén A" },
  { id: 2, name: "Almacén B" },
];

const initialFormState = {
  id: null,
  sku: "",
  name: "",
  description: "",
  quantity: "",
  warehouseId: "", // No hay valor por defecto
  categoryId: "", // No hay valor por defecto
};

export default function PartsManagementScreen({ navigation }) {
  const [parts, setParts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Cargar datos iniciales
  const loadInitialData = async () => {
    try {
      // Cargar categorías
      const categoriesResponse = await fetch(CATEGORY_API_URL);
      const categoriesData = await categoriesResponse.json();
      setCategories(categoriesData);

      // Cargar productos
      await fetchProducts();
    } catch (error) {
      console.error("Error loading initial data:", error);
      Alert.alert("Error", "No se pudieron cargar los datos iniciales");
    } finally {
      setLoading(false);
    }
  };

  // Obtener productos
  const fetchProducts = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(PRODUCTS_ENDPOINT);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const transformedData = data.map((item) => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        description: item.description,
        quantity: item.stock?.quantity || 0,
        warehouseName:
          warehouses.find((w) => w.id === item.stock?.warehouseId)?.name ||
          "Almacén no asignado",
        warehouseId: item.stock?.warehouseId,
        categoryName:
          categories.find((c) => c.id === item.categoryId)?.name ||
          "Sin categoría",
        categoryId: item.categoryId,
      }));

      setParts(transformedData);
    } catch (error) {
      console.error("Error fetching products:", error);
      Alert.alert("Error", "No se pudieron cargar los productos");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Validación del formulario
  const validateForm = () => {
    const newErrors = {};
    if (!formData.sku) newErrors.sku = "El SKU es requerido";
    if (!formData.name) newErrors.name = "El nombre es requerido";
    if (!formData.quantity) newErrors.quantity = "La cantidad es requerida";
    if (isNaN(formData.quantity)) newErrors.quantity = "Debe ser un número";
    if (!formData.warehouseId) newErrors.warehouseId = "Seleccione un almacén";
    if (!formData.categoryId) newErrors.categoryId = "Seleccione una categoría";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enviar formulario
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const productData = {
        sku: formData.sku,
        name: formData.name,
        description: formData.description,
        categoryId: formData.categoryId,
        stock: {
          warehouseId: formData.warehouseId,
          quantity: parseInt(formData.quantity, 10),
        },
      };

      const url = isEditing
        ? `${API_BASE_URL}/update/${formData.id}`
        : `${API_BASE_URL}/create`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error en la operación");
      }

      Alert.alert(
        "Éxito",
        isEditing ? "Producto actualizado" : "Producto creado"
      );
      await fetchProducts();
      resetForm();
    } catch (error) {
      console.error("Submission error:", error);
      Alert.alert("Error", error.message);
    }
  };

  // Editar producto
  const handleEdit = (product) => {
    setFormData({
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      quantity: product.quantity.toString(),
      warehouseId: product.warehouseId,
      categoryId: product.categoryId,
    });
    setIsEditing(true);
    setShowForm(true);
  };

  // Eliminar producto
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el producto");
      }

      Alert.alert("Éxito", "Producto eliminado correctamente");
      await fetchProducts();
    } catch (error) {
      console.error("Delete error:", error);
      Alert.alert("Error", error.message);
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    setShowForm(false);
    setErrors({});
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
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
        <Text style={styles.headerTitle}>Gestión de Inventario</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchProducts}
            colors={["#2563eb"]}
          />
        }
      >
        {/* Botón para mostrar/ocultar formulario */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowForm(!showForm)}
        >
          <LinearGradient
            colors={["#2563eb", "#1d4ed8"]}
            style={styles.gradientButton}
          >
            <MaterialCommunityIcons
              name={showForm ? "minus" : "plus"}
              size={24}
              color="white"
            />
            <Text style={styles.addButtonText}>
              {showForm ? "Cancelar" : "Nuevo Producto"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Formulario */}
        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>
              {isEditing ? "Editar Producto" : "Nuevo Producto"}
            </Text>

            {/* Campos del formulario */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>SKU*</Text>
              <TextInput
                style={[styles.input, errors.sku && styles.inputError]}
                value={formData.sku}
                onChangeText={(text) => setFormData({ ...formData, sku: text })}
                placeholder="SKU*"
                editable={!isEditing}
              />
              {errors.sku && <Text style={styles.errorText}>{errors.sku}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre*</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
                placeholder="Nombre del producto"
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={styles.input}
                value={formData.description}
                onChangeText={(text) =>
                  setFormData({ ...formData, description: text })
                }
                placeholder="Descripción detallada"
                multiline
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Cantidad*</Text>
              <TextInput
                style={[styles.input, errors.quantity && styles.inputError]}
                value={formData.quantity}
                onChangeText={(text) =>
                  setFormData({ ...formData, quantity: text })
                }
                keyboardType="numeric"
                placeholder="Cantidad en stock"
              />
              {errors.quantity && (
                <Text style={styles.errorText}>{errors.quantity}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Almacén*</Text>
              <TouchableOpacity
                style={[
                  styles.dropdown,
                  errors.warehouseId && styles.inputError,
                ]}
                onPress={() => {
                  Alert.alert(
                    "Seleccionar Almacén",
                    null, // Cambiar el segundo argumento a null o un mensaje
                    warehouses.map((warehouse) => ({
                      text: warehouse.name,
                      onPress: () => {
                        setFormData({ ...formData, warehouseId: warehouse.id });
                        setErrors({ ...errors, warehouseId: null });
                      },
                    }))
                  );
                }}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    !formData.warehouseId && styles.placeholderText,
                  ]}
                >
                  {formData.warehouseId
                    ? warehouses.find((w) => w.id === formData.warehouseId).name
                    : "Seleccionar almacén"}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={24}
                  color="#64748b"
                />
              </TouchableOpacity>
              {errors.warehouseId && (
                <Text style={styles.errorText}>{errors.warehouseId}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Categoría*</Text>
              <TouchableOpacity
                style={[
                  styles.dropdown,
                  errors.categoryId && styles.inputError,
                ]}
                onPress={() => {
                  Alert.alert(
                    "Seleccionar Categoría",
                    null,
                    categories.map((category) => ({
                      text: category.name,
                      onPress: () => {
                        setFormData({ ...formData, categoryId: category.id });
                        setErrors({ ...errors, categoryId: null });
                      },
                    }))
                  );
                }}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    !formData.categoryId && styles.placeholderText,
                  ]}
                >
                  {formData.categoryId
                    ? categories.find((c) => c.id === formData.categoryId).name
                    : "Seleccionar categoría"}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={24}
                  color="#64748b"
                />
              </TouchableOpacity>
              {errors.categoryId && (
                <Text style={styles.errorText}>{errors.categoryId}</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <LinearGradient
                colors={["#2563eb", "#1d4ed8"]}
                style={styles.gradientButton}
              >
                <Text style={styles.submitButtonText}>
                  {isEditing ? "Actualizar" : "Guardar"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Lista de Productos */}
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Inventario de Productos</Text>

          {parts.length === 0 ? (
            <Text style={styles.emptyText}>No hay productos registrados</Text>
          ) : (
            parts.map((product) => (
              <View
                key={`${product.id}-${product.warehouseId}`}
                style={styles.partItem}
              >
                <View style={styles.partHeader}>
                  <View>
                    <Text style={styles.partCode}>{product.sku}</Text>
                    <Text style={styles.partName}>{product.name}</Text>
                    <Text style={styles.partCategory}>
                      {product.categoryName}
                    </Text>
                  </View>
                  <View style={styles.stockIndicator}>
                    <Text style={styles.stockText}>
                      Stock: {product.quantity}
                    </Text>
                  </View>
                </View>

                <View style={styles.partDetails}>
                  <Text style={styles.partDescription}>
                    {product.description}
                  </Text>
                  <Text style={styles.partLocation}>
                    Almacén: {product.warehouseName}
                  </Text>
                </View>

                <View style={styles.partActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEdit(product)}
                  >
                    <MaterialCommunityIcons
                      name="pencil"
                      size={20}
                      color="#2563eb"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(product.id)}
                  >
                    <MaterialCommunityIcons
                      name="delete"
                      size={20}
                      color="#ef4444"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // ... (mantener los estilos existentes)
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  dropdownSelected: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  dropdownText: {
    fontSize: 16,
    color: "#1e293b",
  },
  placeholderText: {
    color: "#94a3b8",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#ffffff",
    padding: 20,
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
  content: {
    flex: 1,
    padding: 20,
  },
  addButton: {
    marginBottom: 20,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 12,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  form: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 15,
  },
  row: {
    flexDirection: "row",
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1e293b",
  },
  inputError: {
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 5,
  },
  submitButton: {
    marginTop: 20,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  listContainer: {
    marginTop: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 15,
  },
  partItem: {
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
  partHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  partCode: {
    fontSize: 14,
    color: "#64748b",
  },
  partName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
  },
  stockIndicator: {
    backgroundColor: "#f1f5f9",
    padding: 6,
    borderRadius: 6,
  },
  stockText: {
    fontSize: 14,
    color: "#64748b",
  },
  stockLow: {
    color: "#ef4444",
  },
  stockHigh: {
    color: "#22c55e",
  },
  partDetails: {
    marginBottom: 10,
  },
  partDescription: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 5,
  },
  partLocation: {
    fontSize: 14,
    color: "#64748b",
  },
  partActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  editButton: {
    backgroundColor: "#dbeafe",
  },
  deleteButton: {
    backgroundColor: "#fee2e2",
  },
  emptyText: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 16,
    marginTop: 20,
  },
});
