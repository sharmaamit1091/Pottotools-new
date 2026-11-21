export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateFile(
  file: File,
  acceptedExtensions: string[],
  maxSizeMB: number
): ValidationResult {
  if (!file) {
    return { isValid: false, error: 'No file selected.' };
  }

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      isValid: false,
      error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is ${maxSizeMB} MB.`,
    };
  }

  if (file.size === 0) {
    return { isValid: false, error: 'The selected file is empty (0 bytes).' };
  }

  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  const matches = acceptedExtensions.some((ext) => {
    const cleanExt = ext.toLowerCase();
    if (cleanExt.startsWith('.')) {
      return fileName.endsWith(cleanExt);
    }
    return fileType.includes(cleanExt);
  });

  if (!matches) {
    return {
      isValid: false,
      error: `Unsupported file type "${file.name}". Supported formats: ${acceptedExtensions.join(', ')}`,
    };
  }

  return { isValid: true };
}
