import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { colors } from "../theme/colors";

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
      borderColor={colors.border.primary}
      paddingX={2}
      paddingY={1}
    >
      <Box marginBottom={1}>
        <Text bold color={colors.primary}>
          Custom Message
        </Text>
      </Box>

      <Box>
        <Text>
          <Text color={colors.text.primary}>{beforeCursor}</Text>
          <Text
            backgroundColor={colors.primary}
            color={colors.text.inverse}
            bold
          >
            {cursorChar}
          </Text>
          <Text color={colors.text.primary}>{afterCursor}</Text>
          {displayValue.length === 0 && (
            <Text color={colors.text.muted}> type your commit message...</Text>
          )}
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text color={colors.text.secondary}>
          <Text color={colors.accent}>Enter</Text> submit{" "}
          <Text color={colors.error}>Esc</Text> cancel
        </Text>
      </Box>
    </Box>
  );
};
