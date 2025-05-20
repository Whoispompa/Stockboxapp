import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SearchScreen({ navigation }) {
  const [parts, setParts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState(['Todas']);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedStockLevel, setSelectedStockLevel] = useState('Todos');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        // Productos
        const response = await axios.get(
          'http://193.203.165.112:4000/api/product/all',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setParts(response.data);

        // Categorías
        const catRes = await axios.get(
          'http://193.203.165.112:4000/api/category',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setCategories(['Todas', ...catRes.data.map((c) => c.name)]);
      } catch (error) {
        Alert.alert('Error', 'No se pudieron cargar los datos');
      }
    };
    fetchData();
  }, []);

  const STOCK_LEVELS = ['Todos', 'Bajo', 'Normal', 'Alto'];

  const getStockLevel = (quantity) => {
    if (quantity <= 5) return 'Bajo';
    if (quantity <= 15) return 'Normal';
    return 'Alto';
  };

  const filteredParts = parts.filter((part) => {
    const matchesSearch =
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'Todas' ||
      part.categoryName === selectedCategory;
    const stockLevel = getStockLevel(part.quantity);
    const matchesStockLevel =
      selectedStockLevel === 'Todos' || stockLevel === selectedStockLevel;
    return matchesSearch && matchesCategory && matchesStockLevel;
  });

  const handleEdit = (item) => {
    navigation.navigate('PartsManagement', { partId: item.id });
  };

  const handleTransfer = (item) => {
    navigation.navigate('Transfer', { partId: item.id });
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
        <Text style={styles.title}>Búsqueda de Refacciones</Text>
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
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Ionicons name="close-outline" size={20} color="#6c757d" />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <Text style={styles.sectionTitle}>Categorías</Text>
      <View style={styles.filterContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.filterButton,
              selectedCategory === category && styles.activeFilterButton,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.filterText,
                selectedCategory === category && styles.activeFilterText,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stock Levels */}
      <Text style={styles.sectionTitle}>Nivel de Stock</Text>
      <View style={styles.filterContainer}>
        {STOCK_LEVELS.map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.filterButton,
              selectedStockLevel === level && styles.activeFilterButton,
            ]}
            onPress={() => setSelectedStockLevel(level)}
          >
            <Text
              style={[
                styles.filterText,
                selectedStockLevel === level && styles.activeFilterText,
              ]}
            >
              {level}
            </Text>
          </TouchableOpacity>
        ))}
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
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: '#6c757d', marginTop: 40 }}>
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
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
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
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#495057',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 10,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  filterButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#e9ecef',
    marginRight: 10,
    marginBottom: 10,
  },
  activeFilterButton: {
    backgroundColor: '#007bff',
  },
  filterText: {
    fontSize: 14,
    color: '#495057',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  partCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  partCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007bff',
  },
  partName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginTop: 5,
  },
  partDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 10,
  },
  partDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  partDetail: {
    fontSize: 14,
    color: '#6c757d',
    marginRight: 10,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  transferButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 5,
  },
});