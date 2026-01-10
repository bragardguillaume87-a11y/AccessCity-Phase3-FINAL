/**
 * EmptySelectionState - Displayed when no element is selected
 *
 * Shows a centered message prompting the user to select an element
 */
export function EmptySelectionState() {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="text-center text-slate-500 max-w-xs">
        <svg className="w-16 h-16 mx-auto mb-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-sm font-semibold text-slate-400 mb-1">Aucune sélection</h3>
        <p className="text-xs text-slate-600">
          Sélectionne une scène, un personnage ou un dialogue pour voir ses propriétés
        </p>
      </div>
    </div>
  );
}
