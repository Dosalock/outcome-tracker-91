import { useState, useEffect, useCallback } from 'react';
import { CallEntry, CallOutcome, CallStats, CallSession } from '@/types/call-tracker';

const CURRENT_SESSION_KEY = 'call-tracker-current-session';
const SESSIONS_INDEX_KEY = 'call-tracker-sessions-index';

// Helper functions for day-based storage
const getDayKey = (date: Date) => {
  return `call-tracker-day-${date.toISOString().split('T')[0]}`;
};

const getSessionKey = (sessionId: string) => {
  return `call-tracker-session-${sessionId}`;
};

const loadAllHistoricalCalls = () => {
  const sessionsIndex = localStorage.getItem(SESSIONS_INDEX_KEY);
  if (!sessionsIndex) return [];

  const sessionIds: string[] = JSON.parse(sessionsIndex);
  const allCalls: CallEntry[] = [];

  sessionIds.forEach(sessionId => {
    const sessionData = localStorage.getItem(getSessionKey(sessionId));
    if (sessionData) {
      const session = JSON.parse(sessionData);
      const calls = session.calls.map((call: any) => ({
        ...call,
        timestamp: new Date(call.timestamp)
      }));
      allCalls.push(...calls);
    }
  });

  return allCalls;
};

const saveSessionToStorage = (session: CallSession) => {
  // Save the session itself
  const sessionToSave = {
    ...session,
    calls: session.calls.map(call => ({
      ...call,
      timestamp: call.timestamp.toISOString()
    }))
  };
  localStorage.setItem(getSessionKey(session.id), JSON.stringify(sessionToSave));

  // Update sessions index
  const sessionsIndex = localStorage.getItem(SESSIONS_INDEX_KEY);
  const sessionIds: string[] = sessionsIndex ? JSON.parse(sessionsIndex) : [];
  
  if (!sessionIds.includes(session.id)) {
    sessionIds.push(session.id);
    localStorage.setItem(SESSIONS_INDEX_KEY, JSON.stringify(sessionIds));
  }
};

export const useCallTracker = () => {
  const [currentSession, setCurrentSession] = useState<CallSession | null>(null);
  const [calls, setCalls] = useState<CallEntry[]>([]);
  const [allHistoricalCalls, setAllHistoricalCalls] = useState<CallEntry[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    // Load all historical calls from all sessions
    const historicalCalls = loadAllHistoricalCalls();
    setAllHistoricalCalls(historicalCalls);

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
      const sessionWithCalls = {
        ...currentSession,
        calls: calls
      };
      
      // Save current session
      localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify({
        ...sessionWithCalls,
        calls: calls.map(call => ({
          ...call,
          timestamp: call.timestamp.toISOString()
        }))
      }));

      // Save session to permanent storage
      saveSessionToStorage(sessionWithCalls);

      // Update all historical calls
      const updatedHistoricalCalls = loadAllHistoricalCalls();
      setAllHistoricalCalls(updatedHistoricalCalls);
    }
  }, [calls, currentSession]);

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
    console.log('useCallTracker: Adding call with outcome:', outcome);
    const newCall: CallEntry = {
      id: `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      outcome,
      timestamp: new Date(),
      notes,
    };
    console.log('useCallTracker: New call created:', newCall);
    setCalls(prevCalls => {
      const updatedCalls = [newCall, ...prevCalls];
      console.log('useCallTracker: Updated calls array length:', updatedCalls.length);
      return updatedCalls;
    });
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

  const importFromCSV = useCallback((csvContent: string) => {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return; // Need header + at least one data row
    
    const headers = lines[0].split(',');
    const importedCalls: CallEntry[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length >= 2) {
        const timeStr = values[0];
        const outcomeStr = values[1];
        const notesStr = values[2] ? values[2].replace(/"/g, '') : undefined;
        
        // Parse time - assuming format from export
        const today = new Date();
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':');
        let hour = parseInt(hours);
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        
        const timestamp = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, parseInt(minutes));
        
        // Find matching outcome
        const outcome = Object.keys({
          'yes-needs-confirmation': true,
          'confirmed-sale': true,
          'no': true,
          'absolutely-no': true,
          'hangup': true,
          'call-later': true,
          'call-in-2-months': true,
          'sickness-medicine': true,
          'already-customer': true,
          'not-enough-money': true,
          'language-difficulties': true,
          'wrong-number': true,
          'dnc': true,
        }).find(key => outcomeStr.toLowerCase().includes(key.toLowerCase())) as CallOutcome;
        
        if (outcome) {
          importedCalls.push({
            id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            outcome,
            timestamp,
            notes: notesStr
          });
        }
      }
    }
    
    setCalls(prevCalls => [...importedCalls, ...prevCalls]);
  }, []);

  const importFromJSON = useCallback((jsonContent: string) => {
    try {
      const data = JSON.parse(jsonContent);
      const importedCalls: CallEntry[] = [];
      
      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          if (item.outcome && item.timestamp) {
            importedCalls.push({
              id: item.id || `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              outcome: item.outcome as CallOutcome,
              timestamp: new Date(item.timestamp),
              notes: item.notes
            });
          }
        });
      } else if (data.calls && Array.isArray(data.calls)) {
        // Session format
        data.calls.forEach((item: any) => {
          if (item.outcome && item.timestamp) {
            importedCalls.push({
              id: item.id || `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              outcome: item.outcome as CallOutcome,
              timestamp: new Date(item.timestamp),
              notes: item.notes
            });
          }
        });
      }
      
      setCalls(prevCalls => [...importedCalls, ...prevCalls]);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      throw new Error('Invalid JSON format');
    }
  }, []);

  return {
    calls,
    allHistoricalCalls,
    currentSession,
    addCall,
    updateCall,
    deleteCall,
    startNewSession,
    importFromCSV,
    importFromJSON,
    stats: calculateStats(),
  };
};