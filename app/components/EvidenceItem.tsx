export const EvidenceItem = ({ text, theme }: { text: string; theme: string }) => {
  const urlMatch = text.match(/\(Source:\s*(https?:\/\/[^\s)]+)\)/i);

  if (urlMatch) {
    const url = urlMatch[1];
    const textBeforeUrl = text.substring(0, urlMatch.index).trim();

    return (
      <li className={`${theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'} break-words`}>
        {textBeforeUrl}
        <div className="mt-1">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 text-xs font-medium underline hover:opacity-70 transition-opacity ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`}
          >
            🔗 View Source
          </a>
        </div>
      </li>
    );
  }

  return (
    <li className={`${theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'} break-words`}>
      {text}
    </li>
  );
}