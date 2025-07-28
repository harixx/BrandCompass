import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Search, Globe, Zap, CheckCircle } from "lucide-react";
import { type Audit } from "@shared/schema";

interface LoadingSectionProps {
  auditId: string;
}

export default function LoadingSection({ auditId }: LoadingSectionProps) {
  const { data: audit } = useQuery<Audit>({
    queryKey: ["/api/audit", auditId],
    refetchInterval: (query) => {
      if (!query.state.data) return 1000;
      if (query.state.data.status === "processing") return 2000;
      if (query.state.data.status === "completed" || query.state.data.status === "failed") return false;
      return 3000;
    },
    enabled: !!auditId
  });

  if (audit?.status !== "processing") {
    return null;
  }

  // Calculate real progress based on publications processed
  const totalPublications = audit.totalPublications || 30;
  const resultsProcessed = (audit.results as any[])?.length || 0;
  const progress = Math.round((resultsProcessed / totalPublications) * 100);
  const mentionsFound = audit.mentionsFound || 0;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <Card className="bg-white rounded-2xl shadow-xl border border-neutral-100">
          <CardContent className="p-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-2">
              Analyzing Your Media Presence
            </h2>
            <p className="text-neutral-600 mb-8">
              Scanning major publications and analyzing mentions with AI
            </p>
            
            <div className="mb-8">
              <Progress value={progress} className="w-full h-3 mb-4" />
              <p className="text-sm text-neutral-500 mb-2">{progress}% complete</p>
              <p className="text-sm text-neutral-600">
                {resultsProcessed > 0 
                  ? `Processed ${resultsProcessed}/${totalPublications} publications • ${mentionsFound} mentions found`
                  : "Starting analysis of major news outlets..."
                }
              </p>
            </div>
            
            <div className="space-y-4 max-w-lg mx-auto">
              <div className="flex items-center p-4 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 hover:shadow-md transition-all duration-300 ease-in-out">
                <div className="w-10 h-10 bg-brand-blue rounded-full flex items-center justify-center mr-4 hover:scale-110 transition-transform duration-200">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <span className="text-brand-blue font-medium flex-1 text-left">Scanning 30+ major news outlets</span>
              </div>
              
              <div className="flex items-center p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 hover:shadow-md transition-all duration-300 ease-in-out">
                <div className="w-10 h-10 bg-neutral-300 rounded-full flex items-center justify-center mr-4 hover:scale-110 hover:bg-neutral-400 transition-all duration-200">
                  <Globe className="w-5 h-5 text-neutral-600" />
                </div>
                <span className="text-neutral-600 flex-1 text-left">Analyzing brand mentions with AI</span>
              </div>
              
              <div className="flex items-center p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 hover:shadow-md transition-all duration-300 ease-in-out">
                <div className="w-10 h-10 bg-neutral-300 rounded-full flex items-center justify-center mr-4 hover:scale-110 hover:bg-neutral-400 transition-all duration-200">
                  <Zap className="w-5 h-5 text-neutral-600" />
                </div>
                <span className="text-neutral-600 flex-1 text-left">Processing coverage insights</span>
              </div>
              
              <div className="flex items-center p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 hover:shadow-md transition-all duration-300 ease-in-out">
                <div className="w-10 h-10 bg-neutral-300 rounded-full flex items-center justify-center mr-4 hover:scale-110 hover:bg-neutral-400 transition-all duration-200">
                  <CheckCircle className="w-5 h-5 text-neutral-600" />
                </div>
                <span className="text-neutral-600 flex-1 text-left">Generating strategic report</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
