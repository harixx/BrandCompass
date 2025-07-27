import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { type Audit } from "@shared/schema";

interface LoadingSectionProps {
  auditId: string;
}

export default function LoadingSection({ auditId }: LoadingSectionProps) {
  const { data: audit } = useQuery<Audit>({
    queryKey: ["/api/audit", auditId],
    refetchInterval: 2000,
    enabled: !!auditId
  });

  if (audit?.status !== "processing") {
    return null;
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <Card className="bg-white rounded-2xl shadow-xl border border-neutral-100">
          <CardContent className="p-12">
            <div className="animate-spin w-16 h-16 border-4 border-brand-blue border-t-transparent rounded-full mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              Auditing Your Brand Presence...
            </h2>
            <p className="text-neutral-600 mb-8">
              Searching across {audit?.totalPublications || 30}+ major news publications
            </p>
            
            <div className="space-y-3 max-w-md mx-auto">
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <span className="text-sm text-neutral-700">finance.yahoo.com</span>
                <Check className="w-5 h-5 text-brand-green" />
              </div>
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <span className="text-sm text-neutral-700">marketwatch.com</span>
                <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
              </div>
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg opacity-50">
                <span className="text-sm text-neutral-700">apnews.com</span>
                <div className="w-4 h-4 border-2 border-neutral-200 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
