import 'react-native-get-random-values';
import usePresence from './src/hooks/usePresence';
import { getItem, StorageKeys } from './src/utils/storage';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import 'react-native-url-polyfill/auto';
import RootNavigator from './src/navigations/RootNavigator';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const App = () => {

  const userData = getItem(StorageKeys.USER_DATA);
  usePresence(userData?.id);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider
        style={{ flex: 1 }}
      >
        <NavigationContainer>
          <SafeAreaView style={{ flex: 1 }} >
            <StatusBar
              animated={true}
              barStyle={'dark-content'}
              showHideTransition={true}
              hidden={false}
            />
            <RootNavigator />
          </SafeAreaView>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;