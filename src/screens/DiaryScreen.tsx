/**
 * @file src/screens/DiaryScreen.tsx
 * @description Screen for viewing diary pages that unlock based on chat count.
 * 
 * @changelog
 * - Added a guardrail to handle the case where PAGES_DATA might be empty, preventing a potential crash.
 */
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

const PAGES_DATA: DiaryPageData[] = [
    {
        id: 1,
        image: require('../../assets/KakaoTalk_20251215_224724985.png'),
        lines: ['오늘은 책장을 정리했다.', '아침에 일어나서 책장 앞에 섰는데,', '언제 이렇게 쌓였나 싶을 정도로 책이 많았다.', '한 권씩 꺼내서 먼지를 닦고', '다시 제자리에 넣었다.', '생각보다 시간이 오래 걸렸지만', '끝까지 해냈다. 정리된 책장을 보니 뿌듯했다.', '오랜만에 뭔가를 끝냈다는 게 좋았다.'],
        requiredChatCount: 1,
    },
    {
        id: 2,
        image: require('../../assets/KakaoTalk_20251215_224724985_01.png'),
        lines: ['오늘은 밖에 나갔다. 친구들이 산책 가자해서', '따라나섰는데, 날씨가 생각보다 좋았다.', '길가에 있는 꽃을 구경하고 물도 주었다.', '바람이 불고 구름이 떠다니는 걸 보니까', '기분이 좀 나아졌다. 친구들이 옆에서', '재잘재잘 얘기하는게 듣기 좋았다.', '오랜만에 햇살을 제대로 받은 것 같다.'],
        requiredChatCount: 2,
    },
    {
        id: 3,
        image: require('../../assets/KakaoTalk_20251216_091611135.png'),
        lines: ['오늘은 청소를 했다. 친구가 도와준다고 해서', '같이 시작했는데, 혼자였음 못 했을 것 같다.', '쓰레기 봉투를 들고 이것저것 버렸다.', '생각보다 버릴 게 많아서 놀랐다.', '친구가 옆에서 응원해줘서',  '끝까지 할 수 있었다.', '방이 깨끗해지니 내 기분도 좀 개운해졌다.'],
        requiredChatCount: 3,
    },
];

const MAX_PAGE_INDEX = PAGES_DATA.length - 1;

const EmptyDiaryState = () => (
    <View style={styles.container}>
        <Text>일기 데이터가 없어요.</Text>
    </View>
);

const DiaryScreen = ({ navigation }: Props) => {
    const { chatCount } = useAppState();
    const [currentPageIndex, setCurrentPageIndex] = useState(0);

    if (PAGES_DATA.length === 0) {
        return <EmptyDiaryState />;
    }

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
    diaryImage: {
        width: '100%',
        height: '100%',
    },
    textLinesContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    lineRow: {
        borderBottomWidth: 1,
        borderBottomColor: PALETTE.line,
        height: 30,
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
    lockedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: PALETTE.lockedOverlayBg,
        justifyContent: 'center', alignItems: 'center', zIndex: 10,
    },
    lockIcon: { fontSize: 50, marginBottom: 20, color: 'white' },
    lockedText: { fontSize: 18, color: 'white', fontWeight: 'bold', textAlign: 'center', lineHeight: 26 },
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