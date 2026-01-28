
import React, { useMemo } from 'react';
import { ThemeMode } from '../types';
import { DARK_THEME_COLORS, LIGHT_THEME_COLORS } from '../constants';
import { marked } from 'marked';

interface MarkdownViewerProps {
  content: string;
  theme: ThemeMode;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, theme }) => {
  const colors = theme === ThemeMode.DARK ? DARK_THEME_COLORS : LIGHT_THEME_COLORS;

  // Render markdown to HTML and post-process
  const htmlContent = useMemo(() => {
    let rawHtml = marked.parse(content) as string;
    
    // Post-process for GFM Style Callouts/Alerts
    // Matches: <blockquote><p>[!NOTE] Title...
    // Wraps the title line in a span for styling
    rawHtml = rawHtml.replace(
      /(<blockquote>\s*<p>)\s*(\[![\w]+\][^\n<]*)/gi, 
      '$1<span class="callout-title">$2</span>'
    );

    // Replace #rec with a styled span
    return rawHtml.replace(/#rec\b/g, '<span class="tag-rec">#rec</span>');
  }, [content]);

  const headerStyles = `
    .md-render {
      font-size: 14px; /* Base size */
      line-height: 1.6;
      color: ${colors.text};
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    /* FIX: Remove top margin from first child for consistent PDF first-page margin */
    .md-render > :first-child {
      margin-top: 0 !important;
    }

    /* FIX: Hide first HR if it's the very first element */
    .md-render > hr:first-child {
      display: none;
    }

    /* Distinct Header Sizes - Clearly differentiated levels */
    .md-render h1 { 
      font-size: 32px; 
      font-weight: 800; 
      color: ${colors.header}; 
      margin-bottom: 0.8rem; 
      margin-top: 2rem; 
      padding-bottom: 0.5rem; 
      line-height: 1.2;
    }
    .md-render h2 { 
      font-size: 26px; 
      font-weight: 700; 
      color: ${colors.header}; 
      margin-bottom: 0.75rem; 
      margin-top: 1.75rem; 
      line-height: 1.3;
    }
    .md-render h3 { 
      font-size: 22px; 
      font-weight: 600; 
      color: ${colors.header}; 
      margin-bottom: 0.6rem; 
      margin-top: 1.5rem; 
      line-height: 1.4;
    }
    .md-render h4 { 
      font-size: 18px; 
      font-weight: 600; 
      color: ${colors.header}; 
      margin-bottom: 0.5rem; 
      margin-top: 1.25rem; 
      line-height: 1.4;
    }
    .md-render h5 { 
      font-size: 16px; 
      font-weight: 600; 
      color: ${colors.header}; 
      margin-bottom: 0.4rem; 
      margin-top: 1rem;
      letter-spacing: 0.025em;
    }
    .md-render h6 { 
      font-size: 14px; 
      font-weight: 700; 
      color: ${colors.header}; 
      margin-bottom: 0.4rem; 
      margin-top: 1rem; 
      opacity: 0.85;
    }
    
    .md-render p { margin-bottom: 1rem; }
    
    /* #rec Tag Styling */
    .md-render .tag-rec {
      background-color: ${theme === ThemeMode.DARK ? 'rgba(58, 169, 159, 0.15)' : '#E6FFFA'};
      color: ${theme === ThemeMode.DARK ? '#3AA99F' : '#2C7A7B'} !important;
      border: 1px solid ${theme === ThemeMode.DARK ? 'rgba(58, 169, 159, 0.3)' : '#B2F5EA'};
      padding: 2px 8px;
      border-radius: 999px;
      font-weight: 600;
      font-size: 0.75em;
      display: inline-block;
      margin: 0 4px;
      vertical-align: middle;
      position: relative;
      top: -1px;
      line-height: 1;
      white-space: nowrap;
    }
    
    .md-render h1 .tag-rec, 
    .md-render h2 .tag-rec, 
    .md-render h3 .tag-rec {
      font-size: 0.5em;
      margin-left: 0.8em;
      top: -3px;
    }

    /* Lists */
    .md-render ul, .md-render ol { 
      margin-bottom: 1rem; 
      padding-left: 1.5rem; 
      list-style: none !important; 
    }
    
    .md-render li { 
      margin-bottom: 0.25rem; 
      position: relative;
      line-height: 1.6;
    }

    .md-render li p {
      margin-bottom: 0;
      display: inline;
    }
    
    .md-render ul > li::before {
      content: '•';
      position: absolute;
      left: -1rem;
      top: 0;
      width: 1rem;
      text-align: center;
      color: ${colors.text};
      font-weight: bold;
    }

    .md-render ol { counter-reset: item; }
    .md-render ol > li { counter-increment: item; }
    .md-render ol > li::before {
      content: counter(item) ".";
      position: absolute;
      left: -1.5rem; 
      top: 0;
      width: 1.2rem;
      text-align: right;
      color: ${colors.text};
      font-weight: bold;
      font-variant-numeric: tabular-nums;
    }
    
    /* Blockquote and Callout Base */
    .md-render blockquote { 
      border-left: 4px solid ${colors.header}; 
      padding: 12px 20px 16px 20px; /* Increased padding, especially bottom */
      color: ${theme === ThemeMode.DARK ? '#94A3B8' : '#4A5568'}; 
      background: ${theme === ThemeMode.DARK ? 'rgba(30, 41, 59, 0.5)' : '#F7FAFC'}; 
      border-radius: 0 6px 6px 0;
      margin: 1.5rem 0;
      /* Removed white-space: pre-wrap to prevent excessive top margin from source whitespace */
    }

    /* Tighten paragraphs inside blockquotes */
    .md-render blockquote p {
      margin-bottom: 0.5rem; 
    }
    
    /* Remove vertical margin from first and last elements in quote to fit tight to padding */
    .md-render blockquote > *:first-child {
      margin-top: 0 !important;
    }
    .md-render blockquote > *:last-child {
      margin-bottom: 0 !important;
    }

    /* Callout Title Styling */
    .md-render .callout-title {
      color: ${colors.header};
      font-weight: 700;
      display: block;
      margin-bottom: 0.5rem;
    }
    
    /* Code Blocks */
    .md-render pre {
      margin: 1.5rem 0;
      padding: 1rem;
      border-radius: 6px;
      white-space: pre-wrap;       
      word-wrap: break-word;       
      overflow-wrap: anywhere;
      background: ${theme === ThemeMode.DARK ? 'rgba(30, 41, 59, 0.5)' : '#F7FAFC'}; 
      border: 1px solid ${theme === ThemeMode.DARK ? '#334155' : '#E2E8F0'};
    }

    .md-render code { 
      background: ${theme === ThemeMode.DARK ? 'rgba(30, 41, 59, 0.8)' : '#EDF2F7'}; 
      color: ${theme === ThemeMode.DARK ? '#E2E8F0' : '#2D3748'}; 
      padding: 2px 5px; 
      border-radius: 4px; 
      font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
      font-size: 0.85em;
    }

    .md-render pre code {
      background: transparent;
      color: inherit;
      padding: 0;
    }

    /* Table Styling */
    .md-render table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 2rem 0;
      border-radius: 6px;
      overflow: hidden;
      border-style: hidden; 
      box-shadow: 0 0 0 1px ${theme === ThemeMode.DARK ? '#1E293B' : '#E2E8F0'};
    }
    
    .md-render th, .md-render td { 
      padding: 10px 14px; 
      text-align: left;
      border: 1px solid ${theme === ThemeMode.DARK ? '#1E293B' : '#E2E8F0'}; 
      vertical-align: middle !important;
      font-size: 14px;
    }
    
    .md-render td p, .md-render th p {
      margin: 0 !important;
      line-height: 1.4;
    }

    .md-render th { 
      background: ${theme === ThemeMode.DARK ? '#1E293B' : '#F7FAFC'}; 
      font-weight: 700; 
      letter-spacing: 0.05em;
      color: ${theme === ThemeMode.LIGHT ? '#4A5568' : colors.header}; 
    }
    
    .md-render tr:nth-child(even) { 
      background: ${theme === ThemeMode.DARK ? 'rgba(30, 41, 59, 0.4)' : '#F8FAFC'}; 
    }
    
    .md-render hr { 
      border: 0; 
      height: 1px;
      background: ${theme === ThemeMode.DARK ? '#1E293B' : '#E2E8F0'}; 
      margin: 2rem 0; 
    }
    
    .md-render img { 
      max-width: 100%; 
      height: auto; 
      border-radius: 6px; 
      margin: 1.5rem 0; 
    }
    
    .md-render a { 
      color: #3AA99F; 
      text-decoration: none; 
      border-bottom: 1px dotted #3AA99F; 
      font-weight: 500;
    }
  `;

  return (
    <div 
      className="md-render p-10 min-h-full" 
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      <style>{headerStyles}</style>
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </div>
  );
};

export default MarkdownViewer;
