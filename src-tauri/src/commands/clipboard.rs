use tauri::command;
use tauri_plugin_clipboard_manager::ClipboardExt;

#[command]
pub async fn get_clipboard_text(app: tauri::AppHandle) -> Result<String, String> {
    match app.clipboard().read_text() {
        Ok(Some(text)) => Ok(text),
        Ok(None) => Ok(String::new()),
        Err(e) => Err(e.to_string()),
    }
}

#[command]
pub async fn set_clipboard_text(app: tauri::AppHandle, content: String) -> Result<(), String> {
    app.clipboard()
        .write_text(&content)
        .map_err(|e| e.to_string())
}
