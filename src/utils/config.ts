import { readFileSync, writeFileSync, existsSync } from "fs";
import { homedir } from "os";
import path from "path";
import { Config } from "../types";

const CONFIG_FILE = path.join(homedir(), ".sncommit.json");

const DEFAULT_CONFIG: Config = {
  model: "llama-3.1-8b-instant",
  maxHistoryCommits: 50,
  commitStyle: "conventional",
  language: "en",
  customPrompt: "",
};

export class ConfigManager {
  private config: Config;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): Config {
    try {
      if (existsSync(CONFIG_FILE)) {
        const configData = readFileSync(CONFIG_FILE, "utf-8");
        return { ...DEFAULT_CONFIG, ...JSON.parse(configData) };
      }
    } catch {
      // Silently fail - use defaults
    }
    return { ...DEFAULT_CONFIG };
  }

  public getConfig(): Config {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<Config>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  private saveConfig(): void {
    try {
      writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
    } catch (error) {
      throw new Error(`Failed to save config: ${error}`, { cause: error });
    }
  }

  public getConfigPath(): string {
    return CONFIG_FILE;
  }

  public hasConfig(): boolean {
    return existsSync(CONFIG_FILE);
  }

  public resetConfig(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.saveConfig();
  }
}

export const configManager = new ConfigManager();
