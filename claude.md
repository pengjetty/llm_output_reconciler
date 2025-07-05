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
- grep

## Commands That Must Ask for Permission
- rm
- mv

# Build and Testing Instructions

## Build Commands
- `npm run build` - Build the Next.js application
- `npm run dev` - Start development server
- `npm run lint` - Run ESLint
- `npm run start` - Start production server

## Auto-Build After Code Changes
**MANDATORY**: After ANY code modification (edit, create, or delete files), IMMEDIATELY run `npm run build` to catch compilation errors early and fix them immediately. This must be done for EVERY code change without exception.

# Architecture Overview

## Tech Stack
- Next.js 15 with App Router
- TypeScript with strict mode
- Tailwind CSS + shadcn/ui components
- AI SDK for LLM integrations (OpenAI, Anthropic, Google, xAI)
- Client-side only (no server-side storage)

## Core Components

### Storage System (`lib/storage.ts`)
- Client-side localStorage with quota management
- Automatic backups and data recovery
- Progressive cleanup when storage limits reached
- Data validation and migration support

### LLM Integration (`app/actions.ts`)
- Server actions for model execution
- Parallel processing of multiple models
- Timeout handling (30 seconds)
- Support for text and image inputs

### Model Configuration (`lib/model-info.ts`)
- Model capabilities and specifications
- Context window sizes and input/output types
- Support for 19+ models across 4 providers

### Type System (`lib/types.ts`)
- Complete TypeScript definitions
- Model configurations, test cases, and run results
- Diff scoring and comparison metrics

## Key Features

### Model Comparison
- Run multiple LLM models in parallel
- Compare outputs against golden copy
- Visual diff highlighting with word-level precision
- Automatic ranking by similarity scores

### Test Management
- Create and manage test cases
- Support for text and image inputs
- Rerun historical tests with new models
- CRUD operations with change detection

### API Key Management
- Secure local storage of API keys
- Provider-specific configurations
- Enable/disable providers and models

### Results & History
- Local storage of all runs
- Expandable result displays
- Historical comparison browsing
- Export/import functionality

# Development Notes

## File Organization
- `app/` - Next.js app router pages
- `components/` - React components (UI and business logic)
- `lib/` - Utility functions and type definitions
- `public/` - Static assets

## Component Library
Uses shadcn/ui components with Radix UI primitives for accessibility and consistent styling.

## Data Flow
1. User creates test cases with prompts and golden copy
2. Selects models and provides API keys
3. Server action runs models in parallel
4. Results stored locally with diff analysis
5. Visual comparison displayed with ranking

