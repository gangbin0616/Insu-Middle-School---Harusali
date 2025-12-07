/**
 * @file GpsDemoScreen.tsx
 * @description Displays a map with the user's location and dummy mission spots.
 * 
 * --- IMPORTANT SETUP for react-native-maps ---
 * For Android, you MUST provide a Google Maps API key.
 * Add it to your `app.json` file.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { COLORS } from '../constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'GpsDemoScreen'>;

// --- TYPE DEFINITIONS ---
type MissionMarker = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
};

const DEFAULT_LOCATION: Region = {
  latitude: 37.5665,
  longitude: 126.9780,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const DUMMY_PLACE_TITLES = ['공원', '카페', '강변', '서점', '산책로'];

// --- Helper Functions ---
const getMissionForPlace = (placeTitle: string): string => {
  if (placeTitle.includes('공원') || placeTitle.includes('산책로')) {
    return '그곳에 가서 잠시 쉬기 / 벤치에 앉아 있기';
  }
  if (placeTitle.includes('카페') || placeTitle.includes('서점')) {
    return '따뜻한 차 한 잔 마시거나, 좋아하는 책 구경하기';
  }
  return '그 주변을 천천히 걸으면서 하늘 보기';
};

const generateDummyPlaces = (currentRegion: Region): MissionMarker[] => {
    return DUMMY_PLACE_TITLES.map((title, index) => {
        const offset = 0.01 + (index * 0.002); // Create some distance
        return {
            id: `${title}_${index}`,
            title: title,
            latitude: currentRegion.latitude + (Math.random() - 0.5) * offset,
            longitude: currentRegion.longitude + (Math.random() - 0.5) * offset,
        };
    });
};

// --- Main Component ---
const GpsDemoScreen = ({ navigation }: Props) => {
  const [region, setRegion] = useState<Region | null>(null);
  const [dummyPlaces, setDummyPlaces] = useState<MissionMarker[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mapRef = useRef<MapView>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const setupLocation = async (isButtonPress: boolean = false) => {
    setErrorMsg(null);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('위치 정보 접근 권한이 거부되었습니다. 기본 위치로 표시됩니다.');
      setRegion(DEFAULT_LOCATION);
      setDummyPlaces(generateDummyPlaces(DEFAULT_LOCATION));
      if(isButtonPress) Alert.alert('권한 거부', '위치 정보 접근 권한이 거부되어 기본 위치로 지도를 표시합니다.');
      return;
    }

    try {
        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const newRegion = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
        };
        setRegion(newRegion);
        setDummyPlaces(generateDummyPlaces(newRegion));
        mapRef.current?.animateToRegion(newRegion, 1000);
    } catch(e) {
        setErrorMsg('현재 위치를 가져올 수 없습니다. 기본 위치로 표시됩니다.');
        setRegion(DEFAULT_LOCATION);
        setDummyPlaces(generateDummyPlaces(DEFAULT_LOCATION));
        if(isButtonPress) Alert.alert('오류', '현재 위치를 가져올 수 없어 기본 위치로 지도를 표시합니다.');
    }
  };

  useEffect(() => {
    setupLocation();
  }, []);

  const handleMarkerPress = (place: MissionMarker) => {
    // Defensive coding: Check if place and its properties are valid
    if (!place || !place.id || !place.title) {
        Alert.alert("오류", "선택한 장소의 정보를 불러올 수 없습니다. 다시 시도해주세요.");
        return;
    }

    try {
        // Navigate to the new MarkerMissionScreen
        navigation.navigate('MarkerMissionScreen', { id: place.id, title: place.title });
    } catch (e: any) {
        console.error("Navigation error to MarkerMissionScreen:", e);
        Alert.alert(
            "내비게이션 오류",
            `미션 화면으로 이동할 수 없습니다: ${e.message || "알 수 없는 오류"}`
        );
    }
  };

  if (!region) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text>지도와 위치를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {dummyPlaces.map((place) => (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.latitude, longitude: place.longitude }}
            title={place.title}
            pinColor={COLORS.secondary}
            onPress={() => handleMarkerPress(place)}
          />
        ))}
      </MapView>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          {errorMsg || "주변의 장소를 눌러 미션을 확인해보세요."}
        </Text>
      </View>

      <TouchableOpacity style={styles.recenterButton} onPress={() => setupLocation(true)}>
          <Text style={styles.recenterButtonText}>위치 재설정</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => navigation.navigate('HomeScreen')}
      >
        <Text style={styles.homeButtonText}>홈으로 돌아가기</Text>
      </TouchableOpacity>


    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map: { ...StyleSheet.absoluteFillObject },
  disclaimer: {
    position: 'absolute',
    top: 20,
    width: '80%',
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 8,
    borderRadius: 10,
  },
  disclaimerText: { color: COLORS.white, fontSize: 14, textAlign: 'center' },
  recenterButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: COLORS.white,
    padding: 10,
    borderRadius: 8,
    elevation: 5,
  },
  recenterButtonText: { color: COLORS.primary, fontWeight: 'bold' },
  homeButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    elevation: 5,
  },
  homeButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalView: {
    width: '100%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  modalText: { marginBottom: 25, textAlign: 'center', fontSize: 18, color: COLORS.primary },
  closeButton: { backgroundColor: COLORS.secondary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 },
  closeButtonText: { color: COLORS.primary, fontWeight: 'bold', textAlign: 'center' },
});

export default GpsDemoScreen;
