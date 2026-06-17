mod bootstrap;
mod overlay;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            overlay::configure_overlay_window(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![bootstrap::get_bootstrap_state])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
