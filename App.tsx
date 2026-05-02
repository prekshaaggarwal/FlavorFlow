import 'react-native-gesture-handler';

import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { WebErrorBoundary } from './src/components/WebErrorBoundary';
import { FlavorThemeProvider } from './src/hooks/useFlavorTheme';
import { RootNavigator } from './src/navigation/AppNavigator';

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  return (
    <WebErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <FlavorThemeProvider>
          <SafeAreaProvider>
            <RootNavigator />
          </SafeAreaProvider>
        </FlavorThemeProvider>
      </GestureHandlerRootView>
    </WebErrorBoundary>
  );
}
