import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCallTracker } from '@/hooks/useCallTracker';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { CallOutcome } from '@/types/call-tracker';

interface DayData {
  date: Date;
  calls: number;
  outcomes: CallOutcome[];
  intensity: number;
}

export const CallActivityGrid: React.FC = () => {
  const { calls } = useCallTracker();
  const { t } = useLanguage();

  // Generate last 12 weeks of data
  const generateGridData = (): DayData[] => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (12 * 7)); // 12 weeks ago
    
    const gridData: DayData[] = [];
    
    for (let i = 0; i < 84; i++) { // 12 weeks * 7 days
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const daysCalls = calls.filter(call => 
        call.timestamp.toDateString() === currentDate.toDateString()
      );
      
      const callCount = daysCalls.length;
      const outcomes = daysCalls.map(call => call.outcome);
      
      // Calculate intensity based on call count (0-4 scale)
      let intensity = 0;
      if (callCount > 0) intensity = 1;
      if (callCount > 5) intensity = 2;
      if (callCount > 10) intensity = 3;
      if (callCount > 20) intensity = 4;
      
      gridData.push({
        date: currentDate,
        calls: callCount,
        outcomes,
        intensity
      });
    }
    
    return gridData;
  };

  const gridData = generateGridData();
  
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
    
    const successfulCalls = day.outcomes.filter(outcome => 
      outcome === 'yes-needs-confirmation' || outcome === 'confirmed-sale'
    ).length;
    
    return `${day.date.toLocaleDateString()}: ${day.calls} calls, ${successfulCalls} successful`;
  };

  // Group by weeks for display
  const weeks: DayData[][] = [];
  for (let i = 0; i < gridData.length; i += 7) {
    weeks.push(gridData.slice(i, i + 7));
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t('call-activity')}</span>
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
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {/* Day labels */}
          <div className="grid grid-cols-[auto_1fr] gap-2 text-xs text-muted-foreground mb-2">
            <div className="w-8"></div>
            <div className="grid grid-cols-12 gap-1">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                <div key={month} className="text-center">{month}</div>
              ))}
            </div>
          </div>
          
          {/* Grid */}
          <div className="grid grid-cols-[auto_1fr] gap-2">
            {/* Week day labels */}
            <div className="space-y-1">
              {['Mon', 'Wed', 'Fri'].map((day, index) => (
                <div key={day} className="h-2.5 text-xs text-muted-foreground flex items-center" style={{ marginTop: index === 0 ? '0' : '0.375rem' }}>
                  {day}
                </div>
              ))}
            </div>
            
            {/* Activity grid */}
            <div className="grid grid-cols-12 gap-1">
              {weeks.map((week, weekIndex) => (
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
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};