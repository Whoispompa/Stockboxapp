import React, { useState, useEffect } from 'react';
import { addMovement } from "../utils/movementUtils"; // Ajusta la ruta según tu estructura

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ROLES = [
  { id: 1, name: 'Administrador' },
  { id: 2, name: 'Supervisor' },
  { id: 3, name: 'Usuario' },
];

export default function UserScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    roleId: 2,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'No se encontró el token de autenticación.');
        return;
      }
      const response = await axios.get(
        'http://193.203.165.112:4000/api/user/all',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200) {
        const mappedUsers = response.data.map((user) => ({
          ...user,
          roleId: ROLES.find((role) => role.name === user.role)?.id,
        }));
        setUsers(mappedUsers);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Error al cargar los usuarios.'
        );
      } else {
        Alert.alert('Error', 'Ocurrió un error desconocido.');
      }
    }
  };

  const handleAddUser = async () => {
    if (
      newUser.first_name &&
      newUser.last_name &&
      newUser.email &&
      newUser.password
    ) {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          Alert.alert('Error', 'No se encontró el token de autenticación.');
          return;
        }
        const response = await axios.post(
          'http://193.203.165.112:4000/api/user/register',
          {
            email: newUser.email,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            password: newUser.password,
            roleId: Number(newUser.roleId),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.status === 201) {
          Alert.alert('Éxito', 'Usuario creado exitosamente.');
          setUsers((prev) => [...prev, response.data.data]);
          setModalVisible(false);
          await addMovement({
            id: Date.now(),
            type: "usuario",
            item: `Usuario: ${newUser.first_name} ${newUser.last_name}`,
            quantity: 1,
            date: new Date().toLocaleString(),
          });
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          Alert.alert(
            'Error',
            error.response?.data?.message || 'Error al crear el usuario.'
          );
        } else {
          Alert.alert('Error', 'Ocurrió un error desconocido.');
        }
      }
    } else {
      Alert.alert('Error', 'Por favor, completa todos los campos.');
    }
  };

  const handleEditUser = async () => {
    if (selectedUser) {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          Alert.alert('Error', 'No se encontró el token de autenticación.');
          return;
        }
        const response = await axios.patch(
          `http://193.203.165.112:4000/api/user/update/${selectedUser.id}`,
          {
            email: selectedUser.email,
            first_name: selectedUser.first_name,
            last_name: selectedUser.last_name,
            password: selectedUser.password || '',
            roleId: Number(selectedUser.roleId),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.status === 200) {
          Alert.alert('Éxito', 'Usuario actualizado exitosamente.');
          setUsers((prevUsers) =>
            prevUsers.map((user) =>
              user.id === selectedUser.id ? { ...user, ...selectedUser } : user
            )
          );
          setEditModalVisible(false);
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          Alert.alert(
            'Error',
            error.response?.data?.message || 'Error al actualizar el usuario.'
          );
        } else {
          Alert.alert('Error', 'Ocurrió un error desconocido.');
        }
      }
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'No se encontró el token de autenticación.');
        return;
      }
      const response = await axios.patch(
        `http://193.203.165.112:4000/api/user/status/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200) {
        Alert.alert('Éxito', 'Estado del usuario actualizado.');
        fetchUsers();
        setEditModalVisible(false);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Error al cambiar el estado del usuario.'
        );
      } else {
        Alert.alert('Error', 'Ocurrió un error desconocido.');
      }
    }
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
        <Text style={styles.title}>Gestión de Usuarios</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#6c757d" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar usuarios..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.addButton}
        >
          <Ionicons name="add-outline" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Users List */}
      <FlatList
        data={users.filter(
          (user) =>
            (user.first_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (user.last_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
        )}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View>
              <Text style={styles.userName}>
                {item.first_name} {item.last_name}
              </Text>
              <Text style={styles.userEmail}>{item.email}</Text>
              <Text style={styles.userRole}>
                {ROLES.find((role) => role.id === item.roleId)?.name}
              </Text>
              <Text style={styles.userStatus}>
                {item.isActive ? 'Activo' : 'Inactivo'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setSelectedUser(item);
                setEditModalVisible(true);
              }}
              style={styles.editButton}
            >
              <Ionicons name="create-outline" size={20} color="#007bff" />
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Add User Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo Usuario</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close-outline" size={24} color="#6c757d" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              value={newUser.first_name}
              onChangeText={(text) =>
                setNewUser({ ...newUser, first_name: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Apellido"
              value={newUser.last_name}
              onChangeText={(text) =>
                setNewUser({ ...newUser, last_name: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              value={newUser.email}
              onChangeText={(text) => setNewUser({ ...newUser, email: text })}
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              value={newUser.password}
              onChangeText={(text) =>
                setNewUser({ ...newUser, password: text })
              }
              secureTextEntry
            />
            <View style={styles.roleContainer}>
              {ROLES.map((role) => (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles.roleButton,
                    newUser.roleId === role.id && styles.activeRoleButton,
                  ]}
                  onPress={() => setNewUser({ ...newUser, roleId: role.id })}
                >
                  <Text
                    style={[
                      styles.roleText,
                      newUser.roleId === role.id && styles.activeRoleText,
                    ]}
                  >
                    {role.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.createButton} onPress={handleAddUser}>
              <Text style={styles.createButtonText}>Crear Usuario</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit User Modal */}
      {selectedUser && (
        <Modal visible={editModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Editar Usuario</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Ionicons name="close-outline" size={24} color="#6c757d" />
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="Nombre"
                value={selectedUser.first_name}
                onChangeText={(text) =>
                  setSelectedUser({ ...selectedUser, first_name: text })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Apellido"
                value={selectedUser.last_name}
                onChangeText={(text) =>
                  setSelectedUser({ ...selectedUser, last_name: text })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                value={selectedUser.email}
                onChangeText={(text) =>
                  setSelectedUser({ ...selectedUser, email: text })
                }
                keyboardType="email-address"
              />
              <TextInput
                style={styles.input}
                placeholder="Contraseña (opcional)"
                value={selectedUser.password || ''}
                onChangeText={(text) =>
                  setSelectedUser({ ...selectedUser, password: text })
                }
                secureTextEntry
              />
              <View style={styles.roleContainer}>
                {ROLES.map((role) => (
                  <TouchableOpacity
                    key={role.id}
                    style={[
                      styles.roleButton,
                      selectedUser.roleId === role.id && styles.activeRoleButton,
                    ]}
                    onPress={() =>
                      setSelectedUser({ ...selectedUser, roleId: role.id })
                    }
                  >
                    <Text
                      style={[
                        styles.roleText,
                        selectedUser.roleId === role.id && styles.activeRoleText,
                      ]}
                    >
                      {role.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.statusContainer}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    selectedUser.isActive && styles.activeStatusButton,
                  ]}
                  onPress={() => handleToggleUserStatus(selectedUser.id)}
                >
                  <Text
                    style={[
                      styles.statusText,
                      selectedUser.isActive && styles.activeStatusText,
                    ]}
                  >
                    Activar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    !selectedUser.isActive && styles.inactiveStatusButton,
                  ]}
                  onPress={() => handleToggleUserStatus(selectedUser.id)}
                >
                  <Text
                    style={[
                      styles.statusText,
                      !selectedUser.isActive && styles.inactiveStatusText,
                    ]}
                  >
                    Desactivar
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.createButton} onPress={handleEditUser}>
                <Text style={styles.createButtonText}>Guardar Cambios</Text>
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
  addButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  userEmail: {
    fontSize: 14,
    color: '#6c757d',
  },
  userRole: {
    fontSize: 14,
    color: '#6c757d',
  },
  userStatus: {
    fontSize: 14,
    color: '#6c757d',
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
    position: 'relative',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
    color: '#495057',
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  activeRoleButton: {
    backgroundColor: '#007bff',
  },
  roleText: {
    fontSize: 14,
    color: '#495057',
  },
  activeRoleText: {
    color: '#ffffff',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statusButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  activeStatusButton: {
    backgroundColor: '#28a745',
  },
  inactiveStatusButton: {
    backgroundColor: '#dc3545',
  },
  statusText: {
    fontSize: 14,
    color: '#495057',
  },
  activeStatusText: {
    color: '#ffffff',
  },
  inactiveStatusText: {
    color: '#ffffff',
  },
  createButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButton: {
    padding: 10,
  },
});