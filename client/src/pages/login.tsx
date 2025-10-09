import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export default function LoginPage() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-10 w-10 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl">顧客管理システム</CardTitle>
            <CardDescription>中小企業診断士向け</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-center text-muted-foreground">
              顧客情報と支援履歴を効率的に管理
            </p>
            <Button onClick={handleLogin} className="w-full" data-testid="button-login">
              ログイン
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
