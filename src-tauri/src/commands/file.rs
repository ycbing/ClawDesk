use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::fs;
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct FileInfo {
    name: String,
    path: String,
    is_dir: bool,
    size: u64,
}

#[command]
pub fn search_files(query: String) -> Result<Vec<FileInfo>, String> {
    let home = dirs_home().unwrap_or_else(|| "/".to_string());
    let home_path = PathBuf::from(&home);

    let mut results = Vec::new();
    search_files_recursive(&home_path, &query.to_lowercase(), &mut results, 50)?;

    Ok(results)
}

fn search_files_recursive(
    dir: &PathBuf,
    query: &str,
    results: &mut Vec<FileInfo>,
    max_results: usize,
) -> Result<(), String> {
    if results.len() >= max_results {
        return Ok(());
    }

    let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if results.len() >= max_results {
            break;
        }

        let file_name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_lowercase();

        if file_name.contains(query) {
            let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
            results.push(FileInfo {
                name: file_name,
                path: path.to_string_lossy().to_string(),
                is_dir: path.is_dir(),
                size: metadata.len(),
            });
        }

        if path.is_dir() && !path.file_name().map_or(false, |n| n == "." || n == "..") {
            // Skip hidden directories and common large directories
            if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                if name.starts_with('.') || ["node_modules", "target", ".git", "Library", "System"].contains(&name) {
                    continue;
                }
            }
            let _ = search_files_recursive(&path, query, results, max_results);
        }
    }

    Ok(())
}

#[command]
pub fn read_file_content(path: String) -> Result<String, String> {
    let path = PathBuf::from(&path);

    // Security check: must be under home directory
    let home = PathBuf::from(dirs_home().unwrap_or_else(|| "/".to_string()));
    if !path.starts_with(&home) {
        return Err("Access denied: path outside home directory".to_string());
    }

    let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
    if metadata.len() > 10 * 1024 * 1024 {
        return Err("File too large (max 10MB)".to_string());
    }

    fs::read_to_string(&path).map_err(|e| e.to_string())
}

fn dirs_home() -> Option<String> {
    std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .ok()
}
