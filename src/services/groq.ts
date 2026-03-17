import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { CommitSuggestion, GitFile, GitCommit, Config } from "../types";

export class GroqService {
  private apiKey: string;
  private config: Config;

  constructor(apiKey: string, config: Config) {
    this.apiKey = apiKey;
    this.config = config;
  }

  async generateCommitSuggestions(
    stagedFiles: GitFile[],
    diff: string,
    recentCommits: GitCommit[] = [],
    _diffStats?: {
      added: number;
      deleted: number;
      modified: number;
      renamed: number;
      files: string[];
    },
  ): Promise<CommitSuggestion[]> {
    const prompt = this.buildPrompt(stagedFiles, diff, recentCommits);

    try {
      const groq = createGroq({ apiKey: this.apiKey });
      const { text } = await generateText({
        model: groq(this.config.model || "llama-3.1-8b-instant"),
        messages: [
          {
            role: "system",
            content:
              "You are an expert at writing clear, concise, and meaningful git commit messages.\n" +
              "Generate commit messages that follow best practices and are helpful for future developers.\n" +
              "IMPORTANT: Output your response in strict JSON format with the following schema:\n" +
              '{\n  "suggestions": [\n    {\n      "message": "commit message here",\n      "type": "feat/fix/etc",\n      "description": "brief explanation"\n    }\n  ]\n}',
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      });

      if (!text) {
        throw new Error("No response from Groq API");
      }

      return this.parseSuggestions(text);
    } catch (e: unknown) {
      const error = e as { status?: number; message?: string };
      if (error?.status === 401) {
        throw new Error(
          'Invalid API Key. Run "sncommit config" to set your Groq API key. Get one at https://console.groq.com/keys',
        );
      }

      throw new Error(
        `Error generating suggestions: ${error?.message || String(e)}`,
      );
    }
  }

  async generateCommitSuggestionsFromCustomInput(
    stagedFiles: GitFile[],
    diff: string,
    userInput: string,
    recentCommits: GitCommit[] = [],
    diffStats?: {
      added: number;
      deleted: number;
      modified: number;
      renamed: number;
      files: string[];
    },
  ): Promise<CommitSuggestion[]> {
    const prompt = this.buildPromptFromCustomInput(
      stagedFiles,
      diff,
      userInput,
      recentCommits,
      diffStats,
    );

    try {
      const groq = createGroq({ apiKey: this.apiKey });
      const { text } = await generateText({
        model: groq(this.config.model || "llama-3.1-8b-instant"),
        messages: [
          {
            role: "system",
            content:
              "You are an expert at writing clear, concise, and meaningful git commit messages.\n" +
              "Generate commit messages that follow best practices and are helpful for future developers.\n" +
              "IMPORTANT: Output your response in strict JSON format with the following schema:\n" +
              '{\n  "suggestions": [\n    {\n      "message": "commit message here",\n      "type": "feat/fix/etc",\n      "description": "brief explanation"\n    }\n  ]\n}',
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      });

      if (!text) {
        throw new Error("No response from Groq API");
      }

      return this.parseSuggestions(text);
    } catch (e: unknown) {
      const error = e as { status?: number; message?: string };
      if (error?.status === 401) {
        throw new Error(
          'Invalid API Key. Run "sncommit config" to set your Groq API key. Get one at https://console.groq.com/keys',
        );
      }

      throw new Error(
        `Error generating suggestions: ${error?.message || String(e)}`,
      );
    }
  }

  private buildPromptFromCustomInput(
    stagedFiles: GitFile[],
    diff: string,
    userInput: string,
    recentCommits: GitCommit[],
    diffStats?: {
      added: number;
      deleted: number;
      modified: number;
      renamed: number;
      files: string[];
    },
  ): string {
    const filesText = stagedFiles.map((f) => `- ${f.path}`).join("\n");
    const recentCommitsText = recentCommits
      .slice(0, 5)
      .map((c) => `- ${c.message}`)
      .join("\n");

    let styleInstruction = "";
    switch (this.config.commitStyle) {
      case "conventional":
        styleInstruction =
          "Use conventional commit format (feat:, fix:, docs:, etc.)";
        break;
      case "simple":
        styleInstruction = "Keep messages simple and concise";
        break;
      case "detailed":
        styleInstruction = "Include detailed descriptions of changes";
        break;
    }

    const customPrompt = this.config.customPrompt
      ? `\nAdditional instructions: ${this.config.customPrompt}`
      : "";

    const statsText = diffStats
      ? `
Change statistics:
- ${diffStats.added} lines added
- ${diffStats.deleted} lines deleted
- ${diffStats.modified} files modified
- ${diffStats.renamed} files renamed
- ${diffStats.files.length} total files changed`
      : "";

    return `The user wants commit messages based on their description: "${userInput}"

Analyze the following git changes and generate 4 different commit message suggestions that match the user's intent.

IMPORTANT: Carefully analyze the git diff below to understand WHAT changes were actually made:
- Look for added/removed/modified lines (lines starting with +, -, or @@)
- Identify if files were added, deleted, or modified
- Understand the nature of the changes (new features, bug fixes, refactoring, etc.)
- Match the user's description: "${userInput}"

Files staged for commit:
${filesText}${statsText}

${
  diff
    ? `Complete git diff (analyze this carefully to understand the actual changes):\n${diff.slice(
        0,
        2000,
      )}\n${diff.length > 2000 ? "...(truncated)" : ""}`
    : "No diff available"
}

${
  recentCommitsText
    ? `Recent commit history for reference:\n${recentCommitsText}`
    : ""
}

Requirements:
- Generate exactly 4 different commit messages
- Each message should be 50-72 characters
- ${styleInstruction}
- Make them specific to the actual changes shown AND match the user's intent: "${userInput}"
- Focus on what changed, not how it changed
${customPrompt}

Output ONLY valid JSON.`;
  }

  private getFallbackSuggestions(stagedFiles: GitFile[]): CommitSuggestion[] {
    const fileNames =
      stagedFiles.length > 0
        ? stagedFiles
            .map((f) => f.path)
            .slice(0, 3)
            .join(", ") + (stagedFiles.length > 3 ? "..." : "")
        : "files";

    const suggestions = [
      {
        message: `feat: add ${fileNames}`,
        type: "feat",
        description: `feat: add ${fileNames}`,
      },
      {
        message: `fix: update ${fileNames}`,
        type: "fix",
        description: `fix: update ${fileNames}`,
      },
      {
        message: `refactor: improve ${fileNames}`,
        type: "refactor",
        description: `refactor: improve ${fileNames}`,
      },
      {
        message: `docs: update ${fileNames}`,
        type: "docs",
        description: `docs: update ${fileNames}`,
      },
    ];

    return suggestions;
  }

  private buildPrompt(
    stagedFiles: GitFile[],
    diff: string,
    recentCommits: GitCommit[],
    diffStats?: {
      added: number;
      deleted: number;
      modified: number;
      renamed: number;
      files: string[];
    },
  ): string {
    const filesText = stagedFiles.map((f) => `- ${f.path}`).join("\n");
    const recentCommitsText = recentCommits
      .slice(0, 5)
      .map((c) => `- ${c.message}`)
      .join("\n");

    let styleInstruction = "";
    switch (this.config.commitStyle) {
      case "conventional":
        styleInstruction =
          "Use conventional commit format (feat:, fix:, docs:, etc.)";
        break;
      case "simple":
        styleInstruction = "Keep messages simple and concise";
        break;
      case "detailed":
        styleInstruction = "Include detailed descriptions of changes";
        break;
    }

    const customPrompt = this.config.customPrompt
      ? `\nAdditional instructions: ${this.config.customPrompt}`
      : "";

    const statsText = diffStats
      ? `
Change statistics:
- ${diffStats.added} lines added
- ${diffStats.deleted} lines deleted
- ${diffStats.modified} files modified
- ${diffStats.renamed} files renamed
- ${diffStats.files.length} total files changed`
      : "";

    return `Analyze the following git changes and generate 4 different commit message suggestions.

IMPORTANT: Carefully analyze the git diff below to understand WHAT changes were actually made:
- Look for added/removed/modified lines (lines starting with +, -, or @@)
- Identify if files were added, deleted, or modified
- Understand the nature of the changes (new features, bug fixes, refactoring, etc.)
- DO NOT assume all changes are "add" operations - check the diff carefully

Files staged for commit:
${filesText}${statsText}

${
  diff
    ? `Complete git diff (analyze this carefully to understand the actual changes):\n${diff.slice(
        0,
        2000,
      )}\n${diff.length > 2000 ? "...(truncated)" : ""}`
    : "No diff available"
}

${
  recentCommitsText
    ? `Recent commit history for reference:\n${recentCommitsText}`
    : ""
}

Requirements:
- Generate exactly 4 different commit messages
- Each message should be 50-72 characters
- ${styleInstruction}
- Make them specific to the actual changes shown
- Focus on what changed, not how it changed
${customPrompt}

Output ONLY valid JSON.`;
  }

  private parseSuggestions(content: string): CommitSuggestion[] {
    try {
      // Find the JSON object in the content (it might be wrapped in markdown or have extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
          if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
            return parsed.suggestions
              .map(
                (s: {
                  message?: string;
                  type?: string;
                  description?: string;
                }) => ({
                  message: s.message || "",
                  type: s.type || this.extractType(s.message || ""),
                  description: s.description || s.message || "",
                }),
              )
              .slice(0, 4);
          }
        }
      }
      throw new Error("Invalid JSON structure");
    } catch (e) {
      console.warn(
        "Failed to parse JSON suggestions, falling back to basic parsing:",
        e,
      );
      // Fallback to basic line parsing if JSON fails
      const lines = content.split("\n").filter((line) => line.trim());
      const suggestions: CommitSuggestion[] = [];

      for (const line of lines) {
        const match = line.match(/^\d+\.\s*(.+)$/);
        if (match && suggestions.length < 4) {
          suggestions.push({
            message: match[1].trim(),
            type: this.extractType(match[1]),
            description: match[1].trim(),
          });
        }
      }
      return suggestions;
    }
  }

  private extractType(message: string): string {
    const match = message.match(/^(\w+):/);
    return match ? match[1] : "feat";
  }
}
