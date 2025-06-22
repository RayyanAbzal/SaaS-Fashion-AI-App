import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import MessageBubble from '../components/MessageBubble';
import { ChatMessage, OutfitSuggestion, WardrobeItem } from '../types';
import { ChatbotService } from '../services/chatbotService';
import { useUser } from '../contexts/UserContext';

export default function ChatScreen() {
  const { user } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (user) {
      // Initial greeting from the bot
      setMessages([
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: "Hey! I'm your StyleMate. Ask me for outfit ideas, or tell me about the weather!",
          createdAt: new Date(),
        }
      ]);
    }
  }, [user]);

  const handleSend = async (text: string, payload?: string) => {
    const messageText = payload || text;
    if (!messageText.trim() || !user?.id) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: messageText,
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const botResponse = await ChatbotService.processMessage(messageText, user.id);
      
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: botResponse.text,
        createdAt: new Date(),
        outfitSuggestions: botResponse.outfitSuggestions,
        wardrobeItems: botResponse.wardrobeItems,
        quickReplies: botResponse.quickReplies,
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error("Error processing message:", error);
      const errorMessage: ChatMessage = {
        id: `bot-error-${Date.now()}`,
        sender: 'bot',
        text: "Sorry, something went wrong on my end. Please try again.",
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble message={item} onQuickReplyPress={handleSend} />}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      
      {isTyping && <ActivityIndicator style={{paddingVertical: 10}} size="small" color={Colors.primary} />}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
      >
        <View style={styles.inputContainer}>
            <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Ask me for style advice..."
            placeholderTextColor={Colors.textSecondary}
            />
            <TouchableOpacity style={styles.sendButton} onPress={() => handleSend(input)}>
                <Ionicons name="send" size={24} color={Colors.primary} />
            </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  messagesList: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.backgroundCard,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
  },
  sendButton: {
    marginLeft: 10,
    padding: 10,
  },
}); 