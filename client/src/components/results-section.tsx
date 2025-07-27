import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Globe, TrendingUp, Percent, Award, Check, X } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts";
import { useState } from "react";
import { type Audit, type AuditResult } from "@shared/schema";

interface ResultsSectionProps {
  auditId: string;
  onShowPricing: () => void;
}

export default function ResultsSection({ auditId, onShowPricing }: ResultsSectionProps) {
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  
  const { data: audit } = useQuery<Audit>({
    queryKey: ["/api/audit", auditId],
    refetchInterval: 2000,
    enabled: !!auditId
  });

  if (!audit || audit.status === "processing") {
    return null;
  }

  if (audit.status === "failed") {
    // Check if it's a credits issue
    const isCreditsIssue = true; // This would be determined from the error
    
    return (
      <section className="py-20 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Card className="bg-white rounded-2xl shadow-xl border border-neutral-100">
            <CardContent className="p-12">
              <div className="text-red-500 mb-4">
                <X className="w-16 h-16 mx-auto" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                {isCreditsIssue ? "Credits Exhausted" : "Audit Failed"}
              </h2>
              <p className="text-neutral-600 mb-8">
                {isCreditsIssue 
                  ? "You've reached your included credits. Please add your own SerpAPI key to continue."
                  : "We encountered an error while processing your audit. Please try again."
                }
              </p>
              <Button 
                onClick={() => setShowCreditsModal(true)}
                className="bg-brand-blue text-white hover:bg-blue-600"
              >
                {isCreditsIssue ? "Add API Key" : "Try Again"}
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <Dialog open={showCreditsModal} onOpenChange={setShowCreditsModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Your SerpAPI Key</DialogTitle>
              <DialogDescription>
                You've reached your included credits. Please add your own SerpAPI key to continue processing audits.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-neutral-600">
                Get your API key from <a href="https://serpapi.com" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">serpapi.com</a>
              </p>
              <Button onClick={() => setShowCreditsModal(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    );
  }

  const results = (audit.results as AuditResult[]) || [];
  const mentionedResults = results.filter(r => r.brandMentioned);
  
  // Prepare chart data
  const pieData = [
    { name: 'Mentioned', value: audit.mentionsFound || 0, color: '#10B981' },
    { name: 'Not Mentioned', value: (audit.totalPublications || 0) - (audit.mentionsFound || 0), color: '#F3F4F6' }
  ];

  const barData = mentionedResults.slice(0, 5).map(result => ({
    name: result.domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('.')[0],
    mentions: 1
  }));

  return (
    <section className="py-20 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-neutral-900 mb-4">Your Brand Audit Results</h2>
          <p className="text-xl text-neutral-600">Comprehensive analysis across major media outlets</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-white rounded-xl border border-neutral-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-600">Publications Checked</span>
                <Globe className="w-5 h-5 text-brand-blue" />
              </div>
              <div className="text-3xl font-bold text-neutral-900">{audit.totalPublications}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-xl border border-neutral-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-600">Mentions Found</span>
                <TrendingUp className="w-5 h-5 text-brand-green" />
              </div>
              <div className="text-3xl font-bold text-neutral-900">{audit.mentionsFound}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-xl border border-neutral-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-600">Coverage Rate</span>
                <Percent className="w-5 h-5 text-brand-blue" />
              </div>
              <div className="text-3xl font-bold text-neutral-900">{audit.coverageRate}%</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-xl border border-neutral-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-600">Top Source</span>
                <Award className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="text-lg font-bold text-neutral-900">
                {audit.topSource || "None"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Coverage Donut Chart */}
          <Card className="bg-white rounded-xl border border-neutral-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-neutral-900">Coverage Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Mentions Bar Chart */}
          <Card className="bg-white rounded-xl border border-neutral-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-neutral-900">Top Mentions</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <BarChart data={barData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Bar dataKey="mentions" fill="#3B82F6" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Table */}
        <Card className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-neutral-200">
            <CardTitle className="text-lg font-semibold text-neutral-900">Detailed Results</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-neutral-50">
                    <TableHead className="px-6 py-3">Publication</TableHead>
                    <TableHead className="px-6 py-3">Mentioned</TableHead>
                    <TableHead className="px-6 py-3">Page Title</TableHead>
                    <TableHead className="px-6 py-3">Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result, index) => (
                    <TableRow key={index} className="hover:bg-neutral-50 transition-colors">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center">
                          <img 
                            src={result.logo || `https://www.google.com/s2/favicons?domain=${result.domain}&sz=32`} 
                            alt={result.domain}
                            className="w-8 h-8 rounded mr-3"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${result.domain}&sz=32`;
                            }}
                          />
                          <span className="text-sm font-medium text-neutral-900">{result.domain}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge 
                          variant={result.brandMentioned ? "default" : "secondary"}
                          className={result.brandMentioned 
                            ? "bg-brand-green bg-opacity-10 text-brand-green hover:bg-brand-green hover:bg-opacity-20" 
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                          }
                        >
                          {result.brandMentioned ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                          {result.brandMentioned ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {result.brandMentioned && result.title ? (
                          <div className="text-sm text-neutral-900">{result.title}</div>
                        ) : (
                          <span className="text-sm text-neutral-500">No mentions found</span>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {result.brandMentioned && result.url ? (
                          <a 
                            href={result.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-brand-blue hover:underline"
                          >
                            View Article
                          </a>
                        ) : (
                          <span className="text-sm text-neutral-500">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* CTA to Pricing */}
        <div className="text-center mt-12">
          <Button
            onClick={onShowPricing}
            className="bg-brand-blue text-white hover:bg-blue-600 px-8 py-3 text-lg"
          >
            Boost Your PR Presence
          </Button>
        </div>
      </div>
    </section>
  );
}
