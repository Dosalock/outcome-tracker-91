import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCallTracker } from '@/hooks/useCallTracker';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWindowSize } from '@/hooks/use-window-size';
import { cn } from '@/lib/utils';
import { CallOutcome, CallEntry } from '@/types/call-tracker';

type TimePeriod = 'year' | 'quarter' | 'month' | 'week' | 'session';

interface DayData {
  date: Date;
  calls: number;
  confirmedSales: number;
  outcomes: CallOutcome[];
  callEntries: CallEntry[];
  intensity: number;
}

interface SessionData {
  call: CallEntry;
  index: number;
}

export const CallActivityGrid: React.FC<{ calls: CallEntry[] }> = ({ calls: currentSessionCalls }) => { // Renamed prop to avoid conflict
  const { allHistoricalCalls } = useCallTracker(); // Removed 'calls' from here
  const { t } = useLanguage();
  const { width } = useWindowSize();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('quarter');

  const generateGridData = useMemo((): DayData[] | SessionData[] => {
    console.log('CallActivityGrid: Generating grid data, currentSessionCalls length:', currentSessionCalls.length, 'historical calls length:', allHistoricalCalls.length);
    const today = new Date();
    let startDate = new Date(today);
    let days = 84; // Default for quarter
    
    // Use historical data for long-term views, current session for session view
    const dataSource = timePeriod === 'session' ? currentSessionCalls : allHistoricalCalls; // Use currentSessionCalls here
    
    switch (timePeriod) {
      case 'year':
        startDate.setFullYear(today.getFullYear() - 1);
        days = 365;
        break;
      case 'quarter':
        startDate.setDate(today.getDate() - (12 * 7)); // 12 weeks
        days = 84;
        break;
      case 'month':
        startDate.setDate(today.getDate() - 30);
        days = 30;
        break;
      case 'week':
        startDate.setDate(today.getDate() - 7);
        days = 7;
        break;
      case 'session':
        // Return individual calls for session view (up to 200 calls)
        return currentSessionCalls.slice(0, 200).map((call, index) => ({ // Use currentSessionCalls here
          call,
          index
        })) as SessionData[];
    }
    
    const gridData: DayData[] = [];
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const daysCalls = dataSource.filter(call => 
        call.timestamp.toDateString() === currentDate.toDateString()
      );
      
      const callCount = daysCalls.length;
      const confirmedSales = daysCalls.filter(call => call.outcome === 'confirmed-sale').length;
      const outcomes = daysCalls.map(call => call.outcome);
      
      // Calculate intensity based on confirmed sales (0-4 scale)
      let intensity = 0;
      if (confirmedSales >= 1) intensity = 1;
      if (confirmedSales >= 3) intensity = 2;
      if (confirmedSales >= 5) intensity = 3;
      if (confirmedSales >= 7) intensity = 4;
      
      gridData.push({
        date: currentDate,
        calls: callCount,
        confirmedSales,
        outcomes,
        callEntries: daysCalls,
        intensity
      });
    }
    
    return gridData;
  }, [timePeriod, currentSessionCalls, allHistoricalCalls]); // Updated dependency array

  const gridData = generateGridData;
  const isSessionView = timePeriod === 'session';
  
  const getOutcomeColor = (outcome: CallOutcome) => {
    switch (outcome) {
      case 'confirmed-sale': return 'bg-outcome-confirmed';
      case 'yes-needs-confirmation': return 'bg-outcome-yes';
      case 'no': return 'bg-outcome-no';
      case 'absolutely-no': return 'bg-outcome-absolutelyNo';
      case 'hangup': return 'bg-outcome-hangup';
      case 'call-later': return 'bg-outcome-callLater';
      case 'call-in-2-months': return 'bg-outcome-call2months';
      case 'sickness-medicine': return 'bg-outcome-sickness';
      case 'already-customer': return 'bg-outcome-alreadyCustomer';
      case 'not-enough-money': return 'bg-outcome-noMoney';
      case 'language-difficulties': return 'bg-outcome-language';
      case 'wrong-number': return 'bg-outcome-wrongNumber';
      case 'dnc': return 'bg-outcome-dnc';
      default: return 'bg-muted/30';
    }
  };

  const getIntensityColor = (intensity: number) => {
    switch (intensity) {
      case 0: return 'bg-muted/30';
      case 1: return 'bg-success/20';
      case 2: return 'bg-success/40';
      case 3: return 'bg-success/60';
      case 4: return 'bg-success/80';
      default: return 'bg-muted/30';
    }
  };

  const formatTooltip = (day: DayData) => {
    if (day.calls === 0) {
      return `${day.date.toLocaleDateString()}: No calls`;
    }
    
    return `${day.date.toLocaleDateString()}: ${day.calls} calls, ${day.confirmedSales} confirmed sales`;
  };

  const formatSessionTooltip = (sessionData: SessionData) => {
    return `Call ${sessionData.index + 1}: ${sessionData.call.outcome}${sessionData.call.notes ? ` - ${sessionData.call.notes}` : ''}`;
  };

  const getGridCols = () => {
    switch (timePeriod) {
      case 'year': return 'grid-cols-12';
      case 'quarter': return 'grid-cols-12'; 
      case 'month': return 'grid-cols-10';
      case 'week': return 'grid-cols-7';
      case 'session': return getResponsiveSessionCols();
      default: return 'grid-cols-12';
    }
  };

  const getResponsiveSessionCols = () => {
    if (!width) return 10; // Default fallback
    
    // Calculate columns based on available width
    // Each cell is ~16px (w-3 + gap) and we want some margin
    const availableWidth = width - 200; // Account for card padding and margins
    const cellWidth = 16; // w-3 (12px) + gap (4px)
    const maxCols = Math.floor(availableWidth / cellWidth);
    
    // Clamp between reasonable bounds
    return Math.max(8, Math.min(maxCols, 50));
  };

  // Group by weeks for display (only for non-session views)
  const weeks: DayData[][] = [];
  if (!isSessionView && Array.isArray(gridData) && gridData.length > 0 && 'date' in gridData[0]) {
    const dayData = gridData as DayData[];
    for (let i = 0; i < dayData.length; i += 7) {
      weeks.push(dayData.slice(i, i + 7));
    }
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t('call-activity')}</span>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(['year', 'quarter', 'month', 'week', 'session'] as TimePeriod[]).map(period => (
                <Button
                  key={period}
                  variant={timePeriod === period ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimePeriod(period)}
                  className="h-7 px-2 text-xs"
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isSessionView ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
              <span>Session calls (left to right, top to bottom):</span>
            </div>
            <div 
              className="grid gap-1 w-full"
              style={{
                gridTemplateColumns: `repeat(${getResponsiveSessionCols()}, minmax(0, 1fr))`
              }}
            >
              {(gridData as SessionData[]).map((sessionData, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-3 h-3 rounded-sm cursor-pointer transition-all hover:ring-1 hover:ring-primary/50",
                    getOutcomeColor(sessionData.call.outcome)
                  )}
                  title={formatSessionTooltip(sessionData)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Legend */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{t('less')}</span>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map(level => (
                    <div
                      key={level}
                      className={cn(
                        "w-2.5 h-2.5 rounded-sm",
                        getIntensityColor(level)
                      )}
                    />
                  ))}
                </div>
                <span>{t('more')}</span>
              </div>
            </div>

            {/* Month labels */}
            {(timePeriod === 'year' || timePeriod === 'quarter') && (
              <div className="grid grid-cols-[auto_1fr] gap-2 text-xs text-muted-foreground mb-2">
                <div className="w-8"></div>
                <div className={cn("grid gap-1", getGridCols())}>
                  {timePeriod === 'year' 
                    ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                        <div key={month} className="text-center">{month}</div>
                      ))
                    : Array.from({ length: 12 }, (_, i) => (
                        <div key={i} className="text-center">{i + 1}</div>
                      ))
                  }
                </div>
              </div>
            )}
            
            {/* Grid */}
            <div className="grid grid-cols-[auto_1fr] gap-2">
              {/* Week day labels for week/quarter/year views */}
              {(timePeriod === 'quarter' || timePeriod === 'year') && (
                <div className="space-y-1">
                  {['Mon', 'Wed', 'Fri'].map((day, index) => (
                    <div key={day} className="h-2.5 text-xs text-muted-foreground flex items-center" style={{ marginTop: index === 0 ? '0' : '0.375rem' }}>
                      {day}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Day labels for month/week views */}
              {(timePeriod === 'month' || timePeriod === 'week') && (
                <div className="w-8"></div>
              )}
              
              {/* Activity grid */}
              <div className={cn("grid gap-1", getGridCols())}>
                {(timePeriod === 'quarter' || timePeriod === 'year') ? (
                  weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="space-y-1">
                      {week.map((day, dayIndex) => (
                        <div
                          key={dayIndex}
                          className={cn(
                            "w-2.5 h-2.5 rounded-sm cursor-pointer transition-all hover:ring-1 hover:ring-primary/50",
                            getIntensityColor(day.intensity)
                          )}
                          title={formatTooltip(day)}
                        />
                      ))}
                    </div>
                  ))
                ) : (
                  (gridData as DayData[]).map((day, index) => (
                    <div
                      key={index}
                      className={cn(
                        "w-4 h-4 rounded-sm cursor-pointer transition-all hover:ring-1 hover:ring-primary/50",
                        getIntensityColor(day.intensity)
                      )}
                      title={formatTooltip(day)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};