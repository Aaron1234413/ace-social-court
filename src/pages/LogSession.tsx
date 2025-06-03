
import React from 'react';
import { Helmet } from 'react-helmet-async';
import SessionLogger from '@/components/logging/session/SessionLogger';

const LogSession = () => {
  return (
    <>
      <Helmet>
        <title>Log Training Session - rallypointx</title>
        <meta name="description" content="Log your tennis training session and track your progress" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <SessionLogger />
      </div>
    </>
  );
};

export default LogSession;
