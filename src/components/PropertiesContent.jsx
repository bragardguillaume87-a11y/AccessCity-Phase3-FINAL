import React from "react";
import { useApp } from "../contexts/AppContext";

export default function PropertiesContent() {
  const { selectedElement, updateElement } = useApp();

  if (!selectedElement) {
    return (
      <div className="text-slate-400 italic" aria-live="polite">
        Aucun élément sélectionné.
      </div>
    );
  }

  function handleChange(e) {
    const { name, value } = e.target;
    let val = value;
    if (["x", "y", "scale", "rotation"].includes(name)) {
      val = parseFloat(value) || 0;
    }
    updateElement({ ...selectedElement, [name]: val });
  }

  return (
    <form className="space-y-5" aria-label="Propriétés de l'élément sélectionné">
      <div>
        <label className="block text-sm mb-1 font-semibold" htmlFor="prop-x">
          Position X
        </label>
        <input
          id="prop-x"
          name="x"
          type="number"
          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={selectedElement.x || 0}
          onChange={handleChange}
          aria-label="Position X"
        />
      </div>
      <div>
        <label className="block text-sm mb-1 font-semibold" htmlFor="prop-y">
          Position Y
        </label>
        <input
          id="prop-y"
          name="y"
          type="number"
          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={selectedElement.y || 0}
          onChange={handleChange}
          aria-label="Position Y"
        />
      </div>
      <div>
        <label className="block text-sm mb-1 font-semibold" htmlFor="prop-scale">
          Échelle
        </label>
        <input
          id="prop-scale"
          name="scale"
          type="number"
          step="0.01"
          min="0.1"
          max="10"
          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={selectedElement.scale || 1}
          onChange={handleChange}
          aria-label="Échelle"
        />
      </div>
      <div>
        <label className="block text-sm mb-1 font-semibold" htmlFor="prop-rotation">
          Rotation (°)
        </label>
        <input
          id="prop-rotation"
          name="rotation"
          type="number"
          step="1"
          min="0"
          max="360"
          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={selectedElement.rotation || 0}
          onChange={handleChange}
          aria-label="Rotation en degrés"
        />
      </div>
    </form>
  );
}
