import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, FileText, Search, Plus, Users, Calendar, Clock, AlertCircle, TrendingUp, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { type Office } from "@shared/schema";

interface ActivitySummary {
  period: string;
  visitCount: number;
  totalHours: string;
  startDate: string;
  endDate: string;
}

interface HealthSnapshot {
  officeId: string;
  officeName: string;
  engagementType: string;
  lastVisitDate: string | null;
  daysSinceVisit: number | null;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
}

interface VisitReminder {
  officeId: string;
  officeName: string;
  karteId: string;
  karteTitle: string;
  visitDate: string;
  nextAction: string;
}

export default function HomePage() {
  const { data: offices = [], isLoading } = useQuery<Office[]>({
    queryKey: ["/api/offices"],
  });

  const { data: activitySummary } = useQuery<ActivitySummary>({
    queryKey: ["/api/dashboard/activity-summary"],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: healthSnapshot = [] } = useQuery<HealthSnapshot[]>({
    queryKey: ["/api/dashboard/health-snapshot"],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const { data: visitReminders = [] } = useQuery<VisitReminder[]>({
    queryKey: ["/api/dashboard/visit-reminders"],
    refetchInterval: 300000,
  });

  const activeOffices = offices.filter(o => o.engagementType === "active");
  const criticalOffices = healthSnapshot.filter(h => h.status === 'critical').length;
  const warningOffices = healthSnapshot.filter(h => h.status === 'warning').length;

  const stats = [
    { label: "総事業所数", value: isLoading ? "-" : offices.length.toString(), icon: Building2, color: "text-primary" },
    { label: "関与先", value: isLoading ? "-" : activeOffices.length.toString(), icon: Users, color: "text-chart-2" },
    { label: "今週の訪問", value: activitySummary ? activitySummary.visitCount.toString() : "-", icon: TrendingUp, color: "text-chart-3" },
    { label: "要フォロー", value: (criticalOffices + warningOffices).toString(), icon: AlertCircle, color: "text-destructive" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">健全</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">注意</Badge>;
      case 'critical':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">要対応</Badge>;
      default:
        return <Badge variant="outline">不明</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">ホーム</h1>
        <p className="text-sm text-muted-foreground">顧客管理システムダッシュボード</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
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

      {/* Activity Summary */}
      {activitySummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              活動サマリー（今週）
            </CardTitle>
            <CardDescription>
              {activitySummary.startDate} 〜 {activitySummary.endDate}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">訪問件数</p>
                <p className="text-3xl font-bold">{activitySummary.visitCount}件</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">総活動時間</p>
                <p className="text-3xl font-bold">{activitySummary.totalHours}時間</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
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
            <Button variant="outline" className="justify-start" asChild data-testid="button-new-worklog">
              <Link href="/worklog">
                <Calendar className="mr-2 h-4 w-4" />
                業務日誌記録
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild data-testid="button-subsidy-programs">
              <Link href="/subsidy-programs">
                <BookOpen className="mr-2 h-4 w-4" />
                補助金管理
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Visit Reminders */}
        <Card>
          <CardHeader>
            <CardTitle>訪問予定アラート</CardTitle>
            <CardDescription>次回アクションが設定されている事業所</CardDescription>
          </CardHeader>
          <CardContent>
            {visitReminders.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                予定はありません
              </div>
            ) : (
              <div className="space-y-3">
                {visitReminders.slice(0, 5).map((reminder) => (
                  <Link key={reminder.karteId} href={`/office/${reminder.officeId}/karte/${reminder.karteId}`}>
                    <div className="border-b pb-3 last:border-0 hover-elevate rounded p-2" data-testid={`visit-reminder-${reminder.officeId}`}>
                      <p className="text-sm font-medium">{reminder.officeName}</p>
                      <p className="text-xs text-muted-foreground mt-1">{reminder.nextAction}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Health Snapshot */}
      <Card>
        <CardHeader>
          <CardTitle>関与先健全性スナップショット</CardTitle>
          <CardDescription>最終訪問日からの経過に基づく状態表示</CardDescription>
        </CardHeader>
        <CardContent>
          {healthSnapshot.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              データがありません
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {healthSnapshot
                .filter(h => h.status !== 'healthy')
                .slice(0, 10)
                .map((snapshot) => (
                  <Link key={snapshot.officeId} href={`/office/${snapshot.officeId}`}>
                    <div className="flex items-center justify-between border-b pb-3 last:border-0 hover-elevate rounded p-2" data-testid={`health-snapshot-${snapshot.officeId}`}>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{snapshot.officeName}</p>
                        <p className="text-xs text-muted-foreground">
                          {snapshot.lastVisitDate 
                            ? `最終訪問: ${snapshot.lastVisitDate} (${snapshot.daysSinceVisit}日前)`
                            : '訪問記録なし'}
                        </p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(snapshot.status)}
                      </div>
                    </div>
                  </Link>
                ))}
              {healthSnapshot.filter(h => h.status !== 'healthy').length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  すべての関与先が健全な状態です
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
