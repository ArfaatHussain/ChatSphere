import 'react-native-get-random-values';
import React, { useEffect } from 'react';
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
  );
};

export default App;