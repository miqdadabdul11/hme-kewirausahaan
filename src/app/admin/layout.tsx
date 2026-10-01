// Root admin layout — plain passthrough, NO auth check here.
// Auth is handled by src/app/admin/(protected)/layout.tsx
// so that /admin/login is NOT blocked by a redirect loop.
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
