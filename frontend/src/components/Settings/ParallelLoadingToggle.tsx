import React from 'react';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/config/features';

interface ParallelLoadingToggleProps {
  onToggle: (enabled: boolean) => void;
}

export const ParallelLoadingToggle: FC<ParallelLoadingToggleProps> = ({ onToggle }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onToggle(event.target.checked);
  };

  return (
    <div className="flex items-center">
      <label htmlFor="parallel-loading" className="mr-2">
        Enable Parallel Loading
      </label>
      <input
        id="parallel-loading"
        type="checkbox"
        checked={isFeatureEnabled('PARALLEL_LOADING')}
        onChange={(e) => onToggle(e.target.checked)}
      />
    </div>
  );
}; 