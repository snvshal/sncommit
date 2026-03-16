import React from "react";
import { Box, Text } from "ink";
import { GitFile } from "../types";
import { colors } from "../theme/colors";

interface StagedFilesProps {
  files: GitFile[];
}

export const StagedFiles: React.FC<StagedFilesProps> = ({ files }) => {
  if (files.length === 0) {
    return (
      <Box
        borderStyle="round"
        borderColor={colors.border.warning}
        paddingX={2}
        paddingY={1}
        marginBottom={1}
      >
        <Text color={colors.warning}>No staged files found</Text>
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
      marginBottom={1}
    >
      <Box marginBottom={1}>
        <Text bold color={colors.primary}>
          Staged Files
        </Text>
        <Text color={colors.text.muted}> ({files.length})</Text>
      </Box>

      {files.slice(0, 6).map((file, index) => (
        <Box key={index} paddingLeft={1}>
          <Box width={2}>
            <Text color={colors.accent}>•</Text>
          </Box>
          <Text color={colors.text.primary}>{file.path}</Text>
        </Box>
      ))}

      {files.length > 6 && (
        <Box paddingLeft={1}>
          <Text color={colors.text.muted}>+{files.length - 6} more files</Text>
        </Box>
      )}
    </Box>
  );
};
