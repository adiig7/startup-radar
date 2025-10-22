// Text utility functions for SignalScout

/**
 * Truncates text to a specified length with ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @param suffix - Suffix to add when truncated (default: "...")
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number, suffix: string = "..."): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength).trim() + suffix;
}

/**
 * Truncates text at word boundaries to avoid cutting words in half
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @param suffix - Suffix to add when truncated (default: "...")
 * @returns Truncated text at word boundary
 */
export function truncateAtWordBoundary(text: string, maxLength: number, suffix: string = "..."): string {
  if (!text || text.length <= maxLength) {
    return text;
  }

  // Find the last space within the limit
  const truncated = text.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  // If we found a space and it's not too close to the beginning, truncate there
  if (lastSpaceIndex > maxLength * 0.8) {
    return truncated.substring(0, lastSpaceIndex).trim() + suffix;
  }
  
  // Otherwise, just truncate at the character limit
  return truncated.trim() + suffix;
}

/**
 * Gets responsive character limits based on screen size
 * @param isMobile - Whether the device is mobile
 * @returns Object with character limits for different content types
 */
export function getResponsiveCharLimits(isMobile: boolean = false) {
  return {
    content: isMobile ? 200 : 400,
    title: isMobile ? 60 : 100,
    preview: isMobile ? 100 : 200,
  };
}

/**
 * Formats content for display with proper truncation
 * @param content - The content to format
 * @param maxLength - Maximum length (optional, uses responsive default)
 * @param isMobile - Whether the device is mobile
 * @returns Formatted content object with truncated text and metadata
 */
export function formatContentForDisplay(
  content: string, 
  maxLength?: number, 
  isMobile: boolean = false
) {
  const limits = getResponsiveCharLimits(isMobile);
  const limit = maxLength || limits.content;
  
  const isTruncated = content.length > limit;
  const truncatedContent = isTruncated 
    ? truncateAtWordBoundary(content, limit)
    : content;
  
  return {
    content: truncatedContent,
    originalContent: content,
    isTruncated,
    originalLength: content.length,
    truncatedLength: truncatedContent.length,
  };
}
