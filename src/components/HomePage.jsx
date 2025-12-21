import "../styles/home.css";

function HomePage({
  quests = [],
  selectedQuestId = null,
  newQuestName = "",
  onNewQuestNameChange = () => {},
  onCreateQuest = () => {},
  onSelectQuest = () => {},
  onLaunchEditor = () => {},
  onDeleteQuest = () => {},
}) {
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
              onKeyDown={(e) => {
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
                  {new Date(quest.createdAt).toLocaleDateString()}
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
              onChange={(e) => onNewQuestNameChange(e.target.value)}
              maxLength={60}
              aria-label="Nom de la nouvelle quête"
            />
            <button
              className="btn btn-primary"
              onClick={onCreateQuest}
              disabled={!newQuestName.trim() || quotaUsed >= quotaMax}
              aria-disabled={!newQuestName.trim() || quotaUsed >= quotaMax}
            >
              + Créer cette quête
            </button>
            <button
              className="btn btn-secondary"
              onClick={onLaunchEditor}
              disabled={!selectedQuestId}
              aria-disabled={!selectedQuestId}
              style={{
                backgroundColor: selectedQuestId ? 'var(--accent-purple)' : undefined,
                borderColor: selectedQuestId ? 'var(--accent-purple)' : undefined,
                color: selectedQuestId ? 'white' : undefined,
              }}
            >
              🚀 Lancer l'éditeur
            </button>
            <button
              className="btn btn-danger"
              onClick={onDeleteQuest}
              disabled={!selectedQuestId}
              aria-disabled={!selectedQuestId}
            >
              🗑️ Supprimer
            </button>
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
