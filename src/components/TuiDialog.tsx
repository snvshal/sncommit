import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { colors } from "../theme/colors";

export type DialogType = "input" | "password" | "textarea" | "select";

export interface DialogProps {
  title: string;
  type: DialogType;
  initialValue?: string;
  options?: string[];
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export const TuiDialog: React.FC<DialogProps> = ({
  title,
  type,
  initialValue = "",
  options = [],
  onSubmit,
  onCancel,
}) => {
  const [value, setValue] = useState(initialValue);
  const [selectedIndex, setSelectedIndex] = useState(() => {
    if (type === "select" && initialValue) {
      const index = options.indexOf(initialValue);
      return index !== -1 ? index : 0;
    }
    return 0;
  });
  const [cursorPosition, setCursorPosition] = useState(initialValue.length);

  useInput((input, key) => {
    // Handle escape to cancel
    if (key.escape) {
      onCancel();
      return;
    }

    if (type === "select") {
      if (key.upArrow) {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
      } else if (key.downArrow) {
        setSelectedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
      } else if (key.return) {
        onSubmit(options[selectedIndex]);
      }
    } else {
      // Input / Password / Textarea
      if (key.tab && type === "textarea") {
        // Tab: Submit for textarea
        onSubmit(value.trim());
      } else if (key.return) {
        if (type === "textarea") {
          // Enter: Insert newline for textarea
          const before = value.slice(0, cursorPosition);
          const after = value.slice(cursorPosition);
          setValue(before + "\n" + after);
          setCursorPosition(cursorPosition + 1);
        } else {
          // Enter: Submit for input/password
          onSubmit(value.trim());
        }
      } else if (key.leftArrow) {
        setCursorPosition((prev) => Math.max(0, prev - 1));
      } else if (key.rightArrow) {
        setCursorPosition((prev) => Math.min(value.length, prev + 1));
      } else if (key.backspace || key.delete) {
        if (cursorPosition > 0) {
          const before = value.slice(0, cursorPosition - 1);
          const after = value.slice(cursorPosition);
          setValue(before + after);
          setCursorPosition(cursorPosition - 1);
        }
      } else if (input && !key.ctrl && !key.meta) {
        const before = value.slice(0, cursorPosition);
        const after = value.slice(cursorPosition);
        setValue(before + input + after);
        setCursorPosition(cursorPosition + input.length);
      }
    }
  });

  const renderInputField = () => {
    const displayValue = type === "password" ? "•".repeat(value.length) : value;
    const beforeCursor = displayValue.slice(0, cursorPosition);
    const cursorChar = displayValue[cursorPosition] || " ";
    const afterCursor = displayValue.slice(cursorPosition + 1);

    return (
      <Box
        borderStyle="round"
        borderColor={colors.border.primary}
        flexGrow={1}
        paddingY={1}
        paddingX={2}
      >
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
        </Text>
      </Box>
    );
  };

  return (
    <Box
      flexDirection="column"
      flexGrow={1}
      paddingY={1}
      paddingX={2}
      borderStyle="round"
      borderColor={colors.border.default}
    >
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color={colors.primary}>
          {title}
        </Text>
      </Box>

      {/* Content */}
      {type === "select" ? (
        <Box flexDirection="column" marginBottom={1}>
          {options.map((option, index) => (
            <Box key={option} paddingX={1} paddingY={0.5}>
              <Text
                bold={index === selectedIndex}
                inverse={index === selectedIndex}
              >
                {index === selectedIndex ? "› " : "  "}
                {option}
              </Text>
            </Box>
          ))}
        </Box>
      ) : (
        <Box flexDirection="column" marginBottom={1}>
          {renderInputField()}
          {type === "textarea" && (
            <Box marginTop={1}>
              <Text color={colors.text.muted} dimColor>
                Enter for new line • Tab to submit
              </Text>
            </Box>
          )}
        </Box>
      )}

      {/* Footer */}
      <Box
        borderStyle="round"
        borderColor={colors.border.default}
        paddingY={1}
        paddingX={2}
      >
        {type === "select" ? (
          <Box>
            <Text color={colors.primary}>↑↓</Text>
            <Text color={colors.text.secondary}> navigate </Text>
            <Text color={colors.accent}>Enter</Text>
            <Text color={colors.text.secondary}> confirm </Text>
            <Text color={colors.error}>Esc</Text>
            <Text color={colors.text.secondary}> cancel</Text>
          </Box>
        ) : type === "textarea" ? (
          <Box>
            <Text color={colors.primary}>←→</Text>
            <Text color={colors.text.secondary}> move </Text>
            <Text color={colors.accent}>Tab</Text>
            <Text color={colors.text.secondary}> submit </Text>
            <Text color={colors.error}>Esc</Text>
            <Text color={colors.text.secondary}> cancel</Text>
          </Box>
        ) : (
          <Box>
            <Text color={colors.primary}>←→</Text>
            <Text color={colors.text.secondary}> move </Text>
            <Text color={colors.accent}>Enter</Text>
            <Text color={colors.text.secondary}> confirm </Text>
            <Text color={colors.error}>Esc</Text>
            <Text color={colors.text.secondary}> cancel</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};
