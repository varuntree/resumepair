declare module 'pdf-lib' {
  export class PDFDocument {
    static create(): Promise<PDFDocument>
    static load(data: Uint8Array | ArrayBuffer | Buffer): Promise<PDFDocument>
    copyPages(doc: PDFDocument, indices: number[]): Promise<any[]>
    addPage(page: any): void
    getPageCount(): number
    save(): Promise<Uint8Array>
  }
}
