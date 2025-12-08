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
  ImageBackground,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAppState } from '../context/AppStateContext';
import { COLORS } from '../constants/colors';
import { MISSIONS, Mission } from '../constants/missions';

type Props = NativeStackScreenProps<RootStackParamList, 'RoomMissionScreen'>;

// Mission Card Component
const MissionItem = ({ mission, onSelect }: { mission: Mission, onSelect: (mission: Mission) => void }) => (
  <View style={styles.missionCard}>
    <Text style={styles.missionCardText}>{mission.text}</Text>
    <TouchableOpacity style={styles.missionSelectButton} onPress={() => onSelect(mission)}>
      <Text style={styles.missionSelectButtonText}>이 미션 할래</Text>
    </TouchableOpacity>
  </View>
);

const RoomMissionScreen = ({ navigation }: Props) => {
  const { selectedEmotion, missionHistory, completeMission } = useAppState();

  const missionList = useMemo(() => 
    selectedEmotion 
      ? MISSIONS.filter(m => m.relatedEmotion === selectedEmotion) 
      : MISSIONS, 
    [selectedEmotion]
  );

  const [currentMission, setCurrentMission] = useState<Mission | null>(null);
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
      // Reset state for next time
      setStep('selection');
      setImageUri(null);
      setCurrentMission(null);
    }, 2000);
  };

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyItem}>
      <Text style={styles.historyDate}>{item.date}</Text>
      <Text style={styles.historyText} numberOfLines={1}>{item.missionName}</Text>
      {item.photoUri && <Text style={styles.historyIcon}>📸</Text>}
    </View>
  );
  
  const renderContent = () => {
    switch (step) {
      case 'selection':
        return (
          <>
            <Text style={styles.cardTitle}>오늘의 미션</Text>
            <Text style={styles.cardSubtitle}>마음에 드는 미션을 골라봐.</Text>
            <FlatList
              data={missionList}
              renderItem={({ item }) => <MissionItem mission={item} onSelect={handleSelectMission} />}
              keyExtractor={item => item.id}
              style={styles.missionList}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </>
        );
      case 'photo':
        return (
          <>
            <Text style={styles.cardTitle}>{currentMission?.text}</Text>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.thumbnail} />
            ) : (
              <View style={styles.photoChoiceContainer}>
                <Text style={styles.photoInfoText}>미션을 완료했음을 사진으로 인증해줘!</Text>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={[styles.button, styles.photoButton]} onPress={takePhoto}>
                      <Text style={[styles.buttonText, styles.primaryButtonText]}>📸 사진 찍기</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, styles.photoButton]} onPress={pickImage}>
                      <Text style={[styles.buttonText, styles.primaryButtonText]}>🖼️ 갤러리</Text>
                  </TouchableOpacity>
                </View>
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
        );
      case 'completed':
        return <Text style={styles.infoText}>잘했어, 정말 작은 한 걸음이야!</Text>;
      default:
        return null;
    }
  };

  return (
    <ImageBackground 
      source={require('../../assets/room_bg.png')} 
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
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
              {renderContent()}
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('HomeScreen')} style={styles.homeButton}>
          <Text style={styles.homeButtonText}>홈으로</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)', // To make content more readable over the background
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
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
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
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 15,
    padding: 25,
    width: '100%',
    height: '90%',
    alignItems: 'center',
    justifyContent: 'flex-start',
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
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 20,
  },
  missionList: {
    width: '100%',
  },
  missionCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  missionCardText: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  missionSelectButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginLeft: 10,
  },
  missionSelectButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  photoChoiceContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  photoInfoText: {
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  thumbnail: {
    width: '80%',
    height: '50%',
    borderRadius: 10,
    marginVertical: 15,
  },
  homeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
  },
  homeButtonText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  }
});

export default RoomMissionScreen;
