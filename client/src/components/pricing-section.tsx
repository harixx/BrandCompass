import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Check } from "lucide-react";
import { PRICING_PLANS } from "@/lib/constants";

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  const getPrice = (monthlyPrice: number) => {
    return isYearly ? Math.round(monthlyPrice * 12 * 0.8) : monthlyPrice;
  };

  const getBillingCycle = () => {
    return isYearly ? "yearly" : "monthly";
  };

  return (
    <section className="py-20 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-neutral-900 mb-4">Ready to Boost Your PR?</h2>
          <p className="text-xl text-neutral-600 mb-8">Choose the perfect plan to amplify your brand's media presence</p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4">
            <span className={`text-neutral-600 ${!isYearly ? 'font-semibold' : ''}`}>Monthly</span>
            <Switch 
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-brand-blue"
            />
            <span className={`text-neutral-600 ${isYearly ? 'font-semibold' : ''}`}>
              Yearly <span className="text-brand-green text-sm font-medium">(Save 20%)</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* PR Starter Plan */}
          <Card className="bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-8">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-neutral-900 mb-2">{PRICING_PLANS.starter.name}</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-4xl font-bold text-neutral-900">
                    ${getPrice(PRICING_PLANS.starter.price).toLocaleString()}
                  </span>
                  <span className="text-neutral-600 ml-2">/ {getBillingCycle()}</span>
                </div>
                <p className="text-neutral-600">Perfect for small businesses getting started with PR</p>
              </div>

              <ul className="space-y-4 mb-8">
                {PRICING_PLANS.starter.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="w-5 h-5 text-brand-green mr-3 flex-shrink-0" />
                    <span className="text-neutral-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button className="w-full bg-neutral-900 text-white hover:bg-neutral-800 transition-colors py-3">
                Start with PR Starter
              </Button>
              <p className="text-center text-sm text-neutral-500 mt-3">
                Billed {getBillingCycle()} • Cancel anytime
              </p>
            </CardContent>
          </Card>

          {/* All-in-One PR Plan */}
          <Card className="bg-gradient-to-br from-brand-blue to-blue-600 rounded-2xl text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-white bg-opacity-20 rounded-full px-3 py-1">
              <span className="text-xs font-medium">POPULAR</span>
            </div>
            
            <CardContent className="p-8">
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">{PRICING_PLANS.allinone.name}</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-4xl font-bold">
                    ${getPrice(PRICING_PLANS.allinone.price).toLocaleString()}
                  </span>
                  <span className="text-blue-100 ml-2">/ {getBillingCycle()}</span>
                </div>
                <p className="text-blue-100">Complete PR solution for serious growth</p>
              </div>

              <ul className="space-y-4 mb-8">
                {PRICING_PLANS.allinone.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                    <span className="text-blue-50">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button className="w-full bg-white text-brand-blue hover:bg-neutral-50 transition-colors py-3 font-semibold">
                Go All-In
              </Button>
              <p className="text-center text-sm text-blue-100 mt-3">
                Billed {getBillingCycle()} • Cancel anytime
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Trust Signals */}
        <div className="mt-16 text-center">
          <p className="text-neutral-600 mb-8">Trusted by 1000+ brands to amplify their media presence</p>
          <div className="flex items-center justify-center space-x-8 opacity-60">
            <div className="w-24 h-8 bg-neutral-300 rounded flex items-center justify-center">
              <span className="text-xs font-medium text-neutral-600">Yahoo</span>
            </div>
            <div className="w-24 h-8 bg-neutral-300 rounded flex items-center justify-center">
              <span className="text-xs font-medium text-neutral-600">AP News</span>
            </div>
            <div className="w-24 h-8 bg-neutral-300 rounded flex items-center justify-center">
              <span className="text-xs font-medium text-neutral-600">MarketWatch</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
