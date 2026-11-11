// Usage: node scripts/socket-listen.mjs <accessToken> [conversationId]
// Env: ORIGIN (default http://localhost:5173), URL (default http://localhost:3000)
import { io } from "socket.io-client";

const [token, conversationId] = process.argv.slice(2);
const socket = io(process.env.URL ?? "http://localhost:3000", {
  auth: { token },
  transports: ["websocket"],
  extraHeaders: { Origin: process.env.ORIGIN ?? "http://localhost:5173" },
});

socket.on("connect", () => {
  console.log("connected", socket.id);
  if (conversationId) {
    socket.emit("conversation:join", { conversationId }, (res) => console.log("join ->", res));
  }
});
socket.on("connect_error", (err) => console.log("connect_error:", err.message));
socket.on("disconnect", (reason) => console.log("disconnected:", reason));
socket.onAny((event, ...args) => console.log(event, JSON.stringify(args[0], null, 2)));
