import React from 'react';
import type { Theme } from '../themes/index.js';
interface SetupWizardProps {
    theme: Theme;
    onComplete: (provider: string, apiKey: string, model: string, newTheme: string) => void;
}
export declare function SetupWizard({ theme, onComplete }: SetupWizardProps): React.JSX.Element;
export {};
//# sourceMappingURL=SetupWizard.d.ts.map