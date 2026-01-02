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
import type { FinancialPeriod, FinancialAccount, FinancialBsEntry } from "@shared/schema";

type AccountWithAmount = FinancialAccount & { amount: number; notes: string };

export default function FinancialBsPage() {
  const { officeId, periodId } = useParams<{ officeId: string; periodId: string }>();
  const { toast } = useToast();
  const [amounts, setAmounts] = useState<Record<string, { amount: number; notes: string }>>({});
  const [hasChanges, setHasChanges] = useState(false);
  
  const { data: period } = useQuery<FinancialPeriod>({
    queryKey: ['/api/financial-periods', periodId],
  });
  
  const { data: accounts = [], isLoading: accountsLoading } = useQuery<FinancialAccount[]>({
    queryKey: ['/api/financial-accounts', { type: 'BS' }],
    queryFn: () => fetch('/api/financial-accounts?type=BS', { credentials: 'include' }).then(r => r.json()),
  });
  
  const { data: entries = [], isLoading: entriesLoading } = useQuery<FinancialBsEntry[]>({
    queryKey: ['/api/financial-periods', periodId, 'bs'],
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
      apiRequest(`/api/financial-periods/${periodId}/bs`, "PUT", { entries: entriesToSave }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/financial-periods', periodId, 'bs'] });
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
  
  const calculateTotalAssets = () => {
    let total = 0;
    const assetCategories = ['流動資産', '固定資産'];
    assetCategories.forEach(cat => {
      const categoryAccounts = accountsByCategory[cat] || [];
      categoryAccounts.forEach(acc => {
        total += acc.isDebit === 1 ? acc.amount : -acc.amount;
      });
    });
    return total;
  };
  
  const calculateTotalLiabilities = () => {
    let total = 0;
    const liabilityCategories = ['流動負債', '固定負債'];
    liabilityCategories.forEach(cat => {
      const categoryAccounts = accountsByCategory[cat] || [];
      categoryAccounts.forEach(acc => {
        total += acc.isDebit === 0 ? acc.amount : -acc.amount;
      });
    });
    return total;
  };
  
  const calculateNetAssets = () => {
    const categoryAccounts = accountsByCategory['純資産'] || [];
    let total = 0;
    categoryAccounts.forEach(acc => {
      total += acc.isDebit === 0 ? acc.amount : -acc.amount;
    });
    return total;
  };
  
  const calculateBalanceCheck = () => {
    return calculateTotalAssets() - calculateTotalLiabilities() - calculateNetAssets();
  };
  
  const categoryOrder = ['流動資産', '固定資産', '流動負債', '固定負債', '純資産'];
  
  if (accountsLoading || entriesLoading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }
  
  const balanceDiff = calculateBalanceCheck();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/office/${officeId}/financials`}>
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">貸借対照表</h1>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">資産合計</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-xl font-semibold" data-testid="text-total-assets">
              ¥{formatYen(calculateTotalAssets())}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">負債合計</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-xl font-semibold" data-testid="text-total-liabilities">
              ¥{formatYen(calculateTotalLiabilities())}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">純資産</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-xl font-semibold" data-testid="text-net-assets">
              ¥{formatYen(calculateNetAssets())}
            </div>
          </CardContent>
        </Card>
        <Card className={balanceDiff !== 0 ? 'border-destructive' : ''}>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">貸借差額</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className={`text-xl font-semibold ${balanceDiff !== 0 ? 'text-destructive' : 'text-green-600'}`} data-testid="text-balance-check">
              ¥{formatYen(balanceDiff)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">資産の部</h2>
          <Accordion type="multiple" defaultValue={['流動資産', '固定資産']}>
            {['流動資産', '固定資産'].map(category => {
              const categoryAccounts = accountsByCategory[category] || [];
              if (categoryAccounts.length === 0) return null;
              
              return (
                <AccordionItem key={category} value={category} className="border rounded-lg mb-2">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex justify-between w-full pr-4">
                      <span className="font-medium">{category}</span>
                      <Badge variant="outline">{categoryAccounts.length}科目</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3">
                      {categoryAccounts.map(account => (
                        <div key={account.id} className="flex items-center gap-4" data-testid={`bs-row-${account.id}`}>
                          <div className="flex-1">
                            <Label className="text-sm">{account.name}</Label>
                            {account.subcategory && (
                              <span className="text-xs text-muted-foreground ml-2">({account.subcategory})</span>
                            )}
                          </div>
                          <div className="w-32">
                            <Input
                              type="text"
                              value={formatYen(account.amount)}
                              onChange={(e) => handleAmountChange(account.id, e.target.value)}
                              className="text-right"
                              placeholder="0"
                              data-testid={`input-amount-${account.id}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">負債・純資産の部</h2>
          <Accordion type="multiple" defaultValue={['流動負債', '固定負債', '純資産']}>
            {['流動負債', '固定負債', '純資産'].map(category => {
              const categoryAccounts = accountsByCategory[category] || [];
              if (categoryAccounts.length === 0) return null;
              
              return (
                <AccordionItem key={category} value={category} className="border rounded-lg mb-2">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex justify-between w-full pr-4">
                      <span className="font-medium">{category}</span>
                      <Badge variant="outline">{categoryAccounts.length}科目</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3">
                      {categoryAccounts.map(account => (
                        <div key={account.id} className="flex items-center gap-4" data-testid={`bs-row-${account.id}`}>
                          <div className="flex-1">
                            <Label className="text-sm">{account.name}</Label>
                            {account.subcategory && (
                              <span className="text-xs text-muted-foreground ml-2">({account.subcategory})</span>
                            )}
                          </div>
                          <div className="w-32">
                            <Input
                              type="text"
                              value={formatYen(account.amount)}
                              onChange={(e) => handleAmountChange(account.id, e.target.value)}
                              className="text-right"
                              placeholder="0"
                              data-testid={`input-amount-${account.id}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </div>
      
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
