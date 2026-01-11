import React from 'react';

/**
 * Panneau droit : Propriétés techniques du personnage sélectionné
 * Affiche les informations techniques et métadonnées
 */
export const CharacterProperties = ({ character, scenes = [], labels = {} }) => {
  if (!character) {
    return (
      <aside style={{
        width: '280px',
        borderLeft: '1px solid #e2e8f0',
        padding: '20px',
        backgroundColor: '#f8fafc',
        color: '#64748b'
      }}>
        <p style={{ textAlign: 'center', fontSize: '0.875rem' }}>
          {labels.selectCharacter || 'Sélectionnez un personnage'}
        </p>
      </aside>
    );
  }

  // Compter dans combien de scènes le personnage apparaît
  const appearancesCount = scenes.filter(scene =>
    scene.dialogues?.some(d => d.speaker === character.id)
  ).length;

  // Compter le nombre total de répliques
  const linesCount = scenes.reduce((total, scene) => {
    const sceneLines = scene.dialogues?.filter(d => d.speaker === character.id).length || 0;
    return total + sceneLines;
  }, 0);

  return (
    <aside style={{
      width: '280px',
      borderLeft: '1px solid #e2e8f0',
      padding: '20px',
      backgroundColor: '#f8fafc',
      overflowY: 'auto'
    }}>
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: 'bold',
        marginBottom: '16px',
        color: '#1e293b'
      }}>
        {labels.properties || 'Propriétés'}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* ID */}
        <PropertyItem
          label="ID"
          value={character.id}
          mono
        />

        {/* Nom */}
        <PropertyItem
          label={labels.name || 'Nom'}
          value={character.name}
        />

        {/* Description */}
        {character.description && (
          <PropertyItem
            label={labels.description || 'Description'}
            value={character.description}
            multiline
          />
        )}

        {/* Humeurs disponibles */}
        <PropertyItem
          label="Humeurs"
          value={(character.moods || ['neutral']).join(', ')}
        />

        {/* Nombre d'avatars */}
        <PropertyItem
          label="Avatars"
          value={`${Object.keys(character.sprites || {}).length} / ${(character.moods || []).length}`}
        />

        {/* Statistiques d'utilisation */}
        <div style={{
          marginTop: '8px',
          paddingTop: '16px',
          borderTop: '1px solid #e2e8f0'
        }}>
          <h4 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            marginBottom: '12px',
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Utilisation
          </h4>

          <PropertyItem
            label="Scènes"
            value={`${appearancesCount} scène(s)`}
          />

          <PropertyItem
            label="Répliques"
            value={`${linesCount} réplique(s)`}
          />
        </div>

        {/* Avertissement pour les personnages système */}
        {(character.id === 'player' || character.id === 'narrator') && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: '#92400e'
          }}>
            ⚠️ Personnage système protégé
          </div>
        )}
      </div>
    </aside>
  );
};

/**
 * Composant utilitaire pour afficher une propriété
 */
const PropertyItem = ({ label, value, mono = false, multiline = false }) => (
  <div>
    <div style={{
      fontSize: '0.75rem',
      fontWeight: '600',
      color: '#64748b',
      marginBottom: '4px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }}>
      {label}
    </div>
    <div style={{
      fontSize: '0.875rem',
      color: '#1e293b',
      fontFamily: mono ? 'monospace' : 'inherit',
      backgroundColor: mono ? '#f1f5f9' : 'transparent',
      padding: mono ? '4px 8px' : '0',
      borderRadius: mono ? '4px' : '0',
      whiteSpace: multiline ? 'pre-wrap' : 'normal',
      wordBreak: 'break-word'
    }}>
      {value || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Non défini</span>}
    </div>
  </div>
);
