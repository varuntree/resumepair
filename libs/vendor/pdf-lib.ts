export class PDFDocument {
  static async create(): Promise<PDFDocument> {
    throw new Error('pdf-lib vendor not available')
  }

  static async load(_data: Uint8Array | ArrayBuffer | Buffer): Promise<PDFDocument> {
    throw new Error('pdf-lib vendor not available')
  }

  async copyPages(_doc: PDFDocument, _indices: number[]): Promise<any[]> {
    return []
  }

  addPage(_page: any): void {}

  getPageCount(): number {
    return 0
  }

  async save(): Promise<Uint8Array> {
    return new Uint8Array()
  }
}
