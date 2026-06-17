use tauri::{Manager, PhysicalPosition, PhysicalSize, Position, Size};

pub fn configure_overlay_window(app: &tauri::App) -> tauri::Result<()> {
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
}
