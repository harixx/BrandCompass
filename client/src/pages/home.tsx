import { useState } from "react";
import AuditForm from "@/components/audit-form";
import LoadingSection from "@/components/loading-section";
import ResultsSection from "@/components/results-section";
import PricingSection from "@/components/pricing-section";
import { Search } from "lucide-react";

export default function Home() {
  const [auditId, setAuditId] = useState<string | null>(null);

  const handleAuditStart = (id: string) => {
    setAuditId(id);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-neutral-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-neutral-900">BrandScope</span>
            </div>
            <div className="text-sm text-neutral-600">
              Free Brand PR Analysis Tool
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      {!auditId && (
        <section className="py-20 bg-gradient-to-br from-white to-neutral-50">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold text-neutral-900 mb-6 leading-tight">
              Analyze Your Brand's<br />
              <span className="text-brand-blue">Digital Media Presence</span>
            </h1>
            <p className="text-xl text-neutral-600 mb-12 max-w-2xl mx-auto">
              Discover where your brand is mentioned across 30+ major news publications. Get actionable insights and PR recommendations in minutes.
            </p>
            
            <AuditForm onAuditStart={handleAuditStart} />
          </div>
        </section>
      )}

      {/* Loading Section */}
      {auditId && <LoadingSection auditId={auditId} />}

      {/* Results Section */}
      {auditId && <ResultsSection auditId={auditId} />}

      {/* Pricing Section - Only show after audit completion */}
      {auditId && <PricingSection auditId={auditId} />}

    </div>
  );
}
