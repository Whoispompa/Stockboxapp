import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const API_BASE_URL = "http://193.203.165.112:4000/api";
const PRODUCTS_ENDPOINT = `${API_BASE_URL}/product/all`;
const PRODUCTS_CREATE_URL = `${API_BASE_URL}/product/create`;
const CATEGORY_API_URL = "http://193.203.165.112:4000/api/category";
const WAREHOUSE_API_URL = "http://193.203.165.112:4000/api/warehouse/all";

const initialFormState = {
  id: null,
  sku: "",
  name: "",
  description: "",
  quantity: "",
  warehouseId: "",
  categoryId: "",
};

export default function PartsManagementScreen({ navigation }) {
  const [parts, setParts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Cargar datos iniciales
  const loadInitialData = async () => {
    try {
      setLoading(true);
      await fetchCategories(); // Cargar categorías primero
      await fetchWarehouses(); // Luego cargar almacenes
      await fetchProducts(); // Finalmente cargar productos
    } catch (error) {
      console.error("Error loading initial data:", error);
      Alert.alert("Error", "No se pudieron cargar los datos iniciales");
    } finally {
      setLoading(false);
    }
  };

  // Obtener categorías
  const fetchCategories = async () => {
    try {
      const response = await fetch(CATEGORY_API_URL);
      if (!response.ok) throw new Error("Error al cargar categorías");
      const data = await response.json();
      console.log("Categorías cargadas:", data); // Depuración
      if (!Array.isArray(data)) throw new Error("Formato de datos inválido");
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      Alert.alert("Error", "No se pudieron cargar las categorías");
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await fetch(WAREHOUSE_API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzQ3MTYxMTMzLCJleHAiOjE3NDcxNjQ3MzN9.lHqtFhEwcfgef48ZZIw08BV_atnIPsd9txcPzUIr0AU",
        },
      });

      if (!response.ok) throw new Error("Error al cargar almacenes");
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Formato de datos inválido");
      setWarehouses(data);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      Alert.alert("Error", "No se pudieron cargar los almacenes");
    }
  };

  // Obtener productos
    const fetchProducts = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(PRODUCTS_ENDPOINT);
      if (!response.ok) throw new Error("Error al cargar productos");
  
      const data = await response.json();
  
      const transformedData = data.map((item) => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        description: item.description,
        quantity: item.quantity || 0,
        warehouseName:
          warehouses.find((w) => w.id === item.warehouseId)?.name ||
          "Almacén no asignado",
        warehouseId: item.warehouseId,
        categoryName:
          categories.find((c) => c.id === item.categoryId)?.name ||
          "Sin categoría",
        categoryId: item.categoryId,
      }));
  
      console.log("Productos transformados:", transformedData); // Depuración
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

  // Actualizar partes cuando cambian warehouses o categories
  useEffect(() => {
    if (warehouses.length > 0 && categories.length > 0 && parts.length > 0) {
      const updatedParts = parts.map((item) => ({
        ...item,
        warehouseName:
          warehouses.find((w) => w.id === item.warehouseId)?.name ||
          "Almacén no asignado",
        categoryName:
          categories.find((c) => c.id === item.categoryId)?.name ||
          "Sin categoría",
      }));
      setParts(updatedParts);
    }
  }, [warehouses, categories]);

    useEffect(() => {
    console.log("Categorías cargadas:", categories);
    console.log("Almacenes cargados:", warehouses);
    console.log("Productos cargados:", parts);
  }, [categories, warehouses, parts]);

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
        warehouseId: formData.warehouseId,
        quantity: parseInt(formData.quantity, 10), // Asegurarse de que sea un número
      };

      const url = isEditing
        ? `${API_BASE_URL}/product/update/${formData.id}`
        : PRODUCTS_CREATE_URL;

      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
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
      Alert.alert("Error", error.message || "Error al guardar el producto");
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
      Alert.alert(
        "Confirmar eliminación",
        "¿Estás seguro de que deseas eliminar este producto?",
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Eliminar",
            onPress: async () => {
              const response = await fetch(`${API_BASE_URL}/delete/${id}`, {
                method: "DELETE",
              });

              if (!response.ok) {
                throw new Error("Error al eliminar el producto");
              }

              Alert.alert("Éxito", "Producto eliminado correctamente");
              await fetchProducts();
            },
            style: "destructive",
          },
        ]
      );
    } catch (error) {
      console.error("Delete error:", error);
      Alert.alert("Error", error.message || "Error al eliminar el producto");
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
                  if (warehouses.length === 0) {
                    Alert.alert("Error", "No hay almacenes disponibles");
                    return;
                  }
                  Alert.alert(
                    "Seleccionar Almacén",
                    null,
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
                    ? warehouses.find((w) => w.id === formData.warehouseId)
                        ?.name
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
                  if (categories.length === 0) {
                    Alert.alert("Error", "No hay categorías disponibles");
                    return;
                  }
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
                    ? categories.find((c) => c.id === formData.categoryId)?.name
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
                    {product.description || "Sin descripción"}
                  </Text>
                  <Text style={styles.partLocation}>
                    Almacén: {product.warehouseName}
                  </Text>
                  <Text style={styles.partCategory}>
                    Categoría: {product.categoryName}
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
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
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
  content: {
    flex: 1,
    padding: 16,
  },
  addButton: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
  },
  form: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#1e293b",
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    color: "#475569",
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f8fafc",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f8fafc",
  },
  dropdownText: {
    color: "#1e293b",
  },
  placeholderText: {
    color: "#94a3b8",
  },
  submitButton: {
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 8,
  },
  submitButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  listContainer: {
    marginTop: 8,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#1e293b",
  },
  emptyText: {
    textAlign: "center",
    color: "#64748b",
    marginTop: 32,
  },
  partItem: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  partHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  partCode: {
    fontSize: 14,
    color: "#64748b",
  },
  partName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
  },
  partCategory: {
    fontSize: 14,
    color: "#475569",
  },
  stockIndicator: {
    backgroundColor: "#e0f2fe",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  stockText: {
    color: "#0369a1",
    fontWeight: "bold",
  },
  partDetails: {
    marginBottom: 12,
  },
  partDescription: {
    color: "#475569",
    marginBottom: 8,
  },
  partLocation: {
    color: "#64748b",
    fontSize: 14,
  },
  partActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    padding: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: "#dbeafe",
  },
  deleteButton: {
    backgroundColor: "#fee2e2",
  },
});
