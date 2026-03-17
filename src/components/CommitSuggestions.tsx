import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { CommitSuggestion } from "../types";
import { colors } from "../theme/colors";

interface CommitSuggestionsProps {
  suggestions: CommitSuggestion[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onCommit: (index: number) => void;
  onTryAgain: () => void;
  onCustomInput: () => void;
  isLoading: boolean;
}

export const CommitSuggestions: React.FC<CommitSuggestionsProps> = ({
  suggestions,
  selectedIndex,
  onSelect,
  onCommit,
  onTryAgain,
  onCustomInput,
  isLoading,
}) => {
  const totalOptions = suggestions.length + 2;
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
      } else if (selectedIndex === suggestions.length) {
        onTryAgain();
      } else if (selectedIndex === suggestions.length + 1) {
        onCustomInput();
      }
    }
  });

  if (isLoading) {
    return (
      <Box
        borderStyle="round"
        borderColor={colors.border.default}
        paddingX={2}
        paddingY={1}
      >
        <Text color={colors.text.secondary}>
          {spinnerFrames[frame]} Generating commit suggestions...
        </Text>
      </Box>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Box
        borderStyle="round"
        borderColor={colors.border.warning}
        paddingX={2}
        paddingY={1}
      >
        <Text color={colors.warning}>No suggestions available</Text>
      </Box>
    );
  }

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={colors.border.default}
      paddingX={2}
      paddingY={1}
    >
      <Box marginBottom={1}>
        <Text bold color={colors.primary}>
          Commit Suggestions
        </Text>
        <Text color={colors.text.muted}> ({suggestions.length})</Text>
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
              <Text color={isSelected ? colors.accent : colors.text.muted}>
                {isSelected ? "›" : " "}
              </Text>
            </Box>
            <Text
              color={isSelected ? colors.text.primary : colors.text.secondary}
              bold={isSelected}
            >
              {displayMsg}
            </Text>
          </Box>
        );
      })}

      <Box marginTop={1} paddingLeft={1} flexDirection="row">
        <Box marginRight={4}>
          <Box width={2}>
            <Text
              color={
                selectedIndex === suggestions.length
                  ? colors.accent
                  : colors.text.muted
              }
            >
              {selectedIndex === suggestions.length ? "›" : " "}
            </Text>
          </Box>
          <Text
            color={
              selectedIndex === suggestions.length
                ? colors.accent
                : colors.text.muted
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
                  ? colors.accent
                  : colors.text.muted
              }
            >
              {selectedIndex === suggestions.length + 1 ? "›" : " "}
            </Text>
          </Box>
          <Text
            color={
              selectedIndex === suggestions.length + 1
                ? colors.warning
                : colors.text.muted
            }
            bold={selectedIndex === suggestions.length + 1}
          >
            ✎ Custom input
          </Text>
        </Box>
      </Box>
    </Box>
  );
};
