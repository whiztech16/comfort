import type {
  Appreciation,
  ChatMessage,
  Comfort,
  Conversation,
  Person,
  ReceivedComfort,
  SentComfort,
} from "../types/messaging";

// Temporary stand-in for the backend. Changes last until the page is refreshed.
const received: ReceivedComfort[] = [
  {
    id: "r1",
    direction: "received",
    from: { displayName: "Maya", isAnonymous: false },
    body: "Hey,\n\nI just wanted to remind you that you’re doing great. Your hard work doesn’t go unnoticed, and you matter more than you think.\n\nKeep going, you’ve got this. 💙",
    sentAt: "2h ago",
    firstOpenedAt: null,
    appreciation: null,
    conversationId: null,
  },
  {
    id: "r2",
    direction: "received",
    from: { displayName: null, isAnonymous: true },
    body: "You matter. Always.",
    sentAt: "3d ago",
    firstOpenedAt: null,
    appreciation: null,
    conversationId: null,
  },
  {
    id: "r3",
    direction: "received",
    from: { displayName: "Ruby Wilson", isAnonymous: false },
    body: "You’re not alone. 💙",
    sentAt: "1d ago",
    firstOpenedAt: "2026-10-30T09:00:00Z",
    appreciation: "Thank you",
    conversationId: "c1",
  },
  {
    id: "r4",
    direction: "received",
    from: { displayName: "Jay", isAnonymous: false },
    body: "Keep going. You’ve got this.",
    sentAt: "2d ago",
    firstOpenedAt: "2026-10-28T18:00:00Z",
    appreciation: null,
    conversationId: null,
  },
];

const sent: SentComfort[] = [
  {
    id: "s1",
    direction: "sent",
    to: { displayName: "Zoe", isAnonymous: false },
    body: "Praying for you today. You are not alone. 💙",
    sentAt: "1d ago",
    status: "opened",
    appreciation: "This helped",
  },
  {
    id: "s2",
    direction: "sent",
    to: { displayName: null, isAnonymous: true },
    body: "You are doing better than you think.",
    sentAt: "3h ago",
    status: "delivered",
    appreciation: null,
  },
];

const conversations: Conversation[] = [
  {
    id: "c1",
    participant: { displayName: "Ruby Wilson" },
    unread: true,
    lastActivity: "1d ago",
    messages: [
      {
        id: "c1-1",
        from: "me",
        body: "Thank you, that really means a lot.",
        sentAt: "Mon 09:40",
      },
      {
        id: "c1-2",
        from: "them",
        body: "Anytime. How are you feeling today?",
        sentAt: "Tue 08:05",
      },
    ],
  },
];

export function displayName(person: Person) {
  return person.displayName ?? "Anonymous";
}

export const listReceived = () => [...received];
export const listSent = () => [...sent];
export const listConversations = () => [...conversations];

export function getComfort(id: string): Comfort | undefined {
  return received.find((item) => item.id === id) ?? sent.find((item) => item.id === id);
}

export function getConversation(id: string) {
  return conversations.find((item) => item.id === id);
}

// The backend does this the first time the recipient opens the Comfort
export function markOpened(id: string) {
  const item = received.find((comfort) => comfort.id === id);
  if (item && item.firstOpenedAt === null) {
    item.firstOpenedAt = new Date().toISOString();
  }
}

export function setAppreciation(id: string, value: Appreciation) {
  const item = received.find((comfort) => comfort.id === id);
  if (item) item.appreciation = value;
}

// Replying is the recipient's choice. It never happens automatically.
export function startConversation(comfortId: string) {
  const item = received.find((comfort) => comfort.id === comfortId);
  if (!item || item.from.isAnonymous || !item.from.displayName) return null;
  if (item.conversationId) return item.conversationId;

  const id = `c-${Date.now()}`;
  conversations.unshift({
    id,
    participant: { displayName: item.from.displayName },
    unread: false,
    lastActivity: "Just now",
    messages: [],
  });
  item.conversationId = id;
  return id;
}

export function markConversationRead(id: string) {
  const conversation = getConversation(id);
  if (conversation) conversation.unread = false;
}

export function sendChat(conversationId: string, body: string) {
  const conversation = getConversation(conversationId);
  if (!conversation) return;
  const message: ChatMessage = {
    id: `${conversationId}-${Date.now()}`,
    from: "me",
    body,
    sentAt: "Just now",
  };
  conversation.messages.push(message);
  conversation.lastActivity = "Just now";
}

export function addSentComfort(to: Person, body: string) {
  sent.unshift({
    id: `s-${Date.now()}`,
    direction: "sent",
    to,
    body,
    sentAt: "Just now",
    status: "delivered",
    appreciation: null,
  });
}