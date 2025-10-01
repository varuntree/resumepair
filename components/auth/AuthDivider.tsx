/**
 * AuthDivider Component
 *
 * Simple visual divider with "or" text between authentication methods.
 * Used to separate Google OAuth and email/password login options.
 */
export function AuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border"></div>
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="bg-background px-4 text-muted-foreground">or</span>
      </div>
    </div>
  )
}
