declare module "mammoth" {
  export interface MammothResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  export interface ConvertOptions {
    arrayBuffer?: ArrayBuffer;
    buffer?: Buffer;
    path?: string;
  }

  export function convertToHtml(input: ConvertOptions, options?: any): Promise<MammothResult>;
  export function extractRawText(input: ConvertOptions, options?: any): Promise<MammothResult>;
  export function convertToMarkdown(input: ConvertOptions, options?: any): Promise<MammothResult>;
}
