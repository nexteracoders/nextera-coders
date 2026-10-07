import React, { useState } from 'react';
import {
  Sparkles,
  Gamepad2,
  Globe,
  Code2,
  Cpu,
  Layers,
  Database,
  Search,
  ArrowRight,
  FolderTree,
  Atom,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { cn } from '../../utils/cn';

export interface ProjectTemplate {
  id: string;
  title: string;
  category: 'web' | 'dsa' | 'backend' | 'ai';
  language: string;
  icon: React.ReactNode;
  gradient: string;
  badge: string;
  description: string;
  filesCount: number;
  files: Array<{
    name: string;
    language: string;
    content: string;
  }>;
  folders?: Array<{
    id: string;
    name: string;
  }>;
}

export const STARTER_PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'react-starter',
    title: 'React.js Modern App (Hooks & State)',
    category: 'web',
    language: 'javascript',
    icon: <Atom className="w-5 h-5 text-cyan-400" />,
    gradient: 'from-cyan-500/20 via-blue-500/10 to-indigo-500/20',
    badge: 'CRA / React 18',
    description: 'Modern React application with functional components, useState hook, Tailwind CSS, live counter, and modular architecture.',
    filesCount: 5,
    folders: [
      { id: 'folder-src', name: 'src' },
      { id: 'folder-public', name: 'public' },
    ],
    files: [
      {
        name: 'App.jsx',
        language: 'javascript',
        content: `// React Functional Component with Hooks & State
function App() {
  const [count, setCount] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState('features');

  const features = [
    { title: '⚡ Lightning Fast Sandbox', desc: 'Real-time in-browser compilation with instant hot reload.' },
    { title: '⚛️ React 18 + Hooks', desc: 'Pre-configured with useState, useEffect, and modern JSX.' },
    { title: '📦 Production Ready', desc: 'Export as complete ZIP ready for GitHub, Vercel, or VS Code.' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white font-sans p-6">
      {/* Header Bar */}
      <header className="max-w-4xl mx-auto flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-2xl font-bold shadow-lg shadow-cyan-500/20">
            ⚛
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
              NextEra React App
            </h1>
            <p className="text-xs text-slate-400">Created via npx create-react-app &bull; React v18.3.1</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            localhost:3000
          </span>
        </div>
      </header>

      {/* Hero Counter Demo */}
      <main className="max-w-4xl mx-auto my-8 p-8 rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-950 to-[#0c121e] border border-cyan-500/20 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-mono font-medium mb-3 border border-cyan-500/30">
          State Hook Demonstration
        </div>
        <h2 className="text-2xl sm:text-3xl font-black mb-2 text-white">Interactive Counter Component</h2>
        <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto leading-relaxed">
          Modify <code className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-xs border border-slate-700">src/App.jsx</code> in the IDE editor to see live updates instantly.
        </p>

        <div className="inline-flex items-center gap-4 p-3 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-inner">
          <button 
            onClick={() => setCount(c => c - 1)}
            className="w-11 h-11 rounded-xl bg-slate-700 hover:bg-slate-600 text-cyan-300 font-bold text-xl transition-all active:scale-90 cursor-pointer"
            title="Decrement"
          >
            -
          </button>
          <span className="text-3xl font-mono font-black text-cyan-400 px-6 min-w-[70px] text-center select-none">
            {count}
          </span>
          <button 
            onClick={() => setCount(c => c + 1)}
            className="w-11 h-11 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xl transition-all active:scale-90 shadow-lg shadow-cyan-600/30 cursor-pointer"
            title="Increment"
          >
            +
          </button>
        </div>
      </main>

      {/* Feature Cards Grid */}
      <section className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-4">
        {features.map((feat, i) => (
          <div key={i} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all hover:-translate-y-0.5">
            <h3 className="text-sm font-bold text-cyan-300 mb-1.5">{feat.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

// Render root into DOM
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
`,
      },
      {
        name: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React App - NextEra Coders</title>
  <!-- React 18 & ReactDOM via CDN -->
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <!-- Babel Standalone for in-browser JSX compilation -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="styles.css">
</head>
<body class="bg-[#0a0e17] text-white">
  <div id="root"></div>
</body>
</html>`,
      },
      {
        name: 'styles.css',
        language: 'css',
        content: `/* Custom App Styles & Animations */
@keyframes spinSlow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin-slow {
  animation: spinSlow 15s linear infinite;
}
`,
      },
      {
        name: 'package.json',
        language: 'json',
        content: `{
  "name": "nextera-react-app",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test"
  }
}`,
      },
      {
        name: 'README.md',
        language: 'markdown',
        content: `# NextEra React Application

This project was bootstrapped with **npx create-react-app** in the NextEra Compiler Pro IDE.

## Available Scripts

In the terminal, you can run:

### \`npm start\`
Runs the app in development mode.
Open [http://localhost:3000](http://localhost:3000) in the integrated browser to view it.

### \`npm run build\`
Bundles the app into static files for production.

### \`export-project\` or \`zip\`
Packages all project files into a single ZIP archive downloaded to:
\`C:\\Users\\Sandip\\Downloads\\nextera-code-project.zip\`
`,
      },
    ],
  },
  {
    id: 'cyber-arcade',
    title: 'Retro Cyber Arcade (HTML5 Game)',
    category: 'web',
    language: 'html',
    icon: <Gamepad2 className="w-5 h-5 text-amber-400" />,
    gradient: 'from-amber-500/20 via-orange-500/10 to-purple-500/20',
    badge: 'Playable Web Game',
    description: 'Playable space arcade dodge game on HTML5 Canvas with starfield particles, scoring, and keyboard controls.',
    filesCount: 3,
    files: [
      {
        name: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Cyber Dodge Arcade</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="game-container">
    <header class="hud">
      <h1>⚡ CYBER DODGE</h1>
      <div class="stats">
        <span>SCORE: <b id="score">0</b></span>
        <span>LIVES: <b id="lives">❤️❤️❤️</b></span>
      </div>
    </header>
    <canvas id="gameCanvas" width="480" height="360"></canvas>
    <div class="controls-hint">
      <p>⬅️ / ➡️ or [A] / [D] to steer spaceship &bull; Dodge asteroids!</p>
    </div>
  </div>
  <script src="game.js"></script>
</body>
</html>`,
      },
      {
        name: 'styles.css',
        language: 'css',
        content: `body {
  margin: 0;
  background: #090a0f;
  color: #00ffcc;
  font-family: 'Courier New', monospace;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
.game-container {
  text-align: center;
  background: radial-gradient(circle, #1a1c29 0%, #08090d 100%);
  border: 2px solid #00ffcc;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 0 30px rgba(0, 255, 204, 0.25);
}
.hud {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
h1 {
  margin: 0;
  font-size: 20px;
  text-shadow: 0 0 10px #00ffcc;
}
canvas {
  background: #050608;
  border: 1px solid #334155;
  border-radius: 8px;
  display: block;
}
.controls-hint {
  margin-top: 10px;
  font-size: 11px;
  color: #94a3b8;
}`,
      },
      {
        name: 'game.js',
        language: 'javascript',
        content: `const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');

let player = { x: 220, y: 310, w: 26, h: 26, speed: 6 };
let enemies = [];
let stars = [];
let score = 0;
let lives = 3;
let keys = {};

// Background Starfield
for (let i = 0; i < 40; i++) {
  stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, s: Math.random() * 2 + 1 });
}

window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function spawnEnemy() {
  if (Math.random() < 0.04) {
    enemies.push({ x: Math.random() * (canvas.width - 20), y: -20, s: Math.random() * 3 + 2, r: Math.random() * 8 + 6 });
  }
}

function update() {
  if (keys['arrowleft'] || keys['a']) player.x = Math.max(0, player.x - player.speed);
  if (keys['arrowright'] || keys['d']) player.x = Math.min(canvas.width - player.w, player.x + player.speed);

  // Update stars
  stars.forEach(st => {
    st.y += st.s;
    if (st.y > canvas.height) st.y = 0;
  });

  // Update enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    let en = enemies[i];
    en.y += en.s;

    // Collision detection
    if (
      player.x < en.x + en.r &&
      player.x + player.w > en.x - en.r &&
      player.y < en.y + en.r &&
      player.y + player.h > en.y - en.r
    ) {
      enemies.splice(i, 1);
      lives--;
      livesEl.textContent = '❤️'.repeat(Math.max(0, lives));
      if (lives <= 0) {
        alert('GAME OVER! Your Score: ' + score);
        lives = 3;
        score = 0;
        livesEl.textContent = '❤️❤️❤️';
      }
      continue;
    }

    if (en.y > canvas.height + 20) {
      enemies.splice(i, 1);
      score += 10;
      scoreEl.textContent = score;
    }
  }

  spawnEnemy();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Stars
  ctx.fillStyle = '#64748b';
  stars.forEach(st => ctx.fillRect(st.x, st.y, st.s, st.s));

  // Player ship
  ctx.fillStyle = '#00ffcc';
  ctx.beginPath();
  ctx.moveTo(player.x + player.w / 2, player.y);
  ctx.lineTo(player.x, player.y + player.h);
  ctx.lineTo(player.x + player.w, player.y + player.h);
  ctx.closePath();
  ctx.fill();

  // Asteroids
  ctx.fillStyle = '#f43f5e';
  enemies.forEach(en => {
    ctx.beginPath();
    ctx.arc(en.x, en.y, en.r, 0, Math.PI * 2);
    ctx.fill();
  });

  requestAnimationFrame(() => {
    update();
    draw();
  });
}

draw();`,
      },
    ],
  },
  {
    id: 'glass-portfolio',
    title: 'Modern Glassmorphic Portfolio',
    category: 'web',
    language: 'html',
    icon: <Globe className="w-5 h-5 text-indigo-400" />,
    gradient: 'from-indigo-500/20 via-brand-500/10 to-pink-500/20',
    badge: 'Responsive Web UI',
    description: 'Sleek dark-mode personal website with frosted glass cards, gradient glow, and interactive experience grid.',
    filesCount: 3,
    files: [
      {
        name: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sandip Kr Verma &bull; Full Stack Engineer</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="glow-orb"></div>
  <main class="glass-card">
    <header>
      <div class="avatar">⚡</div>
      <h2>Sandip Kr Verma</h2>
      <p class="tagline">Next-Gen Full Stack & AI Engineer</p>
    </header>
    <section class="skills">
      <span class="chip">React</span>
      <span class="chip">Node.js</span>
      <span class="chip">Python AI</span>
      <span class="chip">TypeScript</span>
      <span class="chip">Docker</span>
    </section>
    <section class="projects">
      <div class="project-item">
        <h4>🚀 CloudFlow Engine</h4>
        <p>Microsecond real-time event streaming pipeline.</p>
      </div>
      <div class="project-item">
        <h4>🧠 NeuroSynth Copilot</h4>
        <p>LLM reasoning assistant with structured memory.</p>
      </div>
    </section>
    <button id="hireBtn" class="btn">Say Hello ✉️</button>
  </main>
  <script src="app.js"></script>
</body>
</html>`,
      },
      {
        name: 'styles.css',
        language: 'css',
        content: `body {
  margin: 0;
  background: #0b0f19;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #f8fafc;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  overflow: hidden;
}
.glow-orb {
  position: absolute;
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.45) 0%, rgba(236, 72, 153, 0.2) 60%, transparent 80%);
  filter: blur(50px);
  z-index: 0;
}
.glass-card {
  position: relative;
  z-index: 1;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  padding: 32px;
  max-width: 380px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
  text-align: center;
}
.avatar {
  font-size: 36px;
  margin-bottom: 8px;
}
h2 { margin: 4px 0; font-size: 22px; }
.tagline { color: #94a3b8; font-size: 13px; margin-bottom: 20px; }
.skills { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 20px; }
.chip {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
}
.projects { text-align: left; margin-bottom: 20px; }
.project-item {
  background: rgba(255, 255, 255, 0.04);
  padding: 10px 14px;
  border-radius: 12px;
  margin-bottom: 8px;
}
.project-item h4 { margin: 0 0 4px; font-size: 13px; color: #a5b4fc; }
.project-item p { margin: 0; font-size: 11px; color: #94a3b8; }
.btn {
  background: linear-gradient(135deg, #6366f1, #ec4899);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
}
.btn:hover { transform: scale(1.05); }`,
      },
      {
        name: 'app.js',
        language: 'javascript',
        content: `document.getElementById('hireBtn').addEventListener('click', () => {
  alert('Thanks for visiting NextEra Coders! Feel free to connect on LinkedIn or Email.');
});`,
      },
    ],
  },
  {
    id: 'python-data-insights',
    title: 'Python AI & Statistical Analyzer',
    category: 'ai',
    language: 'python',
    icon: <Cpu className="w-5 h-5 text-emerald-400" />,
    gradient: 'from-emerald-500/20 via-teal-500/10 to-indigo-500/20',
    badge: 'Data Science & Math',
    description: 'Statistical modeling script computing mean, variance, standard deviation, Z-score outliers, and ASCII histograms.',
    filesCount: 1,
    files: [
      {
        name: 'main.py',
        language: 'python',
        content: `import math

# Sample dataset representing user response times (in ms)
data = [120, 135, 142, 110, 150, 165, 180, 125, 130, 195, 450, 115, 128, 138, 145]

def analyze_dataset(values):
    n = len(values)
    mean_val = sum(values) / n
    sorted_vals = sorted(values)
    median_val = sorted_vals[n // 2] if n % 2 != 0 else (sorted_vals[n // 2 - 1] + sorted_vals[n // 2]) / 2
    variance = sum((x - mean_val) ** 2 for x in values) / (n - 1)
    std_dev = math.sqrt(variance)

    print("=" * 45)
    print("📊 NEXTERA AI STATISTICAL ENGINE")
    print("=" * 45)
    print(f"Sample Count (N)   : {n}")
    print(f"Mean (Average)     : {mean_val:.2f} ms")
    print(f"Median             : {median_val:.2f} ms")
    print(f"Standard Deviation : {std_dev:.2f} ms")
    print(f"Variance           : {variance:.2f}")

    # Detect Anomaly Outliers (Z-score > 2.0)
    print("\\n🚨 ANOMALY & OUTLIER DETECTION (Z-Score > 2.0):")
    outliers = [x for x in values if abs((x - mean_val) / std_dev) > 2.0]
    if outliers:
        for val in outliers:
            z = (val - mean_val) / std_dev
            print(f"  • Outlier Detected: {val} ms (Z-Score: +{z:.2f}σ)")
    else:
        print("  ✓ No critical statistical outliers found.")

    # ASCII Distribution Histogram
    print("\\n📈 DATA SPREAD HISTOGRAM:")
    bins = {"<130ms": 0, "130-160ms": 0, "160-200ms": 0, ">200ms": 0}
    for x in values:
        if x < 130: bins["<130ms"] += 1
        elif x <= 160: bins["130-160ms"] += 1
        elif x <= 200: bins["160-200ms"] += 1
        else: bins[">200ms"] += 1

    for label, count in bins.items():
        bar = "█" * (count * 3)
        print(f"  {label:<12} | {bar} ({count})")
    print("=" * 45)

analyze_dataset(data)`,
      },
    ],
  },
  {
    id: 'cpp-graph-dijkstra',
    title: 'C++ Dijkstra Shortest Path Engine',
    category: 'dsa',
    language: 'cpp',
    icon: <Code2 className="w-5 h-5 text-cyan-400" />,
    gradient: 'from-cyan-500/20 via-blue-500/10 to-indigo-500/20',
    badge: 'DSA & Competitive',
    description: 'Graph routing implementation utilizing priority queues to compute shortest weighted paths across network nodes.',
    filesCount: 1,
    files: [
      {
        name: 'main.cpp',
        language: 'cpp',
        content: `#include <iostream>
#include <vector>
#include <queue>
#include <string>

using namespace std;

const int INF = 1e9;

struct Edge {
    int to;
    int weight;
    string label;
};

void dijkstra(int startNode, int numNodes, const vector<vector<Edge>>& graph) {
    vector<int> dist(numNodes, INF);
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;

    dist[startNode] = 0;
    pq.push({0, startNode});

    cout << "========================================" << endl;
    cout << "⚡ C++ DIJKSTRA SHORTEST PATH ROUTER" << endl;
    cout << "========================================" << endl;
    cout << "Starting Node: Node [" << startNode << "] (Source Router)" << endl << endl;

    while (!pq.empty()) {
        int d = pq.top().first;
        int u = pq.top().second;
        pq.pop();

        if (d > dist[u]) continue;

        for (const auto& edge : graph[u]) {
            if (dist[u] + edge.weight < dist[edge.to]) {
                dist[edge.to] = dist[u] + edge.weight;
                pq.push({dist[edge.to], edge.to});
            }
        }
    }

    cout << "Target Node | Shortest Latency | Routing Status" << endl;
    cout << "------------+------------------+---------------" << endl;
    for (int i = 0; i < numNodes; i++) {
        cout << "   Node [" << i << "]   |       ";
        if (dist[i] == INF) {
            cout << "Unreachable | ❌ Disconnected" << endl;
        } else {
            cout << dist[i] << " ms        | ✓ Optimal Route" << endl;
        }
    }
    cout << "========================================" << endl;
}

int main() {
    int nodes = 5;
    vector<vector<Edge>> graph(nodes);

    // Add edges (Node 0 connects to 1 & 2, etc.)
    graph[0].push_back({1, 4, "Fiber-A"});
    graph[0].push_back({2, 2, "Fiber-B"});
    graph[1].push_back({2, 5, "Fiber-C"});
    graph[1].push_back({3, 10, "Fiber-D"});
    graph[2].push_back({3, 3, "Fiber-E"});
    graph[3].push_back({4, 7, "Fiber-F"});

    dijkstra(0, nodes, graph);
    return 0;
}`,
      },
    ],
  },
  {
    id: 'java-oop-banking',
    title: 'Java OOP Neo Banking System',
    category: 'backend',
    language: 'java',
    icon: <Layers className="w-5 h-5 text-amber-500" />,
    gradient: 'from-amber-500/20 via-yellow-500/10 to-orange-500/20',
    badge: 'Enterprise OOP',
    description: 'Object-oriented core banking simulator with encapsulation, polymorphic transactions, and interest calculations.',
    filesCount: 1,
    files: [
      {
        name: 'Main.java',
        language: 'java',
        content: `import java.util.ArrayList;
import java.util.List;

class BankAccount {
    private String accountNumber;
    private String ownerName;
    protected double balance;
    private List<String> transactions = new ArrayList<>();

    public BankAccount(String accNum, String owner, double initialBalance) {
        this.accountNumber = accNum;
        this.ownerName = owner;
        this.balance = initialBalance;
        log("Account initialized with balance: $" + initialBalance);
    }

    public void deposit(double amount) {
        if (amount > 0) {
            balance += amount;
            log("Deposit: +$" + amount + " | Balance: $" + balance);
        }
    }

    public boolean withdraw(double amount) {
        if (amount > 0 && amount <= balance) {
            balance -= amount;
            log("Withdrawal: -$" + amount + " | Balance: $" + balance);
            return true;
        }
        log("FAILED Withdrawal of $" + amount + " (Insufficient Funds)");
        return false;
    }

    protected void log(String msg) {
        transactions.add(msg);
    }

    public void printStatement() {
        System.out.println("----------------------------------------");
        System.out.println("🏛️ ACCOUNT STATEMENT: " + ownerName + " (" + accountNumber + ")");
        System.out.println("----------------------------------------");
        for (String tx : transactions) {
            System.out.println("  • " + tx);
        }
        System.out.println("Current Available Balance: $" + String.format("%.2f", balance));
        System.out.println("----------------------------------------\\n");
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println("========================================");
        System.out.println("⚡ NEXTERA CODERS NEO BANKING SYSTEM");
        System.out.println("========================================");

        BankAccount acc = new BankAccount("NEC-88901", "Priya Sharma", 1500.00);
        acc.deposit(650.50);
        acc.withdraw(200.00);
        acc.withdraw(2500.00); // Exceeds balance
        acc.deposit(320.00);

        acc.printStatement();
    }
}`,
      },
    ],
  },
  {
    id: 'kanban-board',
    title: 'Interactive Kanban Board (JS App)',
    category: 'web',
    language: 'html',
    icon: <Layers className="w-5 h-5 text-purple-400" />,
    gradient: 'from-purple-500/20 via-pink-500/10 to-indigo-500/20',
    badge: 'Productivity Tool',
    description: 'Task board with column status updates (To Do, In Progress, Completed), badge counters, and real-time addition.',
    filesCount: 3,
    files: [
      {
        name: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sprint Kanban Board</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="board-container">
    <header class="board-header">
      <h2>📋 Sprint 24 Task Board</h2>
      <button id="addBtn">+ New Task</button>
    </header>
    <div class="columns">
      <div class="column" id="todoCol">
        <h3>To Do <span class="badge" id="todoCount">2</span></h3>
        <div class="task-list" id="todoList">
          <div class="task-card">Build Auth Microservice</div>
          <div class="task-card">Design Schema Migrations</div>
        </div>
      </div>
      <div class="column" id="progCol">
        <h3>In Progress <span class="badge" id="progCount">1</span></h3>
        <div class="task-list" id="progList">
          <div class="task-card">Implement AI Compiler Doctor</div>
        </div>
      </div>
      <div class="column" id="doneCol">
        <h3>Completed <span class="badge" id="doneCount">1</span></h3>
        <div class="task-list" id="doneList">
          <div class="task-card">Setup WebSocket Gateway</div>
        </div>
      </div>
    </div>
  </div>
  <script src="kanban.js"></script>
</body>
</html>`,
      },
      {
        name: 'styles.css',
        language: 'css',
        content: `body {
  margin: 0;
  background: #0f172a;
  color: #f1f5f9;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  padding: 24px;
}
.board-container { max-width: 800px; margin: 0 auto; }
.board-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
#addBtn {
  background: #6366f1;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}
.columns { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.column {
  background: #1e293b;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #334155;
}
.column h3 {
  margin: 0 0 14px;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.badge { background: #334155; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
.task-list { display: flex; flex-col; gap: 8px; }
.task-card {
  background: #0f172a;
  border: 1px solid #334155;
  padding: 12px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  transition: transform 0.15s;
}
.task-card:hover { transform: translateY(-2px); border-color: #6366f1; }`,
      },
      {
        name: 'kanban.js',
        language: 'javascript',
        content: `document.getElementById('addBtn').addEventListener('click', () => {
  const title = prompt('Enter new task name:');
  if (title && title.trim()) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.textContent = title.trim();
    document.getElementById('todoList').appendChild(card);
    const countEl = document.getElementById('todoCount');
    countEl.textContent = parseInt(countEl.textContent) + 1;
  }
});`,
      },
    ],
  },
  {
    id: 'sql-sales-analytics',
    title: 'SQL Enterprise Sales Analytics',
    category: 'backend',
    language: 'sql',
    icon: <Database className="w-5 h-5 text-blue-400" />,
    gradient: 'from-blue-500/20 via-cyan-500/10 to-indigo-500/20',
    badge: 'Database & Reporting',
    description: 'Relational queries with aggregations, customer cohorts, and running revenue totals.',
    filesCount: 1,
    files: [
      {
        name: 'queries.sql',
        language: 'sql',
        content: `-- NextEra Coders Enterprise Sales & Analytics Engine

-- 1. Top Performing Revenue Categories
SELECT 
    p.category,
    COUNT(o.order_id) AS total_orders,
    SUM(o.amount) AS gross_revenue,
    ROUND(AVG(o.amount), 2) AS average_order_value
FROM orders o
JOIN products p ON o.product_id = p.product_id
WHERE o.status = 'COMPLETED'
GROUP BY p.category
ORDER BY gross_revenue DESC;

-- 2. Customer Cohort LTV Ranking (Window Functions)
SELECT 
    c.customer_id,
    c.customer_name,
    SUM(o.amount) AS total_spent,
    DENSE_RANK() OVER (ORDER BY SUM(o.amount) DESC) AS rank_tier
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.customer_name
HAVING SUM(o.amount) > 1000
LIMIT 10;`,
      },
    ],
  },
];

interface StarterTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTemplate: (template: ProjectTemplate) => void;
}

export const StarterTemplatesModal: React.FC<StarterTemplatesModalProps> = ({
  isOpen,
  onClose,
  onLoadTemplate,
}) => {
  const { success } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'web' | 'dsa' | 'backend' | 'ai'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = STARTER_PROJECT_TEMPLATES.filter((t) => {
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesQuery =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.language.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handleSelect = (template: ProjectTemplate) => {
    onLoadTemplate(template);
    success(`Loaded "${template.title}" into workspace! Click Run to execute.`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="3xl"
    >
      <div className="space-y-4 text-slate-200">
        
        {/* Header Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-950/80 via-indigo-950/70 to-slate-900 border border-brand-500/30 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <span>Starter Project Templates</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  Ready to Run
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                1-click load production-grade multi-file projects across Web, Python, C++, Java & DSA.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {(
              [
                { id: 'all', label: 'All Templates' },
                { id: 'web', label: 'Web Apps' },
                { id: 'dsa', label: 'DSA & Algorithms' },
                { id: 'backend', label: 'Backend & OOP' },
                { id: 'ai', label: 'AI & Data' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer',
                  selectedCategory === cat.id
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className={cn(
                'p-4 rounded-2xl border border-slate-800 bg-gradient-to-br transition-all flex flex-col justify-between hover:border-brand-500/40 hover:scale-[1.01] shadow-lg group',
                template.gradient
              )}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-900/80 border border-slate-700/60 flex items-center justify-center shrink-0">
                      {template.icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                        {template.title}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">
                        {template.badge}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-900 border border-slate-800 text-slate-300">
                    {template.language}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {template.description}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <FolderTree className="w-3 h-3 text-brand-400" />
                  <span>{template.filesCount} workspace files</span>
                </span>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => handleSelect(template)}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="font-mono text-xs shadow-md shadow-brand-500/20"
                >
                  Load Template
                </Button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </Modal>
  );
};
