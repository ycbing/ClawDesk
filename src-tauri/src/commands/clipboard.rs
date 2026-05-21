use tauri::command;
use tauri_plugin_clipboard_manager::ClipboardExt;

#[command]
pub async fn get_clipboard_text(app: tauri::AppHandle) -> Result<String, String> {
    app.clipboard()
        .read_text()
        .map_err(|e| e.to_string())
        .map(|opt| opt.unwrap_or_default())
}

#[command]
pub async fn set_clipboard_text(app: tauri::AppHandle, content: String) -> Result<(), String> {
    app.clipboard()
        .write_text(&content)
        .map_err(|e| e.to_string())
}
