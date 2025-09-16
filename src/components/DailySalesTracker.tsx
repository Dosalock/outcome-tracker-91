import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { CallEntry } from '@/types/call-tracker';

interface DailyTimeSlot {
  period: string;
  startTime: string;
  endTime: string;
  sales: CallEntry[];
  targetSlots: number;
}

interface DailySalesTrackerProps {
  calls: CallEntry[];
}

export const DailySalesTracker: React.FC<DailySalesTrackerProps> = ({ calls }) => {
  const { t } = useLanguage();

  const timeSlots: DailyTimeSlot[] = [
    { period: '1', startTime: '09:00', endTime: '10:50', sales: [], targetSlots: 2 },
    { period: '2', startTime: '10:50', endTime: '12:45', sales: [], targetSlots: 1 },
    { period: '3', startTime: '12:45', endTime: '15:30', sales: [], targetSlots: 1 },
    { period: '4', startTime: '15:30', endTime: '17:30', sales: [], targetSlots: 1 }
  ];

  // Populate sales for each time slot
  const populatedSlots = timeSlots.map(slot => {
    const todaysSales = calls.filter(call => {
      if (call.outcome !== 'confirmed-sale') return false;
      
      const callTime = call.timestamp.toTimeString().slice(0, 5);
      return callTime >= slot.startTime && callTime < slot.endTime;
    });
    
    return {
      ...slot,
      sales: todaysSales
    };
  });

  // Calculate overflow sales for translucent green effect
  const calculateOverflow = () => {
    let totalOverflow = 0;
    const overflowBySlot = populatedSlots.map(slot => {
      const overflow = Math.max(0, slot.sales.length - slot.targetSlots);
      totalOverflow += overflow;
      return overflow;
    });
    
    return { totalOverflow, overflowBySlot };
  };

  const { totalOverflow, overflowBySlot } = calculateOverflow();

  // Distribute overflow to subsequent periods for translucent green effect
  const getExtraGreenBoxes = (slotIndex: number) => {
    let extraBoxes = 0;
    for (let i = 0; i < slotIndex; i++) {
      extraBoxes += overflowBySlot[i];
    }
    return Math.min(extraBoxes, populatedSlots[slotIndex].targetSlots);
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="p-6">
        <CardTitle className="text-sm">
          Dagens sälj
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {populatedSlots.map((slot, slotIndex) => {
            const extraGreenBoxes = getExtraGreenBoxes(slotIndex);
            const actualSales = slot.sales.length;
            const targetSlots = slot.targetSlots;
            const totalBoxes = Math.max(targetSlots, actualSales);
            
            return (
              <div key={slotIndex} className="flex items-center space-x-2">
                <div className="flex items-center justify-end-safe w-full">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium">
                      {slot.period}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {Array.from({ length: totalBoxes }, (_, boxIndex) => {
                        let boxStyle = "";
                        let content = "";
                        let title = "";
                        
                        if (boxIndex < actualSales) {
                          // Actual sale
                          boxStyle = "border-success bg-success text-success-foreground";
                          content = "✓";
                          title = `Sale ${boxIndex + 1} at ${slot.sales[boxIndex].timestamp.toTimeString().slice(0, 5)}`;
                        } else if (boxIndex < targetSlots && boxIndex - actualSales < extraGreenBoxes) {
                          // Overflow indicator (translucent green)
                          boxStyle = "border-success/50 bg-success/20 text-success-foreground/70";
                          content = "○";
                          title = "Goal completed in previous period";
                        } else if (boxIndex < targetSlots) {
                          // Available slot
                          boxStyle = "border-muted-foreground/30 bg-background text-muted-foreground/50";
                          content = (boxIndex + 1).toString();
                          title = "Available slot";
                        } else {
                          // Overflow sale
                          boxStyle = "border-success bg-success text-success-foreground";
                          content = "✓";
                          title = `Overflow sale ${boxIndex - targetSlots + 1}`;
                        }
                        
                        return (
                          <div
                            key={boxIndex}
                            className={cn(
                              "w-6 h-6 border-2 border-dashed rounded-sm flex items-center justify-center text-xs font-bold transition-all",
                              boxStyle
                            )}
                            title={title}
                          >
                            {content}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {slot.sales.length}/{slot.targetSlots}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
