import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ImageBackground,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAppState, ChatMessage } from '../context/AppStateContext';
import { COLORS } from '../constants/colors';
import { getGeminiResponse } from '../api/gemini';

type Props = NativeStackScreenProps<RootStackParamList, 'HomeScreen'>;

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }: Props) => {
  const { dayCount, resetDayCount, addMessage } = useAppState();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastBotMessage, setLastBotMessage] = useState<ChatMessage | null>(null);

  const handleSend = async () => {
    if (inputText.trim().length === 0 || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: Date.now(),
    };
    addMessage(userMessage);
    const messageToSend = inputText;
    setInputText('');
    setIsLoading(true);
    setLastBotMessage({ id: 'thinking', text: '...', sender: 'bot', timestamp: Date.now() });

    try {
      const botResponseText = await getGeminiResponse(messageToSend);
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        sender: 'bot',
        timestamp: Date.now(),
      };
      addMessage(botMessage);
      setLastBotMessage(botMessage);
    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "미안, 지금은 응답할 수 없어.",
        sender: 'bot',
        timestamp: Date.now(),
      };
      addMessage(errorMessage);
      setLastBotMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const SideMenuItem = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} style={styles.sideMenuItem}>
      <View style={[styles.menuIcon, { backgroundColor: COLORS.secondary }]}>
        <Text style={styles.iconPlaceholderText}>{label.charAt(0)}</Text>
      </View>
      <Text style={styles.menuItemText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ImageBackground 
      source={require('../../assets/room_bg.png')} 
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topRightContainer}>
          <View style={styles.dayCountBubble}>
            <Text style={styles.dayCountText}>몇 일차 : {dayCount}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('GpsDemoScreen')} style={styles.gpsButton}>
          <Text style={styles.gpsButtonText}>밖으로 나가면?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={resetDayCount} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>리셋</Text>
        </TouchableOpacity>

        <View style={styles.sideMenu}>
          <SideMenuItem label="일기" onPress={() => alert('아직 준비되지 않았어요!')} />
          <SideMenuItem label="기록" onPress={() => navigation.navigate('ChatHistoryScreen')} />
          <SideMenuItem label="미션" onPress={() => navigation.navigate('RoomMissionScreen')} />
        </View>

        <View style={styles.mainContentArea}>
          <View style={styles.haruCharacter}>
            <Text style={styles.iconPlaceholderText}>하루</Text>
          </View>

          {lastBotMessage && (
            <View style={styles.botBubble}>
              {isLoading ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : (
                <Text style={styles.botMessageText}>{lastBotMessage.text}</Text>
              )}
            </View>
          )}
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={styles.chatBarContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="하루♥랑 대화하기"
              placeholderTextColor={COLORS.gray}
            />
            <TouchableOpacity style={styles.chatGoButton} onPress={handleSend} disabled={isLoading}>
              <Text style={styles.chatGoButtonText}>▶</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  topRightContainer: { position: 'absolute', top: 20, right: 20, zIndex: 10 },
  dayCountBubble: { backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  dayCountText: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  gpsButton: { position: 'absolute', top: 20, right: 180, padding: 10, backgroundColor: COLORS.secondary, borderRadius: 5, zIndex: 10 },
  gpsButtonText: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold' },
  resetButton: { position: 'absolute', top: 70, right: 20, padding: 10, backgroundColor: COLORS.danger, borderRadius: 5, zIndex: 10 },
  resetButtonText: { color: COLORS.white, fontSize: 14 },
  sideMenu: { 
    position: 'absolute', 
    left: 0, 
    top: 50, 
    zIndex: 10, 
    paddingLeft: 20, 
    width: 100,
    alignItems: 'center',
  },
  sideMenuItem: { alignItems: 'center', marginBottom: 30 },
  menuIcon: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  menuItemText: { fontSize: 14, color: COLORS.white, fontWeight: 'bold', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: {width: -1, height: 1}, textShadowRadius: 5 },
  iconPlaceholderText: { fontSize: 14, color: COLORS.white },
  mainContentArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  haruCharacter: { width: 150, height: 200, backgroundColor: COLORS.primary, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  botBubble: { backgroundColor: COLORS.white, padding: 15, borderRadius: 20, borderBottomLeftRadius: 4, maxWidth: width * 0.4, position: 'absolute', bottom: height * 0.5 - 10, left: width * 0.5 - 120, zIndex: 5 },
  botMessageText: { fontSize: 16, color: COLORS.text },
  keyboardAvoidingView: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0,
    zIndex: 20, // Keep zIndex to ensure it's on top
  },
  chatBarContainer: { 
    backgroundColor: 'transparent', 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 10,
    paddingHorizontal: 20, 
    height: 70,
    paddingLeft: 120, // Add padding to avoid side menu
  },
  textInput: { 
    flex: 1, 
    height: 50,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 25,
    paddingHorizontal: 20,
    marginRight: 10,
  },
  chatGoButton: { 
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatGoButtonText: { fontSize: 24, color: COLORS.primary },
});

export default HomeScreen;

