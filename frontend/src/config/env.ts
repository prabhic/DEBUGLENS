export const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || process.env[`NEXT_PUBLIC_${key}`];
  
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  
  return value || defaultValue || '';
};

export const config = {
  apiUrl: getEnvVar('API_URL', 'http://localhost:5000'),
  claudeApiKey: getEnvVar('CLAUDE_API_KEY'),
  claudeApiEndpoint: getEnvVar('CLAUDE_API_ENDPOINT'),
  claudeModel: getEnvVar('CLAUDE_MODEL', 'claude-3-sonnet-20240229'),
}; 