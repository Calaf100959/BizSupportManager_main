import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Upload, FileText, Check, AlertCircle, Download } from "lucide-react";
import type { FinancialPeriod, FinancialAccount } from "@shared/schema";

type ParsedRow = {
  accountCode: string;
  accountName?: string;
  amount: number;
  notes?: string;
  valid: boolean;
  error?: string;
};

export default function FinancialImportPage() {
  const { officeId } = useParams<{ officeId: string }>();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [statementType, setStatementType] = useState<"PL" | "BS">("PL");
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  
  const { data: periods = [] } = useQuery<FinancialPeriod[]>({
    queryKey: ['/api/offices', officeId, 'financial-periods'],
  });
  
  const { data: accounts = [] } = useQuery<FinancialAccount[]>({
    queryKey: ['/api/financial-accounts'],
  });
  
  const importMutation = useMutation({
    mutationFn: (data: ParsedRow[]) => 
      apiRequest(`/api/offices/${officeId}/financials/import-csv`, "POST", {
        periodId: selectedPeriodId,
        statementType,
        data: data.filter(r => r.valid).map(r => ({
          accountCode: r.accountCode,
          amount: r.amount,
          notes: r.notes,
        })),
      }),
    onSuccess: (result: { imported: number; total: number }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/financial-periods', selectedPeriodId] });
      toast({ title: `${result.imported}件のデータをインポートしました` });
      setParsedData([]);
      setFileName("");
    },
    onError: () => {
      toast({ title: "インポートに失敗しました", variant: "destructive" });
    },
  });
  
  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const accountsByCode = new Map(accounts.map(a => [a.code, a]));
    const rows: ParsedRow[] = [];
    
    const headerLine = lines[0].toLowerCase();
    const hasNameColumn = headerLine.includes('勘定科目名') || headerLine.includes('カテゴリ');
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cells = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      
      if (cells.length < 2) continue;
      
      let accountCode: string;
      let amount: number;
      let notes: string;
      
      if (hasNameColumn && cells.length >= 4) {
        accountCode = cells[0];
        amount = parseInt(cells[3].replace(/[^0-9-]/g, ''), 10) || 0;
        notes = cells[4] || '';
      } else {
        accountCode = cells[0];
        amount = parseInt(cells[1].replace(/[^0-9-]/g, ''), 10) || 0;
        notes = cells[2] || '';
      }
      
      const account = accountsByCode.get(accountCode);
      
      if (!account) {
        rows.push({
          accountCode,
          amount,
          notes,
          valid: false,
          error: '勘定科目コードが見つかりません',
        });
      } else if (account.statementType !== statementType) {
        rows.push({
          accountCode,
          accountName: account.name,
          amount,
          notes,
          valid: false,
          error: `${statementType === 'PL' ? '損益計算書' : '貸借対照表'}の科目ではありません`,
        });
      } else {
        rows.push({
          accountCode,
          accountName: account.name,
          amount,
          notes,
          valid: true,
        });
      }
    }
    
    return rows;
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      setParsedData(parsed);
    };
    reader.readAsText(file, 'UTF-8');
  };
  
  const handleImport = () => {
    if (!selectedPeriodId) {
      toast({ title: "事業年度を選択してください", variant: "destructive" });
      return;
    }
    if (parsedData.filter(r => r.valid).length === 0) {
      toast({ title: "有効なデータがありません", variant: "destructive" });
      return;
    }
    importMutation.mutate(parsedData);
  };
  
  const downloadTemplate = () => {
    const filteredAccounts = accounts.filter(a => a.statementType === statementType);
    const header = '勘定科目コード,勘定科目名,カテゴリ,金額,備考';
    const rows = filteredAccounts.map(a => `${a.code},"${a.name}","${a.category}",0,`);
    const csv = [header, ...rows].join('\n');
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${statementType}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const validCount = parsedData.filter(r => r.valid).length;
  const invalidCount = parsedData.filter(r => !r.valid).length;
  const selectedPeriod = periods.find(p => p.id === selectedPeriodId);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/office/${officeId}/financials`}>
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">CSVインポート</h1>
          <p className="text-sm text-muted-foreground">財務データを一括登録</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">インポート設定</CardTitle>
          <CardDescription>
            インポート先の事業年度と財務諸表の種類を選択してください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>事業年度</Label>
              <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
                <SelectTrigger data-testid="select-period">
                  <SelectValue placeholder="事業年度を選択" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map(period => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.periodName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>財務諸表</Label>
              <Select value={statementType} onValueChange={(v) => { setStatementType(v as "PL" | "BS"); setParsedData([]); }}>
                <SelectTrigger data-testid="select-statement-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PL">損益計算書 (PL)</SelectItem>
                  <SelectItem value="BS">貸借対照表 (BS)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadTemplate} data-testid="button-download-template">
              <Download className="mr-2 h-4 w-4" />
              テンプレートをダウンロード
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ファイル選択</CardTitle>
          <CardDescription>
            CSVファイル形式：勘定科目コード,金額,備考
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              data-testid="input-file"
            />
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-select-file"
            >
              <Upload className="mr-2 h-4 w-4" />
              CSVファイルを選択
            </Button>
            {fileName && (
              <span className="ml-4 text-sm text-muted-foreground">
                <FileText className="inline h-4 w-4 mr-1" />
                {fileName}
              </span>
            )}
          </div>
          
          {parsedData.length > 0 && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <Badge variant="default">
                  <Check className="mr-1 h-3 w-3" />
                  有効: {validCount}件
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="destructive">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    無効: {invalidCount}件
                  </Badge>
                )}
              </div>
              
              <div className="max-h-80 overflow-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">コード</TableHead>
                      <TableHead>勘定科目</TableHead>
                      <TableHead className="text-right w-32">金額</TableHead>
                      <TableHead>備考</TableHead>
                      <TableHead className="w-20">状態</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row, index) => (
                      <TableRow key={index} className={!row.valid ? 'bg-destructive/10' : ''}>
                        <TableCell className="font-mono text-sm">{row.accountCode}</TableCell>
                        <TableCell>{row.accountName || '-'}</TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat('ja-JP').format(row.amount)}円
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{row.notes || '-'}</TableCell>
                        <TableCell>
                          {row.valid ? (
                            <Badge variant="outline"><Check className="h-3 w-3" /></Badge>
                          ) : (
                            <Badge variant="destructive" title={row.error}>
                              <AlertCircle className="h-3 w-3" />
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => { setParsedData([]); setFileName(""); }}
                  data-testid="button-clear"
                >
                  クリア
                </Button>
                <Button 
                  onClick={handleImport}
                  disabled={importMutation.isPending || validCount === 0 || !selectedPeriodId}
                  data-testid="button-import"
                >
                  {importMutation.isPending ? '処理中...' : `${validCount}件をインポート`}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
