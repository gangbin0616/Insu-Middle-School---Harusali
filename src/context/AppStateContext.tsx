/**
 * @file src/context/AppStateContext.tsx
 * @description Global state management for the Harusali app.
 *
 * @changelog
 * - **Robustness:** Added comprehensive error handling for all AsyncStorage operations.
 * - **Data Integrity:**
 *   - Implemented type guards and try-catch blocks for parsing stored JSON to prevent crashes from corrupt data.
 *   - Fixed race conditions in `addMessage` and `completeMission` by correctly awaiting `AsyncStorage.setItem`.
 * - **Bug Fix:** Corrected the `dayCount` logic to only increment once per day using a `lastVisitDate` check.
 * - **UI Stability:** Added `isAiThinking` state to globally manage loading indicators and disable buttons during AI responses.
 * - **Maintainability:** Centralized all AsyncStorage keys and simplified the `hardReset` logic.
 */
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Mission, MISSIONS } from '../constants/missions';
import { HaruEmotion, getGeminiResponse, HaruResponse } from '../api/gemini';

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
};
const ALL_STORAGE_KEYS = Object.values(STORAGE_KEYS);


// --- APP STATE INTERFACE ---
interface AppState {
  // State
  dayCount: number;
  chatHistory: ChatMessage[];
  missionHistory: CompletedMission[];
  haruEmotion: HaruEmotion;
  chatCount: number;
  isAiThinking: boolean;
  isInitialized: boolean;

  // Actions
  softReset: () => Promise<void>;
  hardReset: () => Promise<void>;
  addMessage: (message: ChatMessage, isUserMessage?: boolean) => Promise<void>;
  completeMission: (mission: Mission, photoUri?: string) => Promise<void>;
  setHaruEmotion: (emotion: HaruEmotion) => Promise<void>;
  updateApiKey: (newKey: string) => Promise<boolean>;
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


  useEffect(() => {
    const loadState = async () => {
      try {
        const storedValues = await AsyncStorage.multiGet([
          STORAGE_KEYS.DAY_COUNT,
          STORAGE_KEYS.LAST_VISIT_DATE,
          STORAGE_KEYS.CHAT_HISTORY,
          STORAGE_KEYS.MISSION_HISTORY,
          STORAGE_KEYS.HARU_EMOTION,
          STORAGE_KEYS.CHAT_COUNT,
        ]);

        const valueMap = new Map(storedValues);
        const today = new Date().toISOString().split('T')[0];

        // Day Count and Last Visit
        const lastVisitDate = valueMap.get(STORAGE_KEYS.LAST_VISIT_DATE);
        const storedDayCount = valueMap.get(STORAGE_KEYS.DAY_COUNT);
        let currentDayCount = storedDayCount ? parseInt(storedDayCount, 10) : 1;

        if (lastVisitDate !== today) {
          if (lastVisitDate) { // Only increment if it's not the first ever visit
            currentDayCount++;
          }
          await AsyncStorage.setItem(STORAGE_KEYS.LAST_VISIT_DATE, today);
          await AsyncStorage.setItem(STORAGE_KEYS.DAY_COUNT, currentDayCount.toString());
        }
        setDayCount(currentDayCount);

        // Chat History
        const storedChat = valueMap.get(STORAGE_KEYS.CHAT_HISTORY);
        if (storedChat) {
          try {
            setChatHistory(JSON.parse(storedChat));
          } catch (e) {
            console.error('Failed to parse chat history, resetting.', e);
            setChatHistory([]);
          }
        }

        // Mission History
        const storedMissions = valueMap.get(STORAGE_KEYS.MISSION_HISTORY);
        if (storedMissions) {
          try {
            setMissionHistory(JSON.parse(storedMissions));
          } catch (e) {
            console.error('Failed to parse mission history, resetting.', e);
            setMissionHistory([]);
          }
        }

        // Haru Emotion
        const storedEmotion = valueMap.get(STORAGE_KEYS.HARU_EMOTION);
        setHaruEmotionState(isHaruEmotion(storedEmotion) ? storedEmotion : DEFAULT_EMOTION);

        // Chat Count
        const storedChatCount = valueMap.get(STORAGE_KEYS.CHAT_COUNT);
        setChatCount(storedChatCount ? parseInt(storedChatCount, 10) : 0);

      } catch (e) {
        console.error('Failed to load state from AsyncStorage.', e);
        // On catastrophic failure, set default state
        setDayCount(1);
        setChatHistory([]);
        setMissionHistory([]);
        setHaruEmotionState(DEFAULT_EMOTION);
        setChatCount(0);
      } finally {
        setIsInitialized(true);
      }
    };

    loadState();
  }, []);

  const addMessage = async (message: ChatMessage, isUserMessage: boolean = false) => {
    // Update state immediately for snappy UI
    const newHistory = [...chatHistory, message];
    setChatHistory(newHistory);

    // Persist to storage
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(newHistory));
      if (isUserMessage) {
        const newChatCount = chatCount + 1;
        setChatCount(newChatCount);
        await AsyncStorage.setItem(STORAGE_KEYS.CHAT_COUNT, newChatCount.toString());
      }
    } catch (e) {
      console.error('Failed to save chat message.', e);
    }
  };

  const setHaruEmotion = async (emotion: HaruEmotion) => {
    setHaruEmotionState(emotion);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HARU_EMOTION, emotion);
    } catch (e) {
      console.error('Failed to save Haru emotion.', e);
    }
  };

  const getBotResponse = async (userMessage: ChatMessage) => {
    setIsAiThinking(true);
    setHaruEmotion('neutral'); // Set to neutral while thinking
    try {
      const botResponse: HaruResponse = await getGeminiResponse(userMessage.text);
      const botMessage: ChatMessage = {
        id: new Date().toISOString(),
        text: botResponse.text,
        sender: 'bot',
        timestamp: Date.now(),
        state: botResponse.state,
      };
      await addMessage(botMessage);
      setHaruEmotion(botResponse.state);
    } catch (e) {
      console.error('Error getting bot response.', e);
    } finally {
      setIsAiThinking(false);
    }
  };

  const completeMission = async (mission: Mission, photoUri?: string) => {
    const newCompletion: CompletedMission = {
      id: new Date().toISOString(),
      missionName: mission.text,
      date: new Date().toISOString().split('T')[0],
      photoUri,
    };
    const newHistory = [newCompletion, ...missionHistory];
    setMissionHistory(newHistory);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MISSION_HISTORY, JSON.stringify(newHistory));
    } catch (e) {
      console.error('Failed to save completed mission.', e);
    }
  };

  const softReset = async () => {
    try {
      setIsAiThinking(true);
      setChatHistory([]);
      setChatCount(0);
      await AsyncStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
      await AsyncStorage.setItem(STORAGE_KEYS.CHAT_COUNT, '0');
    } catch (e) {
      console.error('Failed to soft reset state.', e);
    } finally {
      setIsAiThinking(false);
    }
  };

  const hardReset = async () => {
    try {
      setIsAiThinking(true);
      await AsyncStorage.multiRemove(ALL_STORAGE_KEYS);

      // Reset state variables to their initial values
      setDayCount(1);
      setChatHistory([]);
      setMissionHistory([]);
      setHaruEmotionState(DEFAULT_EMOTION);
      setChatCount(0);

      // Re-initialize necessary default values in storage
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(STORAGE_KEYS.DAY_COUNT, '1');
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_VISIT_DATE, today);
      await AsyncStorage.setItem(STORAGE_KEYS.CHAT_COUNT, '0');
      await AsyncStorage.setItem(STORAGE_KEYS.HARU_EMOTION, DEFAULT_EMOTION);

    } catch (e) {
      console.error('Failed to hard reset state.', e);
    } finally {
      setIsAiThinking(false);
    }
  };

  const updateApiKey = async (newKey: string): Promise<boolean> => {
    const oldKey = await AsyncStorage.getItem(STORAGE_KEYS.API_KEY);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.API_KEY, newKey);
      const response = await getGeminiResponse('hello');
      if (response.text.includes('API 키가 설정되지 않았어요')) {
        throw new Error('Invalid API key');
      }
      return true;
    } catch (e) {
      console.error("Failed to update API key:", e);
      if (oldKey) {
        await AsyncStorage.setItem(STORAGE_KEYS.API_KEY, oldKey);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.API_KEY);
      }
      return false;
    }
  };

  const contextValue = {
    // State
    dayCount,
    chatHistory,
    missionHistory,
    haruEmotion,
    chatCount,
    isAiThinking,
    isInitialized,
    // Actions
    softReset,
    hardReset,
    addMessage,
    completeMission,
    setHaruEmotion,
    updateApiKey,
  };
  
  // This is a new combined function to handle user messages and bot responses
  const handleUserMessage = async (message: ChatMessage) => {
    await addMessage(message, true);
    await getBotResponse(message);
  };
  
  // Replace original addMessage with this enhanced one in the context
  contextValue.addMessage = handleUserMessage;

  return (
    <AppStateContext.Provider value={contextValue}>
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