/** @jsxImportSource react */
'use client'

interface ConceptsPanelProps {
  currentLine: number | null;
  content: string[];
}

const conceptsMap: Record<number, { description: string; concept: string }> = {
  1: {
    description: "Initialization phase of the program",
    concept: "Program initialization involves setting up the initial state and required resources."
  },
  2: {
    description: "Branch creation in the repository",
    concept: "Version control systems use branches to manage parallel development streams."
  },
  3: {
    description: "Branch property modification",
    concept: "Branches can be modified to update their properties or change their state."
  }
};

export function ConceptsPanel({ currentLine, content }: ConceptsPanelProps) {
  if (!currentLine || !conceptsMap[currentLine]) return null;

  const concept = conceptsMap[currentLine];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-600 shadow-lg text-slate-200">
      <div className="container max-w-7xl mx-auto">
        <div className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-slate-100">
              Concept Explanation
            </h3>
            <span className="text-xs text-slate-400">
              Line {currentLine}
            </span>
          </div>
          
          <div className="text-sm space-y-2">
            <div className="font-mono text-blue-300">
              {content[currentLine - 1]}
            </div>
            <div className="flex gap-4">
              <div className="text-slate-300">
                <strong>Description:</strong> {concept.description}
              </div>
              <div className="text-slate-300">
                <strong>Concept:</strong> {concept.concept}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 