// Each status maps to a display label, a CSS color, and a glow color.
// The var(--…) values come from your globals.css palette.
export const STATUS = {
  known:      { label: "Known",      color: "var(--status-known)",   glow: "var(--glow-known)" },
  to_contact: { label: "To contact", color: "var(--status-contact)", glow: "var(--glow-contact)" },
  avoid:      { label: "Avoid",      color: "var(--status-avoid)",   glow: "var(--glow-avoid)" },
  friend:     { label: "Friend",     color: "var(--status-friend)",  glow: "var(--glow-friend)" },
};

// A fixed order for showing the four statuses in the UI (objects have no guaranteed order).
export const STATUS_ORDER = ["known", "to_contact", "avoid", "friend"];

// Contact channel types (used later, in the detail popup & table).
export const CHANNELS = [
  { value: "whatsapp",  label: "WhatsApp" },
  { value: "sms",       label: "Text / SMS" },
  { value: "x",         label: "X" },
  { value: "instagram", label: "Instagram" },
  { value: "email",     label: "Email" },
  { value: "linkedin",  label: "LinkedIn" },
  { value: "discord",   label: "Discord" },
  { value: "other",     label: "Other" },
];

// Helper: turn a channel value like "whatsapp" into its label "WhatsApp".
export function channelLabel(value) {
  return CHANNELS.find((c) => c.value === value)?.label || value;
} 
