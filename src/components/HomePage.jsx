import React from "react";
import "../styles/home.css";

function HomePage() {
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
            <div className="card-stats">📖 1/5 histoires</div>
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
          {/* Liste des quêtes */}
          <div className="quest-card">
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span>📖</span>
              <h3 className="card-title" style={{ marginBottom: 0 }}>
                La visite à la mairie
              </h3>
              <span className="card-badge card-badge--local">📍 Local</span>
              <span className="card-badge card-badge--date">19/12/2025</span>
            </div>
          </div>
          {/* Quota */}
          <div className="quest-quota">
            <div className="quest-quota__header">
              <span className="quest-quota__title">📊 Quota</span>
              <span className="quest-quota__count">1/5</span>
            </div>
            <div className="quest-quota__progress">
              <div
                className="quest-quota__progress-bar"
                style={{ width: "20%" }}
              ></div>
            </div>
            <div className="quest-quota__remaining">✨ 4 quêtes restantes</div>
          </div>
          {/* Nouvelle quête */}
          <div className="new-quest">
            <div className="new-quest__header">+ ✨ Nouvelle Quête</div>
            <input
              className="new-quest__input"
              placeholder="Ex: La visite à la mairie"
            />
            <button className="btn btn-primary">+ Créer cette quête</button>
            <button className="btn btn-secondary">
              ⚠️ Sélectionne une quête
            </button>
            <button className="btn btn-danger">🗑️ Supprimer</button>
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
