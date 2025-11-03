import type { Model, ApiKey, Message, Technique } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// Models
export async function fetchModels(): Promise<Model[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/models`);
  if (!response.ok) {
    throw new Error('Failed to fetch models');
  }
  const data = await response.json();
  return data.models || [];
}

// API Keys
export async function fetchApiKeys(): Promise<ApiKey[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/keys`);
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
  const response = await fetch(`${API_BASE_URL}/api/v1/keys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ provider, api_key: apiKey }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to add API key');
  }
}

export async function deleteApiKey(provider: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/keys/${provider}`, {
    method: 'DELETE',
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
): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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

  if (!response.body) {
    throw new Error('Response body is null');
  }

  return response.body;
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
