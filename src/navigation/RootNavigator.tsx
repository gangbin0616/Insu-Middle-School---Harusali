import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import EmotionChatScreen from '../screens/EmotionChatScreen';
import RoomMissionScreen from '../screens/RoomMissionScreen';
import ReportScreen from '../screens/ReportScreen';
import GpsDemoScreen from '../screens/GpsDemoScreen';
import ChatHistoryScreen from '../screens/ChatHistoryScreen';
import MarkerMissionScreen from '../screens/MarkerMissionScreen';
import AdminScreen from '../screens/AdminScreen';

export type RootStackParamList = {
  HomeScreen: undefined;
  EmotionChatScreen: undefined;
  RoomMissionScreen: undefined;
  ReportScreen: undefined;
  GpsDemoScreen: undefined;
  ChatHistoryScreen: undefined;
  MarkerMissionScreen: { id: string; title: string; };
  AdminScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="EmotionChatScreen" component={EmotionChatScreen} />
        <Stack.Screen name="RoomMissionScreen" component={RoomMissionScreen} />
        <Stack.Screen name="ReportScreen" component={ReportScreen} />
        <Stack.Screen name="GpsDemoScreen" component={GpsDemoScreen} />
        <Stack.Screen name="ChatHistoryScreen" component={ChatHistoryScreen} />
        <Stack.Screen name="MarkerMissionScreen" component={MarkerMissionScreen} />
        <Stack.Screen name="AdminScreen" component={AdminScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;