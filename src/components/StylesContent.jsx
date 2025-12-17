import React from "react";
import { useApp } from "../contexts/AppContext";

const FILTERS = [
  { id: "none", label: "Aucun" },
  { id: "sepia", label: "Sépia" },
  { id: "grayscale", label: "Noir & blanc" },
  { id: "blur", label: "Flou" },
];

export default function StylesContent() {
  const { scenario, selectedSceneId, updateScene } = useApp();
  const scene = scenario.scenes.find((s) => s.id === selectedSceneId);

  if (!scene) {
    return <div className="text-slate-400 italic">Aucune scène sélectionnée.</div>;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    updateScene({ ...scene, [name]: value });
  }

  return (
    <form className="space-y-5" aria-label="Styles de la scène">
      <div>
        <label className="block text-sm mb-1 font-semibold" htmlFor="scene-bgcolor">
          Couleur de fond
        </label>
        <input
          id="scene-bgcolor"
          name="backgroundColor"
          type="color"
          className="w-12 h-8 bg-slate-900 border border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={scene.backgroundColor || "#22223b"}
          onChange={handleChange}
          aria-label="Couleur de fond de la scène"
        />
      </div>
      <div>
        <label className="block text-sm mb-1 font-semibold" htmlFor="scene-filter">
          Filtre visuel
        </label>
        <select
          id="scene-filter"
          name="filter"
          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={scene.filter || "none"}
          onChange={handleChange}
          aria-label="Filtre visuel de la scène"
        >
          {FILTERS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </div>
      {/* Effets spéciaux (exemple simple) */}
      <div>
        <label className="block text-sm mb-1 font-semibold" htmlFor="scene-effect">
          Effet spécial
        </label>
        <input
          id="scene-effect"
          name="effect"
          type="text"
          placeholder="ex: neige, pluie, ..."
          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={scene.effect || ""}
          onChange={handleChange}
          aria-label="Effet spécial de la scène"
        />
      </div>
    </form>
  );
}
