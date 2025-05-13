import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import UserScreen from './screens/UserScreen';
import PartsManagementScreen from './screens/PartsManagement';
import ReportScreen from './screens/ReportScreen';
import TransferScreen from './screens/TransferScren';
import SearchScreen from './screens/SearchScreen';

const Stack = createStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!isLoggedIn ? (
          <Stack.Screen 
            name="Login" 
            options={{ headerShown: false }}
          >
            {(props) => <LoginScreen {...props} setIsLoggedIn={setIsLoggedIn} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="User" 
              component={UserScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="AgregarRefaccion" 
              component={PartsManagementScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Reportes" 
              component={ReportScreen} 
              options={{ headerShown: false }}
            />
             <Stack.Screen 
              name="Traslado" 
              component={TransferScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Buscar" 
              component={SearchScreen} 
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}