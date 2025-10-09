import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { insertPersonSchema, type InsertPerson, type Person } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";

export default function PersonFormPage() {
  const { officeId, personId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isEditing = !!personId;

  const { data: person } = useQuery<Person>({
    queryKey: [`/api/persons/${personId}`],
    enabled: isEditing,
  });

  const form = useForm<InsertPerson>({
    resolver: zodResolver(insertPersonSchema),
    defaultValues: {
      officeId: officeId || "",
      name: "",
      nameKana: "",
      gender: "",
      code: "",
      personCategory: "",
      phone: "",
      mobile: "",
      email1: "",
      email2: "",
      email3: "",
      fax: "",
      sns1: "",
      sns2: "",
      sns3: "",
      organization1: "",
      organization2: "",
      organization3: "",
      organization4: "",
      organization5: "",
    },
  });

  // Reset form when person data is loaded
  useEffect(() => {
    if (person && isEditing) {
      form.reset(person);
    }
  }, [person, isEditing, form]);

  const createMutation = useMutation({
    mutationFn: (data: InsertPerson) => apiRequest("/api/persons", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/offices/${officeId}/persons`] });
      toast({
        title: "登録しました",
        description: "個人情報を登録しました",
      });
      setLocation(`/office/${officeId}/detail`);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "登録に失敗しました",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertPerson) => apiRequest(`/api/persons/${personId}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/offices/${officeId}/persons`] });
      toast({
        title: "更新しました",
        description: "個人情報を更新しました",
      });
      setLocation(`/office/${officeId}/detail`);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "更新に失敗しました",
      });
    },
  });

  const onSubmit = (data: InsertPerson) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate({ ...data, officeId: officeId || "" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation(`/office/${officeId}/detail`)}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">
          {isEditing ? "個人情報編集" : "個人情報登録"}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList>
              <TabsTrigger value="basic" data-testid="tab-basic">基本情報</TabsTrigger>
              <TabsTrigger value="contact" data-testid="tab-contact">連絡先</TabsTrigger>
              <TabsTrigger value="organization" data-testid="tab-organization">所属団体</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>基本情報</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>個人コード</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-person-code" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>氏名 *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nameKana"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>氏名（カナ）</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-name-kana" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>性別</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-gender">
                              <SelectValue placeholder="選択してください" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="男性">男性</SelectItem>
                            <SelectItem value="女性">女性</SelectItem>
                            <SelectItem value="その他">その他</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>生年月日</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} data-testid="input-birth-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="personCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>個人区分</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-person-category" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>連絡先</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>電話番号</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>携帯電話</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-mobile" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>FAX</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-fax" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>メールアドレス1</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} value={field.value || ""} data-testid="input-email1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>メールアドレス2</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} value={field.value || ""} data-testid="input-email2" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email3"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>メールアドレス3</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} value={field.value || ""} data-testid="input-email3" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sns1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SNS1</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-sns1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sns2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SNS2</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-sns2" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sns3"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SNS3</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-sns3" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="organization" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>所属団体</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="organization1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>所属団体1</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-org1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="organization2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>所属団体2</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-org2" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="organization3"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>所属団体3</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-org3" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="organization4"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>所属団体4</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-org4" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="organization5"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>所属団体5</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-org5" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation(`/office/${officeId}/detail`)}
              data-testid="button-cancel"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-submit"
            >
              {createMutation.isPending || updateMutation.isPending ? "処理中..." : isEditing ? "更新" : "登録"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
