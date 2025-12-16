import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Mission, MISSIONS } from '../constants/missions';
import { HaruEmotion, API_KEY_STORAGE_KEY, getGeminiResponse } from '../api/gemini';

// --- NEW TYPES ---
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
  state?: HaruEmotion; // Add optional state for bot's emotion
}

export interface CompletedMission {
    id: string;
    missionName: string;
    date: string;
    photoUri?: string;
}

// --- EXTENDED APP STATE INTERFACE ---
interface AppState {
  dayCount: number;
  selectedEmotion: string | null;
  selectedMission: Mission | null;
  reportType: string;
  chatHistory: ChatMessage[];
  missionHistory: CompletedMission[];
  defaultHaruEmotion: HaruEmotion;
  chatCount: number; // Add chatCount
  incrementDayCount: () => void;
  softReset: () => void;
  hardReset: () => void;
  selectEmotion: (emotionId: string) => void;
  selectMission: (mission: Mission) => void;
  generateReport: () => void;
  addMessage: (message: ChatMessage) => void;
  completeMission: (mission: Mission, photoUri?: string) => void;
  setDefaultHaruEmotion: (emotion: HaruEmotion) => void;
  updateApiKey: (newKey: string) => Promise<boolean>;
  incrementChatCount: () => void; // Add incrementChatCount
}

const AppStateContext = createContext<AppState | undefined>(undefined);

// --- ASYNC STORAGE KEYS ---
const DAY_COUNT_KEY = 'harusali_dayCount';
const CHAT_HISTORY_KEY = 'harusali_chatHistory';
const MISSION_HISTORY_KEY = 'harusali_missionHistory';
const DEFAULT_HARU_EMOTION_KEY = 'harusali_defaultHaruEmotion';
const CHAT_COUNT_KEY = 'harusali_chatCount'; // Add chat count key


export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [dayCount, setDayCount] = useState(1);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [reportType, setReportType] = useState('default');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [missionHistory, setMissionHistory] = useState<CompletedMission[]>([]);
  const [defaultHaruEmotion, setDefaultHaruEmotionState] = useState<HaruEmotion>('neutral');
  const [chatCount, setChatCount] = useState(0); // Add chatCount state

  // --- LOAD STATE FROM ASYNCSTORAGE ON MOUNT ---
  useEffect(() => {
    const loadState = async () => {
      try {
        const storedDayCount = await AsyncStorage.getItem(DAY_COUNT_KEY);
        if (storedDayCount) {
          const newDayCount = parseInt(storedDayCount, 10) + 1;
          setDayCount(newDayCount);
          await AsyncStorage.setItem(DAY_COUNT_KEY, newDayCount.toString());
        } else {
          await AsyncStorage.setItem(DAY_COUNT_KEY, '1');
          setDayCount(1);
        }

        const storedChat = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
        if(storedChat) setChatHistory(JSON.parse(storedChat));

        const storedMissions = await AsyncStorage.getItem(MISSION_HISTORY_KEY);
        if(storedMissions) setMissionHistory(JSON.parse(storedMissions));

        const storedDefaultEmotion = await AsyncStorage.getItem(DEFAULT_HARU_EMOTION_KEY);
        if(storedDefaultEmotion) setDefaultHaruEmotionState(storedDefaultEmotion as HaruEmotion);
        
        const storedChatCount = await AsyncStorage.getItem(CHAT_COUNT_KEY);
        if (storedChatCount) {
          setChatCount(parseInt(storedChatCount, 10));
        } else {
            await AsyncStorage.setItem(CHAT_COUNT_KEY, '0');
            setChatCount(0);
        }

      } catch (e) {
        console.error('Failed to load state.', e);
      }
    };

    loadState();
  }, []);
  
  const incrementDayCount = async () => {
    const newDayCount = dayCount + 1;
    setDayCount(newDayCount);
    await AsyncStorage.setItem(DAY_COUNT_KEY, newDayCount.toString());
  };

  const incrementChatCount = async () => {
    const newChatCount = chatCount + 1;
    setChatCount(newChatCount);
    await AsyncStorage.setItem(CHAT_COUNT_KEY, newChatCount.toString());
  };

  const softReset = async () => {
    try {
      setChatHistory([]);
      setChatCount(0);
      await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
      await AsyncStorage.removeItem(CHAT_COUNT_KEY);
      await AsyncStorage.setItem(CHAT_COUNT_KEY, '0');
    } catch(e) {
      console.error('Failed to soft reset state.', e);
    }
  };

  const hardReset = async () => {
    try {
        setDayCount(1);
        setSelectedEmotion(null);
        setSelectedMission(null);
        setReportType('default');
        setChatHistory([]);
        setMissionHistory([]);
        setDefaultHaruEmotion('neutral');
        setChatCount(0); // Reset chat count

        await AsyncStorage.multiRemove([
            DAY_COUNT_KEY, 
            CHAT_HISTORY_KEY, 
            MISSION_HISTORY_KEY, 
            DEFAULT_HARU_EMOTION_KEY, 
            API_KEY_STORAGE_KEY,
            CHAT_COUNT_KEY, // Remove chat count key
        ]);
        await AsyncStorage.setItem(DAY_COUNT_KEY, '1');
        await AsyncStorage.setItem(CHAT_COUNT_KEY, '0'); // Reset chat count in storage

    } catch(e) {
        console.error('Failed to hard reset state.', e);
    }
  };

  const updateApiKey = async (newKey: string): Promise<boolean> => {
    const oldKey = await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
    try {
      await AsyncStorage.setItem(API_KEY_STORAGE_KEY, newKey);
      // Test the new key
      const response = await getGeminiResponse('hello');
      // A very basic check. If the response text is one of the generic error messages, the key is likely invalid.
      if (response.text.includes('API 키') || response.text.includes('연결이 어려운 것 같아')) {
        throw new Error('Invalid API key or network issue');
      }
      return true;
    } catch (e) {
      console.error("Failed to update API key:", e);
      // Revert to the old key if the new one fails
      if (oldKey) {
        await AsyncStorage.setItem(API_KEY_STORAGE_KEY, oldKey);
      } else {
        await AsyncStorage.removeItem(API_KEY_STORAGE_KEY);
      }
      return false;
    }
  };

  const selectEmotion = (emotionId: string) => {
    setSelectedEmotion(emotionId);
    const mission = MISSIONS.find(m => m.relatedEmotion === emotionId) || MISSIONS[0];
    setSelectedMission(mission);
  };

  const selectMission = (mission: Mission) => {
    setSelectedMission(mission);
  };

  const generateReport = () => {
    if (selectedEmotion === 'lethargic' || selectedMission?.id === 'm01' || selectedMission?.id === 'm05') {
      setReportType('light_action');
    } else if (selectedEmotion === 'anxious' || selectedEmotion === 'stifled') {
      setReportType('quiet_room');
    } else {
      setReportType('outside_dream');
    }
  };

  const addMessage = async (message: ChatMessage) => {
    setChatHistory(prev => {
        const newHistory = [...prev, message];
        AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(newHistory));
        return newHistory;
    });
  };

  const completeMission = async (mission: Mission, photoUri?: string) => {
    const newCompletion: CompletedMission = {
        id: new Date().toISOString(),
        missionName: mission.text,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        photoUri: photoUri,
    };
    setMissionHistory(prev => {
        const newHistory = [newCompletion, ...prev];
        AsyncStorage.setItem(MISSION_HISTORY_KEY, JSON.stringify(newHistory));
        return newHistory;
    });
  };

  const setDefaultHaruEmotion = async (emotion: HaruEmotion) => {
    setDefaultHaruEmotionState(emotion);
    await AsyncStorage.setItem(DEFAULT_HARU_EMOTION_KEY, emotion);
  };


  return (
    <AppStateContext.Provider
      value={{
        dayCount,
        selectedEmotion,
        selectedMission,
        reportType,
        chatHistory,
        missionHistory,
        defaultHaruEmotion,
        chatCount, // export chatCount
        incrementDayCount,
        softReset,
        hardReset,
        selectEmotion,
        selectMission,
        generateReport,
        addMessage,
        completeMission,
        setDefaultHaruEmotion,
        updateApiKey,
        incrementChatCount, // export incrementChatCount
      }}
    >
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
