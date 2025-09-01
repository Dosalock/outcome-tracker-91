import React from 'react';
import { CallTracker } from '@/components/CallTracker';
import { LanguageProvider } from '@/contexts/LanguageContext';

const Index = () => {
  return (
    <LanguageProvider>
      <CallTracker />
    </LanguageProvider>
  );
};

export default Index;
