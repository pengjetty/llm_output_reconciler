# LLM Output Reconciler

A powerful web application for comparing outputs from multiple Large Language Models (LLMs) against a golden copy reference. Built with Next.js 15, TypeScript, and shadcn/ui components.

## Features

### 🤖 Multi-Model Support
- **OpenAI**: GPT-4.1 series, GPT-4o series, GPT-3.5 series
- **Anthropic**: Claude 4 series, Claude 3.5/3 series  
- **Google**: Gemini 2.5/1.5 series
- **xAI**: Grok 3 series, Grok 2 series
- 30+ models with pricing information and capabilities

### 🔍 Text Comparison
- **Multi-level diff analysis**: Word-level, line-level, and JSON-aware
- **Semantic similarity scoring** with Levenshtein distance
- **Visual diff rendering** with color-coded highlights
- **Automatic ranking** by similarity scores
- **Parallel model execution** for optimal performance

### 📊 Test Management
- Create and manage reusable test cases
- **Multimodal input support**: Text and image inputs
- **Golden copy validation** with diff preview
- **Historical test browsing** with rerun capability
- **Change detection** with visual indicators

### 💾 Local Storage
- **IndexedDB storage** with automatic localStorage migration
- **Progressive cleanup** with 50+ runs warning system
- **Export/import functionality** for data portability
- **Storage diagnostics** and quota management
- **Automatic backups** with restoration capabilities

### 🎨 UI (Thanks to v0.dev for creating the initial draft)
- **shadcn/ui components** with Tailwind CSS
- **Responsive design** with mobile-first approach
- **Dark mode support** with theme persistence
- **Accessibility features** with keyboard navigation
- **Real-time progress tracking** during model execution

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd llm_output_reconcilier
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or  
pnpm install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### API Keys Setup

The application requires API keys for LLM providers:

1. **OpenAI**: Get from [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. **Anthropic**: Get from [https://console.anthropic.com/](https://console.anthropic.com/)
3. **Google**: Get from [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
4. **xAI**: Get from [https://console.x.ai/](https://console.x.ai/)

Navigate to the **Models** page to configure your API keys. Keys are stored locally in IndexedDB for security.

## Usage

### 1. Configure Models
- Go to the **Models** page
- Add your API keys for each provider
- Select which models you want to use for comparisons
- View pricing information and model capabilities

### 2. Create Test Cases
- Navigate to the **Tests** page
- Create a new test with a descriptive name
- Add your prompt text and/or upload images
- Set a golden copy (expected output) for comparison
- Save the test case

### 3. Run Comparisons
- Go to the **Runs** page
- Select a test case and choose models to compare
- Click "Run Comparison" to execute in parallel
- View real-time progress and results

### 4. Analyze Results
- Visit the **Results** page to view detailed comparisons
- See similarity scores, execution times, and visual diffs
- Export results for further analysis
- Browse historical runs and rerun tests

## Architecture

### Tech Stack
- **Next.js 15** with App Router
- **TypeScript** with strict mode
- **Tailwind CSS** + shadcn/ui components
- **AI SDK** for LLM integrations
- **IndexedDB** for client-side storage

### Key Components
- **Storage System** (`lib/storage.ts`): Native IndexedDB with migration
- **LLM Integration** (`app/actions.ts`): Server actions with parallel processing
- **Diff Analysis** (`lib/diff.ts`): Multi-level comparison algorithms
- **Model Configuration** (`lib/model-info.ts`): Comprehensive model database

### File Structure
```
├── app/                 # Next.js App Router pages
├── components/          # React components
├── lib/                 # Core utilities and algorithms
├── __tests__/          # Jest test files
└── public/             # Static assets
```

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode
```

### Testing

The project uses Jest with TypeScript support. Tests are located in the `__tests__/` directory with a focus on core utilities:

```bash
npm run test         # Run all tests
npm run test:watch   # Run tests in watch mode
```

Coverage threshold is set to 70% for branches, functions, lines, and statements.

## Storage Management

The application uses IndexedDB for robust client-side storage with several advanced features:

- **Automatic Migration**: Seamlessly migrates from localStorage to IndexedDB
- **Progressive Cleanup**: Warns when storage exceeds 50 runs and provides cleanup options
- **Data Validation**: Comprehensive validation with error recovery
- **Export/Import**: Full data portability with JSON format
- **Storage Diagnostics**: Health monitoring and quota management

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

Built with v0.dev and Claude Code with love by PJ.