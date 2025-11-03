import type { Model, ApiKey, Message, Technique } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// Helper function to get auth headers
async function getAuthHeaders(): Promise<HeadersInit> {
  // Get the session from NextAuth
  const { getSession } = await import('next-auth/react');
  const session = await getSession();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (session?.accessToken) {
    headers['Authorization'] = `Bearer ${session.accessToken}`;
  }
  
  return headers;
}

// Models
export async function fetchModels(): Promise<Model[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/models`, { headers });
  if (!response.ok) {
    throw new Error('Failed to fetch models');
  }
  const data = await response.json();
  return data.models || [];
}

// API Keys
export async function fetchApiKeys(): Promise<ApiKey[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/keys`, { headers });
  if (!response.ok) {
    throw new Error('Failed to fetch API keys');
  }
  const data = await response.json();
  // Transform snake_case to camelCase
  return (data.keys || []).map((key: any) => ({
    provider: key.provider,
    maskedKey: key.masked_key,
    isValid: key.is_valid,
    createdAt: key.created_at ? new Date(key.created_at) : undefined,
    updatedAt: key.updated_at ? new Date(key.updated_at) : undefined,
  }));
}

export async function addApiKey(provider: string, apiKey: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/keys`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ provider, api_key: apiKey }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to add API key');
  }
}

export async function deleteApiKey(provider: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/keys/${provider}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to delete API key');
  }
  // Expect 204 No Content, no body to parse
}

// Chat
export async function sendChatMessage(
  model: string,
  messages: Message[],
  techniques: Technique[]
): Promise<ReadableStream<Uint8Array> | any> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      techniques,
      stream: true,
    }),
  });

  if (!response.ok) {
    // Try to get detailed error message from backend
    let errorMessage = `Failed to send message (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      // If parsing fails, use generic message
      errorMessage = `Server error: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  // Check if response is streaming (SSE) or regular JSON
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('text/event-stream')) {
    // Streaming response
    if (!response.body) {
      throw new Error('Response body is null');
    }
    return response.body;
  } else {
    // Non-streaming JSON response (Google/Anthropic)
    const data = await response.json();
    return data;
  }
}

// Health
export interface HealthStatus {
  timestamp: string;
  overall_status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database?: {
      status: string;
      message: string;
    };
    optillm?: {
      status: string;
      message: string;
      url: string;
    };
  };
  api_keys: Record<string, {
    configured: boolean;
    valid: boolean;
  }>;
}

export async function fetchHealthStatus(): Promise<HealthStatus> {
  const response = await fetch(`${API_BASE_URL}/health/detailed`);
  if (!response.ok) {
    throw new Error('Failed to fetch health status');
  }
  return await response.json();
}

// Chat History
export interface ChatMessage {
  id: number;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  techniques?: string[];
  created_at: string;
}

export async function saveMessage(
  sessionId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  model?: string,
  techniques?: string[]
): Promise<ChatMessage> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      session_id: sessionId,
      role,
      content,
      model,
      techniques,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to save message');
  }

  return await response.json();
}

export async function fetchSessionHistory(sessionId: string): Promise<ChatMessage[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/sessions/${sessionId}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch session history');
  }

  const data = await response.json();
  return data.messages || [];
}

export async function fetchAllSessions(): Promise<string[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/sessions`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch sessions');
  }

  const data = await response.json();
  return data.sessions || [];
}

export async function deleteSession(sessionId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/sessions/${sessionId}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to delete session');
  }
}

export async function deleteAllMessages(): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/messages`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to delete messages');
  }
}
