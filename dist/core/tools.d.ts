export interface ToolResult {
    output: string;
    error?: string;
    success: boolean;
}
export interface ToolDef {
    name: string;
    description: string;
    execute: (args: Record<string, unknown>) => Promise<ToolResult>;
}
export declare const tools: Record<string, ToolDef>;
export declare function executeTool(name: string, args: Record<string, unknown>): Promise<ToolResult>;
//# sourceMappingURL=tools.d.ts.map