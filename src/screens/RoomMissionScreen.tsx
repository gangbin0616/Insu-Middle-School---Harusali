import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAppState } from '../context/AppStateContext';
import { COLORS } from '../constants/colors';
import { MISSIONS, Mission } from '../constants/missions';

type Props = NativeStackScreenProps<RootStackParamList, 'RoomMissionScreen'>;
const { width } = Dimensions.get('window');

const RoomMissionScreen = ({ navigation }: Props) => {
  const { selectedEmotion, missionHistory, completeMission } = useAppState();

  const missionList = useMemo(() => 
    selectedEmotion 
      ? MISSIONS.filter(m => m.relatedEmotion === selectedEmotion) 
      : MISSIONS, 
    [selectedEmotion]
  );

  const [currentMission, setCurrentMission] = useState<Mission>(missionList[0]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [step, setStep] = useState<'selection' | 'photo' | 'completed'>('selection');

  const handleSelectMission = (mission: Mission) => {
    setCurrentMission(mission);
    setStep('photo');
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '미션을 인증하려면 사진첩 접근 권한이 필요해요.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert('권한 필요', '미션을 인증하려면 카메라 접근 권한이 필요해요.');
        return;
    }

    let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
    });

    if (!result.canceled) {
        setImageUri(result.assets[0].uri);
    }
  };

  const handleComplete = () => {
    if (!currentMission) return;
    completeMission(currentMission, imageUri || undefined);
    setStep('completed');
    setTimeout(() => {
      navigation.navigate('HomeScreen');
      setStep('selection');
      setImageUri(null);
    }, 2000);
  };
  
  const showNextMission = () => {
      const currentIndex = missionList.findIndex(m => m.id === currentMission.id);
      const nextIndex = (currentIndex + 1) % missionList.length;
      setCurrentMission(missionList[nextIndex]);
  };

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyItem}>
      <Text style={styles.historyDate}>{item.date}</Text>
      <Text style={styles.historyText} numberOfLines={1}>{item.missionName}</Text>
      {item.photoUri && <Text style={styles.historyIcon}>📸</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContent}>
        {/* Left Column: History */}
        <View style={styles.leftColumn}>
          <Text style={styles.sectionTitle}>최근 기록</Text>
          {missionHistory.length > 0 ? (
            <FlatList
              data={missionHistory}
              renderItem={renderHistoryItem}
              keyExtractor={item => item.id}
            />
          ) : (
            <View style={styles.noHistoryContainer}>
                <Text style={styles.noHistoryText}>아직 완료한 미션이 없어요.</Text>
            </View>
          )}
        </View>

        {/* Right Column: Main Card */}
        <View style={styles.rightColumn}>
          <View style={styles.card}>
            {step === 'selection' && (
              <>
                <Text style={styles.cardTitle}>오늘의 미션</Text>
                <Text style={styles.missionText}>{currentMission.text}</Text>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.button} onPress={showNextMission}>
                    <Text style={styles.buttonText}>다른 미션</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={() => handleSelectMission(currentMission)}>
                    <Text style={[styles.buttonText, styles.primaryButtonText]}>이 미션 할래</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {step === 'photo' && (
              <>
                <Text style={styles.cardTitle}>{currentMission.text}</Text>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.thumbnail} />
                ) : (
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity style={[styles.button, styles.photoButton]} onPress={takePhoto}>
                        <Text style={[styles.buttonText, styles.primaryButtonText]}>📸 사진 찍기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.photoButton]} onPress={pickImage}>
                        <Text style={[styles.buttonText, styles.primaryButtonText]}>🖼️ 갤러리</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton, styles.fullWidthButton, !imageUri && styles.disabledButton]}
                  onPress={handleComplete}
                  disabled={!imageUri}
                >
                  <Text style={[styles.buttonText, styles.primaryButtonText]}>완료했다!</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'completed' && (
              <Text style={styles.infoText}>잘했어, 정말 작은 한 걸음이야!</Text>
            )}
          </View>
        </View>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('HomeScreen')} style={styles.homeButton}>
        <Text style={styles.homeButtonText}>홈으로</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 20,
  },
  leftColumn: {
    width: '35%',
    paddingRight: 20,
  },
  rightColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 15,
    paddingLeft: 5,
  },
  historyContainer: {
    width: '100%',
    marginBottom: 20,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 5,
    marginBottom: 8,
  },
  historyDate: { color: COLORS.lightGray, fontSize: 12 },
  historyText: { color: COLORS.white, flex: 1, marginHorizontal: 8, fontSize: 14, },
  historyIcon: { fontSize: 14 },
  noHistoryContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  noHistoryText: { color: COLORS.lightGray, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 25,
    width: '100%',
    height: '90%',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
  },
  missionText: {
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 28,
    color: COLORS.text,
    marginVertical: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    width: '48%',
    alignItems: 'center',
  },
  primaryButton: { backgroundColor: COLORS.primary },
  fullWidthButton: { width: '100%', marginTop: 15 },
  photoButton: { backgroundColor: COLORS.secondary, borderWidth: 0, },
  disabledButton: { backgroundColor: COLORS.gray },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  primaryButtonText: { color: COLORS.white },
  infoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
  },
  thumbnail: {
    width: '80%',
    height: '50%',
    borderRadius: 10,
    marginVertical: 15,
  },
  homeButton: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  homeButtonText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: 'bold'
  }
});

export default RoomMissionScreen;
