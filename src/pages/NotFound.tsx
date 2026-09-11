import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-display numeric text-6xl font-semibold">404</p>
      <h1 className="font-display mt-3 text-xl font-semibold">This page doesn't exist</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The page you were looking for isn't part of the tracker.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Back to dashboard</Link>
      </Button>
    </div>
  );
}
