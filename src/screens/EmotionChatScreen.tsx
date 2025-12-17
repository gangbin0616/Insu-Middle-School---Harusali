import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAppState } from '../context/AppStateContext';
import { COLORS } from '../constants/colors';
import { EMOTIONS, EMOTION_RESPONSES } from '../constants/emotions';

type Props = NativeStackScreenProps<RootStackParamList, 'EmotionChatScreen'>;

const { width } = Dimensions.get('window');

const EmotionChatScreen = ({ navigation }: Props) => {
  const { sendUserMessage } = useAppState();
  const [localSelectedEmotionId, setLocalSelectedEmotionId] = useState<string | null>(null);

  const handleSelectEmotion = (emotionId: string) => {
    setLocalSelectedEmotionId(emotionId);
  };

  const handleNext = async () => {
    if (localSelectedEmotionId) {
      const selectedEmotion = EMOTIONS.find(e => e.id === localSelectedEmotionId);
      if (selectedEmotion) {
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          text: selectedEmotion.text,
          sender: 'user',
          timestamp: Date.now(),
        };
        await sendUserMessage(userMessage);
        navigation.navigate('HomeScreen');
      }
    }
  };

  const responseText = localSelectedEmotionId
    ? EMOTION_RESPONSES[localSelectedEmotionId]
    : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Left Column */}
      <View style={styles.leftColumn}>
        <View style={styles.characterContainer}>
            <View style={styles.haruCharacter}>
                <Text style={styles.iconText}>하루</Text>
            </View>
        </View>
        <Text style={styles.title}>오늘 하루는{"\n"}어떤 느낌이야?</Text>
      </View>

      {/* Right Column */}
      <View style={styles.rightColumn}>
        <View style={styles.emotionButtonContainer}>
          {EMOTIONS.map((emotion) => (
            <TouchableOpacity
              key={emotion.id}
              style={[
                styles.emotionButton,
                localSelectedEmotionId === emotion.id && styles.selectedEmotionButton,
              ]}
              onPress={() => handleSelectEmotion(emotion.id)}
            >
              <Text
                style={[
                  styles.emotionButtonText,
                  localSelectedEmotionId === emotion.id && styles.selectedEmotionButtonText,
                ]}
              >
                {emotion.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomContainer}>
            {responseText && (
                <View style={styles.responseContainer}>
                    <Text style={styles.responseText}>{responseText}</Text>
                </View>
            )}

            <TouchableOpacity
                style={[styles.nextButton, !localSelectedEmotionId && styles.disabledButton]}
                onPress={handleNext}
                disabled={!localSelectedEmotionId}
            >
                <Text style={styles.nextButtonText}>다음으로 넘어가기</Text>
            </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    flexDirection: 'row',
  },
  // --- Columns ---
  leftColumn: {
    width: width * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRightWidth: 1,
    borderRightColor: COLORS.lightGray,
  },
  rightColumn: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  // --- Left Column Components ---
  characterContainer: {
    marginBottom: 30,
  },
  haruCharacter: {
    width: 120,
    height: 160,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 14,
    color: COLORS.white,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  // --- Right Column Components ---
  emotionButtonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  emotionButton: {
    width: '45%', // Two buttons per row
    margin: '2.5%',
    paddingVertical: 20,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    alignItems: 'center',
    minHeight: 70,
    justifyContent: 'center',
  },
  selectedEmotionButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  emotionButtonText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
  },
  selectedEmotionButtonText: {
    color: COLORS.white,
  },
  bottomContainer: {
    width: '100%',
    alignItems: 'center',
  },
  responseContainer: {
    padding: 20,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    width: '100%',
    marginBottom: 20,
  },
  responseText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  nextButton: {
    width: '100%',
    paddingVertical: 18,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.gray,
  },
  nextButtonText: {
    fontSize: 18,
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default EmotionChatScreen;
