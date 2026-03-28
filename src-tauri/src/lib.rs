use serde::Serialize;
use tauri::{Manager, PhysicalPosition, PhysicalSize, Position, Size};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct BootstrapState {
    app_name: &'static str,
    platform: &'static str,
    hydration_interval_minutes: u16,
    posture_interval_minutes: u16,
    cursor_interactions_enabled: bool,
    overlay_mode: &'static str,
    next_milestone: &'static str,
}

#[tauri::command]
fn get_bootstrap_state() -> BootstrapState {
    BootstrapState {
        app_name: "Goose Overlay",
        platform: std::env::consts::OS,
        hydration_interval_minutes: 40,
        posture_interval_minutes: 30,
        cursor_interactions_enabled: false,
        overlay_mode: "prototype",
        next_milestone: "Wire PixiJS goose renderer and reminder scheduler",
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            if let Some(window) = app.get_webview_window("overlay") {
                let monitor = window
                    .current_monitor()?
                    .or_else(|| window.primary_monitor().ok().flatten());

                if let Some(monitor) = monitor {
                    let monitor_size = monitor.size();
                    let monitor_position = monitor.position();

                    window.set_position(Position::Physical(PhysicalPosition::new(
                        monitor_position.x,
                        monitor_position.y,
                    )))?;
                    window.set_size(Size::Physical(PhysicalSize::new(
                        monitor_size.width,
                        monitor_size.height,
                    )))?;
                }

                window.set_focusable(false)?;
                window.set_ignore_cursor_events(true)?;
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_bootstrap_state])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
