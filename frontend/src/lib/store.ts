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
  loadChatHistory: () => Promise<void>;
  setSelectedModel: (modelId: string) => void;
  toggleTechnique: (technique: Technique) => void;
  sendMessage: (content: string) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  clearMessages: () => void;
  exportAsMarkdown: () => string;
  exportAsJSON: () => string;
  getMessageCount: () => number;
  
  // Session actions
  createNewSession: () => void;
  loadSession: (sessionId: string) => Promise<void>;
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
          // Use the authenticated API client from lib/api.ts
          const { fetchModels: apiFetchModels } = await import('./api');
          const models = await apiFetchModels();
          set({ availableModels: models });
        } catch (error) {
          console.error('Failed to fetch models:', error);
          // Don't show toast if it's just a 401 (user not authenticated yet)
          if (error instanceof Error && !error.message.includes('401')) {
            toast.error('Failed to load models. Please check your connection.');
          }
          set({ availableModels: [] });
        }
      },

      loadChatHistory: async () => {
        try {
          const { fetchAllSessions, fetchSessionHistory } = await import('./api');
          
          // Get all user's sessions
          const sessionIds = await fetchAllSessions();
          
          // Always start with a new empty session
          const newSessionId = Date.now().toString();
          
          // Load first message from each session to get titles
          const sessionsWithTitles = await Promise.all(
            sessionIds.map(async (id) => {
              try {
                const messages = await fetchSessionHistory(id);
                const firstMessage = messages[0];
                const title = firstMessage 
                  ? firstMessage.content.slice(0, 50) + (firstMessage.content.length > 50 ? '...' : '')
                  : 'New Chat';
                
                return {
                  id,
                  title,
                  messages: [], // Don't load all messages, just the title
                  createdAt: firstMessage ? new Date(firstMessage.created_at) : new Date(),
                  updatedAt: new Date(),
                };
              } catch (error) {
                console.error(`Failed to load session ${id}:`, error);
                return {
                  id,
                  title: 'Chat Session',
                  messages: [],
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };
              }
            })
          );
          
          set({ 
            currentSessionId: newSessionId, 
            messages: [],
            sessions: sessionsWithTitles
          });
        } catch (error) {
          console.error('Failed to load chat history:', error);
          // On error, create a new session
          const newSessionId = Date.now().toString();
          set({ currentSessionId: newSessionId, messages: [], sessions: [] });
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
        const { selectedModel, selectedTechniques, messages, currentSessionId } = get();

        if (!selectedModel) {
          toast.error('Please select a model first');
          return;
        }

        // Ensure we have a session ID
        let sessionId = currentSessionId;
        if (!sessionId) {
          sessionId = Date.now().toString();
          set({ currentSessionId: sessionId });
        }

        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content,
          timestamp: new Date(),
        };

        set({ messages: [...messages, userMessage], isLoading: true });

        // Save user message to backend
        try {
          const { saveMessage } = await import('./api');
          await saveMessage(sessionId, 'user', content);
        } catch (error) {
          console.error('❌ Failed to save user message:', error);
          // Don't block on save failure, but show the error
          if (error instanceof Error) {
            console.error('Error details:', error.message);
          }
        }

        const startTime = new Date();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          startTime,
          model: selectedModel,
          techniques: selectedTechniques,
          userMessageId: userMessage.id, // Link to user message for retry
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

                // Save assistant message to backend
                const finalMessage = get().messages.find(msg => msg.id === assistantMessage.id);
                if (finalMessage && finalMessage.content) {
                  try {
                    const { saveMessage } = await import('./api');
                    await saveMessage(
                      sessionId,
                      'assistant',
                      finalMessage.content,
                      selectedModel,
                      selectedTechniques.length > 0 ? selectedTechniques : undefined
                    );
                  } catch (error) {
                    console.error('❌ Failed to save assistant message:', error);
                    if (error instanceof Error) {
                      console.error('Error details:', error.message);
                    }
                  }
                }

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

          // Save assistant message to backend
          if (content) {
            try {
              const { saveMessage } = await import('./api');
              await saveMessage(
                sessionId,
                'assistant',
                content,
                selectedModel,
                selectedTechniques.length > 0 ? selectedTechniques : undefined
              );
            } catch (error) {
              console.error('❌ Failed to save assistant message (non-streaming):', error);
              if (error instanceof Error) {
                console.error('Error details:', error.message);
              }
            }
          }
        }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          console.error('Failed to send message:', error);
          
          // Check for rate limit error (429)
          if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('rate limit')) {
            // Extract retry-after time if available
            const retryMatch = errorMessage.match(/try again in (\d+) (second|minute|hour)s?/i);
            const retryTime = retryMatch ? `${retryMatch[1]} ${retryMatch[2]}${parseInt(retryMatch[1]) > 1 ? 's' : ''}` : 'a few minutes';
            
            toast.error('Rate limit exceeded', {
              description: `You've reached the limit of 50 messages per hour. Try again in ${retryTime}.`,
              duration: 6000,
            });
            
            set((state) => ({
              messages: state.messages.map((msg) =>
                msg.id === assistantMessage.id
                  ? { ...msg, content: `⏱️ Rate limit exceeded. Please try again in ${retryTime}.`, isError: true }
                  : msg
              ),
            }));
          } else {
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
                  ? { ...msg, content: `❌ Error: ${errorMessage}`, isError: true }
                  : msg
              ),
            }));
          }
        } finally {
          set({ isLoading: false });
        }
      },

      retryMessage: async (messageId: string) => {
        const { messages } = get();
        
        // Find the error message
        const errorMessage = messages.find(msg => msg.id === messageId);
        if (!errorMessage || !errorMessage.userMessageId) {
          toast.error('Cannot retry this message');
          return;
        }
        
        // Find the original user message
        const userMessage = messages.find(msg => msg.id === errorMessage.userMessageId);
        if (!userMessage) {
          toast.error('Original message not found');
          return;
        }
        
        // Remove the error message
        set({ messages: messages.filter(msg => msg.id !== messageId) });
        
        // Resend the original message
        await get().sendMessage(userMessage.content);
      },

      clearMessages: () => {
        const { currentSessionId } = get();
        set({ messages: [] });
        
        // Also delete from backend if we have a session
        if (currentSessionId) {
          import('./api').then(({ deleteSession }) => {
            deleteSession(currentSessionId).catch((error) => {
              console.error('Failed to delete session from backend:', error);
            });
          });
        }
        
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

      loadSession: async (sessionId: string) => {
        const { currentSessionId } = get();
        
        // Don't reload if already on this session
        if (currentSessionId === sessionId) return;
        
        try {
          // Fetch messages from backend for this session
          const { fetchSessionHistory } = await import('./api');
          const backendMessages = await fetchSessionHistory(sessionId);
          
          // Convert backend messages to frontend format
          const formattedMessages: Message[] = backendMessages.map((msg) => ({
            id: msg.id.toString(),
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
            timestamp: new Date(msg.created_at),
            model: msg.model || undefined,
            techniques: (msg.techniques || []) as Technique[],
          }));

          set({
            currentSessionId: sessionId,
            messages: formattedMessages,
          });
        } catch (error) {
          console.error('Failed to load session:', error);
          toast.error('Failed to load chat session');
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
        // Don't persist messages - they're stored in backend now
        // Only persist UI preferences
        selectedModel: state.selectedModel,
        selectedTechniques: state.selectedTechniques,
        currentSessionId: state.currentSessionId, // Keep session ID for continuity
      }),
    }
  )
);
