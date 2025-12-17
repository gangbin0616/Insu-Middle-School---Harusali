import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Mission } from '../constants/missions';
import { HaruEmotion, getGeminiResponse, HaruResponse, GeminiStatus } from '../api/gemini';

// --- TYPE DEFINITIONS ---

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
  state?: HaruEmotion;
}

export interface CompletedMission {
  id: string;
  missionName: string;
  date: string;
  photoUri?: string;
}

// A type guard to validate HaruEmotion strings from storage
const HARU_EMOTIONS: HaruEmotion[] = ['neutral', 'very_shy', 'turned_away', 'relaxed_smile', 'half_turned'];
const isHaruEmotion = (value: any): value is HaruEmotion => {
  return HARU_EMOTIONS.includes(value);
};

// --- ASYNC STORAGE KEYS ---
const STORAGE_KEYS = {
  DAY_COUNT: 'harusali_dayCount',
  LAST_VISIT_DATE: 'harusali_lastVisitDate',
  CHAT_HISTORY: 'harusali_chatHistory',
  MISSION_HISTORY: 'harusali_missionHistory',
  HARU_EMOTION: 'harusali_haruEmotion',
  CHAT_COUNT: 'harusali_chatCount',
  API_KEY: 'harusali_apiKey',
  USE_AI_RESPONSE: 'harusali_useAiResponse',
};
const ALL_STORAGE_KEYS = Object.values(STORAGE_KEYS);

// --- APP STATE INTERFACE ---
interface AppState {
  dayCount: number;
  chatHistory: ChatMessage[];
  missionHistory: CompletedMission[];
  haruEmotion: HaruEmotion;
  chatCount: number;
  isAiThinking: boolean;
  isInitialized: boolean;
  useAiResponse: boolean;
  geminiStatus: GeminiStatus;
  lastGeminiError: string;
  softReset: () => Promise<void>;
  hardReset: () => Promise<void>;
  sendUserMessage: (message: ChatMessage) => Promise<void>;
  completeMission: (mission: Mission, photoUri?: string) => Promise<void>;
  setHaruEmotion: (emotion: HaruEmotion) => Promise<void>;
  updateApiKey: (newKey: string) => Promise<boolean>;
  setUseAiResponse: (useAi: boolean) => Promise<void>;
}

const AppStateContext = createContext<AppState | undefined>(undefined);
const DEFAULT_EMOTION: HaruEmotion = 'neutral';

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [dayCount, setDayCount] = useState(1);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [missionHistory, setMissionHistory] = useState<CompletedMission[]>([]);
  const [haruEmotion, setHaruEmotionState] = useState<HaruEmotion>(DEFAULT_EMOTION);
  const [chatCount, setChatCount] = useState(0);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [useAiResponse, setUseAiResponseState] = useState(true);
  const [geminiStatus, setGeminiStatusState] = useState<GeminiStatus>('idle');
  const [lastGeminiError, setLastGeminiError] = useState('');

  useEffect(() => {
    const loadState = async () => {
      try {
        const storedValues = await AsyncStorage.multiGet(Object.values(STORAGE_KEYS));
        const valueMap = new Map(storedValues);
        const today = new Date().toISOString().split('T')[0];

        const lastVisitDate = valueMap.get(STORAGE_KEYS.LAST_VISIT_DATE);
        const storedDayCount = valueMap.get(STORAGE_KEYS.DAY_COUNT);
        let currentDayCount = storedDayCount ? parseInt(storedDayCount, 10) : 1;

        if (lastVisitDate !== today) {
          if (lastVisitDate) { currentDayCount++; }
          await AsyncStorage.setItem(STORAGE_KEYS.LAST_VISIT_DATE, today);
          await AsyncStorage.setItem(STORAGE_KEYS.DAY_COUNT, currentDayCount.toString());
        }
        setDayCount(currentDayCount);

        const storedChat = valueMap.get(STORAGE_KEYS.CHAT_HISTORY);
        if (storedChat) {
          try { setChatHistory(JSON.parse(storedChat)); } catch (e) { setChatHistory([]); }
        }

        const storedMissions = valueMap.get(STORAGE_KEYS.MISSION_HISTORY);
        if (storedMissions) {
          try { setMissionHistory(JSON.parse(storedMissions)); } catch (e) { setMissionHistory([]); }
        }

        const storedEmotion = valueMap.get(STORAGE_KEYS.HARU_EMOTION);
        setHaruEmotionState(isHaruEmotion(storedEmotion) ? storedEmotion : DEFAULT_EMOTION);

        const storedChatCount = valueMap.get(STORAGE_KEYS.CHAT_COUNT);
        setChatCount(storedChatCount ? parseInt(storedChatCount, 10) : 0);

        const storedUseAi = valueMap.get(STORAGE_KEYS.USE_AI_RESPONSE);
        setUseAiResponseState(storedUseAi !== null ? JSON.parse(storedUseAi) : true);

      } catch (e) {
        console.error('Failed to load state from AsyncStorage.', e);
      } finally {
        setIsInitialized(true);
      }
    };
    loadState();
  }, []);

  const setGeminiStatus = (status: GeminiStatus, error: string = '') => {
    setGeminiStatusState(status);
    setLastGeminiError(error);
  };

  const setHaruEmotion = async (emotion: HaruEmotion) => {
    setHaruEmotionState(emotion);
    try { await AsyncStorage.setItem(STORAGE_KEYS.HARU_EMOTION, emotion); } 
    catch (e) { console.error('Failed to save Haru emotion.', e); }
  };

  const setUseAiResponse = async (useAi: boolean) => {
    setUseAiResponseState(useAi);
    try { await AsyncStorage.setItem(STORAGE_KEYS.USE_AI_RESPONSE, JSON.stringify(useAi)); } 
    catch (e) { console.error('Failed to save AI response preference.', e); }
  };

  const getBotResponse = async (userMessage: ChatMessage): Promise<ChatMessage> => {
    setIsAiThinking(true);
    let botResponse: HaruResponse;
    try {
      if (useAiResponse) {
        botResponse = await getGeminiResponse(userMessage.text, setGeminiStatus);
      } else {
        botResponse = { text: "지금은 잠깐 다른 생각 중이야...", state: "half_turned" };
        setGeminiStatus('idle', 'AI is disabled');
      }
    } catch (e) {
      console.error('Error in getBotResponse:', e);
      botResponse = { text: "...", state: 'neutral' };
      setGeminiStatus('error', 'Client-side error');
    } finally {
      setIsAiThinking(false);
      setHaruEmotion(botResponse.state || 'neutral');
    }
    return { id: new Date().toISOString(), text: botResponse.text, sender: 'bot', timestamp: Date.now(), state: botResponse.state };
  };
  
  const sendUserMessage = async (message: ChatMessage) => {
    setChatHistory(prev => [...prev, message]);
    setChatCount(prev => prev + 1);

    const newHistory = [...chatHistory, message];
    await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(newHistory)),
        AsyncStorage.setItem(STORAGE_KEYS.CHAT_COUNT, (chatCount + 1).toString())
    ]);

    const botMessage = await getBotResponse(message);
    
    setChatHistory(prev => [...prev, botMessage]);
    const finalHistory = [...newHistory, botMessage];
    await AsyncStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(finalHistory));
  };

  const completeMission = async (mission: Mission, photoUri?: string) => {
    const newCompletion: CompletedMission = { id: new Date().toISOString(), missionName: mission.text, date: new Date().toISOString().split('T')[0], photoUri };
    const newHistory = [newCompletion, ...missionHistory];
    setMissionHistory(newHistory);
    try { await AsyncStorage.setItem(STORAGE_KEYS.MISSION_HISTORY, JSON.stringify(newHistory)); }
    catch (e) { console.error('Failed to save completed mission.', e); }
  };

  const softReset = async () => {
    setChatHistory([]);
    setChatCount(0);
    try {
        await AsyncStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
        await AsyncStorage.setItem(STORAGE_KEYS.CHAT_COUNT, '0');
    } catch (e) { console.error('Failed to soft reset state.', e); }
  };

  const hardReset = async () => {
    try {
      await AsyncStorage.multiRemove(ALL_STORAGE_KEYS);
      setDayCount(1);
      setChatHistory([]);
      setMissionHistory([]);
      setHaruEmotionState(DEFAULT_EMOTION);
      setChatCount(0);
      setUseAiResponseState(true);
      setGeminiStatus('idle');
      setLastGeminiError('');

      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(STORAGE_KEYS.DAY_COUNT, '1');
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_VISIT_DATE, today);
    } catch (e) {
      console.error('Failed to hard reset state.', e);
    }
  };

  const updateApiKey = async (newKey: string): Promise<boolean> => {
    const oldKey = await AsyncStorage.getItem(STORAGE_KEYS.API_KEY);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.API_KEY, newKey);
      const response = await getGeminiResponse('hello', setGeminiStatus);
      if (response.text.includes('API 키가 설정되지 않았어요')) throw new Error('Invalid API key');
      return true;
    } catch (e) {
      console.error("Failed to update API key:", e);
      if (oldKey) { await AsyncStorage.setItem(STORAGE_KEYS.API_KEY, oldKey); }
      else { await AsyncStorage.removeItem(STORAGE_KEYS.API_KEY); }
      return false;
    }
  };

  return (
    <AppStateContext.Provider value={{ dayCount, chatHistory, missionHistory, haruEmotion, chatCount, isAiThinking, isInitialized, useAiResponse, geminiStatus, lastGeminiError, softReset, hardReset, sendUserMessage, completeMission, setHaruEmotion, updateApiKey, setUseAiResponse }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within a AppStateProvider');
  }
  return context;
};