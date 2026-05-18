const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const multer = require('multer');
const AdmZip = require('adm-zip');
const path = require('path');
const sharp = require('sharp');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const upload = multer({ storage: multer.memoryStorage() });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── Banner generator ──────────────────────────────────────────────────────────
async function generateBanner(projectName) {
  const name = (projectName || 'Project').trim();
  const bgPath = path.join(__dirname, 'bg_no_logo.png');

  const meta = await sharp(bgPath).metadata();
  const W = meta.width || 1456;
  const H = meta.height || 816;
  const cx = Math.round(W / 2);
  const cy = Math.round(H / 2);

  const targetPct = name.length <= 5 ? 0.36
    : name.length <= 8 ? 0.42
      : name.length <= 12 ? 0.52
        : name.length <= 16 ? 0.62
          : 0.72;
  const textLength = Math.round(W * targetPct);
  const fontSize = 148;

  const textSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <filter id="halo" x="-40%" y="-150%" width="180%" height="400%">
      <feGaussianBlur stdDeviation="20" in="SourceGraphic" result="wide"/>
    </filter>
    <filter id="bloom" x="-30%" y="-120%" width="160%" height="340%">
      <feGaussianBlur stdDeviation="7" in="SourceGraphic" result="tight"/>
      <feMerge>
        <feMergeNode in="tight"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle"
    font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="bold"
    textLength="${textLength}" lengthAdjust="spacingAndGlyphs"
    fill="white" filter="url(#halo)" opacity="0.5">${name}</text>
  <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle"
    font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="bold"
    textLength="${textLength}" lengthAdjust="spacingAndGlyphs"
    fill="white" filter="url(#bloom)" opacity="0.97">${name}</text>
</svg>`;

  const buffer = await sharp(bgPath)
    .composite([{ input: Buffer.from(textSvg), blend: 'over' }])
    .png()
    .toBuffer();

  return `data:image/png;base64,${buffer.toString('base64')}`;
}

// ── Main route ────────────────────────────────────────────────────────────────
app.post('/api/generate-project', upload.single('projectZip'), async (req, res) => {
  try {
    const { style, rawCode } = req.body;

    let combinedCode = '';
    let fileCount = 0;

    if (req.file) {
      const zip = new AdmZip(req.file.buffer);
      zip.getEntries().forEach((entry) => {
        const name = entry.entryName;
        if (
          !entry.isDirectory &&
          !name.includes('node_modules/') &&
          !name.includes('.git/') &&
          !name.match(/\.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|mp4|mp3|zip|pdf)$/i)
        ) {
          const content = entry.getData().toString('utf8');
          if (content.length < 100000) {
            combinedCode += `\n\n--- FILE: ${name} ---\n\n${content}`;
            fileCount++;
          }
        }
      });
    } else if (rawCode && rawCode.trim().length > 0) {
      combinedCode = `\n\n--- FILE: pasted_code.txt ---\n\n${rawCode}`;
      fileCount = 1;
    } else {
      return res.status(400).json({ error: 'No repository source or code provided.' });
    }

    if (fileCount === 0 && !rawCode) {
      return res.status(400).json({ error: 'No valid code files found in the ZIP.' });
    }

    const MAX_CHARS = 500000;
    if (combinedCode.length > MAX_CHARS) {
      combinedCode = combinedCode.substring(0, MAX_CHARS);
    }

    const isDetailed = style === 'detailed';

    // ── Templates ─────────────────────────────────────────────────────────────
    const conciseTemplate = `
# [Project Name]
> [One-line description]

[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Downloads Stats][npm-downloads]][npm-url]

[One to two paragraph statement about your product and what it does.]

## Installation

OS X & Linux:
\`\`\`sh
npm install [package-name] --save
\`\`\`

Windows:
\`\`\`sh
edit autoexec.bat
\`\`\`

## Usage example

[A few motivating and useful examples. Include real code snippets.]

\`\`\`js
// example
\`\`\`

_For more examples, please refer to the [Wiki][wiki]._

## Development setup

\`\`\`sh
npm install
npm test
\`\`\`

## Release History

* 0.1.0 - Initial release

## Meta

[Author] – email – license

## Contributing

1. Fork it
2. Create your feature branch (\`git checkout -b feature/fooBar\`)
3. Commit your changes (\`git commit -am 'Add some fooBar'\`)
4. Push (\`git push origin feature/fooBar\`)
5. Create a Pull Request

[npm-image]: https://img.shields.io/npm/v/datadog-metrics.svg?style=flat-square
[npm-url]: https://npmjs.org/package/datadog-metrics
[npm-downloads]: https://img.shields.io/npm/dm/datadog-metrics.svg?style=flat-square
[travis-image]: https://img.shields.io/travis/dbader/node-datadog-metrics/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/dbader/node-datadog-metrics
[wiki]: https://github.com/yourname/yourproject/wiki`;

    const detailedTemplate = `
# [Product/Project Name]

<div align="center">
  <img src="https://img.shields.io/badge/[Tech1]-[Version]-blue?style=for-the-badge" alt="Tech1" />
  <img src="https://img.shields.io/badge/[Tech2]-[Version]-green?style=for-the-badge" alt="Tech2" />
  <img src="https://img.shields.io/badge/[Tech3]-[Version]-purple?style=for-the-badge" alt="Tech3" />
</div>

<br />

<div align="center">
  <h3>Live Demo</h3>
  <p><strong>Demo Video:</strong> <a href="#">Watch Demo</a></p>
  <p><strong>Live Site:</strong> <a href="#">Visit Application</a></p>
</div>

<br />

[One to two paragraphs describing the project and what problem it solves.]

## Features

### Core Functionality
- **[Feature 1]**: [Description]
- **[Feature 2]**: [Description]
- **[Feature 3]**: [Description]

### User Experience
- **Modern UI**: [Description]
- **Responsive Design**: Works on desktop, tablet, and mobile.

### Advanced Features
- **[Advanced Feature 1]**: [Description]
- **[Advanced Feature 2]**: [Description]

## Tech Stack

### Frontend
- **[Framework]** - [Purpose]
- **[Library]** - [Purpose]

### Backend
- **[Runtime]** - [Purpose]
- **[Framework]** - [Purpose]
- **[Database]** - [Purpose]

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
\`\`\`bash
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name
\`\`\`

2. **Install dependencies**
\`\`\`bash
npm install
\`\`\`

3. **Configure environment variables**
\`\`\`env
PORT=3000
DATABASE_URI=your-connection-string
API_KEY=your-api-key
\`\`\`

4. **Start the development server**
\`\`\`bash
npm run dev
\`\`\`

## Project Structure

\`\`\`
your-repo/
├── src/
│   ├── components/
│   ├── routes/
│   └── utils/
├── public/
├── package.json
└── README.md
\`\`\`

## API Endpoints

### [Resource Group 1]
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/resource | Get all items |
| POST | /api/resource | Create item |
| GET | /api/resource/:id | Get single item |
| PUT | /api/resource/:id | Update item |
| DELETE | /api/resource/:id | Delete item |

## Architecture

\`\`\`mermaid
[MERMAID DIAGRAM]
\`\`\`

## Design System

### Color Palette
- **Primary**: [Hex] - [Usage]
- **Secondary**: [Hex] - [Usage]

### Typography
- **Primary Font**: [Font Name]
- **Code Font**: [Font Name]

## Security Features
- [Security Feature 1]
- [Security Feature 2]
- [Security Feature 3]

## Deployment

### Frontend
1. Build: \`npm run build\`
2. Deploy dist folder

### Backend
1. Set environment variables
2. Deploy server

## Contributing

1. Fork the repository
2. Create feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit changes (\`git commit -m 'Add amazing feature'\`)
4. Push (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

MIT License — see [LICENSE](LICENSE) for details.

## Acknowledgments

- [Credit 1]
- [Credit 2]`;

    const template = isDetailed ? detailedTemplate : conciseTemplate;

    const prompt = `You are an expert AI software architect and technical writer.

Analyze the project code below and generate a single comprehensive README.md.

Return ONLY a raw JSON object — no markdown fences, no backticks, no text before or after:
{"projectName":"...","readme":"..."}

- "projectName": extract the real project name from the code
- "readme": full README as a string with newlines escaped as \\n and quotes escaped as \\"

Style: ${isDetailed ? 'DETAILED — use all template sections, include emoji headings, badges, mermaid diagram, API tables' : 'CONCISE — clean and minimal, only essential sections, no emojis'}

Follow this template EXACTLY — replace every placeholder with real values from the code. No placeholder text should remain:

${template}

${isDetailed ? `For the Architecture section, use ONLY this Mermaid format:
flowchart TD
  A[NodeA] --> B[NodeB]
  B --> C[NodeC]
Rules: flowchart TD only, no parentheses in labels, no slashes, no labeled edges, no subgraphs, max 8 nodes, single-letter IDs only.
For API Endpoints, extract real routes and fill the table.` : ''}

Files analyzed: ${fileCount}

Project Code:
\`\`\`
${combinedCode}
\`\`\`

CRITICAL: Escape all " as \\" and all newlines as \\n inside the JSON string values. Return only the JSON object.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const responseText = response.text;

    let projectName = 'Project';
    let readme = '';

    try {
      const clean = responseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      const parsed = JSON.parse(clean);
      projectName = parsed.projectName || 'Project';
      readme = parsed.readme || '';
    } catch (e) {
      const nameMatch = responseText.match(/"projectName"\s*:\s*"([^"]+)"/);
      if (nameMatch) projectName = nameMatch[1];
      const readmeMatch = responseText.match(/"readme"\s*:\s*"([\s\S]*?)"\s*}?\s*$/);
      if (readmeMatch) {
        readme = readmeMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      } else {
        readme = responseText.replace(/^[^#]*?(#)/, '$1').trim();
      }
    }

    // Generate banner with project name
    const bannerSrc = await generateBanner(projectName);
    const bannerMd = `\n<div align="center">\n  <img src="${bannerSrc}" alt="${projectName}" width="100%"/>\n</div>\n\n`;

    // Insert banner after intro, before first ## section
    let finalReadme;
    const firstSectionMatch = readme.match(/\n(## )/);
    if (firstSectionMatch) {
      const splitIndex = readme.indexOf('\n' + firstSectionMatch[1]);
      finalReadme = readme.slice(0, splitIndex) + '\n' + bannerMd + readme.slice(splitIndex);
    } else {
      finalReadme = readme + '\n' + bannerMd;
    }

    res.json({ readme: finalReadme, projectName });

  } catch (error) {
    console.error('Error generating documentation:', error);

    let message = 'Failed to generate documentation.';
    if (error?.message) {
      if (error.message.includes('API_KEY') || error.message.includes('401') || error.message.includes('Unauthorized')) {
        message = 'Invalid Gemini API key. Check your .env file.';
      } else if (error.message.includes('429') || error.message.toLowerCase().includes('rate limit') || error.message.toLowerCase().includes('quota')) {
        message = 'Gemini API rate limit hit. Wait a moment and try again.';
      } else if (error.message.toLowerCase().includes('context') || error.message.toLowerCase().includes('too long')) {
        message = 'Codebase too large. Try with a smaller ZIP or pasted code.';
      } else {
        message = `Error: ${error.message}`;
      }
    }

    res.status(500).json({ error: message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ Struct AI server running at http://localhost:${PORT}`);
});