import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { COLORS } from '../constants/colors';
import { useAppState } from '../context/AppStateContext';
import { HaruEmotion } from '../api/gemini';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminScreen'>;

const emotionLabels: { [key in HaruEmotion]: string } = {
  neutral: '5 (기본)',
  very_shy: '1 (부끄럼)',
  turned_away: '2 (외면)',
  relaxed_smile: '3 (편안함)',
  half_turned: '4 (망설임)',
};
const emotionOrder: HaruEmotion[] = ['very_shy', 'turned_away', 'relaxed_smile', 'half_turned', 'neutral'];


const AdminScreen = ({ navigation }: Props) => {
  const { softReset, hardReset, defaultHaruEmotion, setDefaultHaruEmotion, updateApiKey } = useAppState();
  const [showApiInput, setShowApiInput] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isTestingKey, setIsTestingKey] = useState(false);

  const handleSoftReset = () => {
    Alert.alert(
      "리셋",
      "채팅 기록을 모두 삭제합니다. 정말 리셋할까요?",
      [
        { text: "취소", style: "cancel" },
        { 
          text: "확인", 
          onPress: async () => {
            await softReset();
            Alert.alert("완료", "채팅 기록이 초기화되었습니다.", [
              { text: "OK", onPress: () => navigation.navigate('HomeScreen') }
            ]);
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleHardReset = () => {
    Alert.alert(
      "하드 리셋",
      "이 기능은 전시용 앱을 완전히 초기화합니다. 모든 기록(채팅, 미션 등)이 삭제됩니다. 정말 진행할까요?",
      [
        { text: "취소", style: "cancel" },
        { 
          text: "확인", 
          onPress: async () => {
            await hardReset();
            Alert.alert("완료", "앱이 완전히 초기화되었습니다.", [
              { text: "OK", onPress: () => navigation.navigate('HomeScreen') }
            ]);
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleSetEmotion = (emotion: HaruEmotion) => {
    setDefaultHaruEmotion(emotion);
  };

  const handleUpdateApiKey = () => {
    Alert.alert(
      "API 키 변경",
      "이 기능은 문제가 생겼을 때만 사용하는 관리자용 기능입니다. 정말 API 키를 변경할까요?",
      [
        { text: "취소", style: "cancel" },
        { text: "확인", onPress: () => setShowApiInput(true) }
      ]
    )
  };

  const handleSaveApiKey = async () => {
    if (apiKey.trim() === '') {
      Alert.alert("오류", "API 키를 입력해주세요.");
      return;
    }
    setIsTestingKey(true);
    const success = await updateApiKey(apiKey.trim());
    setIsTestingKey(false);
    
    if (success) {
      Alert.alert("성공", "API 키가 유효하며, 성공적으로 업데이트되었습니다.");
      setShowApiInput(false);
      setApiKey('');
    } else {
      Alert.alert("실패", "입력한 API 키가 유효하지 않거나 네트워크에 문제가 있습니다. 이전 키로 복원되었습니다.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity style={styles.homeButton} onPress={() => navigation.goBack()}>
            <Text style={styles.homeButtonText}>홈으로</Text>
        </TouchableOpacity>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>관리자 도구</Text>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>리셋 도구</Text>
            <TouchableOpacity style={[styles.button, styles.buttonSoft]} onPress={handleSoftReset}>
              <Text style={styles.buttonText}>리셋 (채팅 기록 삭제)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.buttonHard]} onPress={handleHardReset}>
              <Text style={styles.buttonText}>하드 리셋 (전체 초기화)</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>하루 기본 이미지 변경</Text>
            <View style={styles.emotionSelectorContainer}>
              {emotionOrder.map((emotion) => (
                <TouchableOpacity
                  key={emotion}
                  style={[
                    styles.emotionButton,
                    defaultHaruEmotion === emotion && styles.emotionButtonActive,
                  ]}
                  onPress={() => handleSetEmotion(emotion)}
                >
                  <Text style={[styles.emotionButtonText, defaultHaruEmotion === emotion && styles.emotionButtonTextActive]}>
                    {emotionLabels[emotion]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.button, {marginTop: 10}]} onPress={() => Alert.alert("완료", "기본 이미지가 적용되었습니다.")}>
              <Text style={styles.buttonText}>적용 완료</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>API 설정</Text>
            <Text style={styles.descriptionText}>현재 API 설정은 정상입니다. 일반적으로 변경할 필요가 없습니다.</Text>
            {!showApiInput && (
              <TouchableOpacity style={[styles.button, styles.buttonWarning]} onPress={handleUpdateApiKey}>
                <Text style={styles.buttonText}>API 키 변경하기</Text>
              </TouchableOpacity>
            )}
            {showApiInput && (
              <View style={styles.apiInputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="새로운 API 키를 여기에 붙여넣기"
                  value={apiKey}
                  onChangeText={setApiKey}
                  secureTextEntry
                />
                <TouchableOpacity style={[styles.button, { marginTop: 10 }]} onPress={handleSaveApiKey} disabled={isTestingKey}>
                  {isTestingKey ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>저장 및 유효성 검사</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.buttonSoft, { marginTop: 0 }]} onPress={() => setShowApiInput(false)}>
                  <Text style={styles.buttonText}>취소</Text>
                </TouchableOpacity>
              </View>
            )}
        </View>

        <View style={styles.footer}>
            <TouchableOpacity onPress={() => Linking.openURL('tel:010-6412-8864')}>
                <Text style={styles.footerText}>문의: 010-6412-8864</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  homeButton: {
    position: 'absolute', top: 24, left: 16, zIndex: 20,
    backgroundColor: '#E8E5D5', paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 3, elevation: 5,
  },
  homeButtonText: { color: '#444444', fontSize: 14, fontWeight: 'bold' },
  container: {
    flex: 1,
    padding: 20,
    marginTop: 60, // Add margin to avoid overlap with home button
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    paddingBottom: 5,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: COLORS.primary,
  },
  buttonSoft: {
    backgroundColor: COLORS.secondary,
  },
  buttonHard: {
    backgroundColor: COLORS.danger,
  },
  buttonWarning: {
    backgroundColor: '#f0ad4e'
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emotionSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  emotionButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  emotionButtonActive: {
    backgroundColor: COLORS.primary,
  },
  emotionButtonText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  emotionButtonTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 15,
  },
  apiInputContainer: {
    marginTop: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: COLORS.white,
  },
  footer: {
      marginTop: 50,
      alignItems: 'center',
  }
});

export default AdminScreen;
