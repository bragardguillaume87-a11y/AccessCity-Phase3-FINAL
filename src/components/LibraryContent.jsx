import React from "react";
import { useApp } from "../contexts/AppContext";

export default function LibraryContent() {
  const { scenario } = useApp();

  // Drag start handler générique
  function handleDragStart(e, type, item) {
    e.dataTransfer.setData("application/json", JSON.stringify({ type, item }));
    e.dataTransfer.effectAllowed = "copy";
  }

  return (
    <div className="space-y-8" aria-label="Bibliothèque">
      {/* Personnages */}
      <section>
        <h3 className="font-bold text-lg mb-3">👥 Personnages</h3>
        <div className="grid grid-cols-2 gap-2">
          {scenario.characters && scenario.characters.length > 0 ? (
            scenario.characters.map((char) => (
              <div
                key={char.id}
                className="bg-slate-700 p-3 rounded cursor-move hover:bg-slate-600 focus:bg-slate-600 outline-none"
                draggable
                tabIndex={0}
                aria-label={`Personnage ${char.name}`}
                onDragStart={(e) => handleDragStart(e, "character", char)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    // Simule drag pour accessibilité clavier
                    handleDragStart(
                      { ...e, dataTransfer: { setData: () => {}, effectAllowed: "copy" } },
                      "character",
                      char
                    );
                  }
                }}
              >
                <div className="text-2xl mb-1" aria-hidden="true">{char.avatar}</div>
                <div className="text-sm truncate">{char.name}</div>
              </div>
            ))
          ) : (
            <div className="text-slate-400 italic">Aucun personnage</div>
          )}
        </div>
      </section>

      {/* Décors */}
      <section>
        <h3 className="font-bold text-lg mb-3">🏞️ Décors</h3>
        <div className="grid grid-cols-2 gap-2">
          {scenario.backgrounds && scenario.backgrounds.length > 0 ? (
            scenario.backgrounds.map((bg) => (
              <div
                key={bg.id}
                className="bg-slate-700 p-3 rounded cursor-move hover:bg-slate-600 focus:bg-slate-600 outline-none"
                draggable
                tabIndex={0}
                aria-label={`Décor ${bg.name}`}
                onDragStart={(e) => handleDragStart(e, "background", bg)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleDragStart(
                      { ...e, dataTransfer: { setData: () => {}, effectAllowed: "copy" } },
                      "background",
                      bg
                    );
                  }
                }}
              >
                <div className="text-2xl mb-1" aria-hidden="true">{bg.emoji || "🏞️"}</div>
                <div className="text-sm truncate">{bg.name}</div>
              </div>
            ))
          ) : (
            <div className="text-slate-400 italic">Aucun décor</div>
          )}
        </div>
      </section>
    </div>
  );
}
