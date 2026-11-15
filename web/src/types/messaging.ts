
export interface Person {
  displayName: string | null
  isAnonymous: boolean;
}

export const appreciations = ["This helped", "Made my day", "Thank you"] as const;
export type Appreciation = (typeof appreciations)[number];

interface ComfortBase {
  id: string;
  body: string;
  sentAt: string;
}

export interface ReceivedComfort extends ComfortBase {
  direction: "received";
  from: Person;
  firstOpenedAt: string | null; 
  appreciation: Appreciation | null; 
  conversationId: string | null; 
}

export interface SentComfort extends ComfortBase {
  direction: "sent";
  to: Person;
  status: "delivered" | "opened";
  appreciation: Appreciation | null; // the response the recipient chose, if any
}

export type Comfort = ReceivedComfort | SentComfort;

export interface ChatMessage {
  id: string;
  from: "them" | "me";
  body: string;
  sentAt: string;
}

export interface Conversation {
  id: string;
  participant: { displayName: string };
  unread: boolean;
  lastActivity: string;
  messages: ChatMessage[];
}

// What the Conversations list shows: messages are encrypted, so no previews
export interface ConversationSummary {
  id: string;
  participant: Person;
  unread: boolean;
  lastActivity: string;
  hasMessages: boolean;
  locked: boolean;
}