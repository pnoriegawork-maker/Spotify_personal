// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tauri::command]
fn get_audio_driver_info() -> String {
    "Web Audio API & CoreAudio / WASAPI Low-Latency Engine Active".into()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_audio_driver_info])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
