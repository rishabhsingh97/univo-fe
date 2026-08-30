export interface ConversationResponse {
  id: number;
  otherUserId: number;
  otherUserName: string | null;
  otherUserHasAvatar: boolean;
  lastMessageBody: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface MessageResponse {
  id: number;
  senderUserId: number;
  senderName: string | null;
  body: string;
  createdAt: string;
  mine: boolean;
}

export interface StartConversationRequest {
  targetUserId: number;
}

export interface SendMessageRequest {
  body: string;
}

/** Payload pushed over the /user/queue/messages STOMP destination - see
 * com.univo.common.messaging.MessagePushEvent. Purely a "go refetch" signal; the frontend never
 * trusts this as the source of truth. */
export interface MessagePushEvent {
  conversationId: number;
  message: MessageResponse;
}
