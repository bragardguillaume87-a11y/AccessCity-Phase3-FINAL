/// AccessCity Tauri Backend
///
/// Deux groupes de commandes :
///
/// ── Player (jeu exporté) ────────────────────────────────────────────────
/// • read_game_data    → lit game-data.json depuis le répertoire de l'exe
/// • get_exe_dir       → retourne le répertoire de l'exe
///
/// ── Editor (AccessCity Studio) ─────────────────────────────────────────
/// • get_user_assets_dir  → chemin AppData/assets (créé si absent)
/// • list_user_assets     → manifest JSON des assets uploadés par l'utilisateur
/// • upload_asset_editor  → sauvegarde Vec<u8> dans assets/{category}/
/// • delete_assets_editor → supprime une liste de fichiers
/// • move_asset_editor    → déplace un asset vers une autre catégorie

use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Manager;

// ── Player commands ───────────────────────────────────────────────────────────

#[tauri::command]
fn read_game_data() -> Result<String, String> {
    let exe_dir = std::env::current_exe()
        .map_err(|e| format!("Cannot locate exe: {}", e))?
        .parent()
        .ok_or_else(|| "Exe has no parent directory".to_string())?
        .to_path_buf();

    std::fs::read_to_string(exe_dir.join("game-data.json"))
        .map_err(|e| format!(
            "Impossible de lire game-data.json (attendu à côté de player.exe) : {}",
            e
        ))
}

#[tauri::command]
fn get_exe_dir() -> Result<String, String> {
    let dir = std::env::current_exe()
        .map_err(|e| format!("Cannot locate exe: {}", e))?
        .parent()
        .ok_or_else(|| "Exe has no parent directory".to_string())?
        .to_path_buf();

    Ok(dir.to_string_lossy().into_owned())
}

// ── Editor commands ───────────────────────────────────────────────────────────

/// Retourne le chemin du dossier assets utilisateur (AppData/Roaming/fr.accesscity.studio/assets).
/// Crée le dossier s'il n'existe pas.
#[tauri::command]
fn get_user_assets_dir(app_handle: tauri::AppHandle) -> Result<String, String> {
    let dir = user_assets_root(&app_handle)?;
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("Impossible de créer le dossier assets : {}", e))?;
    Ok(dir.to_string_lossy().into_owned())
}

/// Scanne AppData/assets/ et retourne un manifest JSON.
/// Les paths sont absolus — le frontend les enveloppe avec convertFileSrc().
/// Format compatible avec assets-manifest.json.
#[tauri::command]
fn list_user_assets(app_handle: tauri::AppHandle) -> Result<String, String> {
    let root = user_assets_root(&app_handle)?;

    if !root.exists() {
        return Ok(empty_manifest());
    }

    let image_exts = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
    let audio_exts = ["mp3", "wav", "ogg", "m4a", "flac"];

    let mut assets_map: std::collections::HashMap<String, Vec<serde_json::Value>> =
        std::collections::HashMap::new();

    if let Ok(dirs) = std::fs::read_dir(&root) {
        for cat_entry in dirs.flatten() {
            let cat_path = cat_entry.path();
            if !cat_path.is_dir() { continue; }

            let category = cat_path
                .file_name()
                .map(|n| n.to_string_lossy().into_owned())
                .unwrap_or_default();

            if let Ok(files) = std::fs::read_dir(&cat_path) {
                let mut entries: Vec<serde_json::Value> = Vec::new();

                for f in files.flatten() {
                    let fp = f.path();
                    if !fp.is_file() { continue; }

                    let ext = fp.extension()
                        .map(|e| e.to_string_lossy().to_lowercase())
                        .unwrap_or_default();

                    if !image_exts.contains(&ext.as_str()) && !audio_exts.contains(&ext.as_str()) {
                        continue;
                    }

                    let abs = fp.to_string_lossy().into_owned();
                    let name = fp.file_name()
                        .map(|n| n.to_string_lossy().into_owned())
                        .unwrap_or_default();

                    entries.push(serde_json::json!({
                        "name": name,
                        "path": abs,
                        "category": category,
                        "source": "user"
                    }));
                }

                if !entries.is_empty() {
                    assets_map.insert(category, entries);
                }
            }
        }
    }

    let total: usize = assets_map.values().map(|v| v.len()).sum();
    let categories: Vec<String> = assets_map.keys().cloned().collect();
    let ts = now_ms();

    let manifest = serde_json::json!({
        "generated": ts.to_string(),
        "version":   "1.0.0",
        "totalAssets": total,
        "categories": categories,
        "assets": assets_map
    });

    serde_json::to_string(&manifest).map_err(|e| e.to_string())
}

/// Sauvegarde des bytes (Vec<u8>) dans AppData/assets/{category}/{filename}.
/// Retourne le chemin absolu du fichier créé.
#[tauri::command]
fn upload_asset_editor(
    app_handle: tauri::AppHandle,
    filename: String,
    category: String,
    data: Vec<u8>,
) -> Result<String, String> {
    let dest_dir = user_assets_root(&app_handle)?.join(&category);
    std::fs::create_dir_all(&dest_dir)
        .map_err(|e| format!("create_dir_all {} : {}", category, e))?;

    let safe = sanitize_filename(&filename);
    let dest = dest_dir.join(&safe);

    std::fs::write(&dest, &data)
        .map_err(|e| format!("write {} : {}", safe, e))?;

    Ok(dest.to_string_lossy().into_owned())
}

/// Restaure un asset depuis un backup en préservant exactement le nom de fichier.
/// `relative_path` ex: "tilesets/foo-12345.png" — chemin relatif depuis la racine assets.
/// Contrairement à upload_asset_editor, aucun timestamp n'est ajouté.
/// Retourne le chemin absolu du fichier restauré.
#[tauri::command]
fn restore_asset_exact(
    app_handle: tauri::AppHandle,
    relative_path: String,
    data: Vec<u8>,
) -> Result<String, String> {
    let assets_root = user_assets_root(&app_handle)?;
    // Sécurité : empêcher la traversal (ex: "../../etc/passwd")
    let norm = relative_path
        .replace('\\', "/")
        .trim_start_matches('/')
        .to_string();
    if norm.contains("..") {
        return Err(format!("Chemin invalide : {}", relative_path));
    }

    let dest = assets_root.join(&norm);

    // Créer les sous-dossiers si nécessaire
    if let Some(parent) = dest.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("create_dir_all : {}", e))?;
    }

    std::fs::write(&dest, &data)
        .map_err(|e| format!("write {} : {}", norm, e))?;

    Ok(dest.to_string_lossy().into_owned())
}

/// Lit le fichier `data/autoload.zip` situé dans le répertoire de l'exe (mode portable).
/// Retourne les bytes du ZIP, ou None si le fichier n'existe pas.
/// Appelé au premier lancement pour auto-importer le projet.
#[tauri::command]
fn read_autoload_zip(app_handle: tauri::AppHandle) -> Result<Option<Vec<u8>>, String> {
    // Disponible uniquement en mode portable
    if app_handle.config().identifier != "fr.accesscity.studio.portable" {
        return Ok(None);
    }

    let exe_dir = std::env::current_exe()
        .map_err(|e| format!("current_exe : {}", e))?
        .parent()
        .ok_or_else(|| "L'exe n'a pas de dossier parent".to_string())?
        .to_path_buf();

    let autoload = exe_dir.join("data").join("autoload.zip");

    if !autoload.exists() {
        return Ok(None);
    }

    let bytes = std::fs::read(&autoload)
        .map_err(|e| format!("read autoload.zip : {}", e))?;

    Ok(Some(bytes))
}

/// Supprime une liste de fichiers (chemins absolus).
/// Retourne JSON { success, deleted, errors, count, message }.
#[tauri::command]
fn delete_assets_editor(paths: Vec<String>) -> Result<String, String> {
    let mut deleted: Vec<serde_json::Value> = Vec::new();
    let mut errors:  Vec<serde_json::Value> = Vec::new();

    for p in &paths {
        match std::fs::remove_file(p) {
            Ok(_)  => deleted.push(serde_json::json!({ "path": p, "deleted": true })),
            Err(e) => errors.push( serde_json::json!({ "path": p, "error": e.to_string() })),
        }
    }

    let count = deleted.len();
    serde_json::to_string(&serde_json::json!({
        "success": errors.is_empty(),
        "deleted": deleted,
        "errors":  errors,
        "count":   count,
        "message": format!("{} asset(s) supprimé(s)", count)
    })).map_err(|e| e.to_string())
}

/// Déplace un asset vers une autre catégorie dans AppData/assets/.
/// Retourne JSON { success, oldPath, newPath, newCategory, message }.
#[tauri::command]
fn move_asset_editor(
    app_handle: tauri::AppHandle,
    old_path: String,
    new_category: String,
) -> Result<String, String> {
    let old = PathBuf::from(&old_path);
    let fname = old.file_name()
        .ok_or_else(|| "Chemin invalide".to_string())?
        .to_string_lossy()
        .into_owned();

    let new_dir = user_assets_root(&app_handle)?.join(&new_category);
    std::fs::create_dir_all(&new_dir)
        .map_err(|e| format!("create_dir_all {} : {}", new_category, e))?;

    let new_path = new_dir.join(&fname);

    // rename() peut échouer cross-partition → fallback copy + delete
    if std::fs::rename(&old, &new_path).is_err() {
        std::fs::copy(&old, &new_path)
            .map_err(|e| format!("copy {} : {}", fname, e))?;
        std::fs::remove_file(&old)
            .map_err(|e| format!("remove_file {} : {}", fname, e))?;
    }

    serde_json::to_string(&serde_json::json!({
        "success":     true,
        "oldPath":     old_path,
        "newPath":     new_path.to_string_lossy(),
        "newCategory": new_category,
        "message":     "Asset déplacé avec succès"
    })).map_err(|e| e.to_string())
}

// ── Helpers ───────────────────────────────────────────────────────────────────

fn user_assets_root(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    // Mode portable : assets stockés dans data/assets/ à côté de l'exe
    if app_handle.config().identifier == "fr.accesscity.studio.portable" {
        let exe_dir = std::env::current_exe()
            .map_err(|e| format!("current_exe: {}", e))?
            .parent()
            .ok_or_else(|| "L'exe n'a pas de dossier parent".to_string())?
            .to_path_buf();
        return Ok(exe_dir.join("data").join("assets"));
    }
    // Mode installé : AppData/Roaming/fr.accesscity.studio/assets
    app_handle
        .path()
        .app_data_dir()
        .map(|p| p.join("assets"))
        .map_err(|e| format!("app_data_dir : {}", e))
}

fn empty_manifest() -> String {
    serde_json::json!({
        "generated": "0",
        "version":   "1.0.0",
        "totalAssets": 0,
        "categories": [],
        "assets": {}
    }).to_string()
}

fn now_ms() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0)
}

/// Sanitize un nom de fichier + ajoute un timestamp pour éviter les doublons.
fn sanitize_filename(name: &str) -> String {
    let p = std::path::Path::new(name);
    let ext = p.extension()
        .map(|e| format!(".{}", e.to_string_lossy().to_lowercase()))
        .unwrap_or_default();
    let stem = p.file_stem()
        .map(|s| s.to_string_lossy().to_lowercase())
        .unwrap_or_default();

    let safe: String = stem.chars()
        .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' { c } else { '-' })
        .collect();

    format!("{}-{}{}", safe, now_ms(), ext)
}

// ── Entry point ───────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Mode portable : la fenêtre est créée ici avec un data directory
            // relatif à l'exe (localStorage + cache WebView2 voyagent avec l'exe).
            // Pour les autres builds, la fenêtre est définie dans tauri.conf.*.json.
            if app.config().identifier == "fr.accesscity.studio.portable" {
                let exe_path = std::env::current_exe()?;
                let exe_dir = exe_path
                    .parent()
                    .map(|p| p.to_path_buf())
                    .ok_or_else(|| {
                        std::io::Error::new(
                            std::io::ErrorKind::NotFound,
                            "L'exe n'a pas de dossier parent",
                        )
                    })?;

                let data_dir = exe_dir.join("data");
                std::fs::create_dir_all(&data_dir)?;

                tauri::WebviewWindowBuilder::new(
                    app,
                    "main",
                    tauri::WebviewUrl::App("index.html".into()),
                )
                .title("AccessCity Studio")
                .inner_size(1600.0, 900.0)
                .min_inner_size(1200.0, 700.0)
                .resizable(true)
                .center()
                .data_directory(data_dir.join("webview"))
                .build()?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Player
            read_game_data,
            get_exe_dir,
            // Editor
            get_user_assets_dir,
            list_user_assets,
            upload_asset_editor,
            restore_asset_exact,
            read_autoload_zip,
            delete_assets_editor,
            move_asset_editor,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
