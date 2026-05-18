<div align="center">
  <h1>Struct AI</h1>
  <p><strong>AI-powered documentation infrastructure for engineering teams.</strong></p>

  [![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
  [![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
  [![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
  [![Gemini](https://img.shields.io/badge/Gemini-AI-4285F4?style=flat-square&logo=google&logoColor=white)](https://aistudio.google.com)
  [![Status](https://img.shields.io/badge/status-active-success?style=flat-square)](#)
</div>

<br/>

Struct AI transforms repositories and raw source code into clean, production-ready README files. Upload a ZIP or paste code — Struct analyzes your project structure and generates polished markdown documentation using Gemini API.


<div align="center">
  <img src="public/struct.png" alt="Struct AI" width="100%"/>
</div>


---

## Installation

**Prerequisites:** Node.js 18+, a [Gemini API key](https://aistudio.google.com/app/apikey)

```sh
# Clone the repo
git clone https://github.com/ash1shkumar/struct.git
cd struct

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# → Add your GEMINI_API_KEY to .env

# Start the server
npm start
```

Open **http://localhost:3000** in your browser.

---

## Usage

1. Upload a `.zip` repository or paste raw source code
2. Select **Concise** or **Detailed** documentation style
3. Click **Generate Documentation**
4. Copy or download your `README.md`

---

## Tech Stack

<div align="center">

  ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
  ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
  ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
  ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
  ![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
  ![Google Gemini](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)

</div>

---


## Project Structure

```txt
struct/
│
├── public/
│       ├── struct.png
│       └── bg_no_logo.png
│
├── src/
│   ├── script.js
│   └── style.css
│
├── server/
│   └── server.js
│
├── index.html          
├── .env.example        
├── .gitignore
├── package.json
└── package-lock.json
```

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.

---

<div align="center">
  <sub>Built by <a href="https://github.com/ash1shkumar">Ashish Kumar</a></sub>
</div>
