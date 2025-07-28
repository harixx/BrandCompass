import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Globe, TrendingUp, Percent, Award, Check, X, Download, Share2, BarChart3 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

import { useState } from "react";
import { type Audit, type AuditResult, NEWS_PUBLICATIONS } from "@shared/schema";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ResultsSectionProps {
  auditId: string;
}

export default function ResultsSection({ auditId }: ResultsSectionProps) {
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const { data: audit } = useQuery<Audit>({
    queryKey: ["/api/audit", auditId],
    refetchInterval: (query) => {
      // Smart polling: faster when processing, slower when completed
      if (!query.state.data) return 1000;
      if (query.state.data.status === "processing") return 3000; // Reduced from 2000ms
      if (query.state.data.status === "completed" || query.state.data.status === "failed") return false; // Stop polling
      return 5000; // Default slower polling
    },
    enabled: !!auditId,
    staleTime: 1000 // Consider data stale after 1 second
  });

  const handleDownloadPDF = async () => {
    const element = document.getElementById('audit-results');
    if (!element) return;

    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF();
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    pdf.save(`${audit?.brandName || 'brand'}-brand-audit.pdf`);
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const copyShareLink = () => {
    if (audit?.shareableLink) {
      navigator.clipboard.writeText(audit.shareableLink);
    }
  };

  if (!audit) {
    return null;
  }

  if (audit.status === "failed") {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Analysis Failed</h2>
          <p className="text-neutral-600 mb-4">
            We encountered an issue while analyzing your brand presence. This might be due to API limitations.
          </p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </section>
    );
  }

  if (audit.status !== "completed") {
    return null;
  }

  const results = (audit.results as AuditResult[]) || [];
  const mentionedResults = results.filter(r => r.brandMentioned);
  


  return (
    <section className="py-20 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-blue rounded-2xl flex items-center justify-center mx-auto mb-4 hover:scale-110 hover:shadow-lg transition-all duration-300 ease-in-out cursor-default">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-neutral-900 mb-4">Your Brand Audit Results</h2>
          <p className="text-xl text-neutral-600 mb-6">Here's how {audit.brandName} appears across major news publications and media outlets.</p>
          
          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </Button>
            <Button
              onClick={handleShare}
              variant="outline" 
              className="flex items-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Report</span>
            </Button>
          </div>
        </div>

        <div id="audit-results">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <Card className="bg-white rounded-xl border border-neutral-200 shadow-sm text-center p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-in-out group">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-blue-200 transition-all duration-200">
                <Globe className="w-6 h-6 text-brand-blue" />
              </div>
              <div className="text-sm font-medium text-neutral-600 mb-1">Publications Checked</div>
              <div className="text-3xl font-bold text-neutral-900 mb-1">{audit.totalPublications}</div>
              <div className="text-xs text-neutral-500">Major news outlets</div>
            </Card>
            
            <Card className="bg-white rounded-xl border border-neutral-200 shadow-sm text-center p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-in-out group">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-green-200 transition-all duration-200">
                <Check className="w-6 h-6 text-brand-green" />
              </div>
              <div className="text-sm font-medium text-neutral-600 mb-1">Mentions Found</div>
              <div className="text-3xl font-bold text-neutral-900 mb-1">{audit.mentionsFound}</div>
              <div className="text-xs text-neutral-500">{audit.coverageRate}% coverage</div>
            </Card>
            
            <Card className="bg-white rounded-xl border border-neutral-200 shadow-sm text-center p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-in-out group">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-yellow-200 transition-all duration-200">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="text-sm font-medium text-neutral-600 mb-1">Missed Opportunities</div>
              <div className="text-3xl font-bold text-neutral-900 mb-1">{(audit.totalPublications || 0) - (audit.mentionsFound || 0)}</div>
              <div className="text-xs text-neutral-500">Potential placements</div>
            </Card>
            
            <Card className="bg-white rounded-xl border border-neutral-200 shadow-sm text-center p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-in-out group">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-red-200 transition-all duration-200">
                <Percent className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-sm font-medium text-neutral-600 mb-1">Coverage Score</div>
              <div className="text-3xl font-bold text-neutral-900 mb-1">{audit.coverageRate}%</div>
              <div className="text-xs text-neutral-500">Industry benchmark: 25%</div>
            </Card>
          </div>

          {/* Coverage Analysis Pie Chart */}
          <Card className="bg-white rounded-xl border border-neutral-200 shadow-sm mb-12 hover:shadow-lg transition-all duration-300 ease-in-out">
            <CardHeader>
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <BarChart3 className="w-6 h-6 text-brand-blue" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-neutral-900">Coverage Analysis</CardTitle>
                  <p className="text-neutral-600">Visual breakdown of your brand's media presence</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                {/* Pie Chart */}
                <div className="lg:col-span-2">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { 
                              name: 'Mentions Found', 
                              value: audit.mentionsFound || 0, 
                              color: '#10B981',
                              description: 'Publications featuring your brand'
                            },
                            { 
                              name: 'Missed Opportunities', 
                              value: (audit.totalPublications || 0) - (audit.mentionsFound || 0), 
                              color: '#F59E0B',
                              description: 'Publications without brand mentions'
                            }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          innerRadius={60}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {[
                            { color: '#10B981' },
                            { color: '#F59E0B' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number, name: string) => [
                            `${value} publications`,
                            name
                          ]}
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          formatter={(value: string) => (
                            <span className="text-sm font-medium text-neutral-700">{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Statistics */}
                <div className="space-y-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-800 mb-1">{audit.mentionsFound || 0}</div>
                    <div className="text-sm font-medium text-green-700 mb-1">Mentions Found</div>
                    <div className="text-xs text-green-600">{audit.coverageRate}% coverage</div>
                  </div>

                  <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-2xl font-bold text-yellow-800 mb-1">
                      {(audit.totalPublications || 0) - (audit.mentionsFound || 0)}
                    </div>
                    <div className="text-sm font-medium text-yellow-700 mb-1">Missed Opportunities</div>
                    <div className="text-xs text-yellow-600">Potential placements</div>
                  </div>

                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-800 mb-1">{audit.coverageRate}%</div>
                    <div className="text-sm font-medium text-blue-700 mb-1">Coverage Score</div>
                    <div className="text-xs text-blue-600">Industry benchmark: 25%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results Table */}
          <Card className="bg-white rounded-xl border border-neutral-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-neutral-900">
                Detailed Publication Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-neutral-200">
                      <TableHead className="text-left font-semibold text-neutral-900">Publication</TableHead>
                      <TableHead className="text-left font-semibold text-neutral-900">Brand Mentioned</TableHead>
                      <TableHead className="text-left font-semibold text-neutral-900">Article Title</TableHead>
                      <TableHead className="text-left font-semibold text-neutral-900">Link</TableHead>
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
                            <span className="text-sm font-medium text-neutral-900">
                              {NEWS_PUBLICATIONS.find(p => p.domain === result.domain)?.name || result.domain}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge 
                            variant={result.brandMentioned ? "default" : "secondary"}
                            className={result.brandMentioned ? "bg-brand-green text-white" : "bg-neutral-200 text-neutral-700"}
                          >
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
        </div>

        <Dialog open={showCreditsModal} onOpenChange={setShowCreditsModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>API Credits Exhausted</DialogTitle>
              <DialogDescription>
                Your search credits have been exhausted. Please try again later or upgrade your plan.
              </DialogDescription>
            </DialogHeader>
            <div className="text-center py-4">
              <p className="text-neutral-600 mb-4">
                We've successfully analyzed {results.length} publications before running out of API credits.
              </p>
              <Button onClick={() => setShowCreditsModal(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Your Brand Audit Report</DialogTitle>
              <DialogDescription>
                Share this comprehensive analysis with your team or stakeholders.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-2 p-3 bg-neutral-50 rounded-lg">
                <input
                  type="text"
                  value={audit.shareableLink || ''}
                  readOnly
                  className="flex-1 bg-transparent border-none outline-none text-sm"
                />
                <Button size="sm" onClick={copyShareLink}>
                  Copy Link
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}