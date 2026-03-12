import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

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
        borderColor="#22d3ee"
        flexGrow={1}
        paddingY={1}
        paddingX={2}
      >
        <Text>
          <Text color="#e2e8f0">{beforeCursor}</Text>
          <Text backgroundColor="#22d3ee" color="#0f172a" bold>
            {cursorChar}
          </Text>
          <Text color="#e2e8f0">{afterCursor}</Text>
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
      borderColor="#334155"
    >
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="#22d3ee">
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
              <Text color="#64748b" dimColor>
                Enter for new line • Tab to submit
              </Text>
            </Box>
          )}
        </Box>
      )}

      {/* Footer */}
      <Box
        borderStyle="round"
        borderColor="#334155"
        paddingY={1}
        paddingX={2}
      >
        {type === "select" ? (
          <Box>
            <Text color="#38bdf8">↑↓</Text>
            <Text color="#94a3b8"> navigate  </Text>
            <Text color="#22c55e">Enter</Text>
            <Text color="#94a3b8"> confirm  </Text>
            <Text color="#f97316">Esc</Text>
            <Text color="#94a3b8"> cancel</Text>
          </Box>
        ) : type === "textarea" ? (
          <Box>
            <Text color="#38bdf8">←→</Text>
            <Text color="#94a3b8"> move  </Text>
            <Text color="#22c55e">Tab</Text>
            <Text color="#94a3b8"> submit  </Text>
            <Text color="#f97316">Esc</Text>
            <Text color="#94a3b8"> cancel</Text>
          </Box>
        ) : (
          <Box>
            <Text color="#38bdf8">←→</Text>
            <Text color="#94a3b8"> move  </Text>
            <Text color="#22c55e">Enter</Text>
            <Text color="#94a3b8"> confirm  </Text>
            <Text color="#f97316">Esc</Text>
            <Text color="#94a3b8"> cancel</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};
