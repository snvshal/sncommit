import React, { useState, useCallback, useMemo } from "react";
import { Box, Text, useInput, useApp, Key } from "ink";
import { configManager } from "../utils/config";
import { Config } from "../types";
import { TuiDialog, DialogType } from "./TuiDialog";

interface ConfigAppProps {
  onExit: (message?: string) => void;
}

export const ConfigApp: React.FC<ConfigAppProps> = ({ onExit }) => {
  const { exit } = useApp();
  const [config, setConfig] = useState<Config>(configManager.getConfig());

  const [activeDialog, setActiveDialog] = useState<{
    key: keyof Config;
    type: DialogType;
    title: string;
    options?: string[];
  } | null>(null);

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
        type: "textarea" as const,
      },
    ],
    [modelOptions],
  );

  const saveAndExit = useCallback(() => {
    const finalConfig = {
      ...config,
      // model was hardcoded here previously, now we let user select it
      // model: "llama-3.1-8b-instant",
      maxHistoryCommits: 40,
      language: "en",
    };
    configManager.updateConfig(finalConfig);
    onExit("Configuration saved");
    exit();
  }, [config, onExit, exit]);

  const cancelAndExit = useCallback(() => {
    onExit("Configuration cancelled");
    exit();
  }, [onExit, exit]);

  const handleInput = useCallback(
    (input: string, key: Key) => {
      if (activeDialog) return;

      if (key.upArrow) {
        setMenuIndex((prev) => (prev > 0 ? prev - 1 : menuItems.length + 1));
      } else if (key.downArrow) {
        setMenuIndex((prev) => (prev < menuItems.length + 1 ? prev + 1 : 0));
      } else if (key.return) {
        if (menuIndex < menuItems.length) {
          const item = menuItems[menuIndex];
          setActiveDialog({
            key: item.key,
            type: item.type,
            title: `Edit ${item.label}`,
            options: item.options,
          });
        } else if (menuIndex === menuItems.length) {
          saveAndExit();
        } else {
          cancelAndExit();
        }
      } else if (key.escape || (key.ctrl && input === "c")) {
        cancelAndExit();
      }
    },
    [activeDialog, menuIndex, menuItems, saveAndExit, cancelAndExit],
  );

  useInput(handleInput, { isActive: !activeDialog });

  const handleDialogSubmit = (value: string) => {
    if (activeDialog) {
      let finalValue = value;

      // Convert display label back to actual model ID
      if (activeDialog.key === "model") {
        const modelOption = modelOptions.find((m) => m.display === value);
        if (modelOption) {
          finalValue = modelOption.value;
        }
      }

      setConfig((prev) => ({ ...prev, [activeDialog.key]: finalValue }));
      setActiveDialog(null);
    }
  };

  const handleDialogCancel = () => {
    setActiveDialog(null);
  };

  const renderValue = (isSelected: boolean, key: keyof Config) => {
    const val = config[key];
    const textColor = isSelected ? "#111827" : "#e5e7eb";
    const bgColor = isSelected ? "#60a5fa" : undefined;

    if (!val)
      return (
        <Text color={textColor} backgroundColor={bgColor}>
          (not set)
        </Text>
      );
    if (key === "groqApiKey")
      return (
        <Text color={textColor} backgroundColor={bgColor}>
          ••••••••
        </Text>
      );

    if (key === "customPrompt")
      return (
        <Text color={textColor} backgroundColor={bgColor}>
          {(val as string).substring(0, 20) +
            ((val as string).length > 20 ? "..." : "")}
        </Text>
      );
    return (
      <Text color={textColor} backgroundColor={bgColor}>
        {val}
      </Text>
    );
  };

  return (
    <Box
      flexDirection="column"
      paddingX={3}
      paddingY={1}
      flexGrow={1}
      width="100%"
      borderStyle="round"
      borderColor="#334155"
    >
      {/* Dialog or Main Content */}
      {activeDialog ? (
        <Box flexGrow={1} justifyContent="center" alignItems="center">
          <TuiDialog
            title={activeDialog.title}
            type={activeDialog.type}
            initialValue={String(config[activeDialog.key] || "")}
            options={activeDialog.options}
            onSubmit={handleDialogSubmit}
            onCancel={handleDialogCancel}
          />
        </Box>
      ) : (
        <Box
          flexDirection="column"
          flexGrow={1}
          borderStyle="round"
          borderColor="#334155"
          paddingX={2}
          paddingTop={1}
          paddingBottom={1}
        >
          <Box marginBottom={1}>
            <Text bold color="#22d3ee">
              Configure Better-Commit
            </Text>
          </Box>

          {/* Menu Items */}
          <Box flexDirection="column" marginBottom={2}>
            {menuItems.map((item, index) => (
              <Box
                key={item.key}
                flexDirection="row"
                justifyContent="space-between"
                paddingY={0.5}
                paddingX={1}
              >
                <Box width={24}>
                  <Text
                    bold={index === menuIndex}
                    color={index === menuIndex ? "#0f172a" : "#e2e8f0"}
                    backgroundColor={
                      index === menuIndex ? "#38bdf8" : undefined
                    }
                  >
                    {index === menuIndex ? "› " : "  "}
                    {item.label}
                  </Text>
                </Box>
                <Box flexGrow={1}>
                  <Text
                    color={index === menuIndex ? "#0f172a" : "#e2e8f0"}
                    backgroundColor={
                      index === menuIndex ? "#38bdf8" : undefined
                    }
                  >
                    {renderValue(index === menuIndex, item.key)}
                  </Text>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Actions */}
          <Box flexDirection="row" marginBottom={0}>
            <Box marginRight={2}>
              <Text
                bold={menuIndex === menuItems.length}
                color={menuIndex === menuItems.length ? "#0f172a" : "#22c55e"}
                backgroundColor={
                  menuIndex === menuItems.length ? "#22c55e" : undefined
                }
              >
                {menuIndex === menuItems.length ? "› " : "  "} Save & Exit
              </Text>
            </Box>
            <Box>
              <Text
                bold={menuIndex === menuItems.length + 1}
                color={
                  menuIndex === menuItems.length + 1 ? "#0f172a" : "#ef4444"
                }
                backgroundColor={
                  menuIndex === menuItems.length + 1 ? "#f97316" : undefined
                }
              >
                {menuIndex === menuItems.length + 1 ? "› " : "  "}Cancel
              </Text>
            </Box>
          </Box>
        </Box>
      )}

      {/* Footer - only show when no dialog is open */}
      {!activeDialog && (
        <Box borderStyle="round" borderColor="#334155" paddingY={1} paddingX={2}>
          <Box>
            <Text color="#94a3b8">Use </Text>
            <Text color="#38bdf8">↑↓</Text>
            <Text color="#94a3b8"> to navigate </Text>
            <Text color="#22c55e">Enter</Text>
            <Text color="#94a3b8"> to edit/select</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};
