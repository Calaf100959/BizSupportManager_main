import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-lg bg-muted">
          <Building2 className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">404</h1>
          <p className="text-xl font-semibold">ページが見つかりません</p>
          <p className="text-muted-foreground">お探しのページは存在しないか、移動された可能性があります</p>
        </div>
        <Button asChild data-testid="button-home">
          <Link href="/">ホームに戻る</Link>
        </Button>
      </div>
    </div>
  );
}
