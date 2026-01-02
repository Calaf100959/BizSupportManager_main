import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Save, RefreshCw } from "lucide-react";
import type { FinancialPeriod, FinancialAccount, FinancialPlEntry } from "@shared/schema";

type AccountWithAmount = FinancialAccount & { amount: number; notes: string };

export default function FinancialPlPage() {
  const { officeId, periodId } = useParams<{ officeId: string; periodId: string }>();
  const { toast } = useToast();
  const [amounts, setAmounts] = useState<Record<string, { amount: number; notes: string }>>({});
  const [hasChanges, setHasChanges] = useState(false);
  
  const { data: period } = useQuery<FinancialPeriod>({
    queryKey: ['/api/financial-periods', periodId],
  });
  
  const { data: accounts = [], isLoading: accountsLoading } = useQuery<FinancialAccount[]>({
    queryKey: ['/api/financial-accounts', { type: 'PL' }],
    queryFn: () => fetch('/api/financial-accounts?type=PL', { credentials: 'include' }).then(r => r.json()),
  });
  
  const { data: entries = [], isLoading: entriesLoading } = useQuery<FinancialPlEntry[]>({
    queryKey: ['/api/financial-periods', periodId, 'pl'],
  });
  
  useEffect(() => {
    if (entries.length > 0) {
      const initial: Record<string, { amount: number; notes: string }> = {};
      entries.forEach(entry => {
        initial[entry.accountId] = { amount: entry.amount, notes: entry.notes || '' };
      });
      setAmounts(initial);
    }
  }, [entries]);
  
  const saveMutation = useMutation({
    mutationFn: (entriesToSave: Array<{ accountId: string; amount: number; notes?: string }>) =>
      apiRequest(`/api/financial-periods/${periodId}/pl`, "PUT", { entries: entriesToSave }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/financial-periods', periodId, 'pl'] });
      toast({ title: "保存しました" });
      setHasChanges(false);
    },
    onError: () => {
      toast({ title: "保存に失敗しました", variant: "destructive" });
    },
  });
  
  const accountsByCategory = useMemo(() => {
    const grouped: Record<string, AccountWithAmount[]> = {};
    accounts.forEach(acc => {
      const cat = acc.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push({
        ...acc,
        amount: amounts[acc.id]?.amount || 0,
        notes: amounts[acc.id]?.notes || '',
      });
    });
    return grouped;
  }, [accounts, amounts]);
  
  const handleAmountChange = (accountId: string, value: string) => {
    const numValue = parseInt(value.replace(/[^0-9-]/g, ''), 10) || 0;
    setAmounts(prev => ({
      ...prev,
      [accountId]: { ...prev[accountId], amount: numValue, notes: prev[accountId]?.notes || '' }
    }));
    setHasChanges(true);
  };
  
  const handleSave = () => {
    const entriesToSave = Object.entries(amounts)
      .filter(([_, data]) => data.amount !== 0 || data.notes)
      .map(([accountId, data]) => ({
        accountId,
        amount: data.amount,
        notes: data.notes || undefined,
      }));
    saveMutation.mutate(entriesToSave);
  };
  
  const formatYen = (value: number) => {
    return new Intl.NumberFormat('ja-JP').format(value);
  };
  
  const calculateCategoryTotal = (categoryAccounts: AccountWithAmount[]) => {
    return categoryAccounts.reduce((sum, acc) => {
      return sum + (acc.isDebit === 1 ? acc.amount : -acc.amount);
    }, 0);
  };
  
  const calculateGrossProfit = () => {
    const sales = accountsByCategory['売上高']?.reduce((sum, a) => sum + (a.isDebit === 0 ? a.amount : -a.amount), 0) || 0;
    const cogs = accountsByCategory['売上原価']?.reduce((sum, a) => sum + (a.isDebit === 1 ? a.amount : -a.amount), 0) || 0;
    return sales - cogs;
  };
  
  const calculateOperatingIncome = () => {
    const grossProfit = calculateGrossProfit();
    const sga = accountsByCategory['販売費及び一般管理費']?.reduce((sum, a) => sum + a.amount, 0) || 0;
    return grossProfit - sga;
  };
  
  const calculateOrdinaryIncome = () => {
    const opIncome = calculateOperatingIncome();
    const nonOpIncome = accountsByCategory['営業外収益']?.reduce((sum, a) => sum + a.amount, 0) || 0;
    const nonOpExp = accountsByCategory['営業外費用']?.reduce((sum, a) => sum + a.amount, 0) || 0;
    return opIncome + nonOpIncome - nonOpExp;
  };
  
  const calculateNetIncome = () => {
    const ordinary = calculateOrdinaryIncome();
    const extraIncome = accountsByCategory['特別利益']?.reduce((sum, a) => sum + a.amount, 0) || 0;
    const extraLoss = accountsByCategory['特別損失']?.reduce((sum, a) => sum + a.amount, 0) || 0;
    const taxes = accountsByCategory['法人税等']?.reduce((sum, a) => sum + a.amount, 0) || 0;
    return ordinary + extraIncome - extraLoss - taxes;
  };
  
  const categoryOrder = ['売上高', '売上原価', '販売費及び一般管理費', '営業外収益', '営業外費用', '特別利益', '特別損失', '法人税等'];
  
  if (accountsLoading || entriesLoading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/office/${officeId}/financials`}>
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">損益計算書</h1>
          {period && <p className="text-sm text-muted-foreground">{period.periodName}</p>}
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saveMutation.isPending || !hasChanges}
          data-testid="button-save"
        >
          {saveMutation.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          保存
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">売上総利益</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-xl font-semibold" data-testid="text-gross-profit">
              ¥{formatYen(calculateGrossProfit())}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">営業利益</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-xl font-semibold" data-testid="text-operating-income">
              ¥{formatYen(calculateOperatingIncome())}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">経常利益</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-xl font-semibold" data-testid="text-ordinary-income">
              ¥{formatYen(calculateOrdinaryIncome())}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">当期純利益</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-xl font-semibold" data-testid="text-net-income">
              ¥{formatYen(calculateNetIncome())}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Accordion type="multiple" defaultValue={categoryOrder} className="space-y-2">
        {categoryOrder.map(category => {
          const categoryAccounts = accountsByCategory[category] || [];
          if (categoryAccounts.length === 0) return null;
          
          return (
            <AccordionItem key={category} value={category} className="border rounded-lg">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex justify-between w-full pr-4">
                  <span className="font-medium">{category}</span>
                  <Badge variant="outline">
                    {categoryAccounts.length}科目
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  {categoryAccounts.map(account => (
                    <div key={account.id} className="flex items-center gap-4" data-testid={`pl-row-${account.id}`}>
                      <div className="flex-1">
                        <Label className="text-sm">{account.name}</Label>
                        {account.subcategory && (
                          <span className="text-xs text-muted-foreground ml-2">({account.subcategory})</span>
                        )}
                      </div>
                      <div className="w-40">
                        <Input
                          type="text"
                          value={formatYen(account.amount)}
                          onChange={(e) => handleAmountChange(account.id, e.target.value)}
                          className="text-right"
                          placeholder="0"
                          data-testid={`input-amount-${account.id}`}
                        />
                      </div>
                      <span className="w-8 text-muted-foreground text-sm">円</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
      
      {hasChanges && (
        <div className="fixed bottom-4 right-4">
          <Badge variant="secondary" className="px-4 py-2">
            未保存の変更があります
          </Badge>
        </div>
      )}
    </div>
  );
}
