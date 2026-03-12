/**
 * LLM Configuration
 *
 * Configure available LLM providers and models
 * API keys are still in .env.local for security
 */

export interface LLMModel {
  id: string;
  name: string;
  provider: 'anthropic' | 'openai' | 'groq' | 'github' | 'google';
  contextWindow: number;
  inputCostPer1M: number;
  outputCostPer1M: number;
  supportsJSON: boolean;
  supportsMCP: boolean;
  maxTokens: number;
  description?: string;
}

export interface LLMProvider {
  id: string;
  name: string;
  envKey: string;
  models: LLMModel[];
  defaultModel: string;
}

/**
 * LLM Providers Configuration
 */
export const llmProviders: LLMProvider[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    envKey: 'ANTHROPIC_API_KEY',
    defaultModel: 'claude-sonnet-4-5-20250929',
    models: [
      {
        id: 'claude-sonnet-4-5-20250929',
        name: 'Claude Sonnet 4.5',
        provider: 'anthropic',
        contextWindow: 200000,
        inputCostPer1M: 3.00,
        outputCostPer1M: 15.00,
        supportsJSON: true,
        supportsMCP: true,
        maxTokens: 8192,
        description: 'Most capable model, best for complex tasks',
      },
      {
        id: 'claude-haiku-4-5',
        name: 'Claude Haiku 4.5',
        provider: 'anthropic',
        contextWindow: 200000,
        inputCostPer1M: 1.00,
        outputCostPer1M: 5.00,
        supportsJSON: true,
        supportsMCP: true,
        maxTokens: 8192,
        description: 'Latest Haiku - fastest, matches Sonnet 4 on coding & agents',
      },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    envKey: 'OPENAI_API_KEY',
    defaultModel: 'gpt-4o',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-5',
        provider: 'openai',
        contextWindow: 128000,
        inputCostPer1M: 2.50,
        outputCostPer1M: 10.00,
        supportsJSON: true,
        supportsMCP: true,
        maxTokens: 16384,
        description: 'Multimodal flagship model with function calling',
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-5 Mini',
        provider: 'openai',
        contextWindow: 128000,
        inputCostPer1M: 0.15,
        outputCostPer1M: 0.60,
        supportsJSON: true,
        supportsMCP: true,
        maxTokens: 16384,
        description: 'Affordable and fast with function calling',
      },
    ],
  },
  {
    id: 'groq',
    name: 'Groq',
    envKey: 'GROQ_API_KEY',
    defaultModel: 'gpt-oss-120b',
    models: [
      {
        id: 'gpt-oss-120b',
        name: 'GPT OSS 120B',
        provider: 'groq',
        contextWindow: 128000,
        inputCostPer1M: 0.20,
        outputCostPer1M: 0.20,
        supportsJSON: true,
        supportsMCP: true,
        maxTokens: 32768,
        description: 'Larger Responses API model with MCP support',
      },
    ],
  },
  {
    id: 'github',
    name: 'GitHub Models',
    envKey: 'GITHUB_MODELS_API_KEY',
    defaultModel: 'openai/gpt-4.1',
    models: [
      {
        id: 'openai/gpt-4.1',
        name: 'GPT-4.1 via GitHub Models',
        provider: 'github',
        contextWindow: 128000,
        inputCostPer1M: 0,
        outputCostPer1M: 0,
        supportsJSON: true,
        supportsMCP: false,
        maxTokens: 16384,
        description: 'OpenAI-compatible GitHub Models endpoint using a GitHub token',
      },
      {
        id: 'openai/gpt-4.1-mini',
        name: 'GPT-4.1 Mini via GitHub Models',
        provider: 'github',
        contextWindow: 128000,
        inputCostPer1M: 0,
        outputCostPer1M: 0,
        supportsJSON: true,
        supportsMCP: false,
        maxTokens: 16384,
        description: 'Lower-cost GitHub Models option for testing and iteration',
      },
    ],
  },
  {
    id: 'google',
    name: 'Google Gemini',
    envKey: 'GOOGLE_API_KEY',
    defaultModel: 'gemini-2.5-flash',
    models: [
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'google',
        contextWindow: 1048576,
        inputCostPer1M: 0,
        outputCostPer1M: 0,
        supportsJSON: true,
        supportsMCP: false,
        maxTokens: 65536,
        description: 'Fast general-purpose Gemini model via the OpenAI-compatible endpoint',
      },
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        provider: 'google',
        contextWindow: 1048576,
        inputCostPer1M: 0,
        outputCostPer1M: 0,
        supportsJSON: true,
        supportsMCP: false,
        maxTokens: 65536,
        description: 'Higher-quality Gemini model for more complex reasoning tasks',
      },
    ],
  },
];

/**
 * Get default model for a provider
 */
export function getDefaultModel(provider: 'anthropic' | 'openai' | 'groq' | 'github' | 'google'): string {
  const config = llmProviders.find(p => p.id === provider);
  return config?.defaultModel || '';
}

/**
 * Get all models for a provider
 */
export function getModelsForProvider(provider: 'anthropic' | 'openai' | 'groq' | 'github' | 'google'): LLMModel[] {
  const config = llmProviders.find(p => p.id === provider);
  return config?.models || [];
}

/**
 * Get model info by full ID (provider/model-id)
 */
export function getModelInfo(fullModelId: string): LLMModel | null {
  const [provider, modelId] = fullModelId.split('/');
  const providerConfig = llmProviders.find(p => p.id === provider);
  if (!providerConfig) return null;

  return providerConfig.models.find(m => m.id === modelId) || null;
}

/**
 * Format model ID for API calls
 */
export function formatModelId(provider: string, modelId: string): string {
  return `${provider}/${modelId}`;
}

/**
 * Get all available models (flattened)
 */
export function getAllModels(): Array<LLMModel & { fullId: string }> {
  return llmProviders.flatMap(provider =>
    provider.models.map(model => ({
      ...model,
      fullId: `${provider.id}/${model.id}`,
    }))
  );
}

/**
 * Check if provider API key is configured
 */
export function isProviderConfigured(provider: 'anthropic' | 'openai' | 'groq' | 'github' | 'google'): boolean {
  const config = llmProviders.find(p => p.id === provider);
  if (!config) return false;

  // This only works server-side
  if (typeof process === 'undefined') return false;

  return !!process.env[config.envKey];
}

/**
 * Get configured providers
 */
export function getConfiguredProviders(): string[] {
  return llmProviders
    .filter(p => isProviderConfigured(p.id as any))
    .map(p => p.id);
}
