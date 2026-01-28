import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ThemeMode } from '../types';

interface LinkPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  url: string;
}

// Helper to convert Hex to RGB
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 255, g: 255, b: 255 };
}

/**
 * Generates a PDF from a specified HTML container.
 * 
 * MAJOR UPDATE:
 * - Smart page breaks: scans for whitespace to avoid cutting text/lines.
 * - Supports hyperlinks extraction and mapping to PDF coordinates.
 */
export const generatePDF = async (containerId: string, theme: ThemeMode, baseFilename: string = 'document') => {
  const originalElement = document.getElementById(containerId);
  if (!originalElement) return;

  // 1. Setup Clone
  const element = originalElement.cloneNode(true) as HTMLElement;
  
  // Force width to A4 standard (approx 794px at 96 DPI)
  const contentWidthPx = 794;
  element.style.width = `${contentWidthPx}px`; 
  element.style.minWidth = `${contentWidthPx}px`;
  element.style.maxWidth = `${contentWidthPx}px`;
  
  // MARGIN SETUP:
  element.style.padding = '0 64px'; 
  element.style.boxSizing = 'border-box';
  
  // Visibility setup
  element.style.position = 'fixed';
  element.style.left = '-10000px';
  element.style.top = '0';
  element.style.zIndex = '-1';
  element.style.height = 'auto'; // Let content flow
  element.style.overflow = 'visible';
  const bgHex = theme === ThemeMode.DARK ? '#050A15' : '#FFFFFF';
  element.style.backgroundColor = bgHex;
  
  document.body.appendChild(element);

  // Remove top padding from the inner container to ensure the first page 
  // starts at the same visual position as subsequent pages (controlled by PDF margins).
  const innerContainer = element.querySelector('.md-render') as HTMLElement;
  if (innerContainer) {
    innerContainer.style.paddingTop = '0px';
  }

  // Wait for rendering and fonts
  await document.fonts.ready;
  await new Promise(resolve => setTimeout(resolve, 300));

  // 2. Extract Data (Headers and Links)
  // Included H6 support
  const headers = Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((el, index) => {
    const tagName = el.tagName.toLowerCase();
    return {
      id: `header-${index}`,
      level: parseInt(tagName.substring(1)),
      text: (el as HTMLElement).innerText,
      offsetTop: (el as HTMLElement).offsetTop
    };
  });

  const links: LinkPosition[] = [];
  const linkElements = element.querySelectorAll('a');
  const containerRect = element.getBoundingClientRect();

  linkElements.forEach(link => {
    const rect = link.getBoundingClientRect();
    links.push({
      x: rect.left - containerRect.left,
      y: rect.top - containerRect.top,
      width: rect.width,
      height: rect.height,
      url: link.href
    });
  });

  // 3. Capture Full Content
  const scale = 2;
  const canvas = await html2canvas(element, {
    scale: scale, 
    useCORS: true,
    backgroundColor: bgHex,
    logging: false,
    windowWidth: contentWidthPx,
    height: element.scrollHeight,
    onclone: (clonedDoc) => {
      const clonedEl = clonedDoc.body.children[clonedDoc.body.children.length - 1] as HTMLElement;
      if (clonedEl) {
        clonedEl.style.display = 'block'; 
      }
    }
  });

  document.body.removeChild(element);

  // 4. PDF Configuration
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = 210; 
  const pdfHeight = 297; 
  const marginTop = 20; 
  const marginBottom = 20;
  const contentHeightMm = pdfHeight - marginTop - marginBottom; 
  
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  
  const pxToMm = pdfWidth / imgWidth; 
  const mmToPx = imgWidth / pdfWidth;
  const pageHeightPx = Math.floor(contentHeightMm * mmToPx); // Max content height per page in pixels

  let yOffset = 0; 
  let pageCount = 0;
  const pageStartOffsets: number[] = []; // Track where each PDF page starts in Canvas PX
  
  // Prepare for pixel scanning
  const ctx = canvas.getContext('2d');
  const bgRgb = hexToRgb(bgHex);
  const scanRange = 100 * scale; // How far up to scan for a break (approx 50-100px in source DOM)

  // 5. Page Loop
  while (yOffset < imgHeight) {
    pageStartOffsets.push(yOffset);

    if (pageCount > 0) {
      pdf.addPage();
    }
    
    // Default split point (hard cut)
    let splitY = Math.min(yOffset + pageHeightPx, imgHeight);
    
    // Smart Page Break Logic
    // If we are not at the end of the image, try to find a better split point
    if (splitY < imgHeight && ctx) {
      // Get pixel data for the region just above the hard cut
      // We scan upwards from splitY
      const scanHeight = Math.min(splitY - yOffset, scanRange);
      if (scanHeight > 0) {
        const scanStartY = splitY - scanHeight;
        // Optimization: grab the whole block once
        const imageData = ctx.getImageData(0, scanStartY, imgWidth, scanHeight);
        const data = imageData.data;
        
        // Iterate rows from bottom (splitY) to top
        for (let row = scanHeight - 1; row >= 0; row--) {
          let isRowSolid = true;
          // Check pixels in this row
          const rowOffset = row * imgWidth * 4;
          
          for (let col = 0; col < imgWidth; col++) {
            const idx = rowOffset + (col * 4);
            const r = data[idx];
            const g = data[idx+1];
            const b = data[idx+2];
            // const a = data[idx+3];
            
            // Check if pixel matches background
            // Allow small tolerance for antialiasing
            const tolerance = 5;
            const matchesBg = 
              Math.abs(r - bgRgb.r) <= tolerance &&
              Math.abs(g - bgRgb.g) <= tolerance &&
              Math.abs(b - bgRgb.b) <= tolerance;

            if (!matchesBg) {
              isRowSolid = false;
              break; // Found content in this row, not a safe break
            }
          }

          if (isRowSolid) {
            // Found a blank row!
            splitY = scanStartY + row;
            break;
          }
        }
        // If loop finishes without finding blank row, we keep original splitY (hard cut)
      }
    }
    
    // A. Fill Background Color
    pdf.setFillColor(bgHex);
    pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
    
    // B. Calculate Slice
    const sliceHeightPx = splitY - yOffset;
    
    // C. Create Temporary Canvas for Slice
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = imgWidth;
    pageCanvas.height = sliceHeightPx;
    
    const pageCtx = pageCanvas.getContext('2d');
    if (pageCtx) {
      pageCtx.fillStyle = bgHex;
      pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      
      pageCtx.drawImage(
        canvas,
        0, yOffset, imgWidth, sliceHeightPx, // Source Rect
        0, 0, imgWidth, sliceHeightPx        // Dest Rect
      );
    }
    
    const sliceImgData = pageCanvas.toDataURL('image/png');
    
    // D. Add Image to PDF
    const sliceHeightMm = sliceHeightPx * pxToMm;
    pdf.addImage(sliceImgData, 'PNG', 0, marginTop, pdfWidth, sliceHeightMm);

    // E. Add Links
    const domToMm = 210 / contentWidthPx;

    links.forEach(link => {
      const linkYCanvas = link.y * scale;

      // Check intersection with current slice
      if (linkYCanvas >= yOffset && linkYCanvas < splitY) {
         // Calculate position on PDF Page
         const yOnSlicePx = linkYCanvas - yOffset;
         
         const pdfX = link.x * domToMm;
         const pdfY = marginTop + (yOnSlicePx * pxToMm);
         const pdfW = link.width * domToMm;
         const pdfH = link.height * domToMm;

         pdf.link(pdfX, pdfY, pdfW, pdfH, { url: link.url });
      }
    });
    
    yOffset = splitY; // Move cursor to where we actually cut
    pageCount++;
  }
  
  // Add sentinel for end of document
  pageStartOffsets.push(imgHeight);

  // 6. Add Bookmarks
  headers.forEach(header => {
    // scale factor because html2canvas scale=2
    const currentScale = canvas.width / contentWidthPx; 
    const headerTopCanvasPx = header.offsetTop * currentScale;
    
    // Find which page this header belongs to based on real cut points
    let pageIndex = 0;
    for (let i = 0; i < pageStartOffsets.length - 1; i++) {
        if (headerTopCanvasPx >= pageStartOffsets[i] && headerTopCanvasPx < pageStartOffsets[i+1]) {
            pageIndex = i;
            break;
        }
    }
    
    const safePage = Math.min(pageIndex + 1, pdf.getNumberOfPages());
    pdf.outline.add(null, header.text, { pageNumber: safePage });
  });

  // 7. Save
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  pdf.save(`${baseFilename}-${dateStr}.pdf`);
};