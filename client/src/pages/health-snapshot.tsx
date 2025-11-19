import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building2 } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { getHealthStatusInfo } from "@/lib/utils";

interface HealthSnapshot {
  officeId: string;
  officeName: string;
  engagementType: string;
  lastVisitDate: string | null;
  daysSinceVisit: number | null;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
}

export default function HealthSnapshotPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: healthSnapshot = [], isLoading } = useQuery<HealthSnapshot[]>({
    queryKey: ["/api/dashboard/health-snapshot"],
  });

  // Set page title and meta description for SEO
  useEffect(() => {
    document.title = "関与先健全性スナップショット | 顧客管理システム";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', '最終訪問日からの経過に基づく関与先の状態を一覧表示し、要対応・注意・健全な事業所をステータスでフィルタリングできます。');
    }
  }, []);

  const getStatusBadge = (status: string) => {
    const statusInfo = getHealthStatusInfo(status);
    return (
      <Badge variant="outline" className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  const filteredSnapshot = statusFilter === "all" 
    ? healthSnapshot 
    : healthSnapshot.filter(h => h.status === statusFilter);

  const stats = {
    total: healthSnapshot.length,
    healthy: healthSnapshot.filter(h => h.status === 'healthy').length,
    warning: healthSnapshot.filter(h => h.status === 'warning').length,
    critical: healthSnapshot.filter(h => h.status === 'critical').length,
    unknown: healthSnapshot.filter(h => h.status === 'unknown').length,
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
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">関与先健全性スナップショット</h1>
          <p className="text-sm text-muted-foreground">最終訪問日からの経過に基づく関与先の状態一覧</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card data-testid="card-stat-total">
          <CardHeader className="pb-3">
            <CardDescription>総事業所数</CardDescription>
            <CardTitle className="text-3xl" data-testid="stat-total">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card data-testid="card-stat-healthy">
          <CardHeader className="pb-3">
            <CardDescription>健全</CardDescription>
            <CardTitle className="text-3xl text-green-600 dark:text-green-400" data-testid="stat-healthy">{stats.healthy}</CardTitle>
          </CardHeader>
        </Card>
        <Card data-testid="card-stat-warning">
          <CardHeader className="pb-3">
            <CardDescription>注意</CardDescription>
            <CardTitle className="text-3xl text-yellow-600 dark:text-yellow-400" data-testid="stat-warning">{stats.warning}</CardTitle>
          </CardHeader>
        </Card>
        <Card data-testid="card-stat-critical">
          <CardHeader className="pb-3">
            <CardDescription>要対応</CardDescription>
            <CardTitle className="text-3xl text-red-600 dark:text-red-400" data-testid="stat-critical">{stats.critical}</CardTitle>
          </CardHeader>
        </Card>
        <Card data-testid="card-stat-unknown">
          <CardHeader className="pb-3">
            <CardDescription>不明</CardDescription>
            <CardTitle className="text-3xl text-muted-foreground" data-testid="stat-unknown">{stats.unknown}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Card data-testid="card-offices-list">
        <CardHeader>
          <CardTitle>事業所一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="grid w-full grid-cols-5" data-testid="tabs-status-filter">
              <TabsTrigger value="all" data-testid="tab-all">すべて</TabsTrigger>
              <TabsTrigger value="healthy" data-testid="tab-healthy">健全</TabsTrigger>
              <TabsTrigger value="warning" data-testid="tab-warning">注意</TabsTrigger>
              <TabsTrigger value="critical" data-testid="tab-critical">要対応</TabsTrigger>
              <TabsTrigger value="unknown" data-testid="tab-unknown">不明</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-6" data-testid="tab-content-all">
              {renderOfficeList(isLoading, filteredSnapshot, getStatusBadge)}
            </TabsContent>
            
            <TabsContent value="healthy" className="mt-6" data-testid="tab-content-healthy">
              {renderOfficeList(isLoading, filteredSnapshot, getStatusBadge)}
            </TabsContent>
            
            <TabsContent value="warning" className="mt-6" data-testid="tab-content-warning">
              {renderOfficeList(isLoading, filteredSnapshot, getStatusBadge)}
            </TabsContent>
            
            <TabsContent value="critical" className="mt-6" data-testid="tab-content-critical">
              {renderOfficeList(isLoading, filteredSnapshot, getStatusBadge)}
            </TabsContent>
            
            <TabsContent value="unknown" className="mt-6" data-testid="tab-content-unknown">
              {renderOfficeList(isLoading, filteredSnapshot, getStatusBadge)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function renderOfficeList(
  isLoading: boolean, 
  filteredSnapshot: HealthSnapshot[], 
  getStatusBadge: (status: string) => JSX.Element
) {
  if (isLoading) {
    return (
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
    );
  }
  
  if (filteredSnapshot.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground" data-testid="text-no-offices">
        <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>該当する事業所がありません</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {filteredSnapshot.map((snapshot) => (
        <Link 
          key={snapshot.officeId} 
          href={`/office/${snapshot.officeId}/detail`}
          data-testid={`link-office-${snapshot.officeId}`}
        >
          <div 
            className="flex items-center justify-between border rounded-md p-4 hover-elevate" 
            data-testid={`health-item-${snapshot.officeId}`}
          >
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium" data-testid={`office-name-${snapshot.officeId}`}>
                  {snapshot.officeName}
                </p>
                <Badge variant="secondary" className="text-xs" data-testid={`engagement-type-${snapshot.officeId}`}>
                  {snapshot.engagementType}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground" data-testid={`visit-info-${snapshot.officeId}`}>
                {snapshot.lastVisitDate 
                  ? `最終訪問: ${snapshot.lastVisitDate} (${snapshot.daysSinceVisit}日前)`
                  : '訪問記録なし'}
              </p>
            </div>
            <div className="text-right" data-testid={`status-badge-${snapshot.officeId}`}>
              {getStatusBadge(snapshot.status)}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
