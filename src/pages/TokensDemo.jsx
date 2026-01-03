import { Button } from '@/components/ui/button';

export default function TokensDemo() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] p-8">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* Header */}
        <header>
          <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-2">
            Design Tokens Demo
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Validation WCAG 2.2 AA + Gaming UI
          </p>
        </header>

        {/* Buttons Section */}
        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-4">
            Boutons Gaming (Variants tokens)
          </h2>
          <div className="flex gap-4 flex-wrap">
            <Button variant="token-primary">Primary Token</Button>
            <Button variant="token-accent">Accent Token</Button>
            <Button variant="token-success">Success Token</Button>
            <Button variant="token-danger">Danger Token</Button>
          </div>

          <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-4">
            Comparaison avec variants gaming existants
          </h3>
          <div className="flex gap-4 flex-wrap">
            <Button variant="gaming-primary">Gaming Primary</Button>
            <Button variant="gaming-accent">Gaming Accent</Button>
            <Button variant="gaming-success">Gaming Success</Button>
            <Button variant="gaming-danger">Gaming Danger</Button>
          </div>
        </section>

        {/* Colors Section */}
        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-4">
            Palette Couleurs (Tokens)
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-[var(--color-primary)] h-24 rounded-lg flex items-center justify-center text-white">
              Primary
            </div>
            <div className="bg-[var(--color-accent)] h-24 rounded-lg flex items-center justify-center text-white">
              Accent
            </div>
            <div className="bg-[var(--color-secondary)] h-24 rounded-lg flex items-center justify-center text-white">
              Secondary
            </div>
            <div className="bg-[var(--color-pink)] h-24 rounded-lg flex items-center justify-center text-white">
              Pink
            </div>
          </div>
        </section>

        {/* Typography Section */}
        <section className="bg-[var(--color-bg-elevated)] p-6 rounded-xl">
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-4">
            Typographie (Contraste WCAG AA)
          </h2>
          <p className="text-[var(--color-text-primary)] mb-2">
            Text Primary - Ratio 14:1 ✓
          </p>
          <p className="text-[var(--color-text-secondary)] mb-2">
            Text Secondary - Ratio 7:1 ✓
          </p>
          <p className="text-[var(--color-text-muted)]">
            Text Muted - Ratio 4.5:1 ✓
          </p>
        </section>

        {/* Focus Ring Test */}
        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-4">
            Test Focus Ring (Naviguer avec Tab)
          </h2>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg focus:ring-4 focus:ring-[var(--color-border-focus)] focus:outline-none">
              Focus Ring 4px
            </button>
            <input
              type="text"
              placeholder="Input field"
              className="px-4 py-2 bg-[var(--color-bg-base)] border-2 border-[var(--color-border-base)] rounded-lg focus:ring-4 focus:ring-[var(--color-border-focus)] focus:outline-none text-[var(--color-text-primary)]"
            />
          </div>
        </section>

        {/* Shadows Section */}
        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-4">
            Gaming Shadows
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[var(--color-bg-elevated)] h-32 rounded-lg shadow-[var(--shadow-sm)] flex items-center justify-center text-[var(--color-text-primary)]">
              shadow-sm
            </div>
            <div className="bg-[var(--color-bg-elevated)] h-32 rounded-lg shadow-[var(--shadow-md)] flex items-center justify-center text-[var(--color-text-primary)]">
              shadow-md
            </div>
            <div className="bg-[var(--color-bg-elevated)] h-32 rounded-lg shadow-[var(--shadow-lg)] flex items-center justify-center text-[var(--color-text-primary)]">
              shadow-lg
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-[var(--color-primary)] h-32 rounded-lg shadow-[var(--shadow-game-glow)] flex items-center justify-center text-white">
              shadow-game-glow
            </div>
            <div className="bg-[var(--color-accent)] h-32 rounded-lg shadow-[var(--shadow-game-glow-lg)] flex items-center justify-center text-white">
              shadow-game-glow-lg
            </div>
          </div>
        </section>

        {/* Spacing Section */}
        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-4">
            Spacing System (base 4px)
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-[var(--space-4)] h-[var(--space-4)] bg-[var(--color-primary)]"></div>
              <span className="text-[var(--color-text-secondary)]">space-4 (1rem / 16px)</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-[var(--space-8)] h-[var(--space-8)] bg-[var(--color-accent)]"></div>
              <span className="text-[var(--color-text-secondary)]">space-8 (2rem / 32px)</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-[var(--space-12)] h-[var(--space-12)] bg-[var(--color-secondary)]"></div>
              <span className="text-[var(--color-text-secondary)]">space-12 (3rem / 48px)</span>
            </div>
          </div>
        </section>

        {/* Border Radius Section */}
        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-4">
            Border Radius
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-[var(--color-bg-elevated)] h-24 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--color-text-primary)]">
              radius-sm
            </div>
            <div className="bg-[var(--color-bg-elevated)] h-24 rounded-[var(--radius-md)] flex items-center justify-center text-[var(--color-text-primary)]">
              radius-md
            </div>
            <div className="bg-[var(--color-bg-elevated)] h-24 rounded-[var(--radius-lg)] flex items-center justify-center text-[var(--color-text-primary)]">
              radius-lg
            </div>
            <div className="bg-[var(--color-bg-elevated)] h-24 rounded-[var(--radius-xl)] flex items-center justify-center text-[var(--color-text-primary)]">
              radius-xl
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
