import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAppState, ChatMessage } from '../context/AppStateContext';
import { COLORS } from '../constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatHistoryScreen'>;

const groupMessagesByDate = (messages: ChatMessage[]) => {
  const groups: { [key: string]: ChatMessage[] } = {};
  messages.forEach(message => {
    const date = new Date(message.timestamp).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
  });
  return groups;
};

const ChatHistoryScreen = ({ navigation }: Props) => {
  const { chatHistory } = useAppState();
  const groupedMessages = groupMessagesByDate(chatHistory);
  const sortedDates = Object.keys(groupedMessages).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>대화 기록</Text>
        <TouchableOpacity onPress={() => navigation.navigate('HomeScreen')}>
            <Text style={styles.closeButton}>닫기</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {sortedDates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>아직 나눈 대화가 없어요.</Text>
          </View>
        ) : (
          sortedDates.map(date => (
            <View key={date} style={styles.dateGroup}>
              <Text style={styles.dateHeaderText}>{date}</Text>
              {groupedMessages[date].map(message => (
                <View
                  key={message.id}
                  style={[
                    styles.messageBubble,
                    message.sender === 'user'
                      ? styles.userBubble
                      : styles.botBubble,
                  ]}
                >
                  <Text style={message.sender === 'user' ? styles.userMessageText : styles.messageText}>{message.text}</Text>
                  <Text style={styles.timestampText}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30, // More horizontal padding
    paddingVertical: 15,   // Less vertical padding
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    fontSize: 16,
    color: COLORS.primary,
  },
  scrollContainer: {
    paddingHorizontal: 40, // More horizontal padding
    paddingVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.gray,
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeaderText: {
    textAlign: 'center',
    color: COLORS.gray,
    marginBottom: 15,
  },
  messageBubble: {
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
    maxWidth: '70%', // Narrower bubbles for landscape
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
  },
  botBubble: {
    backgroundColor: COLORS.white,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
    color: COLORS.text,
  },
  userMessageText: {
    fontSize: 16,
    color: COLORS.white,
  },
  timestampText: {
    fontSize: 10,
    color: COLORS.lightGray,
    alignSelf: 'flex-end',
    marginTop: 5,
  }
});

export default ChatHistoryScreen;
