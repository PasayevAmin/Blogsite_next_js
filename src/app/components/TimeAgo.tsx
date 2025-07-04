import { useMemo } from "react";

export default function timeAgo(dateString: string | Date) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = (now.getTime() - date.getTime()) / 1000; // saniyə fərqi

  if (diff < 60) return "bir neçə saniyə əvvəl";
  if (diff < 3600) return `${Math.floor(diff / 60)} dəqiqə əvvəl`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat əvvəl`;
  if (diff < 172800) return "dünən";
  if (diff < 604800) return `${Math.floor(diff / 86400)} gün əvvəl`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)} həftə əvvəl`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} ay əvvəl`;
  return `${Math.floor(diff / 31536000)} il əvvəl`;
}
