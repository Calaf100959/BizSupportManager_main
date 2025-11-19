import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Building2 } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface VisitReminder {
  officeId: string;
  officeName: string;
  karteId: string;
  karteTitle: string;
  visitDate: string;
  nextAction: string;
  nextVisitDate: string;
}

export default function VisitRemindersPage() {
  const { data: reminders = [], isLoading } = useQuery<VisitReminder[]>({
    queryKey: ["/api/dashboard/visit-reminders?all=true"],
  });

  // Set page title and meta tags for SEO
  useEffect(() => {
    document.title = "訪問予定リマインダー | 顧客管理システム";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', '今後予定されている全ての訪問予定を一覧表示します。事業所ごとの次回訪問予定日と次回アクションを確認できます。');
    }
    
    // Open Graph tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', '訪問予定リマインダー | 顧客管理システム');
    
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', '今後予定されている全ての訪問予定を一覧表示します。事業所ごとの次回訪問予定日と次回アクションを確認できます。');
  }, []);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'M月d日(E)', { locale: ja });
    } catch {
      return dateString;
    }
  };

  const getDaysUntil = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "今日";
    if (diffDays === 1) return "明日";
    if (diffDays < 0) return `${Math.abs(diffDays)}日遅延`;
    return `${diffDays}日後`;
  };

  const getUrgencyBadgeClass = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
    if (diffDays === 0) return "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300";
    if (diffDays <= 3) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300";
    if (diffDays <= 7) return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild data-testid="button-back">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">訪問予定リマインダー</h1>
          <p className="text-sm text-muted-foreground">今後予定されている訪問の一覧</p>
        </div>
      </div>

      <Card data-testid="card-reminders-list">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            訪問予定一覧
            <Badge variant="secondary" className="ml-2" data-testid="badge-total-count">
              {reminders.length}件
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between border-b pb-3">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          ) : reminders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-reminders">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>訪問予定はありません</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reminders.map((reminder) => (
                <Link 
                  key={reminder.karteId} 
                  href={`/office/${reminder.officeId}/karte/${reminder.karteId}`}
                  data-testid={`link-reminder-${reminder.officeId}`}
                >
                  <div 
                    className="flex items-center justify-between border rounded-md p-4 hover-elevate" 
                    data-testid={`reminder-item-${reminder.officeId}`}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium" data-testid={`reminder-office-${reminder.officeId}`}>
                          {reminder.officeName}
                        </p>
                      </div>
                      <div className="ml-6 space-y-1">
                        <p className="text-xs text-muted-foreground" data-testid={`reminder-title-${reminder.officeId}`}>
                          {reminder.karteTitle}
                        </p>
                        {reminder.nextAction && (
                          <p className="text-xs" data-testid={`reminder-action-${reminder.officeId}`}>
                            次回アクション: {reminder.nextAction}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-medium" data-testid={`reminder-date-${reminder.officeId}`}>
                        {formatDate(reminder.nextVisitDate)}
                      </p>
                      <Badge 
                        variant="outline" 
                        className={getUrgencyBadgeClass(reminder.nextVisitDate)}
                        data-testid={`reminder-urgency-${reminder.officeId}`}
                      >
                        {getDaysUntil(reminder.nextVisitDate)}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
