import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Mission, MISSIONS } from '../constants/missions';

// --- NEW TYPES ---
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
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
  incrementDayCount: () => void;
  resetDayCount: () => void;
  selectEmotion: (emotionId: string) => void;
  selectMission: (mission: Mission) => void;
  generateReport: () => void;
  addMessage: (message: ChatMessage) => void;
  completeMission: (mission: Mission, photoUri?: string) => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

// --- ASYNC STORAGE KEYS ---
const DAY_COUNT_KEY = 'harusali_dayCount';
const CHAT_HISTORY_KEY = 'harusali_chatHistory';
const MISSION_HISTORY_KEY = 'harusali_missionHistory';


export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [dayCount, setDayCount] = useState(1);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [reportType, setReportType] = useState('default');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [missionHistory, setMissionHistory] = useState<CompletedMission[]>([]);

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

  const resetDayCount = async () => {
    try {
        setDayCount(1);
        setSelectedEmotion(null);
        setSelectedMission(null);
        setReportType('default');
        setChatHistory([]);
        setMissionHistory([]);

        await AsyncStorage.setItem(DAY_COUNT_KEY, '1');
        await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
        await AsyncStorage.removeItem(MISSION_HISTORY_KEY);
    } catch(e) {
        console.error('Failed to reset state.', e);
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


  return (
    <AppStateContext.Provider
      value={{
        dayCount,
        selectedEmotion,
        selectedMission,
        reportType,
        chatHistory,
        missionHistory,
        incrementDayCount,
        resetDayCount,
        selectEmotion,
        selectMission,
        generateReport,
        addMessage,
        completeMission,
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
