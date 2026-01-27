import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, FileSpreadsheet, Search, Eye } from "lucide-react";
import { Link } from "wouter";
import { type Invoice, type Office } from "@shared/schema";
import { format } from "date-fns";

const STATUS_OPTIONS = ['下書き', '発行済', '送付済', '一部入金', '入金済', 'キャンセル'] as const;

const statusColors: Record<string, string> = {
  '下書き': 'bg-muted text-muted-foreground',
  '発行済': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  '送付済': 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  '一部入金': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
  '入金済': 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  'キャンセル': 'bg-destructive/10 text-destructive',
};

export default function InvoicesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const queryUrl = statusFilter && statusFilter !== "all" 
    ? `/api/invoices?status=${encodeURIComponent(statusFilter)}`
    : "/api/invoices";
  
  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices", statusFilter || "all"],
    queryFn: async () => {
      const res = await fetch(queryUrl, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch invoices");
      return res.json();
    },
  });

  const { data: offices = [] } = useQuery<Office[]>({
    queryKey: ["/api/offices"],
  });

  const officeMap = new Map(offices.map(o => [o.id, o]));

  const filteredInvoices = invoices.filter(invoice => {
    if (!searchQuery) return true;
    const office = officeMap.get(invoice.officeId);
    const searchLower = searchQuery.toLowerCase();
    return (
      invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
      (office?.name?.toLowerCase().includes(searchLower))
    );
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
  };

  const totalStats = {
    count: invoices.length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
    unpaidAmount: invoices.filter(inv => inv.status !== '入金済' && inv.status !== 'キャンセル')
      .reduce((sum, inv) => sum + (inv.totalAmount - (inv.paidAmount || 0)), 0),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">請求書管理</h1>
            <p className="text-muted-foreground">請求書の作成・発行・入金管理</p>
          </div>
        </div>
        <Link href="/invoices/new">
          <Button data-testid="button-new-invoice">
            <Plus className="h-4 w-4 mr-2" />
            新規作成
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">請求書数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">請求総額</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStats.totalAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">未入金額</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalStats.unpaidAmount)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>請求書一覧</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                  data-testid="input-search"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                  <SelectValue placeholder="すべてのステータス" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {STATUS_OPTIONS.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              請求書がありません
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>請求書番号</TableHead>
                  <TableHead>請求先</TableHead>
                  <TableHead>発行日</TableHead>
                  <TableHead>支払期限</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map(invoice => {
                  const office = officeMap.get(invoice.officeId);
                  return (
                    <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                      <TableCell className="font-mono">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{office?.name || '-'}</TableCell>
                      <TableCell>{invoice.issueDate ? format(new Date(invoice.issueDate), 'yyyy/MM/dd') : '-'}</TableCell>
                      <TableCell>{invoice.dueDate ? format(new Date(invoice.dueDate), 'yyyy/MM/dd') : '-'}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(invoice.totalAmount)}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[invoice.status] || ''} data-testid={`badge-status-${invoice.id}`}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/invoices/${invoice.id}/detail`}>
                          <Button size="sm" variant="ghost" data-testid={`button-view-${invoice.id}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
