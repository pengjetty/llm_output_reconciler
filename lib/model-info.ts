import type { ProviderConfig } from "./types"

export const modelCapabilities: Record<string, ProviderConfig> = {
  openai: {
    "gpt-4.1": {
      input: ["text", "image", "video"],
      output: ["text"],
      context: "1M",
      useCases: "Most advanced general-purpose model with extensive world knowledge",
      pricing: {
        inputPerMillion: 2.00,
        outputPerMillion: 8.00
      }
    },
    "gpt-4.1-mini": {
      input: ["text", "image", "video"],
      output: ["text"],
      context: "1M",
      useCases: "Enhanced mini model, matches GPT-4o performance at 83% lower cost",
      pricing: {
        inputPerMillion: 0.40,
        outputPerMillion: 1.60
      }
    },
    "gpt-4.1-nano": {
      input: ["text", "image", "video"],
      output: ["text"],
      context: "1M",
      useCases: "Fastest and cheapest model, optimized for speed and cost",
      pricing: {
        inputPerMillion: 0.10,
        outputPerMillion: 0.40
      }
    },
    "gpt-4o": {
      input: ["text", "image", "video"],
      output: ["text"],
      context: "128k",
      useCases: "Advanced multimodal model, text and vision integration",
      pricing: {
        inputPerMillion: 5.00,
        outputPerMillion: 20.00
      }
    },
    "gpt-4o-mini": {
      input: ["text", "image", "video"],
      output: ["text"],
      context: "128k",
      useCases: "Cost-efficient multimodal model with vision capabilities",
      pricing: {
        inputPerMillion: 0.15,
        outputPerMillion: 0.60
      }
    },
    "gpt-3.5-turbo": {
      input: ["text"],
      output: ["text"],
      context: "16k",
      useCases: "Fast, cost-effective for general text tasks",
      pricing: {
        inputPerMillion: 0.50,
        outputPerMillion: 1.50
      }
    },
    "gpt-3.5-turbo-instruct": {
      input: ["text"],
      output: ["text"],
      context: "4k",
      useCases: "Optimized for instruction following",
      pricing: {
        inputPerMillion: 1.50,
        outputPerMillion: 2.00
      }
    },
    "gpt-4-turbo": {
      input: ["text", "image"],
      output: ["text"],
      context: "128k",
      useCases: "Previous generation multimodal (being phased out)",
      deprecated: true
    },
    "gpt-4": {
      input: ["text"],
      output: ["text"],
      context: "8k",
      useCases: "Original GPT-4 (legacy)",
      deprecated: true
    },
    "gpt-4-1106-preview": {
      input: ["text"],
      output: ["text"],
      context: "128k",
      useCases: "Preview version (legacy)",
      deprecated: true
    },
    "gpt-3.5-turbo-16k": {
      input: ["text"],
      output: ["text"],
      context: "16k",
      useCases: "Longer context, general purpose (legacy)",
      deprecated: true
    },
  },
  anthropic: {
    "claude-opus-4-20250514": {
      input: ["text", "image"],
      output: ["text"],
      context: "200k",
      useCases: "Most capable and intelligent model with exceptional reasoning",
      pricing: {
        inputPerMillion: 15.00,
        outputPerMillion: 75.00
      }
    },
    "claude-sonnet-4-20250514": {
      input: ["text", "image"],
      output: ["text"],
      context: "200k",
      useCases: "High-performance model with exceptional reasoning",
      pricing: {
        inputPerMillion: 3.00,
        outputPerMillion: 15.00
      }
    },
    "claude-3-7-sonnet-20250219": {
      input: ["text", "image"],
      output: ["text"],
      context: "200k",
      useCases: "Enhanced Sonnet with early extended thinking capabilities",
      pricing: {
        inputPerMillion: 3.00,
        outputPerMillion: 15.00
      }
    },
    "claude-3-5-haiku-20241022": {
      input: ["text", "image"],
      output: ["text"],
      context: "200k",
      useCases: "Fastest model with multimodal capabilities",
      pricing: {
        inputPerMillion: 0.80,
        outputPerMillion: 4.00
      }
    },
    "claude-3-5-sonnet-20241022": {
      input: ["text", "image"],
      output: ["text"],
      context: "200k",
      useCases: "Balanced performance, general purpose",
      pricing: {
        inputPerMillion: 3.00,
        outputPerMillion: 15.00
      }
    },
    "claude-3-opus-20240229": {
      input: ["text", "image"],
      output: ["text"],
      context: "200k",
      useCases: "Advanced reasoning, long context, complex tasks (legacy)",
      deprecated: true
    },
    "claude-3-sonnet-20240229": {
      input: ["text", "image"],
      output: ["text"],
      context: "200k",
      useCases: "Balanced performance, general purpose (legacy)",
      deprecated: true
    },
    "claude-3-haiku-20240307": {
      input: ["text", "image"],
      output: ["text"],
      context: "200k",
      useCases: "Fast, cost-effective (legacy)",
      deprecated: true
    },
  },
  google: {
    "gemini-2.5-pro": {
      input: ["text", "image", "audio", "video", "pdf"],
      output: ["text"],
      context: "1M",
      useCases: "Most powerful thinking model with adaptive reasoning",
      pricing: {
        inputPerMillion: 1.25,
        outputPerMillion: 10.00
      }
    },
    "gemini-2.5-flash": {
      input: ["text", "image", "video", "audio"],
      output: ["text"],
      context: "1M",
      useCases: "Best price-performance, large-scale processing",
      pricing: {
        inputPerMillion: 0.30,
        outputPerMillion: 2.50
      }
    },
    "gemini-2.5-flash-lite-preview-06-17": {
      input: ["text", "image", "video", "audio"],
      output: ["text"],
      context: "1M",
      useCases: "Cost-efficient, low-latency preview",
      pricing: {
        inputPerMillion: 0.10,
        outputPerMillion: 0.40
      }
    },
    "gemini-2.5-flash-preview-native-audio-dialog": {
      input: ["audio", "video", "text"],
      output: ["audio", "text"],
      context: "128k",
      useCases: "Native audio conversation"
    },
    "gemini-2.5-flash-exp-native-audio-thinking-dialog": {
      input: ["audio", "video", "text"],
      output: ["audio", "text"],
      context: "128k",
      useCases: "Experimental audio thinking"
    },
    "gemini-2.5-flash-preview-tts": {
      input: ["text"],
      output: ["audio"],
      context: "1M",
      useCases: "Text-to-speech capabilities"
    },
    "gemini-2.5-pro-preview-tts": {
      input: ["text"],
      output: ["audio"],
      context: "1M",
      useCases: "Advanced text-to-speech"
    },
    "gemini-2.0-flash": {
      input: ["text", "image", "audio", "video"],
      output: ["text"],
      context: "1M",
      useCases: "Fast, cost-effective high-volume tasks",
      pricing: {
        inputPerMillion: 0.10,
        outputPerMillion: 0.40
      }
    },
    "gemini-2.0-flash-preview-image-generation": {
      input: ["text"],
      output: ["image"],
      context: "1M",
      useCases: "Image generation capabilities"
    },
    "gemini-2.0-flash-lite": {
      input: ["text", "image", "audio", "video"],
      output: ["text"],
      context: "1M",
      useCases: "Lightweight, efficient processing",
      pricing: {
        inputPerMillion: 0.075,
        outputPerMillion: 0.30
      }
    },
    "gemini-1.5-flash": {
      input: ["text", "image", "audio", "video"],
      output: ["text"],
      context: "1M",
      useCases: "Fast, versatile multimodal",
      pricing: {
        inputPerMillion: 0.075,
        outputPerMillion: 0.30
      }
    },
    "gemini-1.5-flash-8b": {
      input: ["text", "image", "audio", "video"],
      output: ["text"],
      context: "1M",
      useCases: "Lightweight, cost-optimized",
      pricing: {
        inputPerMillion: 0.0375,
        outputPerMillion: 0.15
      }
    },
    "gemini-1.5-pro": {
      input: ["text", "image", "audio", "video"],
      output: ["text"],
      context: "2M",
      useCases: "Largest context window, extensive analysis",
      pricing: {
        inputPerMillion: 1.25,
        outputPerMillion: 5.00
      }
    },
  },
  xai: {
    "grok-3": {
      input: ["text"],
      output: ["text"],
      context: "131k",
      useCases: "Most advanced model with superior reasoning and extensive pretraining knowledge",
      pricing: {
        inputPerMillion: 3.00,
        outputPerMillion: 15.00
      }
    },
    "grok-3-pro": {
      input: ["text"],
      output: ["text"],
      context: "1M",
      useCases: "Advanced model with 1 million token context window",
      pricing: {
        inputPerMillion: 5.00,
        outputPerMillion: 25.00
      }
    },
    "grok-3-mini": {
      input: ["text"],
      output: ["text"],
      context: "131k",
      useCases: "Compact, efficient model with reasoning capabilities",
      pricing: {
        inputPerMillion: 0.30,
        outputPerMillion: 0.50
      }
    },
    "grok-2-1212": {
      input: ["text"],
      output: ["text"],
      context: "128k",
      useCases: "General purpose, creative text generation (legacy)",
      deprecated: true
    },
    "grok-2-vision-1212": {
      input: ["text", "image"],
      output: ["text"],
      context: "128k",
      useCases: "Multimodal, vision capabilities (legacy)",
      deprecated: true
    },
    "grok-3-fast": {
      input: ["text"],
      output: ["text"],
      context: "128k",
      useCases: "Fast text generation (legacy)",
      deprecated: true
    },
    "grok-3-mini-fast": {
      input: ["text"],
      output: ["text"],
      context: "128k",
      useCases: "Fast and compact text generation (legacy)",
      deprecated: true
    },
    "grok-beta": {
      input: ["text"],
      output: ["text"],
      context: "8k",
      useCases: "Early access, general purpose (legacy)",
      deprecated: true
    },
    "grok-vision-beta": {
      input: ["text", "image"],
      output: ["text"],
      context: "8k",
      useCases: "Early access, vision capabilities (legacy)",
      deprecated: true
    },
  },
}
