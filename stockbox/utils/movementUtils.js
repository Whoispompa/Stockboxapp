import AsyncStorage from "@react-native-async-storage/async-storage";

export const addMovement = async (movement) => {
  try {
    const data = await AsyncStorage.getItem("recentMovements");
    let movements = data ? JSON.parse(data) : [];
    movements = [movement, ...movements].slice(0, 20); // máximo 20 movimientos
    await AsyncStorage.setItem("recentMovements", JSON.stringify(movements));
  } catch (e) {
    // Puedes manejar el error aquí si lo deseas
  }
};