import React from 'react';
import { AppStateProvider } from './src/context/AppStateContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <AppStateProvider>
      <RootNavigator />
    </AppStateProvider>
  );
}
