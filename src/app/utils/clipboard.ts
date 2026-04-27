export const copyToClipboard = async (text: string): Promise<boolean> => {
  // Try modern Clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Clipboard API blocked, fall through to fallback
    }
  }

  // Fallback method using textarea
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);

    return successful;
  } catch (err) {
    console.error('Failed to copy text:', err);
    return false;
  }
};
