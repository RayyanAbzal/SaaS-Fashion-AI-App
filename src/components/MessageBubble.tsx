import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { ChatMessage, OutfitSuggestion, WardrobeItem } from '../types';

interface MessageBubbleProps {
  message: ChatMessage;
  onQuickReplyPress?: (text: string, payload?: string) => void;
}

export default function MessageBubble({ message, onQuickReplyPress }: MessageBubbleProps) {
  const isUser = message.sender === 'user';

  const renderOutfitSuggestions = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
      {message.outfitSuggestions?.map((suggestion, index) => (
        <View key={suggestion.id || index} style={styles.suggestionCard}>
          <Text style={styles.suggestionReasoning}>{suggestion.reasoning}</Text>
          <View style={styles.suggestionItems}>
            {suggestion.items.map(item => (
              <Image key={item.id} source={{ uri: item.imageUrl }} style={styles.suggestionItemImage} />
            ))}
          </View>
          <TouchableOpacity style={styles.purchaseButton} onPress={() => { /* Handle purchase */ }}>
            <Text style={styles.purchaseButtonText}>Shop this look</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );

  const renderWardrobeItems = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
        {message.wardrobeItems?.map(item => (
            <View key={item.id} style={styles.wardrobeItemCard}>
                <Image source={{ uri: item.imageUrl }} style={styles.wardrobeItemImage} />
                <Text style={styles.wardrobeItemName}>{item.name}</Text>
            </View>
        ))}
    </ScrollView>
  );

  const renderQuickReplies = () => (
    <View style={styles.quickRepliesContainer}>
        {message.quickReplies?.map((reply, index) => (
            <TouchableOpacity key={index} style={styles.quickReplyButton} onPress={() => onQuickReplyPress?.(reply.title, reply.payload)}>
                <Text style={styles.quickReplyText}>{reply.title}</Text>
            </TouchableOpacity>
        ))}
    </View>
  );

  return (
    <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.botMessage]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
        <Text style={isUser ? styles.userText : styles.botText}>{message.text}</Text>
      </View>
      
      {message.outfitSuggestions && renderOutfitSuggestions()}
      {message.wardrobeItems && renderWardrobeItems()}
      {message.quickReplies && renderQuickReplies()}
    </View>
  );
}

const styles = StyleSheet.create({
    messageContainer: {
        marginVertical: 5,
        alignItems: 'flex-start',
    },
    userMessage: {
        alignItems: 'flex-end',
    },
    botMessage: {
        alignItems: 'flex-start',
    },
    bubble: {
        maxWidth: '80%',
        padding: 15,
        borderRadius: 20,
    },
    userBubble: {
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 5,
    },
    botBubble: {
        backgroundColor: Colors.backgroundCard,
        borderBottomLeftRadius: 5,
    },
    userText: {
        color: '#FFFFFF',
        fontSize: 16,
    },
    botText: {
        color: Colors.text,
        fontSize: 16,
    },
    carousel: {
        marginTop: 10,
    },
    suggestionCard: {
        backgroundColor: Colors.backgroundSecondary,
        borderRadius: 15,
        padding: 15,
        width: 280,
        marginRight: 10,
    },
    suggestionReasoning: {
        color: Colors.text,
        fontSize: 14,
        fontStyle: 'italic',
        marginBottom: 10,
    },
    suggestionItems: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 10,
    },
    suggestionItemImage: {
        width: 70,
        height: 70,
        borderRadius: 10,
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    purchaseButton: {
        backgroundColor: Colors.primary,
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
    },
    purchaseButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    wardrobeItemCard: {
        backgroundColor: Colors.backgroundSecondary,
        borderRadius: 15,
        padding: 10,
        width: 150,
        alignItems: 'center',
        marginRight: 10,
    },
    wardrobeItemImage: {
        width: 120,
        height: 120,
        borderRadius: 10,
    },
    wardrobeItemName: {
        color: Colors.text,
        marginTop: 5,
        textAlign: 'center',
    },
    quickRepliesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 10,
    },
    quickReplyButton: {
        backgroundColor: Colors.backgroundCard,
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 15,
        margin: 5,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    quickReplyText: {
        color: Colors.primary,
        fontWeight: '600',
    },
}); 