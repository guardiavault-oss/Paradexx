/**
 * PDF Generation Service for Legal Will Documents
 * Generates signed PDF documents from will configurations using Handlebars templates
 */

import fs from "fs/promises";
import path from "path";
import { logInfo, logError } from "./logger";
import Handlebars from "handlebars";

// Register Handlebars helpers
Handlebars.registerHelper("eq", function(a: any, b: any) {
  return a === b;
});

Handlebars.registerHelper("gt", function(a: any, b: any) {
  return a > b;
});

export interface WillAllocation {
  recipient: string;
  recipientName?: string;
  percentage: number;
  assetType?: "native" | "token" | "nft" | "all";
  tokenAddress?: string;
  tokenSymbol?: string;
  isCharityDAO?: boolean;
  nftOnly?: boolean;
}

export interface WillDocument {
  ownerName: string;
  ownerAddress: string;
  createdAt: Date;
  allocations: WillAllocation[];
  metadataHash?: string;
  guardianThreshold?: number;
  guardians?: Array<{ address: string; name?: string }>;
}

/**
 * Generate legal will PDF document
 * Note: This is a template implementation. In production, use a proper PDF library
 * like pdfkit, pdfmake, or integrate with DocuSign API
 */
export class PDFGeneratorService {
  /**
   * Generate a legal will PDF from configuration
   */
  async generateWillPDF(will: WillDocument): Promise<Buffer> {
    try {
      logInfo("Generating will PDF", { owner: will.ownerAddress });

      // Try to use pdfkit for proper PDF generation
      try {
        const PDFDocument = (await import("pdfkit")).default;
        return await this.generatePDFWithPDFKit(will, PDFDocument);
      } catch (error) {
        // Fallback to HTML if pdfkit is not available
        logInfo("PDFKit not available, falling back to HTML", { error });
        const htmlContent = await this.generateWillHTML(will);
        return Buffer.from(htmlContent, "utf-8");
      }
    } catch (error) {
      logError(error as Error, { context: "pdf_generation", willId: will.metadataHash });
      throw new Error("Failed to generate PDF document");
    }
  }

  /**
   * Generate PDF using PDFKit
   */
  private async generatePDFWithPDFKit(will: WillDocument, PDFDocument: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: "A4", margin: 50 });
        const chunks: Buffer[] = [];

        doc.on("data", (chunk: Buffer) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // Header
        doc.fontSize(24).font("Helvetica-Bold").text("DIGITAL ASSET WILL", { align: "center" });
        doc.moveDown(0.5);
        doc
          .fontSize(12)
          .font("Helvetica")
          .text("Blockchain Estate Planning Document", { align: "center" });
        doc.moveDown(2);

        // Testator Information
        doc.fontSize(16).font("Helvetica-Bold").text("1. Testator Information");
        doc.moveDown(0.5);
        doc.fontSize(12).font("Helvetica");
        doc.text(`Name: ${will.ownerName}`);
        doc.text(`Wallet Address: ${will.ownerAddress}`);
        doc.text(`Date of Will: ${will.createdAt.toLocaleDateString()}`);
        doc.moveDown(1.5);

        // Declaration
        doc.fontSize(16).font("Helvetica-Bold").text("2. Declaration");
        doc.moveDown(0.5);
        doc
          .fontSize(12)
          .font("Helvetica")
          .text(
            `I, ${will.ownerName}, of address ${will.ownerAddress}, being of sound mind and memory, ` +
              `do hereby declare this to be my Last Will and Testament regarding my digital assets, ` +
              `cryptocurrency holdings, and non-fungible tokens (NFTs). I revoke all prior wills and ` +
              `codicils relating to digital assets.`,
            { align: "justify" }
          );
        doc.moveDown(1.5);

        // Asset Distribution
        doc.fontSize(16).font("Helvetica-Bold").text("3. Asset Distribution");
        doc.moveDown(0.5);
        doc
          .fontSize(12)
          .font("Helvetica")
          .text(
            "The following allocations shall be executed upon verification of my death or " +
              "incapacitation through the GuardiaVault system:",
            { align: "justify" }
          );
        doc.moveDown(1);

        will.allocations.forEach((alloc, index) => {
          doc.fontSize(14).font("Helvetica-Bold").text(`Allocation ${index + 1}`);
          doc.fontSize(11).font("Helvetica");
          doc.text(`Recipient: ${alloc.recipientName || alloc.recipient}`);
          doc.text(`Wallet Address: ${alloc.recipient}`);
          doc.text(`Allocation: ${alloc.percentage}% of assets`);
          if (alloc.assetType) doc.text(`Asset Type: ${alloc.assetType}`);
          if (alloc.tokenSymbol) doc.text(`Token: ${alloc.tokenSymbol}`);
          if (alloc.isCharityDAO) doc.text(`Type: Charity DAO`);
          if (alloc.nftOnly) doc.text(`Restriction: NFTs Only`);
          doc.moveDown(1);
        });

        // Guardian Oversight (if applicable)
        if (will.guardians && will.guardians.length > 0) {
          doc.fontSize(16).font("Helvetica-Bold").text("4. Guardian Oversight");
          doc.moveDown(0.5);
          doc
            .fontSize(12)
            .font("Helvetica")
            .text(
              `The execution of this will requires approval from ${will.guardianThreshold || "N/A"} ` +
                `of the following guardians:`
            );
          doc.moveDown(0.5);
          will.guardians.forEach((g) => {
            doc.text(`• ${g.name || g.address} (${g.address})`);
          });
          doc.moveDown(1.5);
        }

        // Execution Mechanism
        doc.fontSize(16).font("Helvetica-Bold").text("5. Execution Mechanism");
        doc.moveDown(0.5);
        doc
          .fontSize(12)
          .font("Helvetica")
          .text(
            "This will is executed on-chain via the GuardiaVault SmartWill contract. " +
              "Distribution occurs automatically upon:",
            { align: "justify" }
          );
        doc.moveDown(0.5);
        doc.text("• Death verification through multi-source consensus");
        doc.text("• Guardian attestation (if required)");
        doc.text("• Time-lock expiration period");
        doc.moveDown(0.5);
        doc.text("All distributions are immutable and recorded on the blockchain.");
        doc.moveDown(2);

        // Signature Block
        doc.fontSize(14).font("Helvetica-Bold").text("Testator Signature:");
        doc.moveDown(3);
        doc.fontSize(12).font("Helvetica").text("_________________________");
        doc.text(will.ownerName);
        doc.text(`Date: ${will.createdAt.toLocaleDateString()}`);
        doc.moveDown(2);

        // Metadata
        if (will.metadataHash) {
          doc.fontSize(10).font("Helvetica");
          doc.text(`Document Hash: ${will.metadataHash}`);
          doc.text(`IPFS Reference: ipfs://${will.metadataHash}`);
          doc.moveDown(0.5);
          doc.text(
            "This document is cryptographically verified and stored on IPFS. " +
              "The on-chain will contract contains the execution logic for these allocations.",
            { align: "justify", italics: true }
          );
        }

        // Legal Notice
        doc.moveDown(1.5);
        doc.fontSize(9).font("Helvetica");
        doc.text(
          "Legal Notice: This is a digital asset will executed via smart contract. " +
            "It should be used in conjunction with traditional estate planning documents. " +
            "Consult with a licensed attorney for comprehensive estate planning.",
          { align: "justify" }
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Load Handlebars template
   */
  private async loadTemplate(): Promise<string> {
    try {
      const templatePath = path.join(__dirname, "willPdfTemplate.hbs");
      return await fs.readFile(templatePath, "utf-8");
    } catch (error) {
      // Fallback to inline template if file not found
      logError(error as Error, { context: "load_template" });
      return this.getDefaultTemplate();
    }
  }

  /**
   * Get default template (fallback)
   */
  private getDefaultTemplate(): string {
    // Return the old template as fallback
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Digital Asset Will - {{ownerName}}</title>
</head>
<body>
    <h1>DIGITAL ASSET WILL</h1>
    <p><strong>Testator:</strong> {{ownerName}}</p>
    <p><strong>Wallet:</strong> {{ownerWalletAddress}}</p>
    <p><strong>Date:</strong> {{formattedDate}}</p>
</body>
</html>`;
  }

  /**
   * Generate HTML representation of will using Handlebars template
   */
  private async generateWillHTML(will: WillDocument): Promise<string> {
    const templateContent = await this.loadTemplate();
    const template = Handlebars.compile(templateContent);

    const formattedDate = will.createdAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const context = {
      ownerName: will.ownerName,
      ownerEmail: (will as any).ownerEmail,
      ownerPhone: (will as any).ownerPhone,
      ownerAddress: (will as any).ownerAddress,
      ownerWalletAddress: will.ownerAddress,
      formattedDate,
      contractAddress: (will as any).contractAddress,
      contractWillId: (will as any).contractWillId,
      beneficiaries: will.allocations.map((alloc, index) => ({
        ...alloc,
        index: index + 1,
        name: alloc.recipientName,
        address: alloc.recipient,
        percent: alloc.percentage,
      })),
      guardians: will.guardians?.map((g) => ({
        ...g,
        identifier: g.address,
        guardianType: (g as any).type || "wallet",
        verified: (g as any).verified || false,
      })) || [],
      guardianThreshold: will.guardianThreshold || (will.guardians?.length || 0),
      triggers: (will as any).triggers,
      recoveryKeysCount: ((will as any).triggers?.recoveryKeys?.length || 0),
      assets: (will as any).assets || [],
      metadataHash: will.metadataHash,
      pdfS3Key: (will as any).pdfS3Key,
    };

    return template(context);
  }

  /**
   * Generate HTML representation of will (legacy method - now uses template)
   */
  private async generateWillHTMLLegacy(will: WillDocument): Promise<string> {
    const formattedDate = will.createdAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Digital Asset Will - ${will.ownerName}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            color: #333;
        }
        h1 {
            text-align: center;
            border-bottom: 3px solid #000;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        h2 {
            margin-top: 30px;
            border-bottom: 2px solid #ccc;
            padding-bottom: 5px;
        }
        .will-header {
            text-align: center;
            margin-bottom: 40px;
        }
        .section {
            margin: 20px 0;
            padding: 15px;
            border-left: 4px solid #000;
            background-color: #f9f9f9;
        }
        .allocation-item {
            margin: 15px 0;
            padding: 10px;
            background-color: #fff;
            border: 1px solid #ddd;
        }
        .signature-block {
            margin-top: 60px;
            border-top: 2px solid #000;
            padding-top: 20px;
        }
        .metadata {
            font-size: 0.9em;
            color: #666;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
        }
        @media print {
            body { margin: 0; padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="will-header">
        <h1>DIGITAL ASSET WILL</h1>
        <p><strong>Blockchain Estate Planning Document</strong></p>
    </div>

    <div class="section">
        <h2>1. Testator Information</h2>
        <p><strong>Name:</strong> ${will.ownerName}</p>
        <p><strong>Wallet Address:</strong> ${will.ownerAddress}</p>
        <p><strong>Date of Will:</strong> ${formattedDate}</p>
    </div>

    <div class="section">
        <h2>2. Declaration</h2>
        <p>I, ${will.ownerName}, of address ${will.ownerAddress}, being of sound mind and memory, 
        do hereby declare this to be my Last Will and Testament regarding my digital assets, 
        cryptocurrency holdings, and non-fungible tokens (NFTs). I revoke all prior wills and 
        codicils relating to digital assets.</p>
    </div>

    <div class="section">
        <h2>3. Asset Distribution</h2>
        <p>The following allocations shall be executed upon verification of my death or 
        incapacitation through the GuardiaVault system:</p>
        
        ${will.allocations
          .map(
            (alloc, index) => `
        <div class="allocation-item">
            <h3>Allocation ${index + 1}</h3>
            <p><strong>Recipient:</strong> ${alloc.recipientName || alloc.recipient}</p>
            <p><strong>Wallet Address:</strong> ${alloc.recipient}</p>
            <p><strong>Allocation:</strong> ${alloc.percentage}% of assets</p>
            ${alloc.assetType ? `<p><strong>Asset Type:</strong> ${alloc.assetType}</p>` : ""}
            ${alloc.tokenSymbol ? `<p><strong>Token:</strong> ${alloc.tokenSymbol}</p>` : ""}
            ${alloc.isCharityDAO ? `<p><strong>Type:</strong> Charity DAO</p>` : ""}
            ${alloc.nftOnly ? `<p><strong>Restriction:</strong> NFTs Only</p>` : ""}
        </div>`
          )
          .join("")}
    </div>

    ${will.guardians && will.guardians.length > 0
      ? `
    <div class="section">
        <h2>4. Guardian Oversight</h2>
        <p>The execution of this will requires approval from ${will.guardianThreshold || "N/A"} 
        of the following guardians:</p>
        <ul>
            ${will.guardians.map((g) => `<li>${g.name || g.address} (${g.address})</li>`).join("")}
        </ul>
    </div>
    `
      : ""}

    <div class="section">
        <h2>5. Execution Mechanism</h2>
        <p>This will is executed on-chain via the GuardiaVault SmartWill contract. 
        Distribution occurs automatically upon:</p>
        <ul>
            <li>Death verification through multi-source consensus</li>
            <li>Guardian attestation (if required)</li>
            <li>Time-lock expiration period</li>
        </ul>
        <p>All distributions are immutable and recorded on the blockchain.</p>
    </div>

    <div class="signature-block">
        <p><strong>Testator Signature:</strong></p>
        <br/><br/><br/>
        <p>_________________________</p>
        <p>${will.ownerName}</p>
        <p>Date: ${formattedDate}</p>
    </div>

    ${will.metadataHash
      ? `
    <div class="metadata">
        <p><strong>Document Hash:</strong> ${will.metadataHash}</p>
        <p><strong>IPFS Reference:</strong> ipfs://${will.metadataHash}</p>
        <p><em>This document is cryptographically verified and stored on IPFS. 
        The on-chain will contract contains the execution logic for these allocations.</em></p>
    </div>
    `
      : ""}

    <div style="margin-top: 40px; font-size: 0.85em; color: #666;">
        <p><strong>Legal Notice:</strong> This is a digital asset will executed via smart contract. 
        It should be used in conjunction with traditional estate planning documents. 
        Consult with a licensed attorney for comprehensive estate planning.</p>
    </div>
</body>
</html>`;
  }

  /**
   * Generate a preview version (HTML) for user review
   */
  async generateWillPreview(will: WillDocument): Promise<string> {
    return await this.generateWillHTML(will);
  }

  /**
   * Convert HTML to PDF using a headless browser (puppeteer-like)
   * This is a placeholder - implement with actual PDF conversion library
   */
  async convertHTMLToPDF(html: string): Promise<Buffer> {
    // TODO: Integrate with puppeteer or similar for HTML to PDF conversion
    // const puppeteer = require('puppeteer');
    // const browser = await puppeteer.launch();
    // const page = await browser.newPage();
    // await page.setContent(html);
    // const pdf = await page.pdf({ format: 'A4' });
    // await browser.close();
    // return pdf;

    // For now, return HTML as buffer (frontend can handle PDF conversion)
    return Buffer.from(html, "utf-8");
  }
}

export const pdfGenerator = new PDFGeneratorService();

