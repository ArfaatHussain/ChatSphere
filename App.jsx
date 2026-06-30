import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import 'react-native-url-polyfill/auto';
import RootNavigator from './src/navigations/RootNavigator';
import { StatusBar } from 'react-native';

const App = () => {
  return (
    <SafeAreaProvider
      style={{ flex: 1 }}
    >
      <StatusBar barStyle={'dark-content'} />
      <NavigationContainer>
        <SafeAreaView style={{ flex: 1 }} >
          <RootNavigator />
        </SafeAreaView>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;