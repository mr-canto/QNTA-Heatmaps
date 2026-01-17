import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Generates a vibrant background colour from a string (name or email).
 * Uses a simple hash function to ensure consistency across sessions.
 */
function generateColourFromString(str: string): string {
  const vibrantColours = [
    "#e91e63", // Pink
    "#9c27b0", // Purple
    "#673ab7", // Deep Purple
    "#3f51b5", // Indigo
    "#2196f3", // Blue
    "#00bcd4", // Cyan
    "#009688", // Teal
    "#4caf50", // Green
    "#8bc34a", // Light Green
    "#ff9800", // Orange
    "#ff5722", // Deep Orange
    "#795548", // Brown
    "#607d8b", // Blue Grey
  ];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }

  const index = Math.abs(hash) % vibrantColours.length;
  return vibrantColours[index];
}

/**
 * Extracts initials from a name or email.
 * - For names like "Victor Acquah", returns "VA"
 * - For emails like "victor@example.com", returns "V"
 */
function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  if (email) {
    const localPart = email.split("@")[0];
    return localPart.substring(0, 2).toUpperCase();
  }

  return "??";
}

const sizeClasses = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
};

export function UserAvatar({
  name,
  email,
  size = "md",
  className,
}: UserAvatarProps) {
  const initials = getInitials(name, email);
  const displayString = name || email || "User";
  const bgColour = generateColourFromString(displayString);

  return (
    <Avatar className={`${sizeClasses[size]} ${className || ""}`}>
      <AvatarFallback
        className="text-white font-medium"
        style={{ backgroundColor: bgColour }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
