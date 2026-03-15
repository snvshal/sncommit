import React, { useState, useEffect } from "react";
import { Box, Text, useApp, useInput, useStdout } from "ink";
import { GitService } from "../services/git";
import { GroqService } from "../services/groq";
import { configManager } from "../utils/config";
import { StagedFiles } from "./StagedFiles";
import { CommitSuggestions } from "./CommitSuggestions";
import { CustomInputPrompt } from "./CustomInputPrompt";
import { AppState, GitFile } from "../types";
import { colors } from "../theme/colors";

interface AppProps {
  addAll?: boolean;
  pushAfterCommit?: boolean;
  onExit: (message?: string) => void;
}

export const BetterCommitApp: React.FC<AppProps> = ({
  addAll: _addAll = false,
  pushAfterCommit = false,
  onExit,
}) => {
  const { exit } = useApp();
  const { write } = useStdout();
  const [state, setState] = useState<AppState>({
    stagedFiles: [],
    suggestions: [],
    selectedIndex: 0,
    isLoading: false,
    error: undefined,
  });

  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [exitMessage, setExitMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | undefined>(
    undefined,
  );
  const [isPushing, setIsPushing] = useState(false);
  const [pushLogs, setPushLogs] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [isCustomInputMode, setIsCustomInputMode] = useState(false);

  // Auto-exit when showing success message
  useEffect(() => {
    if (
      successMessage &&
      !isPushing &&
      (!pushAfterCommit || pushLogs.length > 0)
    ) {
      const timer = setTimeout(() => {
        setExitMessage(successMessage);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [
    successMessage,
    isPushing,
    pushAfterCommit,
    pushLogs.length,
    exit,
    write,
  ]);

  // Handle exit after showing message
  useEffect(() => {
    if (exitMessage) {
      const timer = setTimeout(() => {
        exit();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [exitMessage, exit]);

  // Auto-exit when error occurs
  useEffect(() => {
    if (state.error) {
      setExitMessage(state.error);
    }
  }, [state.error]);

  // Handle global exit keys (disabled when custom input is active)
  useInput(
    (input, key) => {
      if (key.escape || (key.ctrl && input === "c")) {
        onExit("Operation cancelled");
        setExitMessage("Operation cancelled");
      }
    },
    { isActive: !isCustomInputMode },
  );

  const config = configManager.getConfig();
  const gitService = new GitService();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const stagedFiles = await gitService.getStagedFiles();
        // No need to check for empty staged files here as index.tsx handles it

        await gitService.getDiff();

        await fetchSuggestions(stagedFiles);

        setState((prev) => ({
          ...prev,
          stagedFiles,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: `Error: ${error instanceof Error ? error.message : String(error)}`,
        }));
      }
    };

    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSuggestions = async (
    stagedFiles: GitFile[],
    customPrompt?: string,
  ) => {
    if (!config.groqApiKey || config.groqApiKey.trim() === "") {
      setState((prev) => ({
        ...prev,
        error:
          'Groq API key not configured. Run "better-commit config" to set it up.',
        isLoading: false,
      }));
      return;
    }

    try {
      const groqService = new GroqService(config.groqApiKey, config);
      const diff = await gitService.getDiff();
      const diffStats = await gitService.getDiffStats();
      const recentCommits = await gitService.getRecentCommits(
        config.maxHistoryCommits || 50,
      );

      let suggestions;
      if (customPrompt) {
        suggestions =
          await groqService.generateCommitSuggestionsFromCustomInput(
            stagedFiles,
            diff,
            customPrompt,
            recentCommits,
            diffStats,
          );
      } else {
        suggestions = await groqService.generateCommitSuggestions(
          stagedFiles,
          diff,
          recentCommits,
          diffStats,
        );
      }

      const hasFallback = suggestions.some((s) => s.isFallback);
      setState((prev) => ({
        ...prev,
        suggestions,
        isLoading: false,
        error: undefined,
      }));
      setIsUsingFallback(hasFallback);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: `Failed to generate suggestions: ${error instanceof Error ? error.message : String(error)}`,
        isLoading: false,
      }));
    }
  };

  const handleSelect = (index: number) => {
    setState((prev) => ({ ...prev, selectedIndex: index }));
  };

  const handleCommit = async (index: number) => {
    const selectedSuggestion = state.suggestions[index];
    if (selectedSuggestion) {
      try {
        await gitService.commit(selectedSuggestion.message);
        setSuccessMessage(selectedSuggestion.message);

        // Push after commit if -p flag was used
        if (pushAfterCommit) {
          setIsPushing(true);
          setPushLogs(["Pushing to remote..."]);

          try {
            await gitService.push();
            setPushLogs((prev) => [...prev, "Push successful!"]);
          } catch (error) {
            setPushLogs((prev) => [
              ...prev,
              `Failed to push: ${error instanceof Error ? error.message : String(error)}`,
            ]);
          } finally {
            setIsPushing(false);
          }
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: `Failed to commit: ${error instanceof Error ? error.message : String(error)}`,
        }));
      }
    }
  };

  const handleTryAgain = () => {
    setState((prev) => ({ ...prev, isLoading: true, suggestions: [] }));
    fetchSuggestions(state.stagedFiles);
  };

  const handleCustomInput = () => {
    setIsCustomInputMode(true);
    setCustomInput("");
  };

  const handleCustomInputCancel = () => {
    setIsCustomInputMode(false);
  };

  const handleCustomInputSubmit = async () => {
    if (!customInput.trim()) {
      setIsCustomInputMode(false);
      return;
    }

    setIsCustomInputMode(false);
    setState((prev) => ({ ...prev, isLoading: true, suggestions: [] }));
    await fetchSuggestions(state.stagedFiles, customInput.trim());
  };

  // Error State
  if (state.error) {
    return (
      <Box
        borderStyle="single"
        borderColor={colors.border.error}
        padding={2}
        marginBottom={1}
      >
        <Text color={colors.error} bold>
          Error
        </Text>
        <Box marginTop={1}>
          <Text color={colors.text.secondary}>{state.error}</Text>
        </Box>
      </Box>
    );
  }

  // Success State
  if (successMessage) {
    return (
      <Box
        flexDirection="column"
        justifyContent="center"
        flexGrow={1}
        paddingX={2}
        paddingY={1}
        borderStyle="round"
        borderColor={colors.border.accent}
      >
        <Box justifyContent="center" marginBottom={1}>
          <Text bold color={colors.accent}>
            {"\u2713"} Commit Successful
          </Text>
        </Box>
        <Box justifyContent="center" marginBottom={1}>
          <Text color={colors.primary}>{successMessage}</Text>
        </Box>

        {pushAfterCommit && pushLogs.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            <Box>
              <Text bold color={colors.primary}>
                Push:
              </Text>
            </Box>
            {pushLogs.map((log, index) => (
              <Box key={index}>
                <Text
                  color={
                    log.includes("failed") || log.includes("Failed")
                      ? colors.error
                      : colors.accent
                  }
                >
                  {"\u2022"} {log}
                </Text>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  // Loading State
  if (state.stagedFiles.length === 0 && !state.error) {
    return (
      <Box flexDirection="column" padding={2} justifyContent="center">
        <Text bold color={colors.primary}>
          Better-Commit
        </Text>
        <Box marginTop={1}>
          <Text color={colors.text.muted}>Loading staged files...</Text>
        </Box>
      </Box>
    );
  }

  if (exitMessage) {
    return (
      <Box
        flexDirection="column"
        paddingX={2}
        paddingY={1}
        borderStyle="round"
        borderColor={colors.border.accent}
        flexGrow={1}
      >
        <Box flexGrow={1} justifyContent="center" alignItems="center">
          <Text bold color={colors.accent}>
            {exitMessage}
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      flexDirection="column"
      paddingX={2}
      paddingY={1}
      borderStyle="round"
      borderColor={colors.border.default}
    >
      {/* Header */}
      <Box marginBottom={1} alignItems="center">
        <Text bold color={colors.primary}>
          Better-Commit
        </Text>
        <Text color={colors.text.secondary}>
          {" "}
          • AI-powered commit suggestions
        </Text>
      </Box>

      {/* Staged Files */}
      <StagedFiles files={state.stagedFiles} />

      {/* Commit Suggestions or Custom Input */}
      {isCustomInputMode ? (
        <CustomInputPrompt
          value={customInput}
          onChange={setCustomInput}
          onSubmit={handleCustomInputSubmit}
          onCancel={handleCustomInputCancel}
        />
      ) : (
        <CommitSuggestions
          suggestions={state.suggestions}
          selectedIndex={state.selectedIndex}
          onSelect={handleSelect}
          onCommit={handleCommit}
          onTryAgain={handleTryAgain}
          onCustomInput={handleCustomInput}
          isLoading={state.isLoading}
          isUsingFallback={isUsingFallback}
        />
      )}

      {/* Footer - hide when custom input is open */}
      {!isCustomInputMode && (
        <Box
          borderStyle="round"
          borderColor={colors.border.default}
          paddingY={1}
          paddingX={2}
        >
          <Box>
            <Text color={colors.primary}>↑↓</Text>
            <Text color={colors.text.secondary}> navigate</Text>
            <Text color={colors.text.secondary}> </Text>
            <Text color={colors.accent}>Enter</Text>
            <Text color={colors.text.secondary}> select</Text>
            <Text color={colors.text.secondary}> </Text>
            <Text color={colors.error}>Esc</Text>
            <Text color={colors.text.secondary}> exit</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export const App = BetterCommitApp;
