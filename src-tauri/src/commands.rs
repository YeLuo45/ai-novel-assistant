use tauri::AppHandle;

/// Open a project file from the local filesystem
#[tauri::command]
pub async fn open_project(path: String) -> Result<String, String> {
    log::info!("Opening project: {}", path);
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

/// Save project data to a local file
#[tauri::command]
pub async fn save_project(path: String, data: String) -> Result<(), String> {
    log::info!("Saving project to: {}", path);
    std::fs::write(&path, data).map_err(|e| e.to_string())
}

/// Minimize the main window
#[tauri::command]
pub async fn minimize_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.minimize().map_err(|e| e.to_string())
    } else {
        Err("Window not found".to_string())
    }
}

/// Maximize the main window
#[tauri::command]
pub async fn maximize_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_maximized().unwrap_or(false) {
            window.unmaximize().map_err(|e| e.to_string())
        } else {
            window.maximize().map_err(|e| e.to_string())
        }
    } else {
        Err("Window not found".to_string())
    }
}

/// Close the main window
#[tauri::command]
pub async fn close_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.close().map_err(|e| e.to_string())
    } else {
        Err("Window not found".to_string())
    }
}

/// Set the window title
#[tauri::command]
pub async fn set_window_title(app: AppHandle, title: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.set_title(&title).map_err(|e| e.to_string())
    } else {
        Err("Window not found".to_string())
    }
}

/// Toggle fullscreen mode
#[tauri::command]
pub async fn toggle_fullscreen(app: AppHandle) -> Result<bool, String> {
    if let Some(window) = app.get_webview_window("main") {
        let is_fullscreen = window.is_fullscreen().unwrap_or(false);
        window.set_fullscreen(!is_fullscreen).map_err(|e| e.to_string())?;
        Ok(!is_fullscreen)
    } else {
        Err("Window not found".to_string())
    }
}

/// Get the application version
#[tauri::command]
pub fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Show a file in the system file explorer
#[tauri::command]
pub async fn show_in_folder(path: String) -> Result<(), String> {
    log::info!("Showing in folder: {}", path);
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .args(["/select,", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .args(["-R", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(std::path::Path::new(&path).parent().unwrap_or(std::path::Path::new(&path)))
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}