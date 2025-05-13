import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const MOCK_PARTS = [
  {
    id: '1',
    code: 'MOT-3HP-001',
    name: 'Motor 3HP Siemens',
    description: 'Motor trifásico 3HP 220V',
    category: 'Motores',
    location: 'A-123',
    stock: 5,
    minStock: 2,
    maxStock: 10,
    lastMovement: '2024-04-08',
  },
  {
    id: '2',
    code: 'ROD-6205-001',
    name: 'Rodamiento 6205',
    description: 'Rodamiento de bolas SKF',
    category: 'Rodamientos',
    location: 'B-234',
    stock: 15,
    minStock: 5,
    maxStock: 20,
    lastMovement: '2024-04-07',
  },
  {
    id: '3',
    code: 'FIL-AIR-001',
    name: 'Filtro de Aire',
    description: 'Filtro de aire industrial',
    category: 'Filtros',
    location: 'C-345',
    stock: 8,
    minStock: 3,
    maxStock: 15,
    lastMovement: '2024-04-06',
  },
];

export default function SearchScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [stockFilter, setStockFilter] = useState('all'); // all, low, normal, high

  const categories = ['Motores', 'Rodamientos', 'Filtros'];

  const filterParts = () => {
    return MOCK_PARTS.filter(part => {
      const matchesSearch = 
        part.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        part.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = 
        !selectedCategory || part.category === selectedCategory;

      const matchesStock = (() => {
        switch (stockFilter) {
          case 'low':
            return part.stock <= part.minStock;
          case 'normal':
            return part.stock > part.minStock && part.stock < part.maxStock;
          case 'high':
            return part.stock >= part.maxStock;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesCategory && matchesStock;
    });
  };

  const getStockStatus = (part) => {
    if (part.stock <= part.minStock) return { color: '#ef4444', text: 'Bajo' };
    if (part.stock >= part.maxStock) return { color: '#22c55e', text: 'Alto' };
    return { color: '#f59e0b', text: 'Normal' };
  };

  const filteredParts = filterParts();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#64748b" />
          <Text style={styles.backButtonText}>Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Búsqueda de Refacciones</Text>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={24} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por código, nombre o descripción..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <MaterialCommunityIcons 
              name={showFilters ? "filter-off" : "filter"} 
              size={24} 
              color="#64748b" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtros */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          {/* Categorías */}
          <Text style={styles.filterTitle}>Categorías</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                !selectedCategory && styles.categoryChipSelected
              ]}
              onPress={() => setSelectedCategory('')}
            >
              <Text style={[
                styles.categoryChipText,
                !selectedCategory && styles.categoryChipTextSelected
              ]}>
                Todas
              </Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipSelected
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === category && styles.categoryChipTextSelected
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Filtro de Stock */}
          <Text style={styles.filterTitle}>Nivel de Stock</Text>
          <View style={styles.stockFilterContainer}>
            {[
              { id: 'all', label: 'Todos' },
              { id: 'low', label: 'Bajo' },
              { id: 'normal', label: 'Normal' },
              { id: 'high', label: 'Alto' }
            ].map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.stockFilterChip,
                  stockFilter === filter.id && styles.stockFilterChipSelected
                ]}
                onPress={() => setStockFilter(filter.id)}
              >
                <Text style={[
                  styles.stockFilterChipText,
                  stockFilter === filter.id && styles.stockFilterChipTextSelected
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Lista de resultados */}
      <ScrollView style={styles.resultsList}>
        {filteredParts.map((part) => {
          const stockStatus = getStockStatus(part);
          return (
            <View key={part.id} style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View>
                  <Text style={styles.resultCode}>{part.code}</Text>
                  <Text style={styles.resultName}>{part.name}</Text>
                </View>
                <View style={[styles.stockBadge, { backgroundColor: `${stockStatus.color}15` }]}>
                  <Text style={[styles.stockBadgeText, { color: stockStatus.color }]}>
                    {stockStatus.text}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.resultDescription}>{part.description}</Text>
              
              <View style={styles.resultDetails}>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="tag" size={16} color="#64748b" />
                  <Text style={styles.detailText}>{part.category}</Text>
                </View>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="map-marker" size={16} color="#64748b" />
                  <Text style={styles.detailText}>{part.location}</Text>
                </View>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="package-variant" size={16} color="#64748b" />
                  <Text style={styles.detailText}>Stock: {part.stock}</Text>
                </View>
              </View>

              <View style={styles.resultActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#eff6ff' }]}
                  onPress={() => navigation.navigate('PartsManagement')}
                >
                  <MaterialCommunityIcons name="pencil" size={20} color="#2563eb" />
                  <Text style={[styles.actionButtonText, { color: '#2563eb' }]}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#f0fdf4' }]}
                  onPress={() => navigation.navigate('Transfer')}
                >
                  <MaterialCommunityIcons name="transfer" size={20} color="#22c55e" />
                  <Text style={[styles.actionButtonText, { color: '#22c55e' }]}>Trasladar</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        {filteredParts.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="file-search" size={48} color="#94a3b8" />
            <Text style={styles.emptyStateText}>No se encontraron resultados</Text>
            <Text style={styles.emptyStateSubtext}>Intenta con otros términos de búsqueda</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#64748b',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#1e293b',
  },
  filterButton: {
    padding: 5,
  },
  filtersContainer: {
    padding: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 10,
  },
  categoriesContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#2563eb',
  },
  categoryChipText: {
    color: '#64748b',
    fontSize: 14,
  },
  categoryChipTextSelected: {
    color: '#ffffff',
  },
  stockFilterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stockFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  stockFilterChipSelected: {
    backgroundColor: '#2563eb',
  },
  stockFilterChipText: {
    color: '#64748b',
    fontSize: 14,
  },
  stockFilterChipTextSelected: {
    color: '#ffffff',
  },
  resultsList: {
    flex: 1,
    padding: 15,
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  resultCode: {
    fontSize: 14,
    color: '#64748b',
  },
  resultName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 2,
  },
  stockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  resultDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  resultDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#64748b',
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
});