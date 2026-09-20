/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#FAFAFA',
    tint: '#00AAFF',
    background: '#06070A',
    foreground: '#FAFAFA',
    card: '#0D1016',
    cardForeground: '#FAFAFA',
    primary: '#00AAFF',
    primaryForeground: '#000000',
    secondary: '#1A1E28',
    secondaryForeground: '#FAFAFA',
    muted: '#151922',
    mutedForeground: '#9DA5B4',
    accent: '#151922',
    accentForeground: '#FAFAFA',
    destructive: '#EF4444',
    destructiveForeground: '#FAFAFA',
    success: '#10B981',
    warning: '#F59E0B',
    border: '#1F2530',
    input: '#1A1E28',
  },
  radius: 8,
};

export default colors;
