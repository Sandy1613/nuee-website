import { Link } from "wouter";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center pt-24">
      <div className="container-editorial text-center">
        <p className="eyebrow mb-6">404</p>
        <h1 className="font-display text-5xl sm:text-6xl mb-6">This table isn't set.</h1>
        <p className="text-ivory/55 mb-10 max-w-md mx-auto">
          The page you're looking for doesn't exist, or may have moved.
        </p>
        <Link href="/"><Button>Return Home</Button></Link>
      </div>
    </div>
  );
}
