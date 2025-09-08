import { useState, useEffect, useCallback } from 'react';
import { CallEntry, CallOutcome, CallStats, CallSession } from '@/types/call-tracker';

const STORAGE_KEY = 'call-tracker-data';
const CURRENT_SESSION_KEY = 'call-tracker-current-session';
const HISTORICAL_DATA_KEY = 'call-tracker-historical-data';

export const useCallTracker = () => {
  const [currentSession, setCurrentSession] = useState<CallSession | null>(null);
  const [calls, setCalls] = useState<CallEntry[]>([]);
  const [allHistoricalCalls, setAllHistoricalCalls] = useState<CallEntry[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    // Load historical data
    const savedHistoricalData = localStorage.getItem(HISTORICAL_DATA_KEY);
    if (savedHistoricalData) {
      const historicalCalls = JSON.parse(savedHistoricalData).map((call: any) => ({
        ...call,
        timestamp: new Date(call.timestamp)
      }));
      setAllHistoricalCalls(historicalCalls);
    }

    const savedSession = localStorage.getItem(CURRENT_SESSION_KEY);
    if (savedSession) {
      const parsed = JSON.parse(savedSession);
      const session: CallSession = {
        ...parsed,
        startTime: new Date(parsed.startTime),
        endTime: parsed.endTime ? new Date(parsed.endTime) : undefined,
      };
      setCurrentSession(session);
      setCalls(session.calls.map(call => ({
        ...call,
        timestamp: new Date(call.timestamp)
      })));
    } else {
      // Start a new session if none exists
      startNewSession();
    }
  }, []);

  // Save to localStorage whenever calls change
  useEffect(() => {
    if (currentSession) {
      const sessionToSave = {
        ...currentSession,
        calls: calls.map(call => ({
          ...call,
          timestamp: call.timestamp.toISOString()
        }))
      };
      localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(sessionToSave));
      
      // Update historical data
      const allCalls = [...allHistoricalCalls, ...calls];
      const uniqueCalls = allCalls.filter((call, index, self) => 
        self.findIndex(c => c.id === call.id) === index
      );
      setAllHistoricalCalls(uniqueCalls);
      localStorage.setItem(HISTORICAL_DATA_KEY, JSON.stringify(
        uniqueCalls.map(call => ({
          ...call,
          timestamp: call.timestamp.toISOString()
        }))
      ));
    }
  }, [calls, currentSession, allHistoricalCalls]);

  const startNewSession = useCallback(() => {
    const newSession: CallSession = {
      id: `session-${Date.now()}`,
      calls: [],
      startTime: new Date(),
    };
    setCurrentSession(newSession);
    setCalls([]);
  }, []);

  const addCall = useCallback((outcome: CallOutcome, notes?: string) => {
    const newCall: CallEntry = {
      id: `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      outcome,
      timestamp: new Date(),
      notes,
    };
    setCalls(prevCalls => [newCall, ...prevCalls]);
  }, []);

  const updateCall = useCallback((callId: string, outcome: CallOutcome, notes?: string) => {
    setCalls(prevCalls => 
      prevCalls.map(call => 
        call.id === callId 
          ? { ...call, outcome, notes }
          : call
      )
    );
  }, []);

  const deleteCall = useCallback((callId: string) => {
    setCalls(prevCalls => prevCalls.filter(call => call.id !== callId));
  }, []);

  const calculateStats = useCallback((): CallStats => {
    const totalCalls = calls.length;
    const confirmedSales = calls.filter(call => call.outcome === 'confirmed-sale').length;
    
    // Yes includes both 'yes-needs-confirmation' and 'confirmed-sale'
    const yesCount = calls.filter(call => 
      call.outcome === 'yes-needs-confirmation' || call.outcome === 'confirmed-sale'
    ).length;
    
    const noCount = calls.filter(call => 
      call.outcome === 'no'
    ).length;
    
    // Engagement includes yes and no (excludes hangups and non-intros)
    const engagementCount = yesCount + noCount;
    
    const yesRatio = (yesCount + noCount) > 0 ? (yesCount / (yesCount + noCount)) * 100 : 0;
    const engagementRatio = totalCalls > 0 ? (engagementCount / totalCalls) * 100 : 0;

    // Count each outcome
    const outcomeCounts: Record<CallOutcome, number> = {
      'yes-needs-confirmation': 0,
      'confirmed-sale': 0,
      'no': 0,
      'absolutely-no': 0,
      'hangup': 0,
      'call-later': 0,
      'call-in-2-months': 0,
      'sickness-medicine': 0,
      'already-customer': 0,
      'not-enough-money': 0,
      'language-difficulties': 0,
      'wrong-number': 0,
      'dnc': 0,
    };

    calls.forEach(call => {
      outcomeCounts[call.outcome]++;
    });

    return {
      totalCalls,
      confirmedSales,
      yesRatio,
      engagementRatio,
      outcomeCounts,
    };
  }, [calls]);

  return {
    calls,
    allHistoricalCalls,
    currentSession,
    addCall,
    updateCall,
    deleteCall,
    startNewSession,
    stats: calculateStats(),
  };
};