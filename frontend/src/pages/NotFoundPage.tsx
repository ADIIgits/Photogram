import { Link } from "wouter";
import { Aperture } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-4">
      <Aperture className="w-16 h-16 mb-8 text-muted-foreground/40" />
      <p className="font-mono text-muted-foreground/60 text-sm uppercase tracking-widest mb-4">404</p>
      <h1 className="font-serif text-4xl mb-4">Frame not found</h1>
      <p className="text-muted-foreground max-w-sm mb-10">
        This photograph doesn't exist in our gallery, or the negative has been exposed.
      </p>
      <Link
        href="/"
        className="text-foreground border border-border px-8 py-3 font-mono uppercase tracking-widest text-xs hover:bg-muted/30 transition-colors"
      >
        Return to Gallery
      </Link>
    </div>
  );
}
