"use client";
import { ConversationProvider } from "@elevenlabs/react";
import Shell from "./shell";
export default function AppPage() {
  return (
    <ConversationProvider>
      <Shell />
    </ConversationProvider>
  );
}
