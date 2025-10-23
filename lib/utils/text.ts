export const truncateText = (text: string, maxLength: number, suffix: string = "..."): string => {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength).trim() + suffix;
}

// Truncates text at word boundaries to avoid cutting words in half
export const truncateAtWordBoundary = (text: string, maxLength: number, suffix: string = "..."): string => {
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
  
  return truncated.trim() + suffix;
}

export const getResponsiveCharLimits = (isMobile: boolean = false) => {
  return {
    content: isMobile ? 200 : 400,
    title: isMobile ? 60 : 100,
    preview: isMobile ? 100 : 200,
  };
}

export const formatContentForDisplay = (
  content: string, 
  maxLength?: number, 
  isMobile: boolean = false
): {
  content: string;
  originalContent: string;
  isTruncated: boolean;
  originalLength: number;
  truncatedLength: number;
} => {
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
