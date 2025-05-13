import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const ReportScreen = ({ navigation }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const reportData = {
    stockBajo: 5,
    transferencias: 28,
    entradas: 45,
    salidas: 32
  };

  const reportTypes = [
    {
      title: 'Stock Bajo',
      value: reportData.stockBajo,
      icon: 'alert-circle',
      color: '#ef4444',
      description: 'Refacciones con stock crítico'
    },
    {
      title: 'Transferencias',
      value: reportData.transferencias,
      icon: 'transfer',
      color: '#2563eb',
      description: 'Total de transferencias realizadas'
    },
    {
      title: 'Entradas',
      value: reportData.entradas,
      icon: 'arrow-down-circle',
      color: '#22c55e',
      description: 'Total de entradas al almacén'
    },
    {
      title: 'Salidas',
      value: reportData.salidas,
      icon: 'arrow-up-circle',
      color: '#f59e0b',
      description: 'Total de salidas del almacén'
    }
  ];

  const timePeriods = [
    { id: 'week', label: 'Última Semana' },
    { id: 'month', label: 'Último Mes' },
    { id: 'year', label: 'Último Año' }
  ];

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
          onPress={() => navigation.navigate('Home')}
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
              selectedPeriod === period.id && styles.periodButtonSelected
            ]}
            onPress={() => setSelectedPeriod(period.id)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period.id && styles.periodButtonTextSelected
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
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['#2563eb', '#1d4ed8']}
              style={styles.actionGradient}
            >
              <MaterialCommunityIcons name="file-pdf-box" size={24} color="white" />
              <Text style={styles.actionButtonText}>Exportar PDF</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.actionGradient}
            >
              <MaterialCommunityIcons name="microsoft-excel" size={24} color="white" />
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
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
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
  periodFilter: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#f1f5f9',
  },
  periodButtonSelected: {
    backgroundColor: '#eff6ff',
  },
  periodButtonText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
  },
  periodButtonTextSelected: {
    color: '#2563eb',
    fontWeight: '500',
  },
  reportsContainer: {
    flex: 1,
    padding: 15,
  },
  reportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  reportCard: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradientBackground: {
    padding: 15,
  },
  reportCardContent: {
    alignItems: 'flex-start',
  },
  reportCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  reportValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 12,
    color: '#64748b',
  },
  actionsContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default ReportScreen;