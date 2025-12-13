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
    Image,
    ImageStyle, // Import ImageStyle
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAppState, ChatMessage } from '../context/AppStateContext';
import { COLORS } from '../constants/colors';
import { getGeminiResponse } from '../api/gemini';

type Props = NativeStackScreenProps<RootStackParamList, 'HomeScreen'>;

const { width, height } = Dimensions.get('window');

// Explicitly type image styles to prevent type conflicts
const haruCharacterStyle: ImageStyle = { 
  width: 1000, 
  height: 380, 
  transform: [{ translateY: 55 }]
};

const menuIconStyle: ImageStyle = {
  width: '100%', 
  height: '100%',
};

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

  const SideMenuItem = ({ label, onPress, iconSource }: { label: string; onPress: () => void; iconSource: any }) => (
    <TouchableOpacity onPress={onPress} style={styles.sideMenuItem}>
      <View style={styles.menuIconContainer}>
        <Image source={iconSource} style={menuIconStyle} />
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
        <View style={styles.dayCounterContainer}>
          <ImageBackground
            source={require('../../assets/d_day_icon.png')}
            style={styles.dayCounterBackground}
            resizeMode="contain"
          >
            <Text style={styles.dayCounterText}>{dayCount}</Text>
          </ImageBackground>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('GpsDemoScreen')} style={styles.gpsButton}>
          <Text style={styles.gpsButtonText}>밖으로 나가면?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={resetDayCount} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>리셋</Text>
        </TouchableOpacity>

        <View style={styles.sideMenu}>
          <SideMenuItem label="일기" onPress={() => alert('아직 준비되지 않았어요!')} iconSource={require('../../assets/diary_icon.png')} />
          <SideMenuItem label="미션" onPress={() => navigation.navigate('RoomMissionScreen')} iconSource={require('../../assets/mission_icon.png')} />
          <SideMenuItem label="기록" onPress={() => navigation.navigate('ChatHistoryScreen')} iconSource={require('../../assets/record_icon.png')} />
        </View>

        <View style={styles.mainContentArea}>
          <Image 
            source={require('../../assets/haru_body.png')} 
            style={haruCharacterStyle} 
            resizeMode="contain" 
          />

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
  dayCounterContainer: {
    position: 'absolute',
    top: -10,
    right: 30,
    width: 100,
    height: 80,
    zIndex: 10,
  },
  dayCounterBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCounterText: {
    fontSize: 18,
    fontWeight: 'normal', // Changed from thin
    color: '#828282ff',
    transform: [{ translateX: 22 }, { translateY: 4 }],
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
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
  menuIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginBottom: 5,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  menuItemText: { fontSize: 14, color: COLORS.white, fontWeight: 'bold', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: {width: -1, height: 1}, textShadowRadius: 5 },
  iconPlaceholderText: { fontSize: 14, color: COLORS.white },
  mainContentArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  botBubble: { backgroundColor: COLORS.white, padding: 15, borderRadius: 20, borderBottomLeftRadius: 4, maxWidth: width * 0.4, position: 'absolute', bottom: height * 0.5 - 10, left: width * 0.5 + 40, zIndex: 5 },
  botMessageText: { fontSize: 16, color: COLORS.text },
  keyboardAvoidingView: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0,
    zIndex: 20,
  },
  chatBarContainer: { 
    backgroundColor: 'transparent', 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 10,
    paddingHorizontal: 20, 
    height: 70,
    paddingLeft: 120,
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

