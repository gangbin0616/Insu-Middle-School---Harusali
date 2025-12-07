// src/screens/MarkerMissionScreen.tsx
import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { COLORS } from '../constants/colors';
import { useAppState } from '../context/AppStateContext';
import { Mission } from '../constants/missions'; // Reusing Mission type

type Props = NativeStackScreenProps<RootStackParamList, 'MarkerMissionScreen'>;

const { width, height } = Dimensions.get('window');

// Mission mapping function as provided by the user
function getMissionForPlace(title: string): { missionTitle: string; description: string } {
  const lower = title.toLowerCase();

  if (lower.includes('공원') || lower.includes('산책로')) {
    return {
      missionTitle: '공원 미션',
      description: '근처 공원에 가서 3분 동안 벤치에 앉아서 쉬어 보기',
    };
  }

  if (lower.includes('카페')) {
    return {
      missionTitle: '카페 미션',
      description: '따뜻한 차 한 잔 마시면서 조용히 앉아 있기',
    };
  }

  if (lower.includes('서점')) {
    return {
      missionTitle: '서점 미션',
      description: '서점에 가서 관심 가는 책 한 권의 제목만 읽어 보기',
    };
  }

  return {
    missionTitle: '산책 미션',
    description: '이 근처를 천천히 걸으면서 하늘을 조금만 바라봐 보기',
  };
}

const MarkerMissionScreen = ({ route, navigation }: Props) => {
  const { id, title } = route.params;
  const { completeMission } = useAppState();

  // Defensive check for params
  if (!id || !title) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>미션 정보를 불러올 수 없습니다.</Text>
        <TouchableOpacity style={styles.closeButtonFull} onPress={() => navigation.goBack()}>
          <Text style={styles.closeButtonText}>닫기</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const missionDetails = getMissionForPlace(title);

  const handleCompleteMission = () => {
    const virtualMission: Mission = { id: id, text: missionDetails.description, relatedEmotion: 'outside' };
    completeMission(virtualMission); // Record mission completion
    Alert.alert("미션 완료!", "대단해요! 미션이 기록되었습니다.");
    navigation.navigate('HomeScreen'); // Go to home screen after completion
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardHeader}>{title}</Text>
        <Text style={styles.missionTitle}>{missionDetails.missionTitle}</Text>
        <Text style={styles.missionDescription}>{missionDetails.description}</Text>

        <TouchableOpacity style={styles.tryMissionButton} onPress={() => Alert.alert("미션 시작", "미션을 시작해볼까요?")}>
          <Text style={styles.tryMissionButtonText}>이 미션 해 볼래</Text>
        </TouchableOpacity>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.completeButton} onPress={handleCompleteMission}>
            <Text style={styles.completeButtonText}>완료했어</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Text style={styles.closeButtonText}>닫기</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 30,
    width: width * 0.7, // Adjusted for landscape
    height: height * 0.7,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  cardHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  missionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 15,
    textAlign: 'center',
  },
  missionDescription: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 24,
    flex: 1, // Allow text to take up space
  },
  tryMissionButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 20,
  },
  tryMissionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  completeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  closeButton: {
    backgroundColor: COLORS.lightGray,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButtonFull: {
    backgroundColor: COLORS.lightGray,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 20,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default MarkerMissionScreen;
