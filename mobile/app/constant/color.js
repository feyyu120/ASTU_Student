// src/constants/colors.js

const COLORS = {
  // Primary brand color (main accent - used for buttons, highlights, icons)
  primary: "#16bd93",           // Your green from login/register

  // Secondary / supporting colors
  secondary: "#296d5c",         // Darker green for pressed states or accents
  accent: "#FFD700",            // Gold/yellow for special highlights (optional)

  // Backgrounds
  background: "#f8f9fa",        // Light gray - main screen background
  surface: "#ffffff",           // White cards, forms, headers
  surfaceDark: "#e8ecef",       // Slightly darker surface for contrast
  link: "#007bff",              // Blue for links and interactive text
  // Text colors
  textPrimary: "#333333",       // Main text (almost black)
  textSecondary: "#555555",     // Subtext, labels
  textTertiary: "#777777",      // Hints, dates, less important text
  textLight: "#999999",         // Very light text (placeholders)

  // Status / feedback colors
  success: "#16bd93",           // Green - success, posted, claimed
  error: "#d32f2f",             // Red - errors, delete
  warning: "#f57c00",           // Orange - pending, caution
  info: "#0288d1",              // Blue - info messages

  // Borders / dividers
  border: "#e0e0e0",            // Light gray borders
  divider: "#eeeeee",

  // Disabled / inactive
  disabled: "#cccccc",
  disabledText: "#999999",

  // Dark mode support (optional - add later)
  darkBackground: "#121212",
  darkSurface: "#1e1e1e",
  darkTextPrimary: "#ffffff",
};

export default COLORS;