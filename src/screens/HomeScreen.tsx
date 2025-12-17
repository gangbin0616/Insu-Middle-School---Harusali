/**
 * @file src/screens/HomeScreen.tsx
 * @description The main screen of the app where users interact with Haru.
 *
 * @changelog
 * - Added fade animation for Haru's character image changes to prevent blinking.
 * - Haru's image now immediately changes to 'neutral' when the AI is thinking.
 */
import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  ImageStyle,
  Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAppState, ChatMessage } from '../context/AppStateContext';
import { COLORS } from '../constants/colors';
import { HaruEmotion } from '../api/gemini';

type Props = NativeStackScreenProps<RootStackParamList, 'HomeScreen'>;

const { width, height } = Dimensions.get('window');

const haruImages: { [key in HaruEmotion]: any } = {
  neutral: require('../../assets/KakaoTalk_20251215_123328170.png'),
  very_shy: require('../../assets/KakaoTalk_20251215_123328170_01.png'),
  turned_away: require('../../assets/KakaoTalk_20251215_123328170_02.png'),
  relaxed_smile: require('../../assets/KakaoTalk_20251215_123328170_03.png'),
  half_turned: require('../../assets/KakaoTalk_20251215_123328170_04.png'),
};

const haruCharacterStyle: ImageStyle = {
  width: 1000,
  height: 380,
  transform: [{ translateY: 55 }],
};

const menuIconStyle: ImageStyle = {
  width: '100%',
  height: '100%',
};

const HomeScreen = ({ navigation }: Props) => {
  const { dayCount, sendUserMessage, haruEmotion, chatHistory, isAiThinking, isInitialized } = useAppState();
  const [inputText, setInputText] = useState('');

  const lastBotMessage = useMemo(() => {
    return [...chatHistory].reverse().find(msg => msg.sender === 'bot');
  }, [chatHistory]);

  const targetImageSource = useMemo(() => {
    if (isAiThinking) {
      return haruImages['neutral'];
    }
    const currentEmotion = lastBotMessage?.state || haruEmotion;
    return haruImages[currentEmotion] || haruImages['neutral'];
  }, [isAiThinking, lastBotMessage, haruEmotion]);

  // Animation state
  const [activeImageSource, setActiveImageSource] = useState(targetImageSource);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (targetImageSource !== activeImageSource) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setActiveImageSource(targetImageSource);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [targetImageSource]);

  const handleSend = async () => {
    if (inputText.trim().length === 0 || isAiThinking || !isInitialized) return;
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: Date.now(),
    };
    setInputText('');
    await sendUserMessage(userMessage);
  };

  const SideMenuItem = ({ label, onPress, iconSource }: { label: string; onPress: () => void; iconSource: any }) => (
    <TouchableOpacity onPress={onPress} style={styles.sideMenuItem} disabled={isAiThinking}>
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
        {!isInitialized && <ActivityIndicator style={StyleSheet.absoluteFill} size="large" color={COLORS.primary} />}
        
        <View style={styles.dayCounterContainer}>
          <ImageBackground
            source={require('../../assets/d_day_icon.png')}
            style={styles.dayCounterBackground}
            resizeMode="contain"
          >
            <Text style={styles.dayCounterText}>{dayCount}</Text>
          </ImageBackground>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('GpsDemoScreen')} style={styles.gpsButton} disabled={isAiThinking}>
          <Text style={styles.gpsButtonText}>밖으로 나가면?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('AdminScreen')} style={styles.adminButton} disabled={isAiThinking}>
          <Text style={styles.adminButtonText}>⚙️</Text>
        </TouchableOpacity>

        <View style={styles.sideMenu}>
          <SideMenuItem label="일기" onPress={() => navigation.navigate('DiaryScreen')} iconSource={require('../../assets/diary_icon.png')} />
          <SideMenuItem label="미션" onPress={() => navigation.navigate('RoomMissionScreen')} iconSource={require('../../assets/mission_icon.png')} />
          <SideMenuItem label="기록" onPress={() => navigation.navigate('ChatHistoryScreen')} iconSource={require('../../assets/record_icon.png')} />
        </View>

        <View style={styles.mainContentArea}>
          <Animated.Image
            source={activeImageSource}
            style={[haruCharacterStyle, { opacity: fadeAnim }]}
            resizeMode="contain"
            fadeDuration={0}
          />

          {lastBotMessage && (
            <View style={styles.botBubble}>
              {isAiThinking && chatHistory[chatHistory.length - 1]?.sender === 'user' ? (
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
              style={[styles.textInput, (isAiThinking || !isInitialized) && styles.disabledInput]}
              value={inputText}
              onChangeText={setInputText}
              placeholder={isAiThinking ? "하루가 생각에 잠겼어요..." : "하루♥랑 대화하기"}
              placeholderTextColor={COLORS.gray}
              editable={!isAiThinking && isInitialized}
            />
            <TouchableOpacity style={[styles.chatGoButton, (isAiThinking || !isInitialized) && styles.disabledInput]} onPress={handleSend} disabled={isAiThinking || !isInitialized}>
              {isAiThinking ? <ActivityIndicator color={COLORS.primary} /> : <Text style={styles.chatGoButtonText}>▶</Text>}
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
  disabledInput: {
    backgroundColor: '#E0E0E0',
    opacity: 0.7,
  },
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
    fontWeight: 'normal',
    color: '#828282ff',
    transform: [{ translateX: 22 }, { translateY: 4 }],
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  gpsButton: { position: 'absolute', top: 20, right: 180, padding: 10, backgroundColor: COLORS.secondary, borderRadius: 5, zIndex: 10 },
  gpsButtonText: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold' },
  adminButton: { position: 'absolute', top: 70, right: 20, padding: 10, backgroundColor: COLORS.lightGray, borderRadius: 5, zIndex: 10 },
  adminButtonText: { color: COLORS.white, fontSize: 14 },
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