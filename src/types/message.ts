export interface Message {
  id?: string; // Supabase auto-generated
  projectId: string; // foreign key to Project
  role: "user" | "assistant"; // "user" or "assistant"
  content: string; // message text
  createdAt?: string; // Supabase auto-generated timestamp
}

export type MessageCreateInput = Omit<Message, "id" | "createdAt">;
