import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft, RefreshCw, TrendingUp, TrendingDown, Minus, Calculator } from "lucide-react";
import type { FinancialPeriod, FinancialMetric, FinancialCashflow } from "@shared/schema";

export default function FinancialAnalysisPage() {
  const { officeId, periodId } = useParams<{ officeId: string; periodId: string }>();
  const { toast } = useToast();
  
  const { data: period } = useQuery<FinancialPeriod>({
    queryKey: ['/api/financial-periods', periodId],
  });
  
  const { data: metrics, isLoading: metricsLoading } = useQuery<FinancialMetric | null>({
    queryKey: ['/api/financial-periods', periodId, 'metrics'],
  });
  
  const { data: cashflow, isLoading: cashflowLoading } = useQuery<FinancialCashflow | null>({
    queryKey: ['/api/financial-periods', periodId, 'cashflow'],
  });
  
  const calculateMetricsMutation = useMutation({
    mutationFn: () => apiRequest(`/api/financial-periods/${periodId}/calculate-metrics`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/financial-periods', periodId, 'metrics'] });
      toast({ title: "財務指標を計算しました" });
    },
    onError: () => {
      toast({ title: "計算に失敗しました", variant: "destructive" });
    },
  });
  
  const calculateCashflowMutation = useMutation({
    mutationFn: () => apiRequest(`/api/financial-periods/${periodId}/calculate-cashflow`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/financial-periods', periodId, 'cashflow'] });
      toast({ title: "キャッシュフローを計算しました" });
    },
    onError: () => {
      toast({ title: "計算に失敗しました", variant: "destructive" });
    },
  });
  
  const handleRecalculate = () => {
    calculateMetricsMutation.mutate();
    calculateCashflowMutation.mutate();
  };
  
  const formatYen = (value: number | null | undefined) => {
    if (value == null) return '-';
    return new Intl.NumberFormat('ja-JP').format(value);
  };
  
  const formatPercent = (value: number | null | undefined) => {
    if (value == null) return '-';
    return (value / 100).toFixed(2) + '%';
  };
  
  const formatRatio = (value: number | null | undefined) => {
    if (value == null) return '-';
    return (value / 10000).toFixed(2) + '倍';
  };
  
  const getTrendIcon = (value: number | null | undefined) => {
    if (value == null || value === 0) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };
  
  const cf = cashflow as any;
  const m = metrics as any;
  
  const isLoading = metricsLoading || cashflowLoading;
  const isCalculating = calculateMetricsMutation.isPending || calculateCashflowMutation.isPending;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/office/${officeId}/financials`}>
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">財務分析</h1>
          {period && <p className="text-sm text-muted-foreground">{period.periodName}</p>}
        </div>
        <Button onClick={handleRecalculate} disabled={isCalculating} data-testid="button-recalculate">
          {isCalculating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
          再計算
        </Button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">読み込み中...</div>
      ) : !metrics ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Calculator className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>財務指標がまだ計算されていません</p>
            <p className="text-sm mb-4">PL/BSデータを入力後、「再計算」ボタンをクリックしてください</p>
            <Button onClick={handleRecalculate} disabled={isCalculating}>
              財務指標を計算
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">売上高</CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <div className="text-xl font-semibold" data-testid="text-revenue">
                  ¥{formatYen(m?.revenue)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">営業利益</CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-semibold" data-testid="text-operating-profit">
                    ¥{formatYen(m?.operatingProfit)}
                  </span>
                  {getTrendIcon(m?.operatingProfit)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">経常利益</CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-semibold" data-testid="text-ordinary-profit">
                    ¥{formatYen(m?.ordinaryProfit)}
                  </span>
                  {getTrendIcon(m?.ordinaryProfit)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">当期純利益</CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-semibold" data-testid="text-net-income">
                    ¥{formatYen(m?.netIncome)}
                  </span>
                  {getTrendIcon(m?.netIncome)}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">収益性指標</CardTitle>
                <CardDescription>利益率と収益効率</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">売上総利益率</span>
                    <span className="text-sm font-medium" data-testid="text-gross-margin">
                      {formatPercent(m?.grossProfitMargin)}
                    </span>
                  </div>
                  <Progress value={Math.min((m?.grossProfitMargin || 0) / 100, 100)} />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">営業利益率</span>
                    <span className="text-sm font-medium" data-testid="text-operating-margin">
                      {formatPercent(m?.operatingProfitMargin)}
                    </span>
                  </div>
                  <Progress value={Math.min(Math.max((m?.operatingProfitMargin || 0) / 100, 0), 100)} />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">当期純利益率</span>
                    <span className="text-sm font-medium" data-testid="text-net-margin">
                      {formatPercent(m?.netProfitMargin)}
                    </span>
                  </div>
                  <Progress value={Math.min(Math.max((m?.netProfitMargin || 0) / 100, 0), 100)} />
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <span className="text-sm">ROA（総資産利益率）</span>
                    <span className="text-sm font-medium" data-testid="text-roa">
                      {formatPercent(m?.roa)}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between">
                    <span className="text-sm">ROE（自己資本利益率）</span>
                    <span className="text-sm font-medium" data-testid="text-roe">
                      {formatPercent(m?.roe)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">安全性指標</CardTitle>
                <CardDescription>財務体質と返済能力</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">流動比率</span>
                    <Badge variant={(m?.currentRatio || 0) >= 20000 ? "default" : "destructive"}>
                      {formatPercent(m?.currentRatio)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">200%以上が安全とされています</p>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">自己資本比率</span>
                    <Badge variant={(m?.equityRatio || 0) >= 3000 ? "default" : "secondary"}>
                      {formatPercent(m?.equityRatio)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">30%以上が安定とされています</p>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">負債比率</span>
                    <span className="text-sm font-medium" data-testid="text-debt-ratio">
                      {formatRatio(m?.debtToEquityRatio)}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <span className="text-sm">総資産回転率</span>
                    <span className="text-sm font-medium" data-testid="text-asset-turnover">
                      {formatRatio(m?.assetTurnover)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">総資産</CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <div className="text-lg font-semibold" data-testid="text-total-assets">
                  ¥{formatYen(m?.totalAssets)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">総負債</CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <div className="text-lg font-semibold" data-testid="text-total-liabilities">
                  ¥{formatYen(m?.totalLiabilities)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">純資産</CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <div className="text-lg font-semibold" data-testid="text-net-assets">
                  ¥{formatYen(m?.netAssets)}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {cf && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">キャッシュフロー計算書（間接法）</CardTitle>
                <CardDescription>資金の流れを把握</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">営業CF</div>
                    <div className={`text-lg font-semibold ${(cf?.operatingCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="text-operating-cf">
                      ¥{formatYen(cf?.operatingCashFlow)}
                    </div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">投資CF</div>
                    <div className={`text-lg font-semibold ${(cf?.investingCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="text-investing-cf">
                      ¥{formatYen(cf?.investingCashFlow)}
                    </div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">財務CF</div>
                    <div className={`text-lg font-semibold ${(cf?.financingCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="text-financing-cf">
                      ¥{formatYen(cf?.financingCashFlow)}
                    </div>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">純増減</div>
                    <div className={`text-lg font-semibold ${(cf?.netCashChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="text-net-cf">
                      ¥{formatYen(cf?.netCashChange)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
