import React from 'react';
import type { Theme } from '../themes/index.js';
export interface Command {
    name: string;
    description: string;
    aliases?: string[];
    args?: string;
}
interface CommandPaletteProps {
    commands: Command[];
    query: string;
    selectedIndex: number;
    theme: Theme;
    onSelect: (cmd: Command) => void;
    onClose: () => void;
}
export declare function CommandPalette({ commands, query, selectedIndex, theme, onSelect, onClose }: CommandPaletteProps): React.JSX.Element | null;
export {};
//# sourceMappingURL=CommandPalette.d.ts.map