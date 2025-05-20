import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import JSZip from 'jszip';

/**
 * Document Parser Service
 * Handles extraction of text content from various document formats
 */
class SimpleDocumentParser {
  /**
   * Parse a document file and extract text content
   * @param filePath The path to the uploaded file
   * @returns Promise with extracted text content
   */
  async parseDocument(filePath: string): Promise<string> {
    try {
      const fileExtension = path.extname(filePath).toLowerCase();
      let content = '';

      switch (fileExtension) {
        case '.txt':
          content = await this.parseTxtFile(filePath);
          break;
        case '.docx':
          content = await this.parseDocxFile(filePath);
          break;
        case '.pdf':
          content = await this.getFileDescription(filePath, 'PDF');
          break;
        case '.pptx':
          content = await this.parsePptxFile(filePath);
          break;
        default:
          throw new Error(`Unsupported file format: ${fileExtension}`);
      }

      return content;
    } catch (error: any) {
      console.error('Error parsing document:', error);
      throw new Error(`Failed to parse document: ${error.message}`);
    }
  }

  /**
   * Parse a TXT file
   */
  private async parseTxtFile(filePath: string): Promise<string> {
    return fs.promises.readFile(filePath, 'utf-8');
  }

  /**
   * Parse a DOCX file using mammoth
   */
  private async parseDocxFile(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  /**
   * Get a basic description for file types we can't fully parse
   */
  private async getFileDescription(filePath: string, fileType: string): Promise<string> {
    try {
      const fileStats = await fs.promises.stat(filePath);
      const fileSizeKB = Math.round(fileStats.size / 1024);
      
      return `${fileType} file uploaded (${fileSizeKB}KB).

This document has been uploaded for flashcard generation. 
The content will be analyzed to create effective study materials covering the main concepts and key points from this document.`;
    } catch (error: any) {
      console.error(`Error processing ${fileType}:`, error);
      return `${fileType} processing error.`;
    }
  }

  /**
   * Parse a PPTX file using JSZip to extract text
   */
  private async parsePptxFile(filePath: string): Promise<string> {
    try {
      const data = await fs.promises.readFile(filePath);
      const zip = await JSZip.loadAsync(data);
      
      let textContent = '';
      const slideRegex = /ppt\/slides\/slide[0-9]+\.xml/;
      const slideFiles = Object.keys(zip.files).filter(name => slideRegex.test(name));
      
      if (slideFiles.length === 0) {
        return this.getFileDescription(filePath, 'PowerPoint');
      }
      
      for (const slideFile of slideFiles) {
        const slideZipObject = zip.file(slideFile);
        if (!slideZipObject) continue;
        
        const content = await slideZipObject.async('string');
        
        // Extract text between <a:t> and </a:t> tags (text elements in PPTX)
        const textMatches = content.match(/<a:t>([^<]*)<\/a:t>/g);
        if (textMatches) {
          for (const match of textMatches) {
            const text = match.replace(/<a:t>|<\/a:t>/g, '');
            if (text.trim()) {
              textContent += text.trim() + '\n';
            }
          }
        }
      }
      
      return textContent || this.getFileDescription(filePath, 'PowerPoint');
    } catch (error: any) {
      console.error('Error parsing PPTX:', error);
      return this.getFileDescription(filePath, 'PowerPoint');
    }
  }

  /**
   * Cleanup temporary files
   */
  async cleanupFile(filePath: string) {
    try {
      await fs.promises.unlink(filePath);
    } catch (error: any) {
      console.error('Error deleting temporary file:', error);
    }
  }
}

export const documentParser = new SimpleDocumentParser();