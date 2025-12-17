import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator, Linking, Switch } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { COLORS } from '../constants/colors';
import { useAppState } from '../context/AppStateContext';
import { HaruEmotion, GeminiStatus } from '../api/gemini';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminScreen'>;

const emotionLabels: { [key in HaruEmotion]: string } = {
  neutral: '5 (기본)',
  very_shy: '1 (부끄럼)',
  turned_away: '2 (외면)',
  relaxed_smile: '3 (편안함)',
  half_turned: '4 (망설임)',
};
const emotionOrder: HaruEmotion[] = ['very_shy', 'turned_away', 'relaxed_smile', 'half_turned', 'neutral'];

const statusInfo: { [key in GeminiStatus]: { text: string; color: string; description: string; } } = {
    idle: { text: '대기 중', color: COLORS.gray, description: '아직 AI를 사용하지 않았어요.' },
    ok: { text: '정상', color: '#28a745', description: '지금은 AI가 정상적으로 대답하고 있어요.' },
    overloaded: { text: '혼잡', color: '#ffc107', description: 'AI 서버가 잠시 혼잡해요. 대체 답변이 나갈 수 있어요.' },
    error: { text: '오류', color: COLORS.danger, description: 'AI 연결에 문제가 있어요. 네트워크나 API 설정을 확인해 주세요.' },
};

const GeminiStatusPanel = () => {
    const { geminiStatus, lastGeminiError } = useAppState();
    const { text, color, description } = statusInfo[geminiStatus] || statusInfo.idle;

    return (
        <View style={styles.statusPanel}>
            <View style={[styles.statusDot, { backgroundColor: color }]} />
            <View style={styles.statusTextContainer}>
                <Text style={styles.statusText}>{text}</Text>
                <Text style={styles.statusDescription}>{description}</Text>
                {geminiStatus === 'error' && lastGeminiError ? (
                    <Text style={styles.errorText}>(마지막 오류: {lastGeminiError})</Text>
                ) : null}
                 {geminiStatus === 'overloaded' && lastGeminiError ? (
                    <Text style={styles.warningText}>(정보: {lastGeminiError})</Text>
                ) : null}
            </View>
        </View>
    );
};


const AdminScreen = ({ navigation }: Props) => {
  const { 
    softReset, hardReset, haruEmotion, setHaruEmotion, updateApiKey, 
    isAiThinking, isInitialized, useAiResponse, setUseAiResponse,
    geminiStatus, lastGeminiError
  } = useAppState();
  const [showApiInput, setShowApiInput] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isTestingKey, setIsTestingKey] = useState(false);

  const isBusy = isAiThinking || !isInitialized;

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
            Alert.alert("완료", "채팅 기록이 초기화되었습니다.", [{ text: "OK" }]);
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleHardReset = () => {
    Alert.alert(
      "하드 리셋",
      "모든 기록(채팅, 미션 등)이 삭제됩니다. 정말 진행할까요?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "확인", 
          onPress: async () => {
            await hardReset();
            Alert.alert("완료", "앱이 완전히 초기화되었습니다.", [{ text: "OK" }]);
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleSetEmotion = (emotion: HaruEmotion) => setHaruEmotion(emotion);

  const handleToggleAiResponse = (value: boolean) => {
    if (!value) {
      Alert.alert(
        "AI 응답 비활성화",
        "이 기능은 테스트용입니다.\nAI 응답을 끄면 하루가 준비해 둔 정해진 멘트만 사용합니다.\n정말 비활성화할까요?",
        [
          { text: "아니오", style: "cancel" },
          { text: "예", onPress: () => setUseAiResponse(false), style: "destructive" }
        ]
      );
    } else {
      Alert.alert(
        "AI 응답 활성화",
        "AI 응답을 다시 켤게요. 네 이야기를 더 잘 들어줄 수 있어요.",
        [{ text: "확인", onPress: () => setUseAiResponse(true) }]
      );
    }
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
      Alert.alert("실패", "입력한 API 키가 유효하지 않거나 네트워크에 문제가 있습니다. 이전 키로 복원되었을 수 있습니다.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity style={styles.homeButton} onPress={() => navigation.goBack()} disabled={isBusy}>
            <Text style={styles.homeButtonText}>홈으로</Text>
        </TouchableOpacity>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>관리자 도구</Text>
        
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gemini API 상태</Text>
            <GeminiStatusPanel />
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>리셋 도구</Text>
            <TouchableOpacity style={[styles.button, styles.buttonSoft, isBusy && styles.buttonDisabled]} onPress={handleSoftReset} disabled={isBusy}>
              <Text style={styles.buttonText}>리셋 (채팅 기록 삭제)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.buttonHard, isBusy && styles.buttonDisabled]} onPress={handleHardReset} disabled={isBusy}>
              <Text style={styles.buttonText}>하드 리셋 (전체 초기화)</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI 사용 설정</Text>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>AI 응답 사용하기</Text>
            <Switch
              trackColor={{ false: COLORS.gray, true: COLORS.primary }}
              thumbColor={COLORS.white}
              ios_backgroundColor={COLORS.lightGray}
              onValueChange={handleToggleAiResponse}
              value={useAiResponse}
              disabled={isBusy}
            />
          </View>
           <Text style={styles.descriptionText}>
            이 설정을 끄면 하루가 정해진 답변만 사용합니다 (테스트용).
          </Text>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>하루 기본 이미지 변경</Text>
            <View style={styles.emotionSelectorContainer}>
              {emotionOrder.map((emotion) => (
                <TouchableOpacity
                  key={emotion}
                  style={[ 
                    styles.emotionButton,
                    haruEmotion === emotion && styles.emotionButtonActive,
                    isBusy && styles.buttonDisabled
                  ]}
                  onPress={() => handleSetEmotion(emotion)}
                  disabled={isBusy}
                >
                  <Text style={[styles.emotionButtonText, haruEmotion === emotion && styles.emotionButtonTextActive]}>
                    {emotionLabels[emotion]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>API 설정</Text>
            <Text style={styles.descriptionText}>일반적으로 변경할 필요가 없습니다.</Text>
            {!showApiInput && (
              <TouchableOpacity style={[styles.button, styles.buttonWarning, isBusy && styles.buttonDisabled]} onPress={handleUpdateApiKey} disabled={isBusy}>
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
                  editable={!isTestingKey && !isBusy}
                />
                <TouchableOpacity style={[styles.button, { marginTop: 10 }, (isTestingKey || isBusy) && styles.buttonDisabled]} onPress={handleSaveApiKey} disabled={isTestingKey || isBusy}>
                  {isTestingKey ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>저장 및 유효성 검사</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.buttonSoft, { marginTop: 0 }, (isTestingKey || isBusy) && styles.buttonDisabled]} onPress={() => setShowApiInput(false)} disabled={isTestingKey || isBusy}>
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
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  homeButton: { position: 'absolute', top: 24, left: 16, zIndex: 20, backgroundColor: '#E8E5D5', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 5 },
  homeButtonText: { color: '#444444', fontSize: 14, fontWeight: 'bold' },
  container: { flex: 1, padding: 20, marginTop: 60 },
  header: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 30 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: COLORS.primary, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray, paddingBottom: 5 },
  button: { paddingVertical: 15, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', marginBottom: 10, backgroundColor: COLORS.primary },
  buttonDisabled: { backgroundColor: COLORS.gray, opacity: 0.7 },
  buttonSoft: { backgroundColor: COLORS.secondary },
  buttonHard: { backgroundColor: COLORS.danger },
  buttonWarning: { backgroundColor: '#f0ad4e' },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  emotionSelectorContainer: { flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap' },
  emotionButton: { borderWidth: 1, borderColor: COLORS.primary, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 15, marginBottom: 10 },
  emotionButtonActive: { backgroundColor: COLORS.primary },
  emotionButtonText: { color: COLORS.primary, fontSize: 14 },
  emotionButtonTextActive: { color: COLORS.white, fontWeight: 'bold' },
  descriptionText: { fontSize: 14, color: COLORS.gray, marginBottom: 15, marginTop: 5 },
  apiInputContainer: { marginTop: 10 },
  textInput: { borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 8, padding: 15, fontSize: 16, backgroundColor: COLORS.white },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  switchLabel: { fontSize: 16, color: COLORS.text },
  footer: { marginTop: 50, alignItems: 'center' },
  footerText: { textDecorationLine: 'underline', color: COLORS.gray },
  statusPanel: { backgroundColor: COLORS.white, borderRadius: 8, padding: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.lightGray },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  statusTextContainer: { flex: 1 },
  statusText: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  statusDescription: { fontSize: 14, color: COLORS.gray, marginTop: 2 },
  errorText: { fontSize: 12, color: COLORS.danger, marginTop: 4 },
  warningText: { fontSize: 12, color: '#856404', marginTop: 4 },
});

export default AdminScreen;
