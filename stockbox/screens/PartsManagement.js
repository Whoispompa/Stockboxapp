import React, { useState, useEffect } from 'react';
import { addMovement } from "../utils/movementUtils";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PartsManagementScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [parts, setParts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [newPart, setNewPart] = useState({
    sku: '',
    name: '',
    description: '',
    categoryId: null,
    quantity: 0,
    warehouseId: null,
  });
  const [selectedPart, setSelectedPart] = useState(null);
  const [additionalStock, setAdditionalStock] = useState(0);
  

  // Cargar almacenes al montar el componente
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const response = await axios.get(
          'http://193.203.165.112:4000/api/warehouse/all',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setWarehouses(response.data);
        if (response.data.length > 0) {
          setNewPart((prev) => ({
            ...prev,
            warehouseId: response.data[0].id,
          }));
        }
      } catch (error) {
        Alert.alert('Error', 'No se pudieron cargar los almacenes');
      }
    };
    fetchWarehouses();
  }, []);

  // Cargar categorías al montar el componente
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const response = await axios.get(
          'http://193.203.165.112:4000/api/category',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setCategories(response.data);
        if (response.data.length > 0) {
          setNewPart((prev) => ({
            ...prev,
            categoryId: response.data[0].id,
          }));
        }
      } catch (error) {
        Alert.alert('Error', 'No se pudieron cargar las categorías');
      }
    };
    fetchCategories();
  }, []);

  // Cargar productos al montar el componente
  useEffect(() => {
    fetchParts();
  }, []);

  // Función para cargar productos
  const fetchParts = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(
        'http://193.203.165.112:4000/api/product/all',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setParts(response.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el stock de productos');
    }
  };

  // Crear producto
  const handleAddPart = async () => {
    if (!newPart.sku.trim() || !newPart.name.trim()) {
      Alert.alert('Error', 'Por favor, completa los campos obligatorios: SKU y Nombre.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.post(
        'http://193.203.165.112:4000/api/product/create',
        {
          sku: newPart.sku,
          name: newPart.name,
          description: newPart.description,
          categoryId: Number(newPart.categoryId),
          quantity: Number(newPart.quantity),
          warehouseId: Number(newPart.warehouseId),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      Alert.alert('Éxito', 'Producto creado exitosamente');
      
      await fetchParts();
      setNewPart({
        sku: '',
        name: '',
        description: '',
        categoryId: categories.length > 0 ? categories[0].id : null,
        quantity: 0,
        warehouseId: warehouses.length > 0 ? warehouses[0].id : null,
        
      });
      setModalVisible(false);

      
      // Agrega movimiento de refacción
      await addMovement({
        id: Date.now(),
        type: "refaccion",
        item: `Refacción: ${newPart.name}`,
        quantity: Number(newPart.quantity),
        date: new Date().toLocaleString(),
      });
    } catch (error) {
      Alert.alert('Error', 'Error al crear el producto');
    }
  };

  // Actualizar stock
  const handleEditPart = async () => {
    if (selectedPart) {
      try {
        const token = await AsyncStorage.getItem('authToken');
        await axios.patch(
          `http://193.203.165.112:4000/api/product/update/${selectedPart.id}`,
          {
            quantity: selectedPart.quantity + additionalStock,
            warehouseId: selectedPart.warehouseId,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        Alert.alert('Éxito', 'Stock actualizado exitosamente');
        await fetchParts();
        setEditModalVisible(false);
        setAdditionalStock(0);

        
        // Agrega movimiento de actualización de stock
        await addMovement({
          id: Date.now(),
          type: "stock",
          item: `Stock actualizado: ${selectedPart.name}`,
          quantity: Number(additionalStock),
          date: new Date().toLocaleString(),
        });
      } catch (error) {
        Alert.alert('Error', 'Error al actualizar el stock');
      }
    }
  };

  // Obtener nombre del almacén
  const getWarehouseName = (item) => {
    if (item.warehouseName) return item.warehouseName;
    return (
      warehouses.find((w) => Number(w.id) === Number(item.warehouseId))?.name ||
      'Desconocido'
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="arrow-back" size={24} color="#007bff" />
          <Text style={styles.backButtonText}>Menú</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Gestión de Productos</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>Nuevo Producto</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#6c757d" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar productos..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Parts List */}
      <FlatList
        data={parts.filter((part) =>
          part.name.toLowerCase().includes(searchQuery.toLowerCase())
        )}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={({ item }) => (
          <View style={styles.partCard}>
            <View style={styles.partHeader}>
              <Text style={styles.partCode}>{item.sku}</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  setSelectedPart(item);
                  setEditModalVisible(true);
                }}
              >
                <Ionicons name="create-outline" size={20} color="#007bff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.partName}>{item.name}</Text>
            <Text style={styles.partDescription}>{item.description}</Text>
            <Text style={styles.partCategory}>
              Categoría: {categories.find((c) => c.id === item.categoryId)?.name}
            </Text>
            <View style={styles.partFooter}>
              <Text style={styles.partLocation}>
                <Ionicons name="location-outline" size={16} />{' '}
                Almacenado en: {getWarehouseName(item)}
              </Text>
              <Text style={styles.partStock}>
                Stock: {item.quantity}{' '}
                <Ionicons
                  name={item.quantity > 0 ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
                  size={16}
                  color={item.quantity > 0 ? 'green' : 'red'}
                />
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay productos disponibles.</Text>
        }
      />

      {/* Add Part Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo Producto</Text>
            <TextInput
              style={styles.input}
              placeholder="SKU *"
              value={newPart.sku}
              onChangeText={(text) => setNewPart({ ...newPart, sku: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Nombre *"
              value={newPart.name}
              onChangeText={(text) => setNewPart({ ...newPart, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Descripción"
              value={newPart.description}
              onChangeText={(text) =>
                setNewPart({ ...newPart, description: text })
              }
            />
            <Text style={styles.label}>Categoría</Text>
            <Picker
              selectedValue={newPart.categoryId}
              onValueChange={(itemValue) =>
                setNewPart({ ...newPart, categoryId: Number(itemValue) })
              }
              style={styles.picker}
            >
              {categories.map((cat) => (
                <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
              ))}
            </Picker>
            <Text style={styles.label}>Almacén</Text>
            <Picker
              selectedValue={newPart.warehouseId}
              onValueChange={(itemValue) =>
                setNewPart({ ...newPart, warehouseId: itemValue })
              }
              style={styles.picker}
            >
              {warehouses.map((w) => (
                <Picker.Item key={w.id} label={w.name} value={w.id} />
              ))}
            </Picker>
            <Text style={styles.label}>Stock Inicial: {newPart.quantity}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={newPart.quantity}
              onValueChange={(value) =>
                setNewPart({ ...newPart, quantity: Math.round(value) })
              }
              minimumTrackTintColor="#007bff"
              maximumTrackTintColor="#dee2e6"
              thumbTintColor="#007bff"
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleAddPart}>
              <Text style={styles.saveButtonText}>Guardar Producto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close-outline" size={24} color="#6c757d" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Part Modal */}
      {selectedPart && (
        <Modal visible={editModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Actualizar Stock</Text>
              <Text style={styles.label}>
                Stock Actual: {selectedPart.quantity}
              </Text>
              <Text style={styles.label}>
                Stock Adicional: {additionalStock}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={additionalStock}
                onValueChange={(value) => setAdditionalStock(Math.round(value))}
                minimumTrackTintColor="#007bff"
                maximumTrackTintColor="#dee2e6"
                thumbTintColor="#007bff"
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleEditPart}
              >
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setEditModalVisible(false);
                  setAdditionalStock(0);
                }}
              >
                <Ionicons name="close-outline" size={24} color="#6c757d" />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  backButtonText: {
    color: '#007bff',
    fontSize: 16,
    marginLeft: 5,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 15,
    backgroundColor: '#ffffff',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#495057',
    marginLeft: 10,
  },
  partCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  partHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212529',
  },
  editButton: {
    padding: 5,
  },
  partName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
    marginTop: 5,
  },
  partDescription: {
    fontSize: 14,
    color: '#495057',
    marginTop: 5,
  },
  partCategory: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 5,
  },
  partFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  partLocation: {
    fontSize: 14,
    color: '#6c757d',
  },
  partStock: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212529',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6c757d',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    width: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 14,
    color: '#495057',
  },
  label: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 5,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 15,
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  saveButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeButton: {
    alignSelf: 'center',
    marginTop: 10,
  },
});
