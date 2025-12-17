/**
 * @file GpsDemoScreen.tsx
 * @description Displays a map with the user's location and dummy mission spots.
 * 
 * @changelog
 * - Added a defensive try/catch block around `requestForegroundPermissionsAsync` to prevent crashes on unusual devices.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { COLORS } from '../constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'GpsDemoScreen'>;

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

const generateDummyPlaces = (currentRegion: Region): MissionMarker[] => {
    return DUMMY_PLACE_TITLES.map((title, index) => {
        const offset = 0.01 + (index * 0.002);
        return {
            id: `${title}_${index}`,
            title: title,
            latitude: currentRegion.latitude + (Math.random() - 0.5) * offset,
            longitude: currentRegion.longitude + (Math.random() - 0.5) * offset,
        };
    });
};

const GpsDemoScreen = ({ navigation }: Props) => {
  const [region, setRegion] = useState<Region | null>(null);
  const [dummyPlaces, setDummyPlaces] = useState<MissionMarker[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mapRef = useRef<MapView>(null);

  const setupLocation = async (isButtonPress: boolean = false) => {
    setErrorMsg(null);
    let status: Location.PermissionStatus;
    try {
      status = (await Location.requestForegroundPermissionsAsync()).status;
    } catch(e) {
      console.error("requestForegroundPermissionsAsync Error:", e);
      setErrorMsg('위치 정보 권한을 요청하는 중 오류가 발생했습니다.');
      setRegion(DEFAULT_LOCATION);
      setDummyPlaces(generateDummyPlaces(DEFAULT_LOCATION));
      if(isButtonPress) Alert.alert('오류', '위치 권한 요청 중 문제가 발생했습니다.');
      return;
    }

    if (status !== 'granted') {
      setErrorMsg('위치 정보 접근 권한이 거부되었습니다. 기본 위치로 표시됩니다.');
      setRegion(DEFAULT_LOCATION);
      setDummyPlaces(generateDummyPlaces(DEFAULT_LOCATION));
      if(isButtonPress) Alert.alert('권한 거부', '위치 정보 접근 권한이 거부되어 기본 위치로 지도를 표시합니다.');
      return;
    }

    try {
        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High, timeout: 5000 });
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
        console.error("getCurrentPositionAsync Error:", e);
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
    if (!place?.id || !place?.title) {
        Alert.alert("오류", "선택한 장소의 정보를 불러올 수 없습니다. 다시 시도해주세요.");
        return;
    }

    try {
        navigation.navigate('MarkerMissionScreen', { id: place.id, title: place.title });
    } catch (e: any) {
        console.error("Navigation error to MarkerMissionScreen:", e);
        Alert.alert("내비게이션 오류", `미션 화면으로 이동할 수 없습니다.`);
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
});

export default GpsDemoScreen;