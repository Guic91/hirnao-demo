/** True when no backend API URL is configured (Netlify / GitHub Pages static deploy). */
export function isClientDemoMode(): boolean {
  if (process.env.NEXT_PUBLIC_API_URL) return false;
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "false") return false;
  return true;
}
