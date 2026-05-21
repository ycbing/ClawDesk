use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_global_shortcut::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            // Global shortcut: Ctrl+Space (or Cmd+Space on macOS)
            let shortcut = if cfg!(target_os = "macos") {
                "cmd+space"
            } else {
                "ctrl+space"
            };

            app.global_shortcut().on_shortcuts(shortcut, |_| {
                // Toggle window visibility — handled per window below
            })?;

            // System tray
            let show = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .tooltip("ClawDesk")
                .icon(app.default_window_icon().unwrap().clone())
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            window.show().unwrap();
                            window.set_focus().unwrap();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::file::search_files,
            commands::file::read_file_content,
            commands::clipboard::get_clipboard_text,
            commands::clipboard::set_clipboard_text,
            commands::system::execute_command,
            commands::system::open_url,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
