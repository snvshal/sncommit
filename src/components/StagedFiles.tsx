import React from "react";
import { Box, Text } from "ink";
import { GitFile } from "../types";

interface StagedFilesProps {
  files: GitFile[];
}

export const StagedFiles: React.FC<StagedFilesProps> = ({ files }) => {
  if (files.length === 0) {
    return (
      <Box
        borderStyle="round"
        borderColor="#f97316"
        paddingX={2}
        paddingY={1}
        marginBottom={1}
      >
        <Text color="#f97316">No staged files found</Text>
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
      marginBottom={1}
    >
      <Box marginBottom={1}>
        <Text bold color="#22d3ee">
          Staged Files
        </Text>
        <Text color="#64748b"> ({files.length})</Text>
      </Box>

      {files.slice(0, 6).map((file, index) => (
        <Box key={index} paddingLeft={1}>
          <Box width={2}>
            <Text color="#22c55e">•</Text>
          </Box>
          <Text color="#e2e8f0">{file.path}</Text>
        </Box>
      ))}

      {files.length > 6 && (
        <Box paddingLeft={1}>
          <Text color="#64748b">+{files.length - 6} more files</Text>
        </Box>
      )}
    </Box>
  );
};
