import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { type Audit } from "@shared/schema";

interface PricingSectionProps {
  auditId?: string;
}

export default function PricingSection({ auditId }: PricingSectionProps) {
  const { data: audit } = useQuery<Audit>({
    queryKey: ["/api/audit", auditId],
    enabled: !!auditId
  });

  // Only show pricing after audit is completed
  if (!audit || audit.status !== "completed") {
    return null;
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-neutral-900 mb-4">
            Ready to Boost Your Media Presence?
          </h2>
          <p className="text-xl text-neutral-600 mb-8">
            Choose a professional PR solution to build credibility and visibility across major media outlets.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* PR Starter */}
          <Card className="bg-white rounded-2xl border border-neutral-200 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-in-out group">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-neutral-900 mb-2">PR Starter</h3>
                <p className="text-neutral-600 mb-6">Perfect for small businesses getting started with PR</p>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-neutral-900">$999</span>
                  <span className="text-neutral-600 ml-2">/ company</span>
                </div>
                
                <p className="text-sm text-neutral-500 mb-6">One-time analysis • Complete audit report</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start hover:text-brand-blue transition-colors duration-200">
                  <Check className="w-5 h-5 text-brand-green mt-0.5 mr-3 flex-shrink-0 hover:scale-110 transition-transform duration-200" />
                  <span className="text-neutral-700">1 Press Release Syndication</span>
                </div>
                <div className="flex items-start">
                  <Check className="w-5 h-5 text-brand-green mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-neutral-700">Yahoo & AP News Distribution</span>
                </div>
                <div className="flex items-start">
                  <Check className="w-5 h-5 text-brand-green mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-neutral-700">Basic Media Monitoring</span>
                </div>
                <div className="flex items-start">
                  <Check className="w-5 h-5 text-brand-green mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-neutral-700">400+ Guaranteed Links</span>
                </div>
                <div className="flex items-start">
                  <Check className="w-5 h-5 text-brand-green mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-neutral-700">Monthly Performance Report</span>
                </div>
                <div className="flex items-start">
                  <Check className="w-5 h-5 text-brand-green mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-neutral-700">Email Support</span>
                </div>
              </div>

              <Button 
                size="lg" 
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-semibold py-4"
                onClick={() => window.open('https://pressviz.com/#contact-us', '_blank')}
              >
                Start with PR Starter →
              </Button>
            </CardContent>
          </Card>

          {/* All-in-One PR */}
          <Card className="bg-white rounded-2xl border-2 border-brand-blue shadow-xl relative hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 ease-in-out group">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-brand-blue text-white px-4 py-1 text-sm font-medium">
                ⭐ Most Popular
              </Badge>
            </div>
            
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-neutral-900 mb-2">All-in-One PR</h3>
                <p className="text-neutral-600 mb-6">Comprehensive PR solution for growing companies</p>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-neutral-900">$3,500</span>
                  <span className="text-neutral-600 ml-2">/ company</span>
                </div>
                
                <p className="text-sm text-neutral-500 mb-6">Comprehensive analysis • Full service package</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <Check className="w-5 h-5 text-brand-green mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-neutral-700">3 Press Releases + Editorial Pitches</span>
                </div>
                <div className="flex items-start">
                  <Check className="w-5 h-5 text-brand-green mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-neutral-700">Full Syndication Network (400+ outlets)</span>
                </div>
                <div className="flex items-start">
                  <Check className="w-5 h-5 text-brand-green mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-neutral-700">Custom Story Development</span>
                </div>
                <div className="flex items-start">
                  <Check className="w-5 h-5 text-brand-green mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-neutral-700">Direct Journalist Outreach</span>
                </div>
                <div className="flex items-start">
                  <Check className="w-5 h-5 text-brand-green mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-neutral-700">15–20 Guaranteed Editorial Links</span>
                </div>
                <div className="flex items-start">
                  <Check className="w-5 h-5 text-brand-green mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-neutral-700">Weekly Performance Reports</span>
                </div>
                <div className="flex items-start">
                  <Check className="w-5 h-5 text-brand-green mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-neutral-700">Dedicated Account Manager</span>
                </div>
                <div className="flex items-start">
                  <Check className="w-5 h-5 text-brand-green mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-neutral-700">Strategy Calls & Priority Support</span>
                </div>
              </div>

              <Button 
                size="lg" 
                className="w-full bg-brand-blue hover:bg-blue-700 text-white font-semibold py-4"
                onClick={() => window.open('https://pressviz.com/#contact-us', '_blank')}
              >
                Go All-In →
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}