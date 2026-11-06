// Nothing here ever includes a person's account ID
export interface Person {
  displayName: string | null; // null when anonymous
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
  firstOpenedAt: string | null; // set by the backend; null means show the envelope
  appreciation: Appreciation | null; // the private response the recipient chose
  conversationId: string | null; // set once the recipient replies
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