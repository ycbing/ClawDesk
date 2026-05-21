use std::process::Command;
use tauri::command;
use tauri_plugin_shell::ShellExt;

#[command]
pub async fn execute_command(cmd: String) -> Result<String, String> {
    // Parse command: handle "cd /path && ls" style
    let result = if cfg!(target_os = "windows") {
        Command::new("cmd")
            .args(["/C", &cmd])
            .output()
            .map_err(|e| e.to_string())?
    } else {
        Command::new("sh")
            .args(["-c", &cmd])
            .output()
            .map_err(|e| e.to_string())?
    };

    let stdout = String::from_utf8_lossy(&result.stdout).to_string();
    let stderr = String::from_utf8_lossy(&result.stderr).to_string();

    if !result.status.success() {
        Ok(format!("Exit code: {:?}\n{}", result.status.code(), stderr))
    } else {
        let mut output = String::new();
        if !stdout.is_empty() {
            output.push_str(&stdout);
        }
        if !stderr.is_empty() {
            if !output.is_empty() {
                output.push('\n');
            }
            output.push_str(&stderr);
        }
        Ok(output)
    }
}

#[command]
pub async fn open_url(app: tauri::AppHandle, url: String) -> Result<(), String> {
    app.shell()
        .open(&url, None::<&str>)
        .map_err(|e| e.to_string())
}
