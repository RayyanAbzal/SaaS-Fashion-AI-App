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
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import MessageBubble from '../components/MessageBubble';
import { ChatMessage, OutfitSuggestion, WardrobeItem } from '../types';
import { ChatbotService } from '../services/chatbotService';
import { useUser } from '../contexts/UserContext';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import mime from 'mime';

export default function ChatScreen() {
  const { user } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

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

  // Audio recording logic
  const handleAudioRecord = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      try {
        await recording?.stopAndUnloadAsync();
        const uri = recording?.getURI();
        setRecording(null);
        if (uri) {
          await handleTranscribeAudio(uri);
        }
      } catch (e) {
        alert('Error stopping recording');
      }
    } else {
      // Start recording
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          alert('Permission to access microphone is required!');
          return;
        }
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const rec = new Audio.Recording();
        await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        await rec.startAsync();
        setRecording(rec);
        setIsRecording(true);
      } catch (e) {
        alert('Could not start recording');
      }
    }
  };

  // Upload and transcribe audio
  const handleTranscribeAudio = async (audioUri: string) => {
    setIsTranscribing(true);
    try {
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) throw new Error('Audio file not found');
      const fileType = mime.getType(audioUri) || 'audio/m4a';
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        name: 'audio.m4a',
        type: fileType,
      } as any);
      const response = await fetch('http://localhost:3000/api/transcribe-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: formData,
      });
      const data = await response.json();
      if (data.success && data.transcript) {
        // Show transcript as user message and send to chatbot
        handleSend(data.transcript);
      } else {
        alert('Transcription failed');
      }
    } catch (e) {
      alert('Error transcribing audio');
    } finally {
      setIsTranscribing(false);
    }
  };

  // SoundWave component for animated bars
  const SoundWave = ({ barCount = 5, barColor = Colors.primary }) => {
    const animations = useRef([...Array(barCount)].map(() => new Animated.Value(1))).current;

    useEffect(() => {
      const animate = (bar: Animated.Value, delay: number) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(bar, {
              toValue: 2.2,
              duration: 350,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
              delay,
            }),
            Animated.timing(bar, {
              toValue: 1,
              duration: 350,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start();
      };
      animations.forEach((bar, i) => animate(bar, i * 100));
      return () => animations.forEach(bar => bar.stopAnimation());
    }, [animations]);

    return (
      <View style={styles.soundWaveContainer}>
        {animations.map((bar, i) => (
          <Animated.View
            key={i}
            style={[
              styles.soundBar,
              {
                backgroundColor: barColor,
                transform: [{ scaleY: bar }],
              },
            ]}
          />
        ))}
      </View>
    );
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
        {isRecording && <SoundWave />}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.audioButton} onPress={handleAudioRecord}>
            <Ionicons name={isRecording ? "stop" : "mic"} size={24} color={isRecording ? Colors.error : Colors.primary} />
          </TouchableOpacity>
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

      {isTranscribing && <ActivityIndicator style={{paddingVertical: 10}} size="small" color={Colors.primary} />}
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
  audioButton: {
    marginRight: 10,
    padding: 10,
  },
  soundWaveContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 8,
    height: 28,
  },
  soundBar: {
    width: 6,
    height: 24,
    borderRadius: 3,
    marginHorizontal: 3,
    backgroundColor: Colors.primary,
  },
}); 