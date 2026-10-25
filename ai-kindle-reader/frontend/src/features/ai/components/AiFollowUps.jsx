import ReactMarkdown from 'react-markdown';

export function AiFollowUps({ followUps }) {
  if (!followUps || followUps.length === 0) return null;

  return (
    <>
      {followUps.map((item) => (
        <div
          key={item.id}
          className="bg-surface-container-lowest/80 backdrop-blur-sm rounded-xl p-4 border border-outline-variant/35 shadow-sm space-y-2 animate-in fade-in duration-200"
        >
          <p className="font-label-md text-label-md text-secondary font-semibold">
            Q: {item.question}
          </p>
          {item.isStreaming && !item.answer && (
            <div className="flex items-center gap-2 text-xs text-on-surface-variant animate-pulse py-1">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span>Thinking…</span>
            </div>
          )}
          {item.error ? (
            <p className="text-xs text-error">{item.error}</p>
          ) : item.answer ? (
            <div className="text-[13.5px] leading-[22px] text-on-surface font-body-ui space-y-2">
              <ReactMarkdown
                components={{
                  li: ({ children }) => (
                    <div className="flex items-start gap-2 my-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0 mt-2"></span>
                      <div className="flex-1">{children}</div>
                    </div>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-body-ui-bold text-primary">{children}</strong>
                  ),
                }}
              >
                {item.answer}
              </ReactMarkdown>
              {item.isStreaming && (
                <span className="inline-block w-[2px] h-3.5 bg-secondary ml-1 cursor-pulse align-middle" />
              )}
            </div>
          ) : null}
        </div>
      ))}
    </>
  );
}
