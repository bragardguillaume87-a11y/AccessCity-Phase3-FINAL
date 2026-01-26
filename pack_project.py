import os

def pack_bulldozer():
    print("🚜 Démarrage du Bulldozer...")
    output_file = "AccessCity-FULL-Context.md"
    
    # Compteurs
    total_lines = 0
    file_count = 0

    with open(output_file, "w", encoding="utf-8") as f_out:
        f_out.write("# PROJET ACCESSCITY - CONTEXTE COMPLET\n\n")

        # On scanne TOUT le dossier actuel
        for root, dirs, files in os.walk("."):
            # On ignore le dossier .git et les dossiers __pycache__
            if ".git" in root: continue
            
            for file in files:
                # On ne prend que les fichiers texte utiles
                if file.endswith((".js", ".json", ".html", ".md", ".css")):
                    # On ignore les fichiers de contexte eux-mêmes (pour pas boucler)
                    if "Context.md" in file: continue
                    
                    path = os.path.join(root, file)
                    
                    try:
                        # L'astuce est ici : errors='ignore' empêche le crash sur les accents
                        with open(path, "r", encoding="utf-8", errors="ignore") as f_in:
                            content = f_in.read()
                            
                            # On écrit seulement si le fichier n'est pas vide
                            if content.strip():
                                f_out.write(f"## FICHIER: {path}\n")
                                f_out.write("```
                                f_out.write(content)
                                f_out.write("\n```\n\n")
                                
                                lines = content.count('\n')
                                total_lines += lines
                                file_count += 1
                                print(f"✅ Ajouté: {file} ({lines} lignes)")
                            else:
                                print(f"⚠️ Vide (ignoré): {file}")
                                
                    except Exception as e:
                        print(f"❌ ERREUR CRITIQUE sur {file}: {e}")

    print(f"\n🏁 TERMINÉ.")
    print(f"📊 Bilan : {file_count} fichiers compactés.")
    print(f"📏 Total : {total_lines} lignes de code.")
    print(f"💾 Vérifie que le fichier {output_file} fait bien plus de 10 Ko !")

if __name__ == "__main__":
    pack_bulldozer()
