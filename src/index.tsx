#!/usr/bin/env node

import { Command } from "commander";
import { render } from "ink";
import { App as BetterCommitApp } from "./components/App";
import { ConfigApp } from "./components/ConfigApp";
import { createRequire } from "module";

// Handle raw mode errors gracefully
const handleRawModeError = (error: Error, fallbackMessage: string) => {
  if (error.message.includes("Raw mode is not supported")) {
    console.log(fallbackMessage);
    process.exit(0);
  }
  throw error;
};

const program = new Command();

program
  .name("sncommit")
  .description("AI-powered git commit message generator with beautiful TUI");

// Load version from package.json so the CLI stays in sync with the published package
const require = createRequire(import.meta.url);
const pkg = require("../package.json");
program.version(pkg.version);

// Add options
program.option("-a, --all", "stage all files before committing");
program.option("-p, --push", "push to remote after committing");

// Subcommand for config
program
  .command("config")
  .description("Configure sncommit settings")
  .action(async () => {
    // Check TTY support first before doing anything
    if (!process.stdin.isTTY) {
      console.log("Configuration interface not supported in this terminal.");
      console.log("Please try running in a compatible terminal like:");
      console.log("- Windows Terminal");
      console.log("- PowerShell with proper TTY support");
      console.log("- Git Bash");
      console.log("- WSL terminal");
      process.exit(0);
      return;
    }

    try {
      const { waitUntilExit } = render(<ConfigApp onExit={() => {}} />, {
        stdout: process.stdout,
        stdin: process.stdin,
        patchConsole: true,
        exitOnCtrlC: false,
      });
      await waitUntilExit();
      process.exit(0);
    } catch (error) {
      handleRawModeError(
        error as Error,
        "Configuration interface not supported in this terminal.",
      );
    }
  });

// Default action - commit
program.action(async () => {
  const options = program.opts();

  // Check TTY support first before doing any git operations
  if (!process.stdin.isTTY) {
    console.log("Interactive interface not supported in this terminal.");
    console.log("Please try running in a compatible terminal like:");
    console.log("- Windows Terminal");
    console.log("- PowerShell with proper TTY support");
    console.log("- Git Bash");
    console.log("- WSL terminal");
    process.exit(0);
    return;
  }

  try {
    // Check git status first to provide fallback behavior
    const gitService = await import("./services/git").then(
      (m) => new m.GitService(),
    );
    const isGitRepo = await gitService.isGitRepository();
    if (!isGitRepo) {
      console.log(
        "Error: Not a git repository. Please run this command from inside a git repository.",
      );
      process.exit(0);
      return;
    }

    if (options.all) {
      const hasUnstaged = await gitService.hasUnstagedChanges();
      if (hasUnstaged) {
        await gitService.stageAll();
      }
    }

    const hasStaged = await gitService.hasStagedChanges();
    if (!hasStaged) {
      const hasUnstaged = await gitService.hasUnstagedChanges();
      if (hasUnstaged) {
        console.log(
          'No staged files. Use "git add ." or run "sncommit -a" to stage all files.',
        );
      } else {
        console.log("No changes to commit. Working tree is clean.");
      }
      process.exit(0);
      return;
    }

    // Only try to render if we have staged files
    const { waitUntilExit } = render(
      <BetterCommitApp
        addAll={options.all || false}
        pushAfterCommit={options.push || false}
        onExit={() => {}}
      />,
      {
        stdout: process.stdout,
        stdin: process.stdin,
        patchConsole: true,
        exitOnCtrlC: false,
      },
    );
    await waitUntilExit();
    process.exit(0);
  } catch (error) {
    handleRawModeError(
      error as Error,
      "Interactive interface not supported in this terminal. Please try running in a compatible terminal.",
    );
  }
});

program.parse();
