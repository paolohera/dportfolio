export type ChatSender = "visitor" | "admin";
export type ChatStatus = "open" | "closed";

export interface ChatMessage {
  id: string;
  sender_type: ChatSender;
  message: string;
  created_at: string;
}

/** What the public API returns to a visitor (no secrets, no other visitors' data). */
export interface PublicChatConversation {
  id: string;
  status: ChatStatus;
  visitor_name: string;
  channel_key: string;
  visitor_unread_count: number;
}

/** What the Admin Studio loads (explicit columns only; never the token hash or IP hash). */
export interface AdminChatConversation {
  id: string;
  /** Realtime topic suffix; used by the admin only for the typing indicator */
  channel_key: string;
  visitor_name: string;
  visitor_email: string | null;
  status: ChatStatus;
  last_message_at: string;
  last_message_preview: string;
  admin_unread_count: number;
  visitor_unread_count: number;
  admin_last_read_at: string | null;
  visitor_last_read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminChatMessage extends ChatMessage {
  conversation_id: string;
  read_at: string | null;
}