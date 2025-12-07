import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAppState } from '../context/AppStateContext';
import { COLORS } from '../constants/colors';
import { REPORT_TEXTS } from '../constants/reports';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportScreen'>;

const { width } = Dimensions.get('window');

const ReportScreen = ({ navigation }: Props) => {
  const { reportType } = useAppState();

  const report = REPORT_TEXTS[reportType] || REPORT_TEXTS.default;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* This View is a placeholder for 'report_card_bg.png' */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>하루 리포트</Text>
          <Text style={styles.reportTitle}>{report.title}</Text>
          <Text style={styles.reportDescription}>{report.description}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'HomeScreen' }] })}
          >
            <Text style={styles.buttonText}>처음으로 돌아가기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => navigation.navigate('GpsDemoScreen')}
          >
            <Text style={[styles.buttonText, styles.primaryButtonText]}>밖으로 나가면?</Text>
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
  content: {
    width: width * 0.7, // Made content narrower for landscape
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    paddingVertical: 30,
    paddingHorizontal: 25,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 250, // Reduced height
    justifyContent: 'center',
  },
  cardHeader: {
    fontSize: 20, // Slightly smaller
    fontWeight: 'bold',
    color: COLORS.secondary,
    position: 'absolute',
    top: 20,
  },
  reportTitle: {
    fontSize: 22, // Slightly smaller
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 15,
  },
  reportDescription: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30, // Reduced margin
    width: '100%',
  },
  button: {
    backgroundColor: COLORS.white,
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    width: '48%',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  primaryButtonText: {
    color: COLORS.white,
  },
});

export default ReportScreen;
