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

  export const images: {
    imgElement: (fn: (element: any) => Promise<{ src: string; alt?: string } | { src: string }>) => any;
    dataUri: (element: any) => Promise<{ src: string }>;
  };

  export function convertToHtml(input: ConvertOptions, options?: any): Promise<MammothResult>;
  export function extractRawText(input: ConvertOptions, options?: any): Promise<MammothResult>;
  export function convertToMarkdown(input: ConvertOptions, options?: any): Promise<MammothResult>;

  const mammoth: {
    convertToHtml: typeof convertToHtml;
    extractRawText: typeof extractRawText;
    convertToMarkdown: typeof convertToMarkdown;
    images: typeof images;
  };

  export default mammoth;
}

declare module "mammoth/mammoth.browser" {
  import mammoth from "mammoth";
  export = mammoth;
}
