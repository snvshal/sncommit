# Sncommit

AI-powered git commit message generator with a beautiful TUI (Terminal User Interface).

## Features

- **AI-Powered**: Uses Groq AI to generate intelligent, context-aware commit messages
- **Beautiful TUI**: Modern, interactive terminal interface with keyboard navigation
- **Smart**: Analyzes staged files, diffs, and recent commit history
- **Fast**: Built with Bun and optimized for speed
- **Configurable**: Personalized styles (Conventional, Simple, Detailed) and prompts
- **Iterative**: "Try again" option and manual editing

## Installation

### Prerequisites

- Node.js 20+ or Bun
- A Groq API key (get one free at [console.groq.com](https://console.groq.com))

### Quick Start

```bash
# Clone the repository
git clone https://github.com/snvshal/sncommit.git
cd sncommit

# Install dependencies
bun install

# Build the project
bun run build

# Link globally (optional)
npm link
```

## Usage

### 1. Setup

First, configure your API key:

```bash
sncommit config
```

Use the arrow keys to navigate and **Enter** to edit settings.

### 2. Generate Commits

Run the tool in any git repository:

```bash
# Run on currently staged files
sncommit

# Or stage all files and run (like git commit -am)
sncommit -a

# Push to remote after committing
sncommit -p

# Stage all files, commit, and push (like git commit -am && git push)
sncommit -ap
```

### Alias

You can use the short alias `sc` instead of typing `sncommit`:

```bash
sc          # Generate commit
sc -a       # Stage all and commit
sc -p       # Commit and push
sc -ap      # Stage all, commit, and push
sc config   # Open configuration
```

### 3. Workflow

1.  **Select**: App shows 4 AI-generated suggestions based on your changes.
2.  **Navigate**: Use `↑` / `↓` to choose a message.
3.  **Confirm**: Press `Enter` to commit with the selected message.
4.  **Refine**: Choose "Custom input" to write your own, or "Try again" for new ideas.
5.  **Cancel**: Press `Esc` or `Ctrl+C` to exit.

## Configuration

Run `sncommit config` to modify:

| Setting           | Description                             | Default                |
| :---------------- | :-------------------------------------- | :--------------------- |
| **Groq API Key**  | Your secret API key                     | Required               |
| **Model**         | AI model (Llama 3, GPT-OSS, etc.)       | `llama-3.1-8b-instant` |
| **Commit Style**  | `conventional`, `simple`, or `detailed` | `conventional`         |
| **Custom Prompt** | Extra instructions for the AI           | _None_                 |

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Build for production
bun run build

# Run production build
bun run start

# Run linting
bun run lint

# Type checking
bun run type-check

# Format code
bun run format
```

## License

MIT
