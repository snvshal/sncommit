export interface Config {
  groqApiKey?: string;
  model?: string;
  maxHistoryCommits?: number;
  commitStyle?: "conventional" | "simple" | "detailed";
  language?: string;
  customPrompt?: string;
}

export interface GitFile {
  path: string;
  status: string;
  isStaged: boolean;
}

export interface CommitSuggestion {
  message: string;
  type?: string;
  description?: string;
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export interface AppState {
  stagedFiles: GitFile[];
  suggestions: CommitSuggestion[];
  selectedIndex: number;
  isLoading: boolean;
  error?: string;
  warning?: string;
}
