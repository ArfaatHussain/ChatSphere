import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import 'react-native-url-polyfill/auto';
import RootNavigator from './src/navigations/RootNavigator';
import { StatusBar } from 'react-native';
import { supabase } from './src/db/supabase';

const App = () => {

  useEffect(() => {
    testConnection();
  }, [])


  async function testConnection() {
    const { data, error } = await supabase
      .from('users')
      .select('*');

    console.log('Data:', data);
    console.log('Error:', error);
  }

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