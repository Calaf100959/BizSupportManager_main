import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Plus, Calendar, FileText, TrendingUp, Trash2, Edit, BarChart3 } from "lucide-react";
import type { FinancialPeriod, Office } from "@shared/schema";

const STATUS_OPTIONS = ['入力中', '確定', '監査済'] as const;

export default function OfficeFinancialsPage() {
  const { officeId } = useParams<{ officeId: string }>();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<FinancialPeriod | null>(null);
  
  const [formData, setFormData] = useState({
    periodName: '',
    startDate: '',
    endDate: '',
    status: '入力中' as string,
    notes: '',
  });
  
  const { data: office } = useQuery<Office>({
    queryKey: ['/api/offices', officeId],
  });
  
  const { data: periods = [], isLoading } = useQuery<FinancialPeriod[]>({
    queryKey: ['/api/offices', officeId, 'financial-periods'],
  });
  
  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => 
      apiRequest(`/api/offices/${officeId}/financial-periods`, "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offices', officeId, 'financial-periods'] });
      toast({ title: "事業年度を作成しました" });
      handleDialogClose();
    },
    onError: () => {
      toast({ title: "作成に失敗しました", variant: "destructive" });
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: (data: { id: string; period: typeof formData }) => 
      apiRequest(`/api/financial-periods/${data.id}`, "PATCH", data.period),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offices', officeId, 'financial-periods'] });
      toast({ title: "事業年度を更新しました" });
      handleDialogClose();
    },
    onError: () => {
      toast({ title: "更新に失敗しました", variant: "destructive" });
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/financial-periods/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offices', officeId, 'financial-periods'] });
      toast({ title: "事業年度を削除しました" });
    },
    onError: () => {
      toast({ title: "削除に失敗しました", variant: "destructive" });
    },
  });
  
  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingPeriod(null);
    setFormData({
      periodName: '',
      startDate: '',
      endDate: '',
      status: '入力中',
      notes: '',
    });
  };
  
  const handleEdit = (period: FinancialPeriod) => {
    setEditingPeriod(period);
    setFormData({
      periodName: period.periodName,
      startDate: period.startDate,
      endDate: period.endDate,
      status: period.status,
      notes: period.notes || '',
    });
    setDialogOpen(true);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPeriod) {
      updateMutation.mutate({ id: editingPeriod.id, period: formData });
    } else {
      createMutation.mutate(formData);
    }
  };
  
  const handleDelete = (id: string) => {
    if (confirm("この事業年度とすべての財務データを削除しますか？")) {
      deleteMutation.mutate(id);
    }
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case '確定': return 'default';
      case '監査済': return 'secondary';
      default: return 'outline';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/office/${officeId}/detail`}>
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            財務情報管理
          </h1>
          {office && (
            <p className="text-sm text-muted-foreground">{office.name}</p>
          )}
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-period">
              <Plus className="mr-2 h-4 w-4" />
              事業年度追加
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPeriod ? "事業年度編集" : "新規事業年度"}</DialogTitle>
              <DialogDescription>
                財務データを入力する事業年度を設定します
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="periodName">期間名 *</Label>
                <Input
                  id="periodName"
                  value={formData.periodName}
                  onChange={(e) => setFormData({ ...formData, periodName: e.target.value })}
                  placeholder="例：第10期、2024年度"
                  required
                  data-testid="input-period-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">期首日 *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    data-testid="input-start-date"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">期末日 *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                    data-testid="input-end-date"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status">ステータス</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">備考</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="メモ"
                  data-testid="input-notes"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  キャンセル
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save"
                >
                  {editingPeriod ? "更新" : "作成"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">読み込み中...</div>
      ) : periods.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>事業年度がまだ登録されていません</p>
            <p className="text-sm">「事業年度追加」ボタンから追加してください</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {periods.map((period) => (
            <Card key={period.id} className="hover-elevate" data-testid={`period-card-${period.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg" data-testid={`period-name-${period.id}`}>
                      {period.periodName}
                    </CardTitle>
                    <Badge variant={getStatusBadgeVariant(period.status)} data-testid={`period-status-${period.id}`}>
                      {period.status}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(period)}
                      data-testid={`button-edit-${period.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(period.id)}
                      data-testid={`button-delete-${period.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {period.startDate} 〜 {period.endDate}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Link href={`/office/${officeId}/financials/${period.id}/pl`}>
                    <Button variant="outline" size="sm" data-testid={`button-pl-${period.id}`}>
                      <FileText className="mr-2 h-4 w-4" />
                      損益計算書
                    </Button>
                  </Link>
                  <Link href={`/office/${officeId}/financials/${period.id}/bs`}>
                    <Button variant="outline" size="sm" data-testid={`button-bs-${period.id}`}>
                      <FileText className="mr-2 h-4 w-4" />
                      貸借対照表
                    </Button>
                  </Link>
                  <Link href={`/office/${officeId}/financials/${period.id}/analysis`}>
                    <Button variant="outline" size="sm" data-testid={`button-analysis-${period.id}`}>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      分析
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">財務分析ダッシュボード</CardTitle>
          <CardDescription>
            複数期間を横断して財務指標・残高の推移を分析できます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/office/${officeId}/financials/dashboard`}>
            <Button data-testid="button-dashboard">
              <BarChart3 className="mr-2 h-4 w-4" />
              ダッシュボードを開く
            </Button>
          </Link>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">CSVインポート</CardTitle>
          <CardDescription>
            定型CSVファイルからPL/BSデータを一括登録できます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/office/${officeId}/financials/import`}>
            <Button variant="outline" data-testid="button-csv-import">
              CSVインポート
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
