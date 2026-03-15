import React, { useState, useCallback, useMemo } from "react";
import { Box, Text, useInput, useApp, Key } from "ink";
import { configManager } from "../utils/config";
import { Config } from "../types";

interface ConfigAppProps {
  onExit: (message?: string) => void;
}

export const ConfigApp: React.FC<ConfigAppProps> = ({ onExit }) => {
  const { exit } = useApp();
  const [config, setConfig] = useState<Config>(configManager.getConfig());
  const [exitMessage, setExitMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (exitMessage) {
      const timer = setTimeout(() => {
        exit();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [exitMessage, exit]);

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [menuIndex, setMenuIndex] = useState(0);

  const modelOptions = useMemo(
    () => [
      {
        display: "llama-3.1-8b-instant (fastest)",
        value: "llama-3.1-8b-instant",
      },
      {
        display: "llama-3.3-70b-versatile (most capable)",
        value: "llama-3.3-70b-versatile",
      },
      { display: "openai/gpt-oss-20b (balanced)", value: "openai/gpt-oss-20b" },
    ],
    [],
  );

  const menuItems = useMemo(
    () => [
      {
        key: "groqApiKey" as keyof Config,
        label: "Groq API Key",
        type: "password" as const,
      },
      {
        key: "model" as keyof Config,
        label: "AI Model",
        type: "select" as const,
        options: modelOptions.map((m) => m.display),
      },
      {
        key: "commitStyle" as keyof Config,
        label: "Commit Style",
        type: "select" as const,
        options: ["conventional", "simple", "detailed"],
      },
      {
        key: "customPrompt" as keyof Config,
        label: "Custom Prompt",
        type: "input" as const,
      },
    ],
    [modelOptions],
  );

  const [editValue, setEditValue] = useState("");
  const [optionIndex, setOptionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);

  const autoSave = useCallback(() => {
    const finalConfig = {
      ...config,
      maxHistoryCommits: 40,
      language: "en",
    };
    configManager.updateConfig(finalConfig);
  }, [config]);

  const saveAndExit = useCallback(() => {
    const finalConfig = {
      ...config,
      maxHistoryCommits: 40,
      language: "en",
    };
    configManager.updateConfig(finalConfig);
    onExit("Configuration saved");
    setExitMessage("Configuration saved");
  }, [config, onExit]);

  const handleExpand = useCallback(
    (index: number) => {
      const item = menuItems[index];
      setExpandedIndex(index);
      setOptionIndex(0);
      if (item.type === "select" && item.options) {
        const currentValue = config[item.key];
        const optIdx = item.options.indexOf(currentValue as string);
        setOptionIndex(optIdx >= 0 ? optIdx : 0);
      } else {
        const val = String(config[item.key] || "");
        setEditValue(val);
        setCursorPosition(val.length);
      }
    },
    [menuItems, config],
  );

  const handleCollapse = useCallback(() => {
    setExpandedIndex(null);
    setEditValue("");
    setCursorPosition(0);
  }, []);

  const handleSubmit = useCallback(
    (index: number) => {
      const item = menuItems[index];
      let finalValue = editValue;

      if (item.type === "select" && item.options) {
        finalValue = item.options[optionIndex];
      }

      if (item.key === "model") {
        const modelOption = modelOptions.find((m) => m.display === finalValue);
        if (modelOption) {
          finalValue = modelOption.value;
        }
      }

      const newConfig = { ...config, [item.key]: finalValue };
      setConfig(newConfig);
      autoSave();
      handleCollapse();
    },
    [
      menuItems,
      editValue,
      optionIndex,
      modelOptions,
      config,
      autoSave,
      handleCollapse,
    ],
  );

  useInput((input: string, key: Key) => {
    if (exitMessage) return;

    if (expandedIndex !== null) {
      const item = menuItems[expandedIndex];

      if (key.escape) {
        handleCollapse();
        return;
      }

      if (item.type === "select" && item.options) {
        if (key.upArrow) {
          setOptionIndex((prev) =>
            prev > 0 ? prev - 1 : item.options!.length - 1,
          );
        } else if (key.downArrow) {
          setOptionIndex((prev) =>
            prev < item.options!.length - 1 ? prev + 1 : 0,
          );
        } else if (key.return) {
          handleSubmit(expandedIndex);
        }
      } else {
        if (key.return) {
          handleSubmit(expandedIndex);
        } else if (key.leftArrow) {
          setCursorPosition((prev) => Math.max(0, prev - 1));
        } else if (key.rightArrow) {
          setCursorPosition((prev) => Math.min(editValue.length, prev + 1));
        } else if (key.backspace || key.delete) {
          if (cursorPosition > 0) {
            setEditValue(
              (prev) =>
                prev.slice(0, cursorPosition - 1) + prev.slice(cursorPosition),
            );
            setCursorPosition((prev) => prev - 1);
          }
        } else if (input && !key.ctrl && !key.meta) {
          setEditValue(
            (prev) =>
              prev.slice(0, cursorPosition) +
              input +
              prev.slice(cursorPosition),
          );
          setCursorPosition((prev) => prev + input.length);
        }
      }
    } else {
      if (key.upArrow) {
        setMenuIndex((prev) => (prev > 0 ? prev - 1 : menuItems.length - 1));
      } else if (key.downArrow) {
        setMenuIndex((prev) => (prev < menuItems.length - 1 ? prev + 1 : 0));
      } else if (key.return) {
        handleExpand(menuIndex);
      } else if (key.escape || (key.ctrl && input === "c")) {
        saveAndExit();
      }
    }
  });

  const renderValue = (key: keyof Config) => {
    const val = config[key];

    if (!val) return "(not set)";
    if (key === "groqApiKey") return "••••••••";

    const strVal = String(val);
    if (key === "customPrompt") {
      return strVal.length > 30 ? strVal.substring(0, 30) + "..." : strVal;
    }
    return strVal;
  };

  return (
    <Box flexDirection="column" paddingY={1} flexGrow={1} width="100%">
      {exitMessage ? (
        <Box flexGrow={1} justifyContent="center" alignItems="center">
          <Text bold color="#22c55e">
            {exitMessage}
          </Text>
        </Box>
      ) : (
        <>
          <Box marginBottom={1}>
            <Text bold color="#22d3ee">
              Configure Better-Commit
            </Text>
          </Box>

          <Box flexDirection="column" gap={1}>
            {menuItems.map((item, index) => {
              const isSel = index === menuIndex && expandedIndex === null;
              const isExp = expandedIndex === index;

              return (
                <Box key={item.key} flexDirection="column">
                  <Box flexDirection="row" alignItems="center">
                    <Box width={1}>
                      <Text bold color={isSel ? "#a5b4fc" : "#1e293b"}>
                        │
                      </Text>
                    </Box>
                    <Box
                      flexGrow={1}
                      backgroundColor={isSel ? "#1e293b" : undefined}
                      paddingX={1}
                    >
                      <Text color={isSel ? "#a5b4fc" : "#e2e8f0"}>
                        {item.label}
                      </Text>
                    </Box>
                  </Box>
                  {!isExp && (
                    <Box flexDirection="row" alignItems="center">
                      <Box width={1}>
                        <Text bold color={isSel ? "#a5b4fc" : "#1e293b"}>
                          │
                        </Text>
                      </Box>
                      <Box
                        flexGrow={1}
                        backgroundColor={isSel ? "#1e293b" : undefined}
                        paddingX={1}
                      >
                        <Text color={isSel ? "#94a3b8" : "#64748b"}>
                          {renderValue(item.key)}
                        </Text>
                      </Box>
                    </Box>
                  )}

                  {isExp && item.type === "select" && item.options && (
                    <Box flexDirection="column">
                      {item.options.map((opt, optIdx) => (
                        <Box key={opt} flexDirection="row" alignItems="center">
                          <Box width={1}>
                            <Text
                              bold
                              color={
                                optIdx === optionIndex ? "#a5b4fc" : "#1e293b"
                              }
                            >
                              │
                            </Text>
                          </Box>
                          <Box
                            flexGrow={1}
                            backgroundColor={
                              optIdx === optionIndex ? "#1e293b" : undefined
                            }
                            paddingX={1}
                          >
                            <Text
                              color={
                                optIdx === optionIndex ? "#a5b4fc" : "#64748b"
                              }
                            >
                              {opt}
                            </Text>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}

                  {isExp && item.type !== "select" && (
                    <Box flexDirection="row" alignItems="center">
                      <Box width={1}>
                        <Text bold color="#a5b4fc">
                          │
                        </Text>
                      </Box>
                      <Box flexGrow={1} backgroundColor="#1e293b" paddingX={1}>
                        <Text color="#a5b4fc">
                          {item.type === "password"
                            ? editValue
                                .split("")
                                .map(() => "•")
                                .join("") +
                              (cursorPosition >= editValue.length ? "█" : "")
                            : editValue
                                .split("")
                                .map((char, i) =>
                                  i === cursorPosition ? "█" : char,
                                )
                                .join("") +
                              (cursorPosition >= editValue.length ? "█" : "")}
                        </Text>
                      </Box>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>

          <Box marginTop={1}>
            <Text color="#64748b" dimColor>
              {expandedIndex !== null
                ? "↑↓ navigate • Enter confirm • Esc cancel"
                : "↑↓ navigate • Enter edit • Esc exit"}
            </Text>
          </Box>
        </>
      )}
    </Box>
  );
};
