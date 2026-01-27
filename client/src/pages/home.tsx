import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, FileText, Search, Plus, Users, Calendar, Clock, AlertCircle, TrendingUp, BookOpen, GripVertical, Settings2 } from "lucide-react";
import { Link } from "wouter";
import { type Office } from "@shared/schema";
import { getHealthStatusInfo } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  nextVisitDate: string;
}

const DEFAULT_WIDGET_ORDER = ["stats", "activity", "quickActions", "reminders", "health"];

interface SortableWidgetProps {
  id: string;
  isEditMode: boolean;
  children: React.ReactNode;
}

function SortableWidget({ id, isEditMode, children }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!isEditMode) {
    return <div>{children}</div>;
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-md bg-muted cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        data-testid={`drag-handle-${id}`}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="ring-2 ring-primary/20 ring-offset-2 rounded-lg">
        {children}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditMode, setIsEditMode] = useState(false);
  const [widgetOrder, setWidgetOrder] = useState<string[]>(DEFAULT_WIDGET_ORDER);

  useEffect(() => {
    if (user?.dashboardLayout && Array.isArray(user.dashboardLayout)) {
      setWidgetOrder(user.dashboardLayout as string[]);
    }
  }, [user?.dashboardLayout]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const saveLayoutMutation = useMutation({
    mutationFn: async (layout: string[]) => {
      return await apiRequest("/api/user/dashboard-layout", "PUT", { layout });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "レイアウトを保存しました" });
    },
    onError: () => {
      toast({ title: "レイアウトの保存に失敗しました", variant: "destructive" });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setWidgetOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        saveLayoutMutation.mutate(newOrder);
        return newOrder;
      });
    }
  };

  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const { data: offices = [], isLoading } = useQuery<Office[]>({
    queryKey: ["/api/offices"],
  });

  const { data: activitySummary, isLoading: activityLoading } = useQuery<ActivitySummary>({
    queryKey: ["/api/dashboard/activity-summary"],
    refetchInterval: 60000,
  });

  const { data: healthSnapshot = [], isLoading: healthLoading } = useQuery<HealthSnapshot[]>({
    queryKey: ["/api/dashboard/health-snapshot"],
    refetchInterval: 300000,
  });

  const { data: visitReminders = [], isLoading: remindersLoading } = useQuery<VisitReminder[]>({
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
    const statusInfo = getHealthStatusInfo(status);
    return (
      <Badge variant="outline" className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  const renderWidget = (widgetId: string) => {
    switch (widgetId) {
      case "stats":
        return (
          <div className="grid gap-4 md:grid-cols-4" data-testid="widget-stats">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  {(stat.label === "総事業所数" || stat.label === "関与先") && isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (stat.label === "今週の訪問") && activityLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (stat.label === "要フォロー") && healthLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold" data-testid={`stat-${stat.label}`}>{stat.value}</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case "activity":
        return (
          <Card data-testid="widget-activity">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                活動サマリー（今週）
              </CardTitle>
              {activityLoading ? (
                <Skeleton className="h-4 w-48" />
              ) : activitySummary ? (
                <CardDescription>
                  {activitySummary.startDate} 〜 {activitySummary.endDate}
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Skeleton className="h-4 w-16 mb-2" />
                    <Skeleton className="h-9 w-20" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </div>
              ) : activitySummary ? (
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
              ) : (
                <p className="text-sm text-muted-foreground">データがありません</p>
              )}
            </CardContent>
          </Card>
        );

      case "quickActions":
        return (
          <Card data-testid="widget-quickActions">
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
        );

      case "reminders":
        return (
          <Card data-testid="widget-reminders">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>訪問予定リマインダー</CardTitle>
                  <CardDescription>次回訪問予定日が設定されている事業所（直近10件）</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild data-testid="button-view-all-reminders">
                  <Link href="/visit-reminders">
                    すべて表示
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {remindersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                  ))}
                </div>
              ) : visitReminders.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  訪問予定はありません
                </div>
              ) : (
                <div className="space-y-3">
                  {visitReminders.map((reminder) => (
                    <Link key={reminder.karteId} href={`/office/${reminder.officeId}/karte/${reminder.karteId}`}>
                      <div className="border-b pb-3 last:border-0 hover-elevate rounded p-2" data-testid={`visit-reminder-${reminder.officeId}`}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium flex-1" data-testid={`reminder-office-${reminder.officeId}`}>
                            {reminder.officeName}
                          </p>
                          <Badge variant="outline" className="text-xs" data-testid={`reminder-date-${reminder.officeId}`}>
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(reminder.nextVisitDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' })}
                          </Badge>
                        </div>
                        {reminder.nextAction && (
                          <p className="text-xs text-muted-foreground mt-1" data-testid={`reminder-action-${reminder.officeId}`}>
                            {reminder.nextAction}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case "health":
        return (
          <Card data-testid="widget-health">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>関与先健全性スナップショット</CardTitle>
                  <CardDescription>最終訪問日からの経過に基づく状態表示</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild data-testid="button-view-all-health">
                  <Link href="/health-snapshot">
                    すべて表示
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {healthLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-56" />
                      </div>
                      <Skeleton className="h-5 w-16" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {healthSnapshot.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      データがありません
                    </div>
                  ) : healthSnapshot.filter(h => h.status !== 'healthy').length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      すべての関与先が健全な状態です
                    </div>
                  ) : (
                    healthSnapshot
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
                      ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  const isHalfWidthWidget = (widgetId: string) => {
    return widgetId === "quickActions" || widgetId === "reminders";
  };

  const renderWidgets = () => {
    const result: React.ReactNode[] = [];
    let i = 0;

    while (i < widgetOrder.length) {
      const currentWidget = widgetOrder[i];
      const nextWidget = widgetOrder[i + 1];

      if (isHalfWidthWidget(currentWidget) && nextWidget && isHalfWidthWidget(nextWidget)) {
        result.push(
          <div key={`pair-${i}`} className="grid gap-6 md:grid-cols-2">
            <SortableWidget id={currentWidget} isEditMode={isEditMode}>
              {renderWidget(currentWidget)}
            </SortableWidget>
            <SortableWidget id={nextWidget} isEditMode={isEditMode}>
              {renderWidget(nextWidget)}
            </SortableWidget>
          </div>
        );
        i += 2;
      } else {
        result.push(
          <SortableWidget key={currentWidget} id={currentWidget} isEditMode={isEditMode}>
            {renderWidget(currentWidget)}
          </SortableWidget>
        );
        i += 1;
      }
    }

    return result;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">ホーム</h1>
          <p className="text-sm text-muted-foreground">顧客管理システムダッシュボード</p>
        </div>
        <Button
          variant={isEditMode ? "default" : "outline"}
          size="sm"
          onClick={handleToggleEditMode}
          data-testid="button-toggle-edit-mode"
        >
          <Settings2 className="h-4 w-4 mr-2" />
          {isEditMode ? "編集完了" : "レイアウト編集"}
        </Button>
      </div>

      {isEditMode && (
        <div className="bg-muted/50 border border-dashed rounded-lg p-3 text-sm text-muted-foreground">
          ウィジェットをドラッグして並べ替えることができます。変更は自動的に保存されます。
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={widgetOrder} strategy={verticalListSortingStrategy}>
          <div className="space-y-6">
            {renderWidgets()}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
