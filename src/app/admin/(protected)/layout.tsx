// This route group exists so files can be colocated under /admin/(protected).
// Auth is handled by the parent layout at src/app/admin/layout.tsx.
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
