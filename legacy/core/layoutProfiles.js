const DEFAULT_PROFILE = {
  devtoolsPanel: 'balanced',
  dialogueVariant: 'panel',
  stageVariant: 'hidden'
};

export const layoutProfiles = {
  standard: {
    devtoolsPanel: 'balanced',
    dialogueVariant: 'panel',
    stageVariant: 'hidden'
  },
  focus: {
    devtoolsPanel: 'minimal',
    dialogueVariant: 'panel',
    stageVariant: 'hidden'
  },
  accessibility: {
    devtoolsPanel: 'minimal',
    dialogueVariant: 'panel-contrast',
    stageVariant: 'hidden'
  },
  devtools: {
    devtoolsPanel: 'expanded',
    dialogueVariant: 'panel',
    stageVariant: 'hidden'
  },
  narrative: {
    devtoolsPanel: 'hidden',
    dialogueVariant: 'stage',
    stageVariant: 'immersive'
  }
};

export function getLayoutProfile(layoutName) {
  if (!layoutName) return DEFAULT_PROFILE;
  return layoutProfiles[layoutName] || DEFAULT_PROFILE;
}
