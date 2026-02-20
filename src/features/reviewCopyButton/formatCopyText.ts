/**
 * コピー用テキストをフォーマットする純粋関数
 */
export const formatCopyText = (fileName: string, lineNumber: string, comment: string): string => {
  const parts: string[] = [];

  if (fileName) {
    parts.push(`File: ${fileName}`);
  }

  if (lineNumber) {
    parts.push(`Line: ${lineNumber}`);
  }

  if (comment) {
    parts.push(`Comment:\n${comment}`);
  }

  return parts.join("\n");
};
