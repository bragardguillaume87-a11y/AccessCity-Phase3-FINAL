import PropTypes from 'prop-types';

/**
 * SceneInfoBar - Display scene statistics
 */
export function SceneInfoBar({ charactersCount, dialoguesCount }) {
  return (
    <div className="bg-slate-800 px-4 py-2 border-t border-slate-700 flex items-center justify-between text-xs">
      <div className="text-slate-400">
        Characters in scene: <span className="text-white font-semibold">{charactersCount}</span>
      </div>
      <div className="text-slate-400">
        Dialogues: <span className="text-white font-semibold">{dialoguesCount}</span>
      </div>
    </div>
  );
}

SceneInfoBar.propTypes = {
  charactersCount: PropTypes.number.isRequired,
  dialoguesCount: PropTypes.number.isRequired
};
