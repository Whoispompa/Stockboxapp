import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { toast } from 'sonner-native';

// Mock data for users
const initialUsers = [
  {
    id: '1',
    name: 'Juan Pérez',
    email: 'juan@example.com',
    role: 'admin',
    status: 'active',
  },
  {
    id: '2',
    name: 'María García',
    email: 'maria@example.com',
    role: 'user',
    status: 'active',
  },
];

const ROLES = [
  { id: 'admin', label: 'Administrador' },
  { id: 'supervisor', label: 'Supervisor' },
  { id: 'user', label: 'Usuario' },
];

export default function UserScreen({ navigation }) {
  const [users, setUsers] = useState(initialUsers);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState(null);  // Form state
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    password: '',
    role: '',
  });
  
  const resetForm = () => {
    setFormData({
      employeeId: '',
      name: '',
      email: '',
      password: '',
      role: '',
    });
    setEditingUser(null);
  };

  const handleCreateUser = () => {
    // Validaciones
    if (!formData.name || !formData.email || (!editingUser && !formData.password) || !formData.role) {
      toast.error('Todos los campos son requeridos');
      return;
    }

    if (!formData.email.includes('@')) {
      toast.error('Email inválido');
      return;
    }

    if (!editingUser && formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (editingUser) {
      // Actualizar usuario existente
      setUsers(users.map(user => 
        user.id === editingUser.id 
          ? { ...user, ...formData }
          : user
      ));
      toast.success('Usuario actualizado exitosamente');
    } else {
      // Crear nuevo usuario
      const newUser = {
        id: Date.now().toString(),
        ...formData,
        status: 'active',
      };
      setUsers([...users, newUser]);
      toast.success('Usuario creado exitosamente');
    }

    setModalVisible(false);
    resetForm();
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
    });
    setModalVisible(true);
  };

  const handleDeleteUser = (userId) => {
    setUsers(users.filter(user => user.id !== userId));
    toast.success('Usuario eliminado exitosamente');
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
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
          <Text style={styles.backButtonText}></Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
      </View>

      {/* Barra de búsqueda y botón de crear */}
      <View style={styles.actionBar}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={24} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar usuarios..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <LinearGradient
            colors={['#2563eb', '#1d4ed8']}
            style={styles.addButtonGradient}
          >
            <MaterialCommunityIcons name="plus" size={24} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Lista de usuarios */}
      <ScrollView style={styles.usersList}>
        {filteredUsers.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userInfo}>
              <View style={styles.userHeader}>
                <Text style={styles.userName}>{user.name}</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: user.status === 'active' ? '#22c55e20' : '#ef444420' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: user.status === 'active' ? '#22c55e' : '#ef4444' }
                  ]}>
                    {user.status === 'active' ? 'Activo' : 'Inactivo'}
                  </Text>
                </View>
              </View>              <Text style={styles.userEmployeeId}>No. Empleado: {user.employeeId}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userRole}>
                {ROLES.find(r => r.id === user.role)?.label || user.role}
              </Text>
            </View>
            <View style={styles.userActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => handleEditUser(user)}
              >
                <MaterialCommunityIcons name="pencil" size={20} color="#2563eb" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteUser(user.id)}
              >
                <MaterialCommunityIcons name="delete" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {filteredUsers.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-search" size={48} color="#94a3b8" />
            <Text style={styles.emptyStateText}>No se encontraron usuarios</Text>
          </View>
        )}
      </ScrollView>

      {/* Modal para crear/editar usuario */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <MaterialCommunityIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>              <View style={styles.formGroup}>
                <Text style={styles.label}>No. Empleado</Text>
                <TextInput
                  style={styles.input}
                  value={formData.employeeId}
                  onChangeText={(text) => setFormData({ ...formData, employeeId: text })}
                  placeholder="Ingrese el número de empleado"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nombre completo</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Ingrese el nombre completo"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Correo electrónico</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="Ingrese el correo electrónico"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  {editingUser ? 'Contraseña (dejar en blanco para mantener)' : 'Contraseña'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  placeholder="Ingrese la contraseña"
                  secureTextEntry
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Rol</Text>
                <View style={styles.roleButtons}>
                  {ROLES.map((role) => (
                    <TouchableOpacity
                      key={role.id}
                      style={[
                        styles.roleButton,
                        formData.role === role.id && styles.roleButtonSelected
                      ]}
                      onPress={() => setFormData({ ...formData, role: role.id })}
                    >
                      <Text style={[
                        styles.roleButtonText,
                        formData.role === role.id && styles.roleButtonTextSelected
                      ]}>
                        {role.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCreateUser}
              >
                <LinearGradient
                  colors={['#2563eb', '#1d4ed8']}
                  style={styles.submitButtonGradient}
                >
                  <Text style={styles.submitButtonText}>
                    {editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  actionBar: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#1e293b',
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    padding: 12,
  },
  usersList: {
    flex: 1,
    padding: 15,
  },
  userCard: {
    flexDirection: 'row',
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
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },  userEmployeeId: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  editButton: {
    backgroundColor: '#eff6ff',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  roleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  roleButtonSelected: {
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  roleButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  roleButtonTextSelected: {
    color: '#2563eb',
  },
  submitButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});