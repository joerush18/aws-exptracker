const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');

async function convertMarkdownToDocx() {
  const markdown = fs.readFileSync('TECHNICAL_REPORT.md', 'utf8');
  
  // Split markdown into sections
  const lines = markdown.split('\n');
  const children = [];
  
  let currentParagraph = [];
  let inCodeBlock = false;
  let codeBlockContent = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Handle code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        if (codeBlockContent.length > 0) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: codeBlockContent.join('\n'),
                  font: 'Courier New',
                  size: 20,
                }),
              ],
              spacing: { after: 200 },
            })
          );
          codeBlockContent = [];
        }
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }
    
    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }
    
    // Handle headers
    if (line.startsWith('# ')) {
      if (currentParagraph.length > 0) {
        children.push(new Paragraph({ children: currentParagraph, spacing: { after: 200 } }));
        currentParagraph = [];
      }
      children.push(
        new Paragraph({
          text: line.substring(2).trim(),
          heading: HeadingLevel.TITLE,
          spacing: { after: 400 },
        })
      );
    } else if (line.startsWith('## ')) {
      if (currentParagraph.length > 0) {
        children.push(new Paragraph({ children: currentParagraph, spacing: { after: 200 } }));
        currentParagraph = [];
      }
      children.push(
        new Paragraph({
          text: line.substring(3).trim(),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 200 },
        })
      );
    } else if (line.startsWith('### ')) {
      if (currentParagraph.length > 0) {
        children.push(new Paragraph({ children: currentParagraph, spacing: { after: 200 } }));
        currentParagraph = [];
      }
      children.push(
        new Paragraph({
          text: line.substring(4).trim(),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 150 },
        })
      );
    } else if (line.startsWith('#### ')) {
      if (currentParagraph.length > 0) {
        children.push(new Paragraph({ children: currentParagraph, spacing: { after: 200 } }));
        currentParagraph = [];
      }
      children.push(
        new Paragraph({
          text: line.substring(5).trim(),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 150, after: 100 },
        })
      );
    } else if (line.trim() === '') {
      // Empty line - end current paragraph
      if (currentParagraph.length > 0) {
        children.push(new Paragraph({ children: currentParagraph, spacing: { after: 200 } }));
        currentParagraph = [];
      }
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // Bullet point
      if (currentParagraph.length > 0) {
        children.push(new Paragraph({ children: currentParagraph, spacing: { after: 200 } }));
        currentParagraph = [];
      }
      children.push(
        new Paragraph({
          text: line.substring(2).trim(),
          bullet: { level: 0 },
          spacing: { after: 100 },
        })
      );
    } else if (line.match(/^\d+\.\s/)) {
      // Numbered list
      if (currentParagraph.length > 0) {
        children.push(new Paragraph({ children: currentParagraph, spacing: { after: 200 } }));
        currentParagraph = [];
      }
      children.push(
        new Paragraph({
          text: line.replace(/^\d+\.\s/, '').trim(),
          numbering: { reference: 'default-numbering', level: 0 },
          spacing: { after: 100 },
        })
      );
    } else {
      // Regular text
      currentParagraph.push(new TextRun(line));
    }
  }
  
  // Add remaining paragraph
  if (currentParagraph.length > 0) {
    children.push(new Paragraph({ children: currentParagraph }));
  }
  
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  });
  
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync('TECHNICAL_REPORT.docx', buffer);
  console.log('✅ DOCX file created: TECHNICAL_REPORT.docx');
}

convertMarkdownToDocx().catch(console.error);
