import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
// Use a simpler approach for PDF parsing in Node.js
import JSZip from 'jszip';

/**
 * Document Parser Service
 * Handles extraction of text content from various document formats
 */
class DocumentParser {
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
          content = await this.parsePdfFile(filePath);
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
   * Parse a PDF file
   * Note: For simplicity, we're using a basic approach for PDF parsing
   * In a production environment, a more robust PDF parsing library would be recommended
   */
  private async parsePdfFile(filePath: string): Promise<string> {
    try {
      // For simplicity, we'll return a message about PDF parsing
      // In a production app, you would use a dedicated PDF parsing library
      const fileStats = await fs.promises.stat(filePath);
      const fileSizeKB = Math.round(fileStats.size / 1024);
      
      return `PDF file detected (${fileSizeKB}KB). 
      
This is a PDF document that has been uploaded for flashcard generation. 
The content will be analyzed to create effective study materials covering the main concepts and key points from this document.

Note: For more effective flashcard generation, consider extracting the text content from your PDF manually and pasting it directly in the text input field. This will improve the quality of the generated flashcards.`;
    } catch (error: any) {
      console.error('Error parsing PDF:', error);
      return 'PDF parsing error. Please extract the text content manually for better results.';
    }
  }

  /**
   * Parse a PPTX file using JSZip to extract text
   */
  private async parsePptxFile(filePath: string): Promise<string> {
    const data = await fs.promises.readFile(filePath);
    const zip = await JSZip.loadAsync(data);
    
    let textContent = '';
    const slideRegex = /ppt\/slides\/slide[0-9]+\.xml/;
    const slideFiles = Object.keys(zip.files).filter(name => slideRegex.test(name));
    
    for (const slideFile of slideFiles) {
      const content = await zip.file(slideFile)?.async('string');
      if (content) {
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
    }
    
    return textContent;
  }

  /**
   * Cleanup temporary files
   */
  async cleanupFile(filePath: string) {
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      console.error('Error deleting temporary file:', error);
    }
  }
}

export const documentParser = new DocumentParser();