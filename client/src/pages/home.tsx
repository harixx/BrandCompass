import { useState } from "react";
import AuditForm from "@/components/audit-form";
import LoadingSection from "@/components/loading-section";
import ResultsSection from "@/components/results-section";
import StrategySection from "@/components/strategy-section";
import PricingSection from "@/components/pricing-section";
import { Search } from "lucide-react";

export default function Home() {
  const [auditId, setAuditId] = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState(false);

  const handleAuditStart = (id: string) => {
    setAuditId(id);
  };

  const handleShowPricing = () => {
    setShowPricing(true);
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
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowPricing(true)}
                className="text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => setShowPricing(true)}
                className="text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Pricing
              </button>
              <button className="bg-brand-blue text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                Sign In
              </button>
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
      {auditId && <ResultsSection auditId={auditId} onShowPricing={handleShowPricing} />}

      {/* Strategy Section */}
      {auditId && <StrategySection auditId={auditId} />}

      {/* Pricing Section */}
      {showPricing && <PricingSection />}

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-neutral-900">BrandScope</span>
              </div>
              <p className="text-neutral-600">
                Analyze and amplify your brand's digital media presence across major publications.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900 mb-4">Product</h4>
              <ul className="space-y-2 text-neutral-600">
                <li><button className="hover:text-neutral-900">Features</button></li>
                <li><button className="hover:text-neutral-900">Pricing</button></li>
                <li><button className="hover:text-neutral-900">API</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900 mb-4">Company</h4>
              <ul className="space-y-2 text-neutral-600">
                <li><button className="hover:text-neutral-900">About</button></li>
                <li><button className="hover:text-neutral-900">Blog</button></li>
                <li><button className="hover:text-neutral-900">Contact</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900 mb-4">Support</h4>
              <ul className="space-y-2 text-neutral-600">
                <li><button className="hover:text-neutral-900">Help Center</button></li>
                <li><button className="hover:text-neutral-900">Privacy</button></li>
                <li><button className="hover:text-neutral-900">Terms</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-200 pt-8 mt-8 text-center text-neutral-600">
            <p>&copy; 2024 BrandScope. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
