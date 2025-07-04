import type { ProviderConfig } from "./types"

export const modelCapabilities: Record<string, ProviderConfig> = {
  openai: {
    "gpt-4-1106-preview": {
      input: ["text"],
      output: ["text"],
      context: "128k",
      useCases: "Complex reasoning, code generation",
    },
    "gpt-4o": {
      input: ["text", "image"],
      output: ["text"],
      context: "128k",
      useCases: "Multimodal, creative content",
    },
    "gpt-4o-mini": {
      input: ["text", "image"],
      output: ["text"],
      context: "128k",
      useCases: "Cost-effective multimodal, quick tasks",
    },
    "gpt-4-turbo": {
      input: ["text", "image"],
      output: ["text"],
      context: "128k",
      useCases: "General purpose, vision capabilities",
    },
    "gpt-4": {
      input: ["text"],
      output: ["text"],
      context: "8k",
      useCases: "Advanced reasoning",
    },
    "gpt-3.5-turbo": {
      input: ["text"],
      output: ["text"],
      context: "16k",
      useCases: "Fast, general purpose",
    },
    "gpt-3.5-turbo-16k": {
      input: ["text"],
      output: ["text"],
      context: "16k",
      useCases: "Longer context, general purpose",
    },
  },
  anthropic: {
    "claude-opus-4-20250514": {
      input: ["text", "image"],
      output: ["text"],
      context: "200k",
      useCases: "Advanced reasoning, long context, complex tasks",
    },
    "claude-sonnet-4-20250514": {
      input: ["text", "image"],
      output: ["text"],
      context: "200k",
      useCases: "Balanced performance, general purpose",
    },
    "claude-3-7-sonnet-20250219": {
      input: ["text", "image"],
      output: ["text"],
      context: "200k",
      useCases: "Balanced performance, general purpose",
    },
    "claude-3-5-sonnet-20241022": {
      input: ["text", "image"],
      output: ["text"],
      context: "200k",
      useCases: "Balanced performance, general purpose",
    },
    "claude-3-5-haiku-20241022": {
      input: ["text", "image"],
      output: ["text"],
      context: "200k",
      useCases: "Fast, cost-effective",
    },
    "claude-3-opus-20240229": {
      input: ["text", "image"],
      output: ["text"],
      context: "200k",
      useCases: "Advanced reasoning, long context, complex tasks",
    },
  },
  google: {
    "gemini-2.5-pro": {
      input: ["text", "image", "audio", "video", "pdf"],
      output: ["text"],
      context: "1M",
      useCases: "Highly multimodal, very long context, complex reasoning",
    },
    "gemini-2.5-flash": {
      input: ["text", "image", "audio", "video", "pdf"],
      output: ["text"],
      context: "1M",
      useCases: "Fast, multimodal, long context",
    },
    "gemini-2.5-flash-lite-preview-06-17": {
      input: ["text", "image", "audio", "video", "pdf"],
      output: ["text"],
      context: "1M",
      useCases: "Lightweight, multimodal, long context",
    },
    "gemini-1.5-pro": {
      input: ["text", "image", "audio", "video", "pdf"],
      output: ["text"],
      context: "1M",
      useCases: "Highly multimodal, very long context, complex reasoning",
    },
    "gemini-1.5-flash": {
      input: ["text", "image", "audio", "video", "pdf"],
      output: ["text"],
      context: "1M",
      useCases: "Fast, multimodal, long context",
    },
    "gemini-1.5-flash-8b": {
      input: ["text", "image", "audio", "video", "pdf"],
      output: ["text"],
      context: "1M",
      useCases: "Lightweight, multimodal, long context",
    },
  },
  xai: {
    "grok-3": {
      input: ["text"],
      output: ["text"],
      context: "128k",
      useCases: "General purpose, creative text generation",
    },
    "grok-3-fast": {
      input: ["text"],
      output: ["text"],
      context: "128k",
      useCases: "Fast text generation",
    },
    "grok-3-mini": {
      input: ["text"],
      output: ["text"],
      context: "128k",
      useCases: "Compact, efficient text generation",
    },
    "grok-3-mini-fast": {
      input: ["text"],
      output: ["text"],
      context: "128k",
      useCases: "Fast and compact text generation",
    },
    "grok-2-1212": {
      input: ["text"],
      output: ["text"],
      context: "128k",
      useCases: "General purpose, creative text generation",
    },
    "grok-2-vision-1212": {
      input: ["text", "image"],
      output: ["text"],
      context: "128k",
      useCases: "Multimodal, vision capabilities",
    },
    "grok-beta": {
      input: ["text"],
      output: ["text"],
      context: "8k",
      useCases: "Early access, general purpose",
    },
    "grok-vision-beta": {
      input: ["text", "image"],
      output: ["text"],
      context: "8k",
      useCases: "Early access, vision capabilities",
    },
  },
}
