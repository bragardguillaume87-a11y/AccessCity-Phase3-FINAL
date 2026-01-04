import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button.jsx';
import { Z_INDEX } from '@/utils/zIndexLayers.js';

/**
 * NoBackgroundPlaceholder - Displayed when scene has no background
 */
export function NoBackgroundPlaceholder({ onSetBackground }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center text-center text-slate-700 pointer-events-none"
      style={{ zIndex: Z_INDEX.CANVAS_BACKGROUND }}
    >
      <div className="pointer-events-auto">
        <svg className="w-20 h-20 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm font-medium">Aucun décor défini</p>
        <Button
          variant="gaming-primary"
          size="sm"
          onClick={onSetBackground}
          className="mt-2"
        >
          Choisir décor
        </Button>
      </div>
    </div>
  );
}

NoBackgroundPlaceholder.propTypes = {
  onSetBackground: PropTypes.func.isRequired
};
