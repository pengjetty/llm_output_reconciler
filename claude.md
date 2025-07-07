# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Shell Command Permissions

## Auto-Approved Commands (No Prompt)
- ls
- find
- cat
- echo
- pwd
- grep
- head
- tail
- npm
- npx
- cp
- chmod
- touch

## Commands That Must Ask for Permission
- rm
- mv

# Build and Testing Instructions

## Build Commands
- `npm run build` - Build the Next.js application
- `npm run dev` - Start development server
- `npm run lint` - Run ESLint
- `npm run start` - Start production server

## Testing Commands
- `npm run test` - Run Jest tests
- `npm run test:watch` - Run Jest tests in watch mode
- Test files located in `__tests__/` directory using Jest with TypeScript support
- Coverage threshold: 70% for branches, functions, lines, and statements

## Auto-Build After Code Changes
**MANDATORY**: After ANY code modification (edit, create, or delete files), IMMEDIATELY run `npm run build` to catch compilation errors early and fix them immediately. This must be done for EVERY code change without exception.

# Architecture Overview

## Tech Stack
- Next.js 15 with App Router
- TypeScript with strict mode
- Tailwind CSS + shadcn/ui components
- AI SDK for LLM integrations (OpenAI, Anthropic, Google, xAI)
- Client-side only (no server-side storage)

## Core Systems

### Storage System (`lib/storage.ts`)
- **Native IndexedDB implementation** with automatic localStorage migration
- CRUD operations for API keys, tests, and runs
- Progressive cleanup (50+ runs warning) and data validation
- Export/import functionality with JSON format
- Storage diagnostics and quota management

### LLM Integration (`app/actions.ts`)
- **Server actions** for model execution with 60-second timeout
- **Parallel processing** of multiple models using Promise.allSettled
- Error handling with graceful degradation
- Support for text and image inputs across all providers

### Diff Analysis System (`lib/diff.ts`)
- **Multi-level diff algorithms**: word-level, line-level, and JSON-aware
- **Advanced JSON comparison** with structural normalization and LCS-based array diffing
- **Semantic similarity** scoring with Levenshtein distance
- **Visual diff rendering** with HTML highlighting and Tailwind CSS classes
- Deep object comparison with tolerance for floating-point precision

### Model Configuration (`lib/model-info.ts`)
- **Comprehensive model database** with 30+ models across 4 providers (OpenAI, Anthropic, Google, xAI)
- Pricing information, context windows, and capability metadata
- Support for deprecated model flagging and migration guidance
- Input/output type specifications (text, image, audio, video)
- Latest model versions: GPT-4.1 series, Claude 4 series, Gemini 2.5 series, Grok 3 series

### Type System (`lib/types.ts`)
- **Complete TypeScript definitions** for all data structures
- Enhanced RunResult with multiple diff metrics (similarity, execution time, JSON validation)
- Test and Run entities with proper relationships
- Storage and API key management interfaces

## Key Features

### Model Comparison Engine
- **Parallel execution** of multiple LLM models with real-time progress
- **Multi-dimensional comparison** against golden copy with three diff algorithms
- **Automatic ranking** by similarity scores with ties broken by execution time
- Support for **text and image inputs** across all supported providers

### Test Management System
- **CRUD operations** for test cases with change detection
- **Rerun capability** for historical tests with new models
- **Image support** with base64 encoding and preview functionality
- **Golden copy validation** with diff preview before execution

### Advanced Diff Analysis
- **Word-level diff** with context-aware tokenization and similarity scoring
- **Line-based diff** for structured content comparison
- **JSON-aware diff** with structural normalization, array LCS, and semantic comparison
- **Visual rendering** with color-coded changes and detailed metrics

### Storage & History
- **IndexedDB storage** with automatic migration from localStorage
- **Historical run browsing** with expandable result displays
- **Export/import** functionality for data portability
- **Storage diagnostics** with cleanup recommendations

## Development Patterns

### Error Handling
- All async operations use try-catch with graceful degradation
- Server actions return error states in results rather than throwing
- Storage operations have fallback mechanisms for quota limits

### Performance Optimization
- Parallel processing for model execution and storage operations
- Progressive loading for large result sets
- Efficient diff algorithms with early termination for identical content

### Data Validation
- TypeScript strict mode enforced across all components
- Runtime validation for imported data with error reporting
- API key validation before model execution

### UI/UX Architecture
- shadcn/ui components for consistent design system
- Responsive design with mobile-first approach
- Dark mode support with CSS custom properties
- Accessible design with proper ARIA labels and keyboard navigation

## File Organization
- `app/` - Next.js app router pages with server actions
- `components/` - React components (UI and business logic)
- `lib/` - Core utilities: storage, diff algorithms, types, model info
- `public/` - Static assets and icons
- `__tests__/` - Jest test files for lib utilities

## API Keys and Configuration

### Required API Keys
The application requires API keys for LLM providers:
- **OpenAI**: Get from https://platform.openai.com/api-keys
- **Anthropic**: Get from https://console.anthropic.com/
- **Google**: Get from https://aistudio.google.com/apikey
- **xAI**: Get from https://console.x.ai/

### Storage Location
- API keys are stored locally in IndexedDB
- No server-side storage or transmission of keys
- Keys are required for model execution via server actions

## Common Development Tasks

### Adding New Models
1. Update `lib/model-info.ts` with model specifications
2. Test API integration in `app/actions.ts`
3. Verify diff algorithms handle new output formats

### Extending Diff Algorithms
1. Add new diff type to `lib/types.ts` RunResult interface
2. Implement algorithm in `lib/diff.ts`
3. Update result display components to show new metrics

### Storage Schema Changes
1. Update interfaces in `lib/types.ts`
2. Add migration logic in `lib/storage.ts`
3. Test with existing data to ensure compatibility

### Testing New Features
1. Write unit tests in `__tests__/` directory
2. Use Jest with TypeScript support (configured in `jest.config.js`)
3. Focus on testing `lib/` utilities (diff algorithms, storage functions)
4. Run `npm run test` to verify all tests pass
5. Maintain 70% coverage threshold for branches, functions, lines, and statements

## Important Implementation Notes

### Component Architecture
- All UI components use shadcn/ui design system with Tailwind CSS
- Main pages: Models (`/models`), Tests (`/tests`), Runs (`/runs`), Results (`/results`)
- Key components: `ModelTable`, `TestForm`, `HistorySidebar`, `ResultDetail`
- Server actions in `app/actions.ts` handle LLM API calls with proper error handling

### Diff Algorithm Behavior
- Word-level diff: Uses Levenshtein distance with similarity scoring
- Line-based diff: Optimized for structured text comparison
- JSON-aware diff: Structural normalization with LCS-based array comparison
- All algorithms output HTML with Tailwind CSS classes for visual rendering

