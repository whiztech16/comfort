import { Analytics } from "@vercel/analytics/react";
import AppRouter from "./routes/AppRouter";


const PUBLIC_PATHS = ["/", "/login", "/signup", "/forgot-password"];

export default function App() {
  return (
    <>
      <AppRouter />
      <Analytics
        beforeSend={(event) => {
          const { pathname } = new URL(event.url);
          return PUBLIC_PATHS.includes(pathname) ? event : null;
        }}
      />
    </>
  );
}