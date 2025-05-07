import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';

const Stack = createStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isLoggedIn ? (
          // Pantalla Home (sin login visible)
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ headerShown: false }} // Oculta el header predeterminado
          />
        ) : (
          // Pantalla Login (sin Home visible)
          <Stack.Screen 
            name="Login" 
            options={{ headerShown: false }} // Oculta el header
          >
            {(props) => <LoginScreen {...props} setIsLoggedIn={setIsLoggedIn} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}