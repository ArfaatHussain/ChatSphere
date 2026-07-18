import 'react-native-gesture-handler';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import { getItem, StorageKeys } from '../utils/storage';
import GroupChatScreen from '../screens/groups/GroupChatScreen';
import GroupDetail from '../screens/groups/GroupDetail';
import CreateGroup from '../screens/groups/CreateGroup';
const Stack = createNativeStackNavigator();

const RootNavigator = () => {

  const userData = getItem(StorageKeys.USER_DATA);
  const isLoggedIn = userData !== null && userData !== undefined;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}
      initialRouteName={isLoggedIn ? "main" : "login"}
    >
      <Stack.Screen name="login" component={LoginScreen} />
      <Stack.Screen name="register" component={RegisterScreen} />
      <Stack.Screen name="chat-screen" component={ChatScreen} />
      <Stack.Screen name="main" component={BottomTabNavigator} />
      <Stack.Screen name="GroupChatScreen" component={GroupChatScreen} />
      <Stack.Screen name="GroupDetail" component={GroupDetail} />
      <Stack.Screen name="CreateGroup" component={CreateGroup} />
    </Stack.Navigator>
  );
};

export default RootNavigator;