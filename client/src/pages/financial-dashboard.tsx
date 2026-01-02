import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, BarChart3, LineChart as LineChartIcon, TableIcon } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { FinancialPeriod, FinancialMetric, FinancialCashflow, Office } from "@shared/schema";

type ViewMode = "metrics" | "profitability" | "safety" | "cashflow" | "pl" | "bs";
type DisplayType = "table" | "chart";

export default function FinancialDashboardPage() {
  const { officeId } = useParams<{ officeId: string }>();
  const [periodCount, setPeriodCount] = useState<string>("3");
  const [viewMode, setViewMode] = useState<ViewMode>("metrics");
  const [displayType, setDisplayType] = useState<DisplayType>("table");
  
  const { data: office } = useQuery<Office>({
    queryKey: ['/api/offices', officeId],
  });
  
  const { data: periods = [] } = useQuery<FinancialPeriod[]>({
    queryKey: ['/api/offices', officeId, 'financial-periods'],
  });
  
  const sortedPeriods = useMemo(() => {
    return [...periods]
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .slice(0, parseInt(periodCount));
  }, [periods, periodCount]);
  
  const periodIds = sortedPeriods.map(p => p.id);
  
  const metricsQueries = useQuery({
    queryKey: ['/api/offices', officeId, 'financial-metrics-multi', periodCount, periodIds],
    queryFn: async () => {
      const results: Record<string, FinancialMetric | null> = {};
      for (const id of periodIds) {
        try {
          const res = await fetch(`/api/financial-periods/${id}/metrics`, { credentials: 'include' });
          results[id] = res.ok ? await res.json() : null;
        } catch { results[id] = null; }
      }
      return results;
    },
    enabled: periodIds.length > 0,
  });
  
  const cashflowQueries = useQuery({
    queryKey: ['/api/offices', officeId, 'financial-cashflow-multi', periodCount, periodIds],
    queryFn: async () => {
      const results: Record<string, FinancialCashflow | null> = {};
      for (const id of periodIds) {
        try {
          const res = await fetch(`/api/financial-periods/${id}/cashflow`, { credentials: 'include' });
          results[id] = res.ok ? await res.json() : null;
        } catch { results[id] = null; }
      }
      return results;
    },
    enabled: periodIds.length > 0,
  });
  
  const plQueries = useQuery({
    queryKey: ['/api/offices', officeId, 'financial-pl-multi', periodCount, periodIds],
    queryFn: async () => {
      const results: Record<string, any[]> = {};
      for (const id of periodIds) {
        try {
          const res = await fetch(`/api/financial-periods/${id}/pl-entries`, { credentials: 'include' });
          results[id] = res.ok ? await res.json() : [];
        } catch { results[id] = []; }
      }
      return results;
    },
    enabled: periodIds.length > 0 && viewMode === 'pl',
  });
  
  const bsQueries = useQuery({
    queryKey: ['/api/offices', officeId, 'financial-bs-multi', periodCount, periodIds],
    queryFn: async () => {
      const results: Record<string, any[]> = {};
      for (const id of periodIds) {
        try {
          const res = await fetch(`/api/financial-periods/${id}/bs-entries`, { credentials: 'include' });
          results[id] = res.ok ? await res.json() : [];
        } catch { results[id] = []; }
      }
      return results;
    },
    enabled: periodIds.length > 0 && viewMode === 'bs',
  });
  
  const metrics = metricsQueries.data || {};
  const cashflows = cashflowQueries.data || {};
  const plData = plQueries.data || {};
  const bsData = bsQueries.data || {};
  
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
  
  const getTrendBadge = (current: number | null | undefined, prev: number | null | undefined) => {
    if (current == null || prev == null || prev === 0) return null;
    const change = ((current - prev) / Math.abs(prev)) * 100;
    if (Math.abs(change) < 1) return <Badge variant="secondary"><Minus className="h-3 w-3" /></Badge>;
    if (change > 0) return <Badge variant="default" className="bg-green-600"><TrendingUp className="h-3 w-3 mr-1" />{change.toFixed(1)}%</Badge>;
    return <Badge variant="destructive"><TrendingDown className="h-3 w-3 mr-1" />{change.toFixed(1)}%</Badge>;
  };
  
  const displayPeriods = [...sortedPeriods].reverse();
  
  const getPlAccountTotals = () => {
    const accounts: Record<string, { code: string; name: string; amounts: Record<string, number> }> = {};
    for (const period of displayPeriods) {
      const entries = plData[period.id] || [];
      for (const entry of entries) {
        const code = entry.account?.code || entry.accountId;
        const name = entry.account?.name || code;
        if (!accounts[code]) accounts[code] = { code, name, amounts: {} };
        accounts[code].amounts[period.id] = entry.amount || 0;
      }
    }
    return Object.values(accounts).sort((a, b) => a.code.localeCompare(b.code));
  };
  
  const getBsAccountTotals = () => {
    const accounts: Record<string, { code: string; name: string; category: string; amounts: Record<string, number> }> = {};
    for (const period of displayPeriods) {
      const entries = bsData[period.id] || [];
      for (const entry of entries) {
        const code = entry.account?.code || entry.accountId;
        const name = entry.account?.name || code;
        const category = entry.account?.category || '';
        if (!accounts[code]) accounts[code] = { code, name, category, amounts: {} };
        accounts[code].amounts[period.id] = entry.amount || 0;
      }
    }
    return Object.values(accounts).sort((a, b) => a.code.localeCompare(b.code));
  };
  
  const metricsChartData = displayPeriods.map(p => ({
    period: p.periodName.replace(/\（.*\）/, ''),
    売上高: (metrics[p.id]?.revenue || 0) / 10000,
    営業利益: (metrics[p.id]?.operatingProfit || 0) / 10000,
    経常利益: (metrics[p.id]?.ordinaryProfit || 0) / 10000,
    純利益: (metrics[p.id]?.netIncome || 0) / 10000,
    総資産: (metrics[p.id]?.totalAssets || 0) / 10000,
    純資産: (metrics[p.id]?.netAssets || 0) / 10000,
  }));
  
  const profitabilityChartData = displayPeriods.map(p => ({
    period: p.periodName.replace(/\（.*\）/, ''),
    売上総利益率: (metrics[p.id]?.grossProfitMargin || 0) / 100,
    営業利益率: (metrics[p.id]?.operatingProfitMargin || 0) / 100,
    経常利益率: (metrics[p.id]?.ordinaryProfitMargin || 0) / 100,
    純利益率: (metrics[p.id]?.netProfitMargin || 0) / 100,
    ROA: (metrics[p.id]?.roa || 0) / 100,
    ROE: (metrics[p.id]?.roe || 0) / 100,
  }));
  
  const safetyChartData = displayPeriods.map(p => ({
    period: p.periodName.replace(/\（.*\）/, ''),
    流動比率: (metrics[p.id]?.currentRatio || 0) / 100,
    自己資本比率: (metrics[p.id]?.equityRatio || 0) / 100,
  }));
  
  const cashflowChartData = displayPeriods.map(p => ({
    period: p.periodName.replace(/\（.*\）/, ''),
    営業CF: (cashflows[p.id]?.operatingCashFlow || 0) / 10000,
    投資CF: (cashflows[p.id]?.investingCashFlow || 0) / 10000,
    財務CF: (cashflows[p.id]?.financingCashFlow || 0) / 10000,
    純増減: (cashflows[p.id]?.netCashChange || 0) / 10000,
  }));
  
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(220, 70%, 50%)'];
  
  const isLoading = metricsQueries.isLoading || cashflowQueries.isLoading;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Link href={`/office/${officeId}/financials`}>
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold truncate" data-testid="text-page-title">財務分析ダッシュボード</h1>
          {office && <p className="text-sm text-muted-foreground truncate">{office.name}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">表示期間:</span>
          <Select value={periodCount} onValueChange={setPeriodCount}>
            <SelectTrigger className="w-24" data-testid="select-period-count">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3期</SelectItem>
              <SelectItem value="5">5期</SelectItem>
              <SelectItem value="10">10期</SelectItem>
              <SelectItem value="999">全期間</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant={displayType === "table" ? "default" : "outline"} 
            size="icon"
            onClick={() => setDisplayType("table")}
            data-testid="button-table-view"
          >
            <TableIcon className="h-4 w-4" />
          </Button>
          <Button 
            variant={displayType === "chart" ? "default" : "outline"} 
            size="icon"
            onClick={() => setDisplayType("chart")}
            data-testid="button-chart-view"
          >
            <LineChartIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">読み込み中...</div>
      ) : sortedPeriods.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>財務データがありません</p>
            <p className="text-sm">決算期間を作成し、PL/BSデータを入力してください</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="metrics" data-testid="tab-metrics">主要指標</TabsTrigger>
            <TabsTrigger value="profitability" data-testid="tab-profitability">収益性</TabsTrigger>
            <TabsTrigger value="safety" data-testid="tab-safety">安全性</TabsTrigger>
            <TabsTrigger value="cashflow" data-testid="tab-cashflow">キャッシュフロー</TabsTrigger>
            <TabsTrigger value="pl" data-testid="tab-pl">損益推移</TabsTrigger>
            <TabsTrigger value="bs" data-testid="tab-bs">残高推移</TabsTrigger>
          </TabsList>
          
          <TabsContent value="metrics" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">主要財務指標の推移（単位: 万円）</CardTitle>
              </CardHeader>
              <CardContent>
                {displayType === "chart" ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={metricsChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis tickFormatter={(v) => `${v.toLocaleString()}`} />
                        <Tooltip formatter={(v: number) => `${v.toLocaleString()}万円`} />
                        <Legend />
                        <Line type="monotone" dataKey="売上高" stroke={COLORS[0]} strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="営業利益" stroke={COLORS[1]} strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="経常利益" stroke={COLORS[2]} strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="純利益" stroke={COLORS[3]} strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[140px]">指標</TableHead>
                          {displayPeriods.map(p => (
                            <TableHead key={p.id} className="text-right min-w-[120px]">{p.periodName}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">売上高</TableCell>
                          {displayPeriods.map((p, i) => (
                            <TableCell key={p.id} className="text-right">
                              <div>¥{formatYen(metrics[p.id]?.revenue)}</div>
                              {i > 0 && getTrendBadge(metrics[p.id]?.revenue, metrics[displayPeriods[i-1].id]?.revenue)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">営業利益</TableCell>
                          {displayPeriods.map((p, i) => (
                            <TableCell key={p.id} className="text-right">
                              <div>¥{formatYen(metrics[p.id]?.operatingProfit)}</div>
                              {i > 0 && getTrendBadge(metrics[p.id]?.operatingProfit, metrics[displayPeriods[i-1].id]?.operatingProfit)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">経常利益</TableCell>
                          {displayPeriods.map((p, i) => (
                            <TableCell key={p.id} className="text-right">
                              <div>¥{formatYen(metrics[p.id]?.ordinaryProfit)}</div>
                              {i > 0 && getTrendBadge(metrics[p.id]?.ordinaryProfit, metrics[displayPeriods[i-1].id]?.ordinaryProfit)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">当期純利益</TableCell>
                          {displayPeriods.map((p, i) => (
                            <TableCell key={p.id} className="text-right">
                              <div>¥{formatYen(metrics[p.id]?.netIncome)}</div>
                              {i > 0 && getTrendBadge(metrics[p.id]?.netIncome, metrics[displayPeriods[i-1].id]?.netIncome)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">総資産</TableCell>
                          {displayPeriods.map((p, i) => (
                            <TableCell key={p.id} className="text-right">
                              <div>¥{formatYen(metrics[p.id]?.totalAssets)}</div>
                              {i > 0 && getTrendBadge(metrics[p.id]?.totalAssets, metrics[displayPeriods[i-1].id]?.totalAssets)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">純資産</TableCell>
                          {displayPeriods.map((p, i) => (
                            <TableCell key={p.id} className="text-right">
                              <div>¥{formatYen(metrics[p.id]?.netAssets)}</div>
                              {i > 0 && getTrendBadge(metrics[p.id]?.netAssets, metrics[displayPeriods[i-1].id]?.netAssets)}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="profitability" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">収益性指標の推移（単位: %）</CardTitle>
              </CardHeader>
              <CardContent>
                {displayType === "chart" ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={profitabilityChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis tickFormatter={(v) => `${v}%`} />
                        <Tooltip formatter={(v: number) => `${v.toFixed(2)}%`} />
                        <Legend />
                        <Line type="monotone" dataKey="売上総利益率" stroke={COLORS[0]} strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="営業利益率" stroke={COLORS[1]} strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="経常利益率" stroke={COLORS[2]} strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="純利益率" stroke={COLORS[3]} strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="ROA" stroke={COLORS[4]} strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="ROE" stroke={COLORS[5]} strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[140px]">指標</TableHead>
                          {displayPeriods.map(p => (
                            <TableHead key={p.id} className="text-right min-w-[120px]">{p.periodName}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">売上総利益率</TableCell>
                          {displayPeriods.map(p => (
                            <TableCell key={p.id} className="text-right">{formatPercent(metrics[p.id]?.grossProfitMargin)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">営業利益率</TableCell>
                          {displayPeriods.map(p => (
                            <TableCell key={p.id} className="text-right">{formatPercent(metrics[p.id]?.operatingProfitMargin)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">経常利益率</TableCell>
                          {displayPeriods.map(p => (
                            <TableCell key={p.id} className="text-right">{formatPercent(metrics[p.id]?.ordinaryProfitMargin)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">当期純利益率</TableCell>
                          {displayPeriods.map(p => (
                            <TableCell key={p.id} className="text-right">{formatPercent(metrics[p.id]?.netProfitMargin)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">ROA（総資産利益率）</TableCell>
                          {displayPeriods.map(p => (
                            <TableCell key={p.id} className="text-right">{formatPercent(metrics[p.id]?.roa)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">ROE（自己資本利益率）</TableCell>
                          {displayPeriods.map(p => (
                            <TableCell key={p.id} className="text-right">{formatPercent(metrics[p.id]?.roe)}</TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="safety" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">安全性指標の推移（単位: %）</CardTitle>
              </CardHeader>
              <CardContent>
                {displayType === "chart" ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={safetyChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis tickFormatter={(v) => `${v}%`} />
                        <Tooltip formatter={(v: number) => `${v.toFixed(2)}%`} />
                        <Legend />
                        <Line type="monotone" dataKey="流動比率" stroke={COLORS[0]} strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="自己資本比率" stroke={COLORS[1]} strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[140px]">指標</TableHead>
                          {displayPeriods.map(p => (
                            <TableHead key={p.id} className="text-right min-w-[120px]">{p.periodName}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">流動比率</TableCell>
                          {displayPeriods.map(p => (
                            <TableCell key={p.id} className="text-right">
                              <Badge variant={(metrics[p.id]?.currentRatio || 0) >= 20000 ? "default" : "destructive"}>
                                {formatPercent(metrics[p.id]?.currentRatio)}
                              </Badge>
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">自己資本比率</TableCell>
                          {displayPeriods.map(p => (
                            <TableCell key={p.id} className="text-right">
                              <Badge variant={(metrics[p.id]?.equityRatio || 0) >= 3000 ? "default" : "secondary"}>
                                {formatPercent(metrics[p.id]?.equityRatio)}
                              </Badge>
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">負債比率（D/E）</TableCell>
                          {displayPeriods.map(p => (
                            <TableCell key={p.id} className="text-right">{formatRatio(metrics[p.id]?.debtToEquityRatio)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">総資産回転率</TableCell>
                          {displayPeriods.map(p => (
                            <TableCell key={p.id} className="text-right">{formatRatio(metrics[p.id]?.assetTurnover)}</TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="cashflow" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">キャッシュフローの推移（単位: 万円）</CardTitle>
              </CardHeader>
              <CardContent>
                {displayType === "chart" ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cashflowChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis tickFormatter={(v) => `${v.toLocaleString()}`} />
                        <Tooltip formatter={(v: number) => `${v.toLocaleString()}万円`} />
                        <Legend />
                        <Line type="monotone" dataKey="営業CF" stroke={COLORS[0]} strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="投資CF" stroke={COLORS[1]} strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="財務CF" stroke={COLORS[2]} strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="純増減" stroke={COLORS[3]} strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[140px]">項目</TableHead>
                          {displayPeriods.map(p => (
                            <TableHead key={p.id} className="text-right min-w-[120px]">{p.periodName}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">営業CF</TableCell>
                          {displayPeriods.map(p => {
                            const cf = cashflows[p.id] as any;
                            const val = cf?.operatingCashFlow;
                            return (
                              <TableCell key={p.id} className={`text-right ${(val || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ¥{formatYen(val)}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">投資CF</TableCell>
                          {displayPeriods.map(p => {
                            const cf = cashflows[p.id] as any;
                            const val = cf?.investingCashFlow;
                            return (
                              <TableCell key={p.id} className={`text-right ${(val || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ¥{formatYen(val)}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">財務CF</TableCell>
                          {displayPeriods.map(p => {
                            const cf = cashflows[p.id] as any;
                            const val = cf?.financingCashFlow;
                            return (
                              <TableCell key={p.id} className={`text-right ${(val || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ¥{formatYen(val)}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-medium">純増減</TableCell>
                          {displayPeriods.map(p => {
                            const cf = cashflows[p.id] as any;
                            const val = cf?.netCashChange;
                            return (
                              <TableCell key={p.id} className={`text-right font-semibold ${(val || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ¥{formatYen(val)}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">期末現金残高</TableCell>
                          {displayPeriods.map(p => {
                            const cf = cashflows[p.id] as any;
                            return (
                              <TableCell key={p.id} className="text-right">¥{formatYen(cf?.endingCash)}</TableCell>
                            );
                          })}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pl" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">損益計算書の推移</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {plQueries.isLoading ? (
                  <div className="text-center py-4">読み込み中...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[60px]">コード</TableHead>
                        <TableHead className="min-w-[140px]">勘定科目</TableHead>
                        {displayPeriods.map(p => (
                          <TableHead key={p.id} className="text-right min-w-[120px]">{p.periodName}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getPlAccountTotals().map(acc => (
                        <TableRow key={acc.code}>
                          <TableCell className="text-muted-foreground">{acc.code}</TableCell>
                          <TableCell className="font-medium">{acc.name}</TableCell>
                          {displayPeriods.map(p => (
                            <TableCell key={p.id} className="text-right">¥{formatYen(acc.amounts[p.id] || 0)}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="bs" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">貸借対照表の推移</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {bsQueries.isLoading ? (
                  <div className="text-center py-4">読み込み中...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[60px]">コード</TableHead>
                        <TableHead className="min-w-[140px]">勘定科目</TableHead>
                        {displayPeriods.map(p => (
                          <TableHead key={p.id} className="text-right min-w-[120px]">{p.periodName}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getBsAccountTotals().map(acc => (
                        <TableRow key={acc.code}>
                          <TableCell className="text-muted-foreground">{acc.code}</TableCell>
                          <TableCell className="font-medium">{acc.name}</TableCell>
                          {displayPeriods.map(p => (
                            <TableCell key={p.id} className="text-right">¥{formatYen(acc.amounts[p.id] || 0)}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
