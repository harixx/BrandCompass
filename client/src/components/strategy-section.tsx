import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, Target, TrendingUp, ArrowRight, CheckCircle } from "lucide-react";
import { type Audit, type AuditStrategy } from "@shared/schema";

interface StrategySectionProps {
  auditId: string;
}

export default function StrategySection({ auditId }: StrategySectionProps) {
  const { data: audit } = useQuery<Audit>({
    queryKey: ["/api/audit", auditId],
    refetchInterval: 2000,
    enabled: !!auditId
  });

  if (!audit || audit.status !== "completed" || !audit.strategy) {
    return null;
  }

  const strategy = audit.strategy as AuditStrategy;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-neutral-900 mb-4">Personalized PR Strategy</h2>
          <p className="text-xl text-neutral-600">AI-generated recommendations based on your audit results</p>
        </div>

        <Card className="bg-gradient-to-br from-brand-blue to-blue-600 rounded-2xl text-white mb-12">
          <CardContent className="p-8">
            <div className="flex items-start space-x-4">
              <div className="bg-white bg-opacity-20 rounded-lg p-3 flex-shrink-0">
                <Lightbulb className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">Key Insights for Your Brand</h3>
                <div className="space-y-3 text-blue-100">
                  {strategy.insights.map((insight, index) => (
                    <p key={index}>• {insight}</p>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-neutral-50 rounded-xl border border-neutral-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-brand-blue" />
                Priority Targets
              </h3>
              <ul className="space-y-3">
                {strategy.priorityTargets.map((target, index) => (
                  <li key={index} className="flex items-center text-neutral-700">
                    <ArrowRight className="w-4 h-4 mr-2 text-brand-green" />
                    {target}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-neutral-50 rounded-xl border border-neutral-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-brand-green" />
                Recommended Actions
              </h3>
              <ul className="space-y-3">
                {strategy.actions.map((action, index) => (
                  <li key={index} className="flex items-center text-neutral-700">
                    <CheckCircle className="w-4 h-4 mr-2 text-brand-green" />
                    {action}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
