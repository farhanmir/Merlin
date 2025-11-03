import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Message, Model, Technique, ChatSession } from './types';
import { sendChatMessage } from './api';
import { toast } from 'sonner';

interface ChatState {
  // Current session
  currentSessionId: string | null;
  messages: Message[];
  selectedModel: string | null;
  availableModels: Model[];
  selectedTechniques: Technique[];
  isLoading: boolean;
  
  // Sessions management
  sessions: ChatSession[];
  
  // Actions
  fetchModels: () => Promise<void>;
  setSelectedModel: (modelId: string) => void;
  toggleTechnique: (technique: Technique) => void;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  exportAsMarkdown: () => string;
  exportAsJSON: () => string;
  getMessageCount: () => number;
  
  // Session actions
  createNewSession: () => void;
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  getCurrentSessionTitle: () => string;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSessionId: null,
      messages: [],
      selectedModel: null,
      availableModels: [],
      selectedTechniques: [],
      isLoading: false,
      sessions: [],

      fetchModels: async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat/models`
          );
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          set({ availableModels: data.models || [] });
          // Remove the toast notification - it's annoying on every navigation
        } catch (error) {
          console.error('Failed to fetch models:', error);
          toast.error('Failed to load models. Please check your connection.');
          set({ availableModels: [] });
        }
      },

      setSelectedModel: (modelId: string) => {
        set({ selectedModel: modelId });
      },

      toggleTechnique: (technique: Technique) => {
        const current = get().selectedTechniques;
        if (current.includes(technique)) {
          set({ selectedTechniques: current.filter((t) => t !== technique) });
        } else {
          set({ selectedTechniques: [...current, technique] });
        }
      },

      sendMessage: async (content: string) => {
        const { selectedModel, selectedTechniques, messages } = get();

        if (!selectedModel) {
          toast.error('Please select a model first');
          return;
        }

        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content,
          timestamp: new Date(),
        };

        set({ messages: [...messages, userMessage], isLoading: true });

        const startTime = new Date();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          startTime,
          model: selectedModel,
          techniques: selectedTechniques,
        };

        set({ messages: [...get().messages, assistantMessage] });

        try {
          const response = await sendChatMessage(
            selectedModel,
            [...messages, userMessage],
            selectedTechniques
          );

          // Check if response is streaming or plain JSON
          if (response instanceof ReadableStream) {
            // Handle streaming response (OpenAI)
            const reader = response.getReader();
            const decoder = new TextDecoder();
            let buffer = ''; // Buffer for incomplete SSE lines

            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                // Calculate final metrics when stream completes
                const endTime = new Date();
                const latencyMs = endTime.getTime() - startTime.getTime();
                
                set((state) => ({
                  messages: state.messages.map((msg) =>
                    msg.id === assistantMessage.id
                      ? { 
                          ...msg, 
                          endTime,
                          latencyMs,
                          tokenCount: Math.ceil(msg.content.length * 0.25), // Rough estimate
                        }
                      : msg
                  ),
                }));
                break;
              }

              const chunk = decoder.decode(value, { stream: true });
              buffer += chunk;

              // Split on \n\n to get complete SSE messages
              const parts = buffer.split('\n\n');
              // Keep the last (potentially incomplete) part in the buffer
              buffer = parts.pop() || '';

            for (const part of parts) {
              const lines = part.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') continue;

                  try {
                    const json = JSON.parse(data);
                    const delta = json.choices?.[0]?.delta?.content || '';

                    if (delta) {
                      set((state) => ({
                        messages: state.messages.map((msg) =>
                          msg.id === assistantMessage.id
                            ? { ...msg, content: msg.content + delta }
                            : msg
                        ),
                      }));
                    }
                  } catch {
                    // Ignore parse errors for malformed JSON chunks
                  }
                }
              }
            }
          }
        } else {
          // Handle non-streaming JSON response (Google/Anthropic)
          const content = response.choices?.[0]?.message?.content || '';
          const endTime = new Date();
          const latencyMs = endTime.getTime() - startTime.getTime();

          set((state) => ({
            messages: state.messages.map((msg) =>
              msg.id === assistantMessage.id
                ? { 
                    ...msg, 
                    content,
                    endTime,
                    latencyMs,
                    tokenCount: Math.ceil(content.length * 0.25),
                  }
                : msg
            ),
          }));
        }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          console.error('Failed to send message:', error);
          
          toast.error('Failed to get response', {
            description: errorMessage,
            action: {
              label: 'Retry',
              onClick: () => get().sendMessage(content),
            },
          });
          
          set((state) => ({
            messages: state.messages.map((msg) =>
              msg.id === assistantMessage.id
                ? { ...msg, content: `❌ Error: ${errorMessage}\n\nClick the retry button above to try again.` }
                : msg
            ),
          }));
        } finally {
          set({ isLoading: false });
        }
      },

      clearMessages: () => {
        set({ messages: [] });
        toast.success('Chat cleared successfully');
      },

      exportAsMarkdown: () => {
        const { messages } = get();
        let markdown = '# Merlin AI Chat Export\n\n';
        markdown += `*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;
        
        messages.forEach((msg) => {
          const role = msg.role === 'user' ? '**You**' : '**Merlin AI**';
          const time = new Date(msg.timestamp).toLocaleTimeString();
          markdown += `### ${role} (${time})\n\n${msg.content}\n\n---\n\n`;
        });
        
        return markdown;
      },

      exportAsJSON: () => {
        const { messages, selectedModel, selectedTechniques } = get();
        const exportData = {
          exportedAt: new Date().toISOString(),
          model: selectedModel,
          techniques: selectedTechniques,
          messageCount: messages.length,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
          })),
        };
        return JSON.stringify(exportData, null, 2);
      },

      getMessageCount: () => {
        return get().messages.length;
      },

      // Session management
      createNewSession: () => {
        const { currentSessionId, messages, selectedModel, selectedTechniques, sessions } = get();
        
        // Save current session if it has messages
        if (currentSessionId && messages.length > 0) {
          const existingIndex = sessions.findIndex(s => s.id === currentSessionId);
          const title = messages[0]?.content.slice(0, 50) + (messages[0]?.content.length > 50 ? '...' : '') || 'New Chat';
          
          const sessionToSave: ChatSession = {
            id: currentSessionId,
            title,
            messages,
            createdAt: new Date(messages[0]?.timestamp || Date.now()),
            updatedAt: new Date(),
            model: selectedModel || undefined,
            techniques: selectedTechniques,
          };

          if (existingIndex >= 0) {
            sessions[existingIndex] = sessionToSave;
            set({ sessions: [...sessions] });
          } else {
            set({ sessions: [sessionToSave, ...sessions] });
          }
        }

        // Create new session
        const newSessionId = Date.now().toString();
        set({
          currentSessionId: newSessionId,
          messages: [],
        });
        toast.success('New chat started');
      },

      loadSession: (sessionId: string) => {
        const { sessions, currentSessionId, messages } = get();
        
        // Save current session before loading new one
        if (currentSessionId && messages.length > 0) {
          get().createNewSession(); // This will save current session
        }
        
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
          set({
            currentSessionId: session.id,
            messages: session.messages,
            selectedModel: session.model || null,
            selectedTechniques: (session.techniques || []) as Technique[],
          });
        }
      },

      deleteSession: (sessionId: string) => {
        const { sessions } = get();
        set({ sessions: sessions.filter(s => s.id !== sessionId) });
        toast.success('Chat deleted');
      },

      getCurrentSessionTitle: () => {
        const { messages } = get();
        if (messages.length === 0) return 'New Chat';
        const firstUserMessage = messages.find(m => m.role === 'user');
        if (!firstUserMessage) return 'New Chat';
        const title = firstUserMessage.content.slice(0, 50);
        return title + (firstUserMessage.content.length > 50 ? '...' : '');
      },
    }),
    {
      name: 'merlin-chat-storage',
      partialize: (state) => ({
        messages: state.messages,
        selectedModel: state.selectedModel,
        selectedTechniques: state.selectedTechniques,
      }),
      // Custom merge to handle Date deserialization
      merge: (persistedState, currentState) => {
        const state = { ...currentState, ...(persistedState as any) };
        // Convert timestamp strings back to Date objects
        if (state.messages) {
          state.messages = state.messages.map((msg: any) => ({
            ...msg,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
            startTime: msg.startTime ? new Date(msg.startTime) : undefined,
            endTime: msg.endTime ? new Date(msg.endTime) : undefined,
          }));
        }
        return state;
      },
    }
  )
);
