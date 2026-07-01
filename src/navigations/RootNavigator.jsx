import 'react-native-gesture-handler';
import React, {useEffect, useState} from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import BottomTabNavigator from './BottomTabNavigator';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import { getItem, StorageKeys } from '../utils/storage';

const Stack = createStackNavigator();

const RootNavigator = () => {

  const isLoggedIn = getItem(StorageKeys.USER_DATA) !== null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}
    initialRouteName={isLoggedIn ? "main" : "login"}
    >
      <Stack.Screen name="login" component={LoginScreen} />
      <Stack.Screen name="register" component={RegisterScreen} />
      <Stack.Screen name="main" component={BottomTabNavigator} />
    </Stack.Navigator>
  );
};

export default RootNavigator;