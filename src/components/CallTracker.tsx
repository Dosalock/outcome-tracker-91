import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Edit2, Phone, RotateCcw, Languages, Download } from 'lucide-react';
import { useCallTracker } from '@/hooks/useCallTracker';
import { CallOutcome } from '@/types/call-tracker';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { CallActivityGrid } from './CallActivityGrid';

const getCallOutcomes = (t: (key: string) => string): { value: CallOutcome; label: string; color: string }[] => [
  { value: 'yes-needs-confirmation', label: t('yes-needs-confirmation'), color: 'bg-success hover:bg-success-light' },
  { value: 'confirmed-sale', label: t('confirmed-sale'), color: 'bg-success hover:bg-success-light' },
  { value: 'no', label: t('no'), color: 'bg-danger hover:bg-danger-light' },
  { value: 'absolutely-no', label: t('absolutely-no'), color: 'bg-danger hover:bg-danger-light' },
  { value: 'hangup', label: t('hangup'), color: 'bg-danger hover:bg-danger-light' },
  { value: 'call-later', label: t('call-later'), color: 'bg-info hover:bg-info-light' },
  { value: 'call-in-2-months', label: t('call-in-2-months'), color: 'bg-info hover:bg-info-light' },
  { value: 'sickness-medicine', label: t('sickness-medicine'), color: 'bg-danger hover:bg-danger-light' },
  { value: 'already-customer', label: t('already-customer'), color: 'bg-danger hover:bg-danger-light' },
  { value: 'not-enough-money', label: t('not-enough-money'), color: 'bg-danger hover:bg-danger-light' },
  { value: 'language-difficulties', label: t('language-difficulties'), color: 'bg-warning hover:bg-warning-light' },
  { value: 'wrong-number', label: t('wrong-number'), color: 'bg-warning hover:bg-warning-light' },
  { value: 'dnc', label: t('dnc'), color: 'bg-danger hover:bg-danger-light' },
];

export const CallTracker: React.FC = () => {
  const { calls, addCall, updateCall, deleteCall, startNewSession, stats } = useCallTracker();
  const { language, setLanguage, t } = useLanguage();
  const [notes, setNotes] = useState('');
  const [editingCall, setEditingCall] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');

  const CALL_OUTCOMES = getCallOutcomes(t);

  const handleAddCall = (outcome: CallOutcome) => {
    console.log('Adding call with outcome:', outcome);
    addCall(outcome, notes.trim() || undefined);
    setNotes('');
    console.log('Call added, current calls count:', calls.length);
  };

  const handleUpdateCall = (callId: string, outcome: CallOutcome) => {
    updateCall(callId, outcome, editNotes.trim() || undefined);
    setEditingCall(null);
    setEditNotes('');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const exportTodaysCallsCSV = () => {
    const today = new Date().toDateString();
    const todaysCalls = calls.filter(call => call.timestamp.toDateString() === today);
    
    if (todaysCalls.length === 0) {
      return;
    }

    const headers = ['Time', 'Outcome', 'Notes'];
    const csvData = [
      headers.join(','),
      ...todaysCalls.map(call => [
        call.timestamp.toLocaleTimeString(),
        getOutcomeConfig(call.outcome).label,
        `"${call.notes || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calls-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getOutcomeConfig = (outcome: CallOutcome) => {
    return CALL_OUTCOMES.find(config => config.value === outcome) || CALL_OUTCOMES[0];
  };

  // Prepare chart data
  const yesNoData = [
    { name: t('yes'), value: Math.round(stats.yesRatio), fill: 'hsl(var(--success))' },
    { name: t('no'), value: Math.round(100 - stats.yesRatio), fill: 'hsl(var(--danger))' }
  ];

  const engagementData = [
    { name: t('engaged'), value: Math.round(stats.engagementRatio), fill: 'hsl(var(--info))' },
    { name: t('not-engaged'), value: Math.round(100 - stats.engagementRatio), fill: 'hsl(var(--neutral))' }
  ];

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{t('call-tracker')}</h1>
              <p className="text-muted-foreground">{t('track-performance')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-muted-foreground" />
              <Button
                variant={language === 'en' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguage('en')}
              >
                EN
              </Button>
              <Button
                variant={language === 'sv' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguage('sv')}
              >
                SV
              </Button>
            </div>
            <Button 
              onClick={exportTodaysCallsCSV}
              variant="outline"
              className="flex items-center gap-2"
              disabled={calls.filter(call => call.timestamp.toDateString() === new Date().toDateString()).length === 0}
            >
              <Download className="h-4 w-4" />
              {t('export-csv')}
            </Button>
            <Button 
              onClick={startNewSession}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {t('new-session')}
            </Button>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('total-calls')}</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalCalls}</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('confirmed-sales')}</p>
                  <p className="text-2xl font-bold text-success">{stats.confirmedSales}</p>
                </div>
                <div className="p-2 bg-success/10 rounded-lg">
                  <div className="h-5 w-5 bg-success rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('yes-ratio')}</p>
                  <p className="text-2xl font-bold text-success">{stats.yesRatio.toFixed(1)}%</p>
                </div>
                <div className="w-20 h-20 p-2">
                  <ChartContainer config={{ yes: { color: 'hsl(var(--success))' }, no: { color: 'hsl(var(--danger))' } }}>
                    <ResponsiveContainer width={80} height={80}>
                      <PieChart>
                        <Pie
                          data={yesNoData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={30}
                        >
                          {yesNoData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('engagement-ratio')}</p>
                  <p className="text-2xl font-bold text-info">{stats.engagementRatio.toFixed(1)}%</p>
                </div>
                <div className="w-20 h-20 p-2">
                  <ChartContainer config={{ engaged: { color: 'hsl(var(--info))' }, notEngaged: { color: 'hsl(var(--neutral))' } }}>
                    <ResponsiveContainer width={80} height={80}>
                      <PieChart>
                        <Pie
                          data={engagementData}
                          dataKey="value"
                          nameKey="name"
                          cx="100%"
                          cy="100%"
                          outerRadius={30}
                        >
                          {engagementData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Grid */}
        <CallActivityGrid calls={calls} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Call Logging Panel */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>{t('log-call-outcome')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {CALL_OUTCOMES.map((outcome) => (
                    <Button
                      key={outcome.value}
                      onClick={() => handleAddCall(outcome.value)}
                      className={cn(
                        outcome.color,
                        "text-white font-medium transition-all duration-200 hover:scale-105"
                      )}
                    >
                      {outcome.label}
                    </Button>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {t('notes-optional')}
                  </label>
                  <Textarea
                    placeholder={t('add-notes-placeholder')}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="resize-none"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Call History Panel */}
          <div className="space-y-4">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>{t('call-history')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {calls.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      {t('no-calls-yet')}
                    </p>
                  ) : (
                    calls.map((call) => {
                      const config = getOutcomeConfig(call.outcome);
                      return (
                        <div
                          key={call.id}
                          className="flex items-center justify-between p-3 border rounded-lg bg-card hover:shadow-sm transition-shadow"
                        >
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className={cn(config.color, "text-white")}>
                                {config.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(call.timestamp)}
                              </span>
                            </div>
                            {call.notes && (
                              <p className="text-sm text-muted-foreground">
                                {call.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingCall(call.id);
                                    setEditNotes(call.notes || '');
                                  }}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>{t('edit-call')}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-2">
                                    {CALL_OUTCOMES.map((outcome) => (
                                      <Button
                                        key={outcome.value}
                                        onClick={() => handleUpdateCall(call.id, outcome.value)}
                                        className={cn(
                                          outcome.color,
                                          "text-white font-medium text-xs"
                                        )}
                                        size="sm"
                                      >
                                        {outcome.label}
                                      </Button>
                                    ))}
                                  </div>
                                  <Textarea
                                    placeholder={t('notes-placeholder')}
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                    rows={3}
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCall(call.id)}
                              className="text-danger hover:text-danger hover:bg-danger/10"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
