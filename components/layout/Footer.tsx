import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-app-border bg-app-background">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Links */}
          <nav className="flex gap-6 text-sm">
            <Link
              href="/tos"
              className="text-app-foreground/60 hover:text-app-foreground transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy-policy"
              className="text-app-foreground/60 hover:text-app-foreground transition-colors"
            >
              Privacy
            </Link>
            <a
              href="mailto:support@resumepair.com"
              className="text-app-foreground/60 hover:text-app-foreground transition-colors"
            >
              Support
            </a>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-app-foreground/50">
            © {currentYear} ResumePair. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}