import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { themeNames, getTheme } from '../themes/index.js';
import { PROVIDER_MODELS } from '../core/config.js';
const PROVIDERS = ['openai', 'anthropic', 'openrouter', 'custom'];
export function SetupWizard({ theme, onComplete }) {
    const [step, setStep] = useState('welcome');
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
            if (key.upArrow)
                setSelectedProvider(p => Math.max(0, p - 1));
            if (key.downArrow)
                setSelectedProvider(p => Math.min(PROVIDERS.length - 1, p + 1));
            if (key.return)
                setStep('apikey');
            return;
        }
        if (step === 'apikey') {
            if (key.return) {
                if (apiKey.trim().length > 4)
                    setStep('model');
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
            if (key.upArrow)
                setSelectedTheme(t => Math.max(0, t - 1));
            if (key.downArrow)
                setSelectedTheme(t => Math.min(themeNames.length - 1, t + 1));
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
    return (React.createElement(Box, { flexDirection: "column", padding: 2 },
        step === 'welcome' && (React.createElement(Box, { flexDirection: "column", gap: 1 },
            React.createElement(Text, { color: theme.primary, bold: true }, "\u2726 Welcome to nexus!"),
            React.createElement(Text, { color: theme.muted },
                "Let",
                '\'',
                "s set you up in just a few steps."),
            React.createElement(Text, { color: theme.secondary }, "Press any key to continue\u2026"))),
        step === 'provider' && (React.createElement(Box, { flexDirection: "column", gap: 1 },
            React.createElement(Text, { color: theme.primary, bold: true }, "Step 1/4 \u2014 Choose your AI provider"),
            React.createElement(Text, { color: theme.muted }, "Use \u2191\u2193 to navigate, Enter to select"),
            React.createElement(Box, { flexDirection: "column", marginTop: 1 }, PROVIDERS.map((p, i) => (React.createElement(Box, { key: p }, i === selectedProvider
                ? React.createElement(Text, { color: theme.primary, bold: true },
                    "\u25B6 ",
                    p)
                : React.createElement(Text, { color: theme.muted },
                    "  ",
                    p))))))),
        step === 'apikey' && (React.createElement(Box, { flexDirection: "column", gap: 1 },
            React.createElement(Text, { color: theme.primary, bold: true },
                "Step 2/4 \u2014 Enter your ",
                provider,
                " API key"),
            React.createElement(Text, { color: theme.muted }, "Your key is stored locally in ~/.nexus/config"),
            React.createElement(Box, { marginTop: 1, borderStyle: "round", borderColor: theme.border, paddingX: 1 },
                React.createElement(Text, { color: theme.secondary }, apiKey.length > 4
                    ? apiKey.slice(0, 4) + '•'.repeat(apiKey.length - 4)
                    : '•'.repeat(apiKey.length)),
                React.createElement(Text, { color: theme.primary }, "\u2588")),
            React.createElement(Text, { color: theme.muted, dimColor: true }, "Press Enter when done"))),
        step === 'model' && (React.createElement(Box, { flexDirection: "column", gap: 1 },
            React.createElement(Text, { color: theme.primary, bold: true }, "Step 3/4 \u2014 Type your model name"),
            React.createElement(Text, { color: theme.muted }, "Type any model name, press Enter to confirm"),
            React.createElement(Box, { marginTop: 1, borderStyle: "round", borderColor: theme.border, paddingX: 1 },
                React.createElement(Text, { color: theme.secondary }, modelInput || ' '),
                React.createElement(Text, { color: theme.primary }, "\u2588")),
            React.createElement(Text, { color: theme.muted, dimColor: true },
                "Leave blank to use default: ",
                React.createElement(Text, { color: theme.secondary }, defaultModel)),
            React.createElement(Box, { flexDirection: "column", marginTop: 1 },
                React.createElement(Text, { color: theme.muted, dimColor: true },
                    "Suggestions for ",
                    provider,
                    ":"),
                models.slice(0, 5).map(m => (React.createElement(Text, { key: m, color: theme.muted, dimColor: true },
                    "  ",
                    m)))))),
        step === 'theme' && (React.createElement(Box, { flexDirection: "column", gap: 1 },
            React.createElement(Text, { color: theme.primary, bold: true }, "Step 4/4 \u2014 Pick a theme"),
            React.createElement(Text, { color: theme.muted }, "Use \u2191\u2193 to navigate, Enter to select"),
            React.createElement(Box, { flexDirection: "column", marginTop: 1 }, themeNames.map((t, i) => {
                const th = getTheme(t);
                return (React.createElement(Box, { key: t }, i === selectedTheme
                    ? React.createElement(Text, { color: th.primary, bold: true },
                        "\u25B6 ",
                        th.label)
                    : React.createElement(Text, { color: theme.muted },
                        "  ",
                        th.label)));
            }))))));
}
//# sourceMappingURL=SetupWizard.js.map