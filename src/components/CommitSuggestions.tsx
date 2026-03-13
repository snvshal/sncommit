import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { CommitSuggestion } from "../types";

interface CommitSuggestionsProps {
  suggestions: CommitSuggestion[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onCommit: (index: number) => void;
  onTryAgain: () => void;
  onCustomInput: () => void;
  isLoading: boolean;
  isUsingFallback?: boolean;
}

export const CommitSuggestions: React.FC<CommitSuggestionsProps> = ({
  suggestions,
  selectedIndex,
  onSelect,
  onCommit,
  onTryAgain,
  onCustomInput,
  isLoading,
  isUsingFallback = false,
}) => {
  const totalOptions = isUsingFallback
    ? suggestions.length
    : suggestions.length + 2;
  const [frame, setFrame] = useState(0);

  const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  // Alternative spinners:
  // const spinnerFrames = ['◐', '◓', '◑', '◒'];

  useEffect(() => {
    if (isLoading) {
      const timer = setInterval(() => {
        setFrame((prev) => (prev + 1) % spinnerFrames.length);
      }, 80);
      return () => clearInterval(timer);
    }
  }, [isLoading, spinnerFrames.length]);

  useInput((input, key) => {
    if (key.upArrow) {
      const newIndex = selectedIndex > 0 ? selectedIndex - 1 : totalOptions - 1;
      onSelect(newIndex);
    } else if (key.downArrow) {
      const newIndex = selectedIndex < totalOptions - 1 ? selectedIndex + 1 : 0;
      onSelect(newIndex);
    } else if (key.return) {
      if (selectedIndex < suggestions.length) {
        onCommit(selectedIndex);
      } else if (!isUsingFallback) {
        if (selectedIndex === suggestions.length) {
          onTryAgain();
        } else if (selectedIndex === suggestions.length + 1) {
          onCustomInput();
        }
      }
    }
  });

  if (isLoading) {
    return (
      <Box borderStyle="round" borderColor="#334155" paddingX={2} paddingY={1}>
        <Text color="#94a3b8">
          {spinnerFrames[frame]} Generating commit suggestions...
        </Text>
      </Box>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Box borderStyle="round" borderColor="#f97316" paddingX={2} paddingY={1}>
        <Text color="#f97316">No suggestions available</Text>
      </Box>
    );
  }

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="#334155"
      paddingX={2}
      paddingY={1}
    >
      <Box marginBottom={1}>
        <Text bold color="#22d3ee">
          Commit Suggestions
        </Text>
        <Text color="#64748b"> ({suggestions.length})</Text>
      </Box>

      {suggestions.map((suggestion, index) => {
        const isSelected = index === selectedIndex;
        const displayMsg =
          suggestion.message.length > 65
            ? suggestion.message.substring(0, 62) + "..."
            : suggestion.message;

        return (
          <Box key={index} paddingLeft={1}>
            <Box width={2}>
              <Text color={isSelected ? "#22c55e" : "#64748b"}>
                {isSelected ? "›" : " "}
              </Text>
            </Box>
            <Text color={isSelected ? "#e2e8f0" : "#94a3b8"} bold={isSelected}>
              {displayMsg}
            </Text>
          </Box>
        );
      })}

      {!isUsingFallback && (
        <Box marginTop={1} paddingLeft={1} flexDirection="row">
          <Box marginRight={4}>
            <Box width={2}>
              <Text
                color={
                  selectedIndex === suggestions.length ? "#22c55e" : "#64748b"
                }
              >
                {selectedIndex === suggestions.length ? "›" : " "}
              </Text>
            </Box>
            <Text
              color={
                selectedIndex === suggestions.length ? "#38bdf8" : "#64748b"
              }
              bold={selectedIndex === suggestions.length}
            >
              ↻ Try again
            </Text>
          </Box>
          <Box>
            <Box width={2}>
              <Text
                color={
                  selectedIndex === suggestions.length + 1
                    ? "#22c55e"
                    : "#64748b"
                }
              >
                {selectedIndex === suggestions.length + 1 ? "›" : " "}
              </Text>
            </Box>
            <Text
              color={
                selectedIndex === suggestions.length + 1 ? "#f59e0b" : "#64748b"
              }
              bold={selectedIndex === suggestions.length + 1}
            >
              ✎ Custom input
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};
