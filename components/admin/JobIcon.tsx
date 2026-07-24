const PATHS: Record<string, string> = {
  droplet:
    '<path d="M12 3.5C12 3.5 5.5 11 5.5 15.2C5.5 18.7 8.4 21 12 21C15.6 21 18.5 18.7 18.5 15.2C18.5 11 12 3.5 12 3.5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
  shield:
    '<path d="M12 3L5.5 5.8V11C5.5 15.8 8.3 19.6 12 21C15.7 19.6 18.5 15.8 18.5 11V5.8L12 3Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
  layers:
    '<path d="M12 4L4.5 8.8L12 13.5L19.5 8.8L12 4Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M4.5 13L12 17.7L19.5 13" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
  sparkle: '<path d="M12 3L13.6 9.4L20 11L13.6 12.6L12 19L10.4 12.6L4 11L10.4 9.4L12 3Z" fill="currentColor"/>',
  sliders:
    '<line x1="4" y1="7" x2="20" y2="7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="14.5" cy="7" r="2.1" fill="#fff" stroke="currentColor" stroke-width="1.8"/><line x1="4" y1="17" x2="20" y2="17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="9.5" cy="17" r="2.1" fill="#fff" stroke="currentColor" stroke-width="1.8"/>',
};

export default function JobIcon({ name, className }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className || 'w-4 h-4'} fill="none" dangerouslySetInnerHTML={{ __html: PATHS[name] || '' }} />
  );
}
