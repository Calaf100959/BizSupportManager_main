import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { ArrowLeft, Save } from "lucide-react";

export default function OfficeFormPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("basic");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted");
    setLocation("/search");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/search")} data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">事業所登録</h1>
          <p className="text-sm text-muted-foreground">新規事業所の情報を登録します</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" data-testid="tab-basic">基本情報</TabsTrigger>
            <TabsTrigger value="office" data-testid="tab-office">事業所情報</TabsTrigger>
            <TabsTrigger value="personal" data-testid="tab-personal">個人情報</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>基本情報</CardTitle>
                <CardDescription>事業所の基本的な情報を入力してください</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="office-code">事業所コード *</Label>
                    <Input id="office-code" placeholder="例：OFF-001" data-testid="input-office-code" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="office-name">事業所名 *</Label>
                    <Input id="office-name" placeholder="例：株式会社山田商店" data-testid="input-office-name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="office-kana">フリガナ *</Label>
                    <Input id="office-kana" placeholder="例：カブシキガイシャヤマダショウテン" data-testid="input-office-kana" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="representative">代表者氏名 *</Label>
                    <Input id="representative" placeholder="例：山田太郎" data-testid="input-representative" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rep-kana">代表者フリガナ *</Label>
                    <Input id="rep-kana" placeholder="例：ヤマダタロウ" data-testid="input-rep-kana" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-type">企業形態</Label>
                    <Select>
                      <SelectTrigger id="company-type" data-testid="select-company-type">
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corporation">株式会社</SelectItem>
                        <SelectItem value="llc">合同会社</SelectItem>
                        <SelectItem value="partnership">合名会社</SelectItem>
                        <SelectItem value="individual">個人事業主</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capital">資本金（万円）</Label>
                    <Input id="capital" type="number" placeholder="例：1000" data-testid="input-capital" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="corporate-number">法人番号</Label>
                    <Input id="corporate-number" placeholder="13桁の番号" data-testid="input-corporate-number" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoice-number">インボイス番号</Label>
                    <Input id="invoice-number" placeholder="T + 13桁の番号" data-testid="input-invoice-number" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">電話番号</Label>
                    <Input id="phone" type="tel" placeholder="例：03-1234-5678" data-testid="input-phone" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile">代表者携帯番号</Label>
                    <Input id="mobile" type="tel" placeholder="例：090-1234-5678" data-testid="input-mobile" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="office" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>事業所情報</CardTitle>
                <CardDescription>事業所の詳細情報を入力してください</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="industry">業種</Label>
                    <Select>
                      <SelectTrigger id="industry" data-testid="select-industry">
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manufacturing">製造業</SelectItem>
                        <SelectItem value="retail">小売業</SelectItem>
                        <SelectItem value="service">サービス業</SelectItem>
                        <SelectItem value="it">情報通信業</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employees">従業員数（人）</Label>
                    <Input id="employees" type="number" placeholder="例：50" data-testid="input-employees" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regular-employees">常用雇用者数（人）</Label>
                    <Input id="regular-employees" type="number" placeholder="例：40" data-testid="input-regular-employees" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-category">企業区分</Label>
                    <Select>
                      <SelectTrigger id="company-category" data-testid="select-company-category">
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">小規模事業者</SelectItem>
                        <SelectItem value="medium">中小企業</SelectItem>
                        <SelectItem value="midsize">中堅企業</SelectItem>
                        <SelectItem value="large">大企業</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="engagement-type">関与区分</Label>
                    <Select>
                      <SelectTrigger id="engagement-type" data-testid="select-engagement-type">
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">関与先</SelectItem>
                        <SelectItem value="past">（旧）関与先</SelectItem>
                        <SelectItem value="seminar">セミナー系関与先</SelectItem>
                        <SelectItem value="onetime">一見先</SelectItem>
                        <SelectItem value="none">非関与先</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="engagement-date">関与年月日</Label>
                    <Input id="engagement-date" type="date" data-testid="input-engagement-date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="withdrawal-date">離脱年月日</Label>
                    <Input id="withdrawal-date" type="date" data-testid="input-withdrawal-date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="withdrawal-reason">離脱理由</Label>
                    <Select>
                      <SelectTrigger id="withdrawal-reason" data-testid="select-withdrawal-reason">
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completion">契約満了</SelectItem>
                        <SelectItem value="closure">廃業・解散・倒産</SelectItem>
                        <SelectItem value="other">その他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="withdrawal-detail">離脱理由（詳細）</Label>
                    <Textarea id="withdrawal-detail" placeholder="詳細な理由を記入してください" data-testid="textarea-withdrawal-detail" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="closure-date">廃業年月日</Label>
                    <Input id="closure-date" type="date" data-testid="input-closure-date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postal-code">郵便番号</Label>
                    <Input id="postal-code" placeholder="例：100-0001" data-testid="input-postal-code" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">事業所所在地</Label>
                    <Input id="address" placeholder="例：東京都千代田区千代田1-1" data-testid="input-address" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="founded-date">創業年月日</Label>
                    <Input id="founded-date" type="date" data-testid="input-founded-date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="office-phone">電話番号</Label>
                    <Input id="office-phone" type="tel" placeholder="例：03-1234-5678" data-testid="input-office-phone" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fax">FAX番号</Label>
                    <Input id="fax" type="tel" placeholder="例：03-1234-5679" data-testid="input-fax" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url">URL</Label>
                    <Input id="url" type="url" placeholder="https://example.com" data-testid="input-url" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email1">メールアドレス1</Label>
                    <Input id="email1" type="email" placeholder="info@example.com" data-testid="input-email1" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email2">メールアドレス2</Label>
                    <Input id="email2" type="email" data-testid="input-email2" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email3">メールアドレス3</Label>
                    <Input id="email3" type="email" data-testid="input-email3" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sns1">SNSアカウント1</Label>
                    <Input id="sns1" placeholder="例：@company" data-testid="input-sns1" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sns2">SNSアカウント2</Label>
                    <Input id="sns2" data-testid="input-sns2" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sns3">SNSアカウント3</Label>
                    <Input id="sns3" data-testid="input-sns3" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="referral">紹介先</Label>
                    <Input id="referral" placeholder="紹介元を記入してください" data-testid="input-referral" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>個人情報</CardTitle>
                <CardDescription>事業所に関連する個人情報を入力してください</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="person-code">個人コード</Label>
                    <Input id="person-code" placeholder="例：PER-001" data-testid="input-person-code" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="person-name">氏名</Label>
                    <Input id="person-name" placeholder="例：田中一郎" data-testid="input-person-name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="person-kana">フリガナ</Label>
                    <Input id="person-kana" placeholder="例：タナカイチロウ" data-testid="input-person-kana" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">性別</Label>
                    <Select>
                      <SelectTrigger id="gender" data-testid="select-gender">
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">男性</SelectItem>
                        <SelectItem value="female">女性</SelectItem>
                        <SelectItem value="other">その他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birth-date">生年月日</Label>
                    <Input id="birth-date" type="date" data-testid="input-birth-date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="person-category">個人区分</Label>
                    <Select>
                      <SelectTrigger id="person-category" data-testid="select-person-category">
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="representative">代表者</SelectItem>
                        <SelectItem value="family">家族</SelectItem>
                        <SelectItem value="executive">役員</SelectItem>
                        <SelectItem value="employee">従業員</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="person-phone">電話番号</Label>
                    <Input id="person-phone" type="tel" data-testid="input-person-phone" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="person-fax">FAX番号</Label>
                    <Input id="person-fax" type="tel" data-testid="input-person-fax" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="person-mobile">携帯電話</Label>
                    <Input id="person-mobile" type="tel" data-testid="input-person-mobile" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="person-email1">メールアドレス1</Label>
                    <Input id="person-email1" type="email" data-testid="input-person-email1" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="person-email2">メールアドレス2</Label>
                    <Input id="person-email2" type="email" data-testid="input-person-email2" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="person-email3">メールアドレス3</Label>
                    <Input id="person-email3" type="email" data-testid="input-person-email3" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="person-sns1">SNSアカウント1</Label>
                    <Input id="person-sns1" data-testid="input-person-sns1" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="person-sns2">SNSアカウント2</Label>
                    <Input id="person-sns2" data-testid="input-person-sns2" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="person-sns3">SNSアカウント3</Label>
                    <Input id="person-sns3" data-testid="input-person-sns3" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org1">加入団体1</Label>
                    <Input id="org1" data-testid="input-org1" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org2">加入団体2</Label>
                    <Input id="org2" data-testid="input-org2" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org3">加入団体3</Label>
                    <Input id="org3" data-testid="input-org3" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org4">加入団体4</Label>
                    <Input id="org4" data-testid="input-org4" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org5">加入団体5</Label>
                    <Input id="org5" data-testid="input-org5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => setLocation("/search")} data-testid="button-cancel">
            キャンセル
          </Button>
          <Button type="submit" data-testid="button-save">
            <Save className="mr-2 h-4 w-4" />
            保存
          </Button>
        </div>
      </form>
    </div>
  );
}
