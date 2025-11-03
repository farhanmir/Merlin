export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  // Performance metrics
  startTime?: Date;
  endTime?: Date;
  latencyMs?: number;
  tokenCount?: number;
  model?: string;
  techniques?: string[];
  // Error handling
  isError?: boolean;
  userMessageId?: string; // ID of the user message that triggered this response (for retry)
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  model?: string;
  techniques?: string[];
}

export interface Model {
  id: string;
  name: string;
  provider: string;
}

export type ApiKeyProvider = 'openai' | 'anthropic' | 'google';

export interface ApiKey {
  provider: string;
  maskedKey: string;
  isValid: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type Technique =
  // Planning
  | 'plansearch'
  // Core Reasoning
  | 'cot_reflection'
  | 'moa'
  // Sampling & Verification
  | 'bon'
  | 'self_consistency'
  // Search & Optimization
  | 'mcts'
  | 'rstar'
  | 'rto'
  // Specialized Techniques
  | 'leap';
  
  // DISABLED TECHNIQUES (do not use):
  // 'mars'      - missing dependencies
  // 'cepo'      - missing dependencies  
  // 'pvg'       - exceeds free tier rate limits
  // 're2'       - exceeds free tier rate limits
  // 'z3'        - not integrated in OptiLLMService

export interface ChatRequest {
  model: string;
  messages: { role: string; content: string }[];
  techniques: Technique[];
  stream: boolean;
}

export interface ChatResponse {
  id: string;
  choices: {
    message: Message;
    finish_reason: string;
  }[];
}
