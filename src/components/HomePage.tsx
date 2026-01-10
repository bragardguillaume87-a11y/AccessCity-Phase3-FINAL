import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Plus, Rocket, Trash2 } from 'lucide-react';
import "../styles/home.css";

/**
 * Quest data structure
 */
interface Quest {
  id: string;
  name: string;
  createdAt: string;
}

/**
 * Props for HomePage component
 */
interface HomePageProps {
  /** List of available quests/stories */
  quests?: Quest[];
  /** Currently selected quest ID */
  selectedQuestId?: string | null;
  /** Name for the new quest being created */
  newQuestName?: string;
  /** Handler for new quest name input changes */
  onNewQuestNameChange?: (name: string) => void;
  /** Handler for creating a new quest */
  onCreateQuest?: () => void;
  /** Handler for selecting a quest */
  onSelectQuest?: (questId: string) => void;
  /** Handler for launching the editor with selected quest */
  onLaunchEditor?: () => void;
  /** Handler for deleting the selected quest */
  onDeleteQuest?: () => void;
}

function HomePage({
  quests = [],
  selectedQuestId = null,
  newQuestName = "",
  onNewQuestNameChange = () => {},
  onCreateQuest = () => {},
  onSelectQuest = () => {},
  onLaunchEditor = () => {},
  onDeleteQuest = () => {},
}: HomePageProps): React.JSX.Element {
  const quotaMax = 5;
  const quotaUsed = quests.length;
  const quotaPercent = Math.min(100, (quotaUsed / quotaMax) * 100);
  const selectedQuest = quests.find((q) => q.id === selectedQuestId);

  return (
    <div className="home-container">
      {/* HEADER */}
      <header className="home-header">
        <span className="home-header__badge">🎮 ACCESSCITY STUDIO</span>
        <h1 className="home-header__title">Bienvenue dans ton Studio</h1>
        <p className="home-header__subtitle">
          Crée des <span className="highlight">scénarios interactifs</span>{" "}
          accessibles pour sensibiliser aux{" "}
          <span className="highlight-cyan">situations de handicap</span>
        </p>
        <div className="home-features">
          <span className="home-features__badge">🎨 Interface ludique</span>
          <span className="home-features__badge">♿ Accessible WCAG AA</span>
          <span className="home-features__badge">⚡ Facile à utiliser</span>
        </div>
      </header>

      {/* MAIN - 2 colonnes */}
      <main className="home-main">
        {/* COLONNE 1 : Espaces */}
        <section>
          <div className="section-header">
            <span className="section-header__number">1</span>
            <div>
              <h2 className="section-header__title">🏆 Ton Espace</h2>
              <p className="section-header__subtitle">
                Environnement de travail
              </p>
            </div>
          </div>
          <div className="space-card">
            <span className="card-badge card-badge--active">🟣 ACTIF</span>
            <h3 className="card-title">Espace local</h3>
            <p className="card-description">
              📚 Histoires créées sur cet ordinateur
            </p>
            <div className="card-stats">
              📖 {quotaUsed}/{quotaMax} histoires
            </div>
            <div className="card-note">
              💡 Un espace regroupe plusieurs histoires. Version gratuite : 5
              max.
            </div>
          </div>
        </section>

        {/* COLONNE 2 : Quêtes */}
        <section>
          <div className="section-header">
            <span className="section-header__number">2</span>
            <div>
              <h2 className="section-header__title">📖 Tes Quêtes</h2>
              <p className="section-header__subtitle">
                Sélectionne ou crée une aventure
              </p>
            </div>
          </div>
          {/* Liste des quêtes dynamiques */}
          {quests.length === 0 && (
            <div className="quest-card" style={{ opacity: 0.7 }}>
              <span>Aucune quête pour l'instant.</span>
            </div>
          )}
          {quests.map((quest) => (
            <div
              key={quest.id}
              className={`quest-card${
                selectedQuestId === quest.id ? " quest-card--selected" : ""
              }`}
              style={{
                cursor: "pointer",
                marginBottom: 12,
                border:
                  selectedQuestId === quest.id
                    ? "2px solid var(--accent-purple)"
                    : undefined,
              }}
              onClick={() => onSelectQuest(quest.id)}
              tabIndex={0}
              aria-label={`Sélectionner la quête ${quest.name}`}
              onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                if (e.key === "Enter" || e.key === " ") onSelectQuest(quest.id);
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <span>📖</span>
                <h3 className="card-title" style={{ marginBottom: 0 }}>
                  {quest.name}
                </h3>
                <span className="card-badge card-badge--local">📍 Local</span>
                <span className="card-badge card-badge--date">
                  {format(new Date(quest.createdAt), 'dd/MM/yyyy', { locale: fr })}
                </span>
              </div>
            </div>
          ))}
          {/* Quota */}
          <div className="quest-quota">
            <div className="quest-quota__header">
              <span className="quest-quota__title">📊 Quota</span>
              <span className="quest-quota__count">
                {quotaUsed}/{quotaMax}
              </span>
            </div>
            <div className="quest-quota__progress">
              <div
                className="quest-quota__progress-bar"
                style={{ width: `${quotaPercent}%` }}
              ></div>
            </div>
            <div className="quest-quota__remaining">
              ✨ {quotaMax - quotaUsed} quêtes restantes
            </div>
          </div>
          {/* Nouvelle quête */}
          <div className="new-quest">
            <div className="new-quest__header">+ ✨ Nouvelle Quête</div>
            <input
              className="new-quest__input"
              placeholder="Ex: La visite à la mairie"
              value={newQuestName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNewQuestNameChange(e.target.value)}
              maxLength={60}
              aria-label="Nom de la nouvelle quête"
            />
            <div className="flex gap-2">
              <Button
                variant="gaming-primary"
                size="sm"
                onClick={onCreateQuest}
                disabled={!newQuestName.trim() || quotaUsed >= quotaMax}
                className="flex-1"
              >
                <Plus className="h-3 w-3" />
                Créer
              </Button>
              <Button
                variant={selectedQuestId ? "gaming-accent" : "secondary"}
                size="sm"
                onClick={onLaunchEditor}
                disabled={!selectedQuestId}
                className="flex-1"
              >
                <Rocket className="h-3 w-3" />
                Lancer
              </Button>
              <Button
                variant="danger-ghost"
                size="sm"
                onClick={onDeleteQuest}
                disabled={!selectedQuestId}
                className="flex-shrink-0"
                title="Supprimer la quête sélectionnée"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="home-footer">
        <div className="home-footer__links">
          <a href="#" className="home-footer__link">
            Comment ça marche ?
          </a>
          <a href="#" className="home-footer__link">
            Accessibilité
          </a>
          <a href="#" className="home-footer__link">
            À propos d'AccessCity
          </a>
          <a href="#" className="home-footer__link">
            🎓 Revoir la visite guidée
          </a>
          <a href="#" className="home-footer__link">
            🎮 Mode Demo
          </a>
        </div>
        <div className="home-footer__version">
          Fait avec <span className="heart">❤️</span> pour l'accessibilité •
          AccessCity Studio v2.0
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
