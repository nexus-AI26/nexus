import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import type { Theme } from '../themes/index.js';
import { themeNames, getTheme } from '../themes/index.js';
import { PROVIDER_MODELS } from '../core/config.js';

interface SetupWizardProps {
  theme: Theme;
  onComplete: (provider: string, apiKey: string, model: string, newTheme: string) => void;
}

type Step = 'welcome' | 'provider' | 'apikey' | 'model' | 'theme' | 'done';

const PROVIDERS = ['openai', 'anthropic', 'openrouter', 'custom'];

export function SetupWizard({ theme, onComplete }: SetupWizardProps) {
  const [step, setStep] = useState<Step>('welcome');
  const [selectedProvider, setSelectedProvider] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [modelInput, setModelInput] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(0);

  useInput((input, key) => {
    if (step === 'welcome') {
      setStep('provider');
      return;
    }

    if (step === 'provider') {
      if (key.upArrow) setSelectedProvider(p => Math.max(0, p - 1));
      if (key.downArrow) setSelectedProvider(p => Math.min(PROVIDERS.length - 1, p + 1));
      if (key.return) setStep('apikey');
      return;
    }

    if (step === 'apikey') {
      if (key.return) {
        if (apiKey.trim().length > 4) setStep('model');
        return;
      }
      if (key.backspace || key.delete) {
        setApiKey(k => k.slice(0, -1));
        return;
      }
      if (!key.ctrl && !key.meta && input) {
        setApiKey(k => k + input);
      }
      return;
    }

    if (step === 'model') {
      if (key.return) {
        setStep('theme');
        return;
      }
      if (key.backspace || key.delete) {
        setModelInput(m => m.slice(0, -1));
        return;
      }
      if (!key.ctrl && !key.meta && !key.upArrow && !key.downArrow && input) {
        setModelInput(m => m + input);
      }
      return;
    }

    if (step === 'theme') {
      if (key.upArrow) setSelectedTheme(t => Math.max(0, t - 1));
      if (key.downArrow) setSelectedTheme(t => Math.min(themeNames.length - 1, t + 1));
      if (key.return) {
        const provider = PROVIDERS[selectedProvider] ?? 'openai';
        const models = PROVIDER_MODELS[provider] ?? [];
        const defaultModel = models[0] ?? 'gpt-4o';
        const model = modelInput.trim() || defaultModel;
        const themeName = themeNames[selectedTheme] ?? 'dracula';
        onComplete(provider, apiKey.trim(), model, themeName);
        return;
      }
      return;
    }
  });

  const provider = PROVIDERS[selectedProvider] ?? 'openai';
  const models = PROVIDER_MODELS[provider] ?? [];
  const defaultModel = models[0] ?? 'gpt-4o';

  return (
    <Box flexDirection="column" padding={2}>
      {step === 'welcome' && (
        <Box flexDirection="column" gap={1}>
          <Text color={theme.primary} bold>✦ Welcome to nexus!</Text>
          <Text color={theme.muted}>Let{'\''}s set you up in just a few steps.</Text>
          <Text color={theme.secondary}>Press any key to continue…</Text>
        </Box>
      )}

      {step === 'provider' && (
        <Box flexDirection="column" gap={1}>
          <Text color={theme.primary} bold>Step 1/4 — Choose your AI provider</Text>
          <Text color={theme.muted}>Use ↑↓ to navigate, Enter to select</Text>
          <Box flexDirection="column" marginTop={1}>
            {PROVIDERS.map((p, i) => (
              <Box key={p}>
                {i === selectedProvider
                  ? <Text color={theme.primary} bold>▶ {p}</Text>
                  : <Text color={theme.muted}>  {p}</Text>
                }
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {step === 'apikey' && (
        <Box flexDirection="column" gap={1}>
          <Text color={theme.primary} bold>Step 2/4 — Enter your {provider} API key</Text>
          <Text color={theme.muted}>Your key is stored locally in ~/.nexus/config</Text>
          <Box marginTop={1} borderStyle="round" borderColor={theme.border} paddingX={1}>
            <Text color={theme.secondary}>
              {apiKey.length > 4
                ? apiKey.slice(0, 4) + '•'.repeat(apiKey.length - 4)
                : '•'.repeat(apiKey.length)}
            </Text>
            <Text color={theme.primary}>█</Text>
          </Box>
          <Text color={theme.muted} dimColor>Press Enter when done</Text>
        </Box>
      )}

      {step === 'model' && (
        <Box flexDirection="column" gap={1}>
          <Text color={theme.primary} bold>Step 3/4 — Type your model name</Text>
          <Text color={theme.muted}>Type any model name, press Enter to confirm</Text>
          <Box marginTop={1} borderStyle="round" borderColor={theme.border} paddingX={1}>
            <Text color={theme.secondary}>{modelInput || ' '}</Text>
            <Text color={theme.primary}>█</Text>
          </Box>
          <Text color={theme.muted} dimColor>
            Leave blank to use default: <Text color={theme.secondary}>{defaultModel}</Text>
          </Text>
          <Box flexDirection="column" marginTop={1}>
            <Text color={theme.muted} dimColor>Suggestions for {provider}:</Text>
            {models.slice(0, 5).map(m => (
              <Text key={m} color={theme.muted} dimColor>  {m}</Text>
            ))}
          </Box>
        </Box>
      )}

      {step === 'theme' && (
        <Box flexDirection="column" gap={1}>
          <Text color={theme.primary} bold>Step 4/4 — Pick a theme</Text>
          <Text color={theme.muted}>Use ↑↓ to navigate, Enter to select</Text>
          <Box flexDirection="column" marginTop={1}>
            {themeNames.map((t, i) => {
              const th = getTheme(t);
              return (
                <Box key={t}>
                  {i === selectedTheme
                    ? <Text color={th.primary} bold>▶ {th.label}</Text>
                    : <Text color={theme.muted}>  {th.label}</Text>
                  }
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
}
