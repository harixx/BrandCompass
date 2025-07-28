import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Shield, Zap, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { auditForm, type AuditForm } from "@shared/schema";

interface AuditFormProps {
  onAuditStart: (auditId: string) => void;
}

export default function AuditForm({ onAuditStart }: AuditFormProps) {
  const { toast } = useToast();
  
  const form = useForm<AuditForm>({
    resolver: zodResolver(auditForm),
    defaultValues: {
      brandName: "",
      websiteUrl: ""
    }
  });

  const startAuditMutation = useMutation({
    mutationFn: async (data: AuditForm) => {
      const response = await apiRequest("POST", "/api/audit", data);
      return response.json();
    },
    onSuccess: (data) => {
      onAuditStart(data.auditId);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start audit",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: AuditForm) => {
    startAuditMutation.mutate(data);
  };

  return (
    <Card className="bg-white rounded-2xl shadow-xl max-w-md mx-auto border border-neutral-100">
      <CardContent className="pt-8 pb-8">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label className="block text-sm font-medium text-neutral-700 mb-2">
              Brand Name
            </Label>
            <Input
              {...form.register("brandName")}
              placeholder="Enter your brand name"
              className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all"
            />
            {form.formState.errors.brandName && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.brandName.message}
              </p>
            )}
            <div className="text-xs text-neutral-500 mt-1">
              We'll search for exact matches of this name
            </div>
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-neutral-700 mb-2">
              Website URL
            </Label>
            <Input
              {...form.register("websiteUrl")}
              placeholder="https://yourbrand.com"
              className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all"
            />
            {form.formState.errors.websiteUrl && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.websiteUrl.message}
              </p>
            )}
            <div className="text-xs text-neutral-500 mt-1">
              Used for verification and context
            </div>
          </div>
          
          <Button
            type="submit"
            disabled={startAuditMutation.isPending}
            className="w-full bg-brand-blue text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-600 transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Play className="w-5 h-5" />
            <span>{startAuditMutation.isPending ? "Starting..." : "Run PR Audit"}</span>
          </Button>
        </form>
        
        <div className="mt-6 flex items-center justify-center space-x-4 text-sm text-neutral-500">
          <div className="flex items-center space-x-1 hover:text-brand-blue transition-colors duration-200 cursor-default">
            <Shield className="w-4 h-4 hover:scale-110 transition-transform duration-200" />
            <span>Secure</span>
          </div>
          <div className="flex items-center space-x-1 hover:text-brand-blue transition-colors duration-200 cursor-default">
            <Zap className="w-4 h-4 hover:scale-110 transition-transform duration-200" />
            <span>Fast Results</span>
          </div>
          <div className="flex items-center space-x-1 hover:text-brand-blue transition-colors duration-200 cursor-default">
            <Check className="w-4 h-4 hover:scale-110 transition-transform duration-200" />
            <span>30+ Sources</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
