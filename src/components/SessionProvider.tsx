'use client';

import React, { useEffect, createContext, useContext, useState } from 'react';

const SessionContext = createContext<string>('');

export const useSession = () => useContext(SessionContext);

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    // Generate simple UUID-like string
    let sid = localStorage.getItem('dreamrooms_session_id');
    
    if (!sid) {
      sid = `sid-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      localStorage.setItem('dreamrooms_session_id', sid);
    }
    
    setSessionId(sid);
    
    // Also store in cookie for server-side API requests if needed
    document.cookie = `dreamrooms_session_id=${sid}; path=/; max-age=31536000; SameSite=Lax`;
  }, []);

  // While session is initializing, we can still render children, fallback to empty string
  return (
    <SessionContext.Provider value={sessionId}>
      {children}
    </SessionContext.Provider>
  );
}
