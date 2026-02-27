/// read_game_data — Lit game-data.json depuis le répertoire contenant l'exe.
///
/// INVARIANT : game-data.json doit être placé à côté de player.exe lors de la distribution.
/// C'est garanti par generateStandaloneExe.ts qui emballe les deux fichiers dans le même dossier.
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

/// get_exe_dir — Retourne le répertoire contenant l'exe (chemin absolu).
///
/// Utilisé par le frontend pour convertir les chemins d'assets relatifs
/// en URLs asset:// via convertFileSrc().
#[tauri::command]
fn get_exe_dir() -> Result<String, String> {
    let dir = std::env::current_exe()
        .map_err(|e| format!("Cannot locate exe: {}", e))?
        .parent()
        .ok_or_else(|| "Exe has no parent directory".to_string())?
        .to_path_buf();

    Ok(dir.to_string_lossy().into_owned())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![read_game_data, get_exe_dir])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
