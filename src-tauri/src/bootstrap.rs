use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BootstrapState {
    app_name: &'static str,
    platform: &'static str,
    hydration_interval_minutes: u16,
    posture_interval_minutes: u16,
    cursor_interactions_enabled: bool,
    overlay_mode: &'static str,
    next_milestone: &'static str,
}

#[tauri::command]
pub fn get_bootstrap_state() -> BootstrapState {
    BootstrapState {
        app_name: "Goose Overlay",
        platform: std::env::consts::OS,
        hydration_interval_minutes: 40,
        posture_interval_minutes: 30,
        cursor_interactions_enabled: false,
        overlay_mode: "actor-preview",
        next_milestone: "Reminder scheduler and tray controls",
    }
}
