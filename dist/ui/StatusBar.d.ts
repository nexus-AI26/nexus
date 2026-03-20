import React from 'react';
import type { Theme } from '../themes/index.js';
interface StatusBarProps {
    provider: string;
    model: string;
    themeName: string;
    theme: Theme;
    messageCount: number;
    cwd: string;
}
export declare function StatusBar({ provider, model, themeName, theme, messageCount, cwd }: StatusBarProps): React.JSX.Element;
export {};
//# sourceMappingURL=StatusBar.d.ts.map