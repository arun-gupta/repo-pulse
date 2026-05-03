export type ProviderId = 'openrouter' | 'anthropic' | 'openai' | 'google' | 'groq'
export type ModelTier = 'fast' | 'smart'

export interface ModelSpec {
  id: string
  label: string
  /** USD per 1M input tokens */
  inputRate: number
  /** USD per 1M output tokens */
  outputRate: number
}

export interface ProviderConfig {
  id: ProviderId
  name: string
  tagline: string
  keyPlaceholder: string
  consoleUrl: string
  consoleLabel: string
  models: Record<ModelTier, ModelSpec>
}

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    tagline: 'One key for Claude, GPT-4o, Gemini & more',
    keyPlaceholder: 'sk-or-…',
    consoleUrl: 'https://openrouter.ai/keys',
    consoleLabel: 'openrouter.ai',
    models: {
      fast:  { id: 'anthropic/claude-haiku-4-5',  label: 'Claude Haiku',   inputRate: 0.88,  outputRate: 4.40  },
      smart: { id: 'anthropic/claude-sonnet-4-6', label: 'Claude Sonnet',  inputRate: 3.30,  outputRate: 16.50 },
    },
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    tagline: 'Claude models direct from Anthropic',
    keyPlaceholder: 'sk-ant-…',
    consoleUrl: 'https://console.anthropic.com/settings/keys',
    consoleLabel: 'console.anthropic.com',
    models: {
      fast:  { id: 'claude-haiku-4-5',  label: 'Claude Haiku',  inputRate: 0.80, outputRate: 4.00  },
      smart: { id: 'claude-sonnet-4-6', label: 'Claude Sonnet', inputRate: 3.00, outputRate: 15.00 },
    },
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    tagline: 'GPT models from OpenAI',
    keyPlaceholder: 'sk-proj-…',
    consoleUrl: 'https://platform.openai.com/api-keys',
    consoleLabel: 'platform.openai.com',
    models: {
      fast:  { id: 'gpt-4o-mini', label: 'GPT-4o mini', inputRate: 0.15, outputRate: 0.60 },
      smart: { id: 'gpt-4o',      label: 'GPT-4o',      inputRate: 2.50, outputRate: 10.00 },
    },
  },
  google: {
    id: 'google',
    name: 'Google',
    tagline: 'Gemini models from Google',
    keyPlaceholder: 'AIza…',
    consoleUrl: 'https://aistudio.google.com/app/apikey',
    consoleLabel: 'aistudio.google.com',
    models: {
      fast:  { id: 'gemini-2.0-flash',              label: 'Gemini 2.0 Flash', inputRate: 0.10, outputRate: 0.40  },
      smart: { id: 'gemini-2.5-pro-preview-05-06',  label: 'Gemini 2.5 Pro',  inputRate: 1.25, outputRate: 10.00 },
    },
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    tagline: 'Ultra-fast open-source models via Groq',
    keyPlaceholder: 'gsk_…',
    consoleUrl: 'https://console.groq.com/keys',
    consoleLabel: 'console.groq.com',
    models: {
      fast:  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', inputRate: 0.05, outputRate: 0.08 },
      smart: { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', inputRate: 0.05, outputRate: 0.08 },
    },
  },
}

export const FREE_TIER_PROVIDER: ProviderId = 'anthropic'
export const FREE_TIER_MODEL: ModelTier = 'fast'
