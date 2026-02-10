import React from 'react';
import { AnalyzeLayout } from '@/components/layouts';
import { Button, Card, Input } from '@/components/base';
import { Select, Checkbox } from '@/components/composite';

export const Settings = () => {
  return (
    <AnalyzeLayout
      title="Settings"
      subtitle="Configure your Aegis environment and preferences"
      content={<div>Settings Page</div>}
    />
  );
};

export default Settings;
