import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, FileText, Search, Plus, Users } from "lucide-react";
import { Link } from "wouter";
import { type Office } from "@shared/schema";

export default function HomePage() {
  const { data: offices = [], isLoading } = useQuery<Office[]>({
    queryKey: ["/api/offices"],
  });

  const activeOffices = offices.filter(o => o.engagementType === "active");

  const stats = [
    { label: "総事業所数", value: isLoading ? "-" : offices.length.toString(), icon: Building2, color: "text-primary" },
    { label: "関与先", value: isLoading ? "-" : activeOffices.length.toString(), icon: Users, color: "text-chart-2" },
    { label: "登録済", value: isLoading ? "-" : offices.length.toString(), icon: FileText, color: "text-chart-3" },
  ];

  const recentOffices = offices.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">ホーム</h1>
        <p className="text-sm text-muted-foreground">顧客管理システムダッシュボード</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`stat-${stat.label}`}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>クイックアクション</CardTitle>
            <CardDescription>よく使う機能へのショートカット</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button variant="outline" className="justify-start" asChild data-testid="button-new-office">
              <Link href="/office/new">
                <Plus className="mr-2 h-4 w-4" />
                新規事業所登録
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild data-testid="button-search-office">
              <Link href="/search">
                <Search className="mr-2 h-4 w-4" />
                事業所検索
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild data-testid="button-new-karte">
              <Link href="/karte">
                <FileText className="mr-2 h-4 w-4" />
                経営カルテ作成
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>最近登録された事業所</CardTitle>
            <CardDescription>直近5件の事業所</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">読み込み中...</div>
            ) : recentOffices.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                事業所が登録されていません
              </div>
            ) : (
              <div className="space-y-3">
                {recentOffices.map((office) => (
                  <Link key={office.id} href={`/office/${office.id}`}>
                    <div className="flex items-center justify-between border-b pb-3 last:border-0 hover-elevate rounded p-2" data-testid={`recent-office-${office.code}`}>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{office.name}</p>
                        <p className="text-xs text-muted-foreground">{office.code}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{office.representativeName || "-"}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
