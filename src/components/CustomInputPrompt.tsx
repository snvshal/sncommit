import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

interface CustomInputPromptProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export const CustomInputPrompt: React.FC<CustomInputPromptProps> = ({
  value,
  onChange,
  onSubmit,
  onCancel,
}) => {
  const [cursorPosition, setCursorPosition] = useState(value.length);

  useInput((input, key) => {
    if (key.return) {
      onSubmit();
    } else if (key.escape) {
      onCancel();
    } else if (key.backspace || key.delete) {
      if (cursorPosition > 0) {
        const before = value.slice(0, cursorPosition - 1);
        const after = value.slice(cursorPosition);
        onChange(before + after);
        setCursorPosition(cursorPosition - 1);
      }
    } else if (key.leftArrow) {
      setCursorPosition((prev: number) => Math.max(0, prev - 1));
    } else if (key.rightArrow) {
      setCursorPosition((prev: number) => Math.min(value.length, prev + 1));
    } else if (input && !key.ctrl && !key.meta) {
      const before = value.slice(0, cursorPosition);
      const after = value.slice(cursorPosition);
      onChange(before + input + after);
      setCursorPosition(cursorPosition + input.length);
    }
  });

  const displayValue = value || "";
  const beforeCursor = displayValue.slice(0, cursorPosition);
  const cursorChar = displayValue[cursorPosition] || " ";
  const afterCursor = displayValue.slice(cursorPosition + 1);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="#22d3ee"
      paddingX={2}
      paddingY={1}
    >
      <Box marginBottom={1}>
        <Text bold color="#22d3ee">
          Custom Message
        </Text>
      </Box>

      <Box>
        <Text>
          <Text color="#e2e8f0">{beforeCursor}</Text>
          <Text backgroundColor="#22d3ee" color="#0f172a" bold>
            {cursorChar}
          </Text>
          <Text color="#e2e8f0">{afterCursor}</Text>
          {displayValue.length === 0 && (
            <Text color="#64748b"> type your commit message...</Text>
          )}
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text color="#94a3b8">
          <Text color="#22c55e">Enter</Text> submit{" "}
          <Text color="#f97316">Esc</Text> cancel
        </Text>
      </Box>
    </Box>
  );
};
