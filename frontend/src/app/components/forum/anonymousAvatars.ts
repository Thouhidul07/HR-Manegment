const anonymousAvatarEmojis: Record<string, string> = {
  Panda: "🐼",
  Koala: "🐨",
  Fox: "🦊",
  Owl: "🦉",
  Dolphin: "🐬",
  Bear: "🐻",
  Tiger: "🐯",
  Rabbit: "🐰",
};

export function getAnonymousAvatarEmoji(name: string) {
  const alias = name.replace(/^Anonymous\s+/i, "").split(/\s+/)[0];
  return anonymousAvatarEmojis[alias] || "🙂";
}
