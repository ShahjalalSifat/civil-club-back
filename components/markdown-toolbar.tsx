"use client";

import { useState } from "react";
import { 
  GitFork, 
  Network, 
  BarChart3, 
  PieChart, 
  Table, 
  Code2, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered, 
  Quote, 
  Link as LinkIcon, 
  Image as ImageIcon,
  Sparkles,
  ChevronDown
} from "lucide-react";

interface MarkdownToolbarProps {
  onInsertSnippet: (snippet: string) => void;
}

export function MarkdownToolbar({ onInsertSnippet }: MarkdownToolbarProps) {
  const [showDiagramMenu, setShowDiagramMenu] = useState(false);

  const snippets = {
    // Mermaid Diagram Snippets
    flowchart: `\`\`\`mermaid
flowchart TD
    A[Start: Project Planning] --> B{Feasibility Study}
    B -- Approved --> C[Structural Design & Analysis]
    B -- Re-evaluate --> A
    C --> D[Material Testing & Concrete Mix]
    D --> E[Foundation & Construction Phase]
    E --> F([Final Quality Inspection])
\`\`\`\n\n`,

    sequence: `\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Engineer as Civil Engineer
    participant Sensor as IoT Stress Sensor
    participant Cloud as Central Monitoring Server
    participant Alert as Site Safety Team

    Engineer->>Sensor: Calibrate & Activate Sensor
    Sensor-->>Cloud: Stream Real-time Load & Vibration (MQTT)
    alt Stress Exceeds Threshold (> 45 MPa)
        Cloud->>Alert: Send Critical Warning Notification
        Alert->>Engineer: Trigger Immediate Inspection Protocol
    else Normal Operating Range
        Cloud->>Cloud: Log Telemetry Data & Update Dashboard
    end
\`\`\`\n\n`,

    gantt: `\`\`\`mermaid
gantt
    title Construction & Research Project Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1: Site Survey
    Soil Investigation     :done,    des1, 2026-01-01, 2026-01-20
    Topographical Mapping  :done,    des2, 2026-01-15, 2026-02-05
    section Phase 2: Design & BIM
    AutoCAD & Revit Model  :active,  des3, 2026-02-01, 2026-03-01
    Structural Simulations :         des4, 2026-02-20, 2026-03-25
    section Phase 3: Construction
    Foundation Piling      :         des5, 2026-03-25, 2026-05-15
\`\`\`\n\n`,

    pie: `\`\`\`mermaid
pie title Material Cost Distribution (%)
    "Portland Composite Cement" : 35
    "Deformed Steel Rebar" : 30
    "Coarse & Fine Aggregate" : 18
    "Admixtures & Curing Agents" : 10
    "Labor & Quality Control" : 7
\`\`\`\n\n`,

    classDiagram: `\`\`\`mermaid
classDiagram
    class Structure {
        +String name
        +Float designLifeYears
        +calculateLoadCapacity()
    }
    class Bridge {
        +Float spanLengthMeters
        +String deckType
    }
    class HighRiseBuilding {
        +Int totalFloors
        +Boolean seismicDampers
    }
    Structure <|-- Bridge
    Structure <|-- HighRiseBuilding
\`\`\`\n\n`,

    table: `| Parameter | Standard Value | Test Result | Status |\n| :--- | :---: | :---: | :--- |\n| Compressive Strength (28-day) | ≥ 30 MPa | **34.5 MPa** |  Passed |\n| Water-Cement Ratio | 0.40 - 0.45 | **0.42** |  Optimal |\n| Slump Test Cone Value | 75 - 100 mm | **85 mm** |  Conformant |\n\n`,

    calloutTip: `> 💡 **Best Practice Note**\n> Always ensure proper moist curing for at least 7 to 14 days to achieve maximum hydration and prevent plastic shrinkage cracks.\n\n`,

    calloutWarning: `> ⚠️ **Safety Caution**\n> Verify bearing capacity calculations with local soil test boreholes before finalizing footing dimensions.\n\n`
  };

  return (
    <div className="flex items-center gap-1 flex-wrap p-1.5 bg-slate-100/90 rounded-xl border border-slate-200 text-slate-700 text-xs select-none">
      {/* Basic Markdown Controls */}
      <button
        type="button"
        onClick={() => onInsertSnippet("## Heading Title\n\n")}
        className="p-1.5 hover:bg-white hover:text-blue-600 rounded-lg transition-colors font-bold flex items-center gap-1"
        title="Insert Heading 2"
      >
        <Heading2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-[11px]">H2</span>
      </button>

      <button
        type="button"
        onClick={() => onInsertSnippet("### Subheading\n\n")}
        className="p-1.5 hover:bg-white hover:text-blue-600 rounded-lg transition-colors font-bold flex items-center gap-1"
        title="Insert Heading 3"
      >
        <span className="text-[11px] font-extrabold">H3</span>
      </button>

      <div className="h-4 w-px bg-slate-300 mx-0.5" />

      <button
        type="button"
        onClick={() => onInsertSnippet("- Item 1\n- Item 2\n- Item 3\n\n")}
        className="p-1.5 hover:bg-white hover:text-blue-600 rounded-lg transition-colors"
        title="Bullet List"
      >
        <List className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => onInsertSnippet("1. Step 1\n2. Step 2\n3. Step 3\n\n")}
        className="p-1.5 hover:bg-white hover:text-blue-600 rounded-lg transition-colors"
        title="Numbered List"
      >
        <ListOrdered className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => onInsertSnippet(snippets.table)}
        className="p-1.5 hover:bg-white hover:text-blue-600 rounded-lg transition-colors flex items-center gap-1"
        title="Insert Table"
      >
        <Table className="w-3.5 h-3.5" />
        <span className="hidden md:inline text-[11px]">Table</span>
      </button>

      <button
        type="button"
        onClick={() => onInsertSnippet(snippets.calloutTip)}
        className="p-1.5 hover:bg-white hover:text-blue-600 rounded-lg transition-colors flex items-center gap-1"
        title="Insert Tip / Note Callout"
      >
        <Info className="w-3.5 h-3.5 text-blue-600" />
        <span className="hidden md:inline text-[11px]">Tip</span>
      </button>

      <button
        type="button"
        onClick={() => onInsertSnippet(snippets.calloutWarning)}
        className="p-1.5 hover:bg-white hover:text-amber-600 rounded-lg transition-colors flex items-center gap-1"
        title="Insert Warning Box"
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
        <span className="hidden md:inline text-[11px]">Warning</span>
      </button>

      <div className="h-4 w-px bg-slate-300 mx-0.5" />

      {/* Diagrams Dropdown Menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowDiagramMenu(!showDiagramMenu)}
          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-2xs transition-all text-[11px]"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Insert Diagram / Flowchart</span>
          <ChevronDown className="w-3 h-3" />
        </button>

        {showDiagramMenu && (
          <div
            className="absolute left-0 mt-1.5 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-30 space-y-1 animate-in fade-in zoom-in-95 duration-100"
            onMouseLeave={() => setShowDiagramMenu(false)}
          >
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Interactive Flowcharts & Charts
            </div>

            <button
              type="button"
              onClick={() => {
                onInsertSnippet(snippets.flowchart);
                setShowDiagramMenu(false);
              }}
              className="w-full text-left px-2.5 py-2 rounded-xl text-xs hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex items-center gap-2 transition-colors"
            >
              <GitFork className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <div className="font-bold">Flowchart (Process / Logic)</div>
                <div className="text-[10px] text-slate-400">Step by step decisions & paths</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onInsertSnippet(snippets.sequence);
                setShowDiagramMenu(false);
              }}
              className="w-full text-left px-2.5 py-2 rounded-xl text-xs hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex items-center gap-2 transition-colors"
            >
              <Network className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <div className="font-bold">Sequence Diagram</div>
                <div className="text-[10px] text-slate-400">Actor & system interactions</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onInsertSnippet(snippets.gantt);
                setShowDiagramMenu(false);
              }}
              className="w-full text-left px-2.5 py-2 rounded-xl text-xs hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex items-center gap-2 transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <div className="font-bold">Gantt Timeline Chart</div>
                <div className="text-[10px] text-slate-400">Project schedule & milestones</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onInsertSnippet(snippets.pie);
                setShowDiagramMenu(false);
              }}
              className="w-full text-left px-2.5 py-2 rounded-xl text-xs hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex items-center gap-2 transition-colors"
            >
              <PieChart className="w-4 h-4 text-purple-600 shrink-0" />
              <div>
                <div className="font-bold">Pie Chart Distribution</div>
                <div className="text-[10px] text-slate-400">Percentage & proportions</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onInsertSnippet(snippets.classDiagram);
                setShowDiagramMenu(false);
              }}
              className="w-full text-left px-2.5 py-2 rounded-xl text-xs hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex items-center gap-2 transition-colors"
            >
              <Code2 className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <div className="font-bold">Class / Architecture Model</div>
                <div className="text-[10px] text-slate-400">Object structure & hierarchy</div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
