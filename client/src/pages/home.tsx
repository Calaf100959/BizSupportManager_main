import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, FileText, Search, Plus, TrendingUp, Users, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  //todo: remove mock functionality
  const stats = [
    { label: "総事業所数", value: "156", icon: Building2, color: "text-primary" },
    { label: "関与先", value: "89", icon: Users, color: "text-chart-2" },
    { label: "今月の支援", value: "23", icon: FileText, color: "text-chart-3" },
  ];

  //todo: remove mock functionality
  const recentActivities = [
    { office: "株式会社山田商店", action: "経営カルテ更新", date: "2024-01-15", user: "山田太郎" },
    { office: "田中工業株式会社", action: "新規登録", date: "2024-01-14", user: "佐藤花子" },
    { office: "鈴木製作所", action: "個人情報追加", date: "2024-01-14", user: "山田太郎" },
  ];

  //todo: remove mock functionality
  const notifications = [
    { type: "warning", message: "契約満了予定：株式会社山田商店（2週間後）" },
    { type: "info", message: "新規事業所登録が3件あります" },
  ];

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
            <CardTitle>通知</CardTitle>
            <CardDescription>重要なお知らせ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.map((notif, idx) => (
              <div key={idx} className="flex items-start gap-3" data-testid={`notification-${idx}`}>
                <AlertCircle className={`h-4 w-4 mt-0.5 ${notif.type === 'warning' ? 'text-chart-3' : 'text-primary'}`} />
                <p className="text-sm">{notif.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>最近の活動</CardTitle>
          <CardDescription>システム内の最新の更新履歴</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivities.map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between border-b pb-3 last:border-0" data-testid={`activity-${idx}`}>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{activity.office}</p>
                  <p className="text-xs text-muted-foreground">{activity.action}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{activity.date}</p>
                  <p className="text-xs text-muted-foreground">{activity.user}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
