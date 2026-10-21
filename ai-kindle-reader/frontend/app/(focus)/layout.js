// Full-screen routes (reader, book detail, drawers): no app chrome.
export default function FocusLayout({ children }) {
  return <div className="min-h-dvh bg-background">{children}</div>;
}
