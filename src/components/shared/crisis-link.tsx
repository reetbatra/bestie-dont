export function CrisisLink({ className = "" }: { className?: string }) {
  return (
    <a
      href="https://findahelpline.com"
      target="_blank"
      rel="noopener noreferrer"
      className={`block text-xs text-muted-foreground underline underline-offset-4 ${className}`}
    >
      Need more than an app?
    </a>
  );
}
