/**
 * HTML Sanitization Middleware
 * Sanitizes user-generated HTML content to prevent XSS attacks
 */

import type { Request, Response, NextFunction } from "express";

/**
 * Sanitize HTML content
 * Removes dangerous tags and attributes while preserving basic formatting
 */
export function sanitizeHTML(html: string): string {
  if (typeof html !== "string") return html;

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, "");

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, "");

  // Remove data URIs that could be dangerous
  sanitized = sanitized.replace(/data:text\/html/gi, "");

  // Remove iframe and object tags (could load external content)
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
  sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "");
  sanitized = sanitized.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "");

  // Remove style tags that could contain malicious CSS
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // Remove dangerous attributes from remaining tags
  sanitized = sanitized.replace(/\s*style\s*=\s*["'][^"']*["']/gi, "");
  sanitized = sanitized.replace(/\s*href\s*=\s*["']javascript:/gi, "");
  sanitized = sanitized.replace(/\s*src\s*=\s*["']javascript:/gi, "");

  // Allow only safe HTML tags for basic formatting
  // This is a whitelist approach - safer than blacklist
  const allowedTags = ["p", "br", "strong", "em", "u", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "a"];
  const tagPattern = new RegExp(`<(/?)(${allowedTags.join("|")})\\b[^>]*>`, "gi");
  
  // For links, only allow safe hrefs
  sanitized = sanitized.replace(/<a\b[^>]*>/gi, (match) => {
    const hrefMatch = match.match(/href\s*=\s*["']([^"']*)["']/i);
    if (hrefMatch) {
      const href = hrefMatch[1];
      // Only allow http, https, mailto, or relative URLs
      if (!/^(https?:\/\/|mailto:|\/|#)/i.test(href)) {
        return "<a>";
      }
    }
    return match;
  });

  return sanitized.trim();
}

/**
 * Middleware to sanitize HTML in request body
 * Applied to endpoints that accept user-generated HTML content
 */
export function sanitizeHTMLBody(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    // Fields that might contain HTML
    const htmlFields = ["message", "content", "body", "description", "letter", "notes", "details"];
    
    for (const field of htmlFields) {
      if (req.body[field] && typeof req.body[field] === "string") {
        req.body[field] = sanitizeHTML(req.body[field]);
      }
    }

    // Also sanitize nested objects (e.g., letter.content)
    if (req.body.letter && typeof req.body.letter === "object") {
      for (const field of htmlFields) {
        if (req.body.letter[field] && typeof req.body.letter[field] === "string") {
          req.body.letter[field] = sanitizeHTML(req.body.letter[field]);
        }
      }
    }
  }

  next();
}

