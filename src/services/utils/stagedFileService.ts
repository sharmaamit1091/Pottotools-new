/**
 * Staged file service for seamless file transfer from Potto Magic Desk
 * into individual tool workspaces without requiring double uploads.
 */

let stagedFile: File | null = null;
const listeners = new Set<(file: File | null) => void>();

export const stageFileForTool = (file: File | null) => {
  stagedFile = file;
  listeners.forEach((listener) => listener(file));
};

export const getStagedFileForTool = (): File | null => {
  return stagedFile;
};

export const consumeStagedFileForTool = (): File | null => {
  const current = stagedFile;
  stagedFile = null;
  listeners.forEach((listener) => listener(null));
  return current;
};

export const clearStagedFileForTool = () => {
  stagedFile = null;
  listeners.forEach((listener) => listener(null));
};

export const subscribeToStagedFile = (listener: (file: File | null) => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
