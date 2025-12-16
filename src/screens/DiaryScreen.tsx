import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Image, ImageSourcePropType } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAppState } from '../context/AppStateContext';

// --- Types and Constants ---
type Props = NativeStackScreenProps<RootStackParamList, 'DiaryScreen'>;

interface DiaryPageData {
    id: number;
    image: ImageSourcePropType;
    lines: string[];
    requiredChatCount: number;
}

const { width, height } = Dimensions.get('window');

// --- Color Palette ---
const PALETTE = {
    background: '#F5F3E8',
    bookCover: '#E8E5D5',
    imageAreaBg: '#F3F2EE',
    pageBg: '#FFFEF9',
    line: '#D5D4C8',
    textDark: '#444444',
    textLight: '#777777',
    buttonBg: 'rgba(78, 52, 46, 0.7)',
    homeButtonBg: '#E8E5D5',
    lockedOverlayBg: 'rgba(0,0,0,0.6)',
};

// --- Page Data (Simplified for one page per screen) ---
const PAGES_DATA: DiaryPageData[] = [
    {
        id: 1,
        image: require('../../assets/KakaoTalk_20251215_224724985.png'),
        lines: ['나와 하루가 처음 만난 날.', '하루가 내 이야기를 들어줬어.', '처음엔 어색했지만', '말하다 보니 조금 후련해졌다.'],
        requiredChatCount: 1,
    },
    {
        id: 2,
        image: require('../../assets/KakaoTalk_20251215_224724985_01.png'),
        lines: ['오늘은 화분에 물을 줬다.', '생각보다 재미있었어.', '작은 것도 해내니', '조금 뿌듯했다.'],
        requiredChatCount: 2,
    },
    {
        id: 3,
        image: require('../../assets/KakaoTalk_20251216_091611135.png'),
        lines: ['책을 정리했다.', '하루와 이야기하니까', '조금씩 움직이고 싶어진다.', '계속 이야기하고 싶어.'],
        requiredChatCount: 3,
    },
];

const MAX_PAGE_INDEX = PAGES_DATA.length - 1;

// --- Main Screen Component ---
const DiaryScreen = ({ navigation }: Props) => {
    const { chatCount } = useAppState();
    const [currentPageIndex, setCurrentPageIndex] = useState(0);

    const currentPageData = PAGES_DATA[currentPageIndex];
    const isLocked = chatCount < (currentPageData?.requiredChatCount ?? 0);

    const goToNextPage = () => {
        if (currentPageIndex < MAX_PAGE_INDEX) {
            setCurrentPageIndex(currentPageIndex + 1);
        }
    };

    const goToPrevPage = () => {
        if (currentPageIndex > 0) {
            setCurrentPageIndex(currentPageIndex - 1);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.homeButton}>
                    <Text style={styles.homeButtonText}>홈으로</Text>
                </TouchableOpacity>

                <View style={styles.bookContainer}>
                    {isLocked ? (
                        <View style={styles.lockedOverlay}>
                            <Text style={styles.lockIcon}>🔒</Text>
                            <Text style={styles.lockedText}>하루와 더 이야기하면</Text>
                            <Text style={styles.lockedText}>이 일기를 볼 수 있어요</Text>
                        </View>
                    ) : (
                        <>
                            {/* Left Area: Image Only */}
                            <View style={styles.leftImageArea}>
                                <Image source={currentPageData.image} style={styles.diaryImage} resizeMode="contain" />
                            </View>
                            
                            {/* Right Area: Text Only */}
                            <View style={styles.rightTextArea}>
                                <View style={styles.textLinesContainer}>
                                    {Array.from({ length: 8 }).map((_, index) => (
                                        <View key={index} style={styles.lineRow}>
                                            <Text style={styles.lineText}>{currentPageData.lines[index] ?? ''}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </>
                    )}
                </View>
                 <Text style={styles.pageNumberIndicator}>{`${currentPageIndex + 1} / ${PAGES_DATA.length}`}</Text>
            </View>
            
            {/* Navigation Arrows */}
            <TouchableOpacity 
                style={[styles.navButton, styles.prevButton, currentPageIndex === 0 && styles.disabledButton]} 
                onPress={goToPrevPage}
                disabled={currentPageIndex === 0}
            >
                <Text style={styles.navButtonText}>◀</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.navButton, styles.nextButton, currentPageIndex === MAX_PAGE_INDEX && styles.disabledButton]} 
                onPress={goToNextPage}
                disabled={currentPageIndex === MAX_PAGE_INDEX}
            >
                <Text style={styles.navButtonText}>▶</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: PALETTE.background },
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    homeButton: {
        position: 'absolute', top: 24, left: 16, zIndex: 20,
        backgroundColor: PALETTE.homeButtonBg, paddingHorizontal: 20, paddingVertical: 10,
        borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 3, elevation: 5,
    },
    homeButtonText: { color: PALETTE.textDark, fontSize: 14, fontWeight: 'bold' },
    bookContainer: {
        width: width * 0.9, height: height * 0.75, flexDirection: 'row',
        backgroundColor: PALETTE.bookCover, borderRadius: 10,
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 5, elevation: 8,
        overflow: 'hidden',
    },
    
    // --- Column Layout ---
    leftImageArea: {
        width: '60%',
        height: '100%',
        backgroundColor: PALETTE.imageAreaBg,
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
    },
    rightTextArea: {
        width: '40%',
        height: '100%',
        backgroundColor: PALETTE.pageBg,
        padding: 24,
        borderLeftWidth: 2,
        borderLeftColor: PALETTE.bookCover,
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
    },

    // --- Content Styles ---
    diaryImage: {
        width: '100%',
        height: '100%',
    },
    textLinesContainer: {
        flex: 1,
        justifyContent: 'center', // Center lines vertically
    },
    lineRow: {
        borderBottomWidth: 1,
        borderBottomColor: PALETTE.line,
        height: 30, // Increased height for more spacing
        justifyContent: 'center',
    },
    lineText: {
        fontSize: 15,
        lineHeight: 22,
        color: PALETTE.textDark,
    },
    pageNumberIndicator: {
        position: 'absolute',
        bottom: height * 0.1,
        fontSize: 14,
        color: PALETTE.textLight,
    },

    // --- Locked State ---
    lockedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: PALETTE.lockedOverlayBg,
        justifyContent: 'center', alignItems: 'center', zIndex: 10,
    },
    lockIcon: { fontSize: 50, marginBottom: 20, color: 'white' },
    lockedText: { fontSize: 18, color: 'white', fontWeight: 'bold', textAlign: 'center', lineHeight: 26 },
    
    // --- Navigation ---
    navButton: {
        position: 'absolute', bottom: 30, width: 50, height: 50,
        borderRadius: 25, backgroundColor: PALETTE.buttonBg,
        justifyContent: 'center', alignItems: 'center', zIndex: 20,
    },
    prevButton: { left: 30 },
    nextButton: { right: 30 },
    navButtonText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
    disabledButton: { opacity: 0.3 },
});

export default DiaryScreen;
