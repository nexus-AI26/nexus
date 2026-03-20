export interface Theme {
    name: string;
    label: string;
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    error: string;
    warning: string;
    muted: string;
    border: string;
    bg: string;
    userMsg: string;
    assistantMsg: string;
    toolMsg: string;
    cmdPaletteBg: string;
    statusBg: string;
}
export declare const themes: Record<string, Theme>;
export declare function getTheme(name: string): Theme;
export declare const themeNames: string[];
//# sourceMappingURL=index.d.ts.map