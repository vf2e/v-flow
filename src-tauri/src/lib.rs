use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;

// Axum 相关导入
use axum::{extract::Path as AxumPath, routing::get, Router, response::IntoResponse, response::Response};
use tower_http::services::ServeFile;
use tower_http::cors::CorsLayer;
use tower::util::ServiceExt;

#[derive(Serialize, Deserialize)]
pub struct VideoItem {
    name: String,
    path: String,
    size: u64, // 新增字段：文件大小
}

#[tauri::command]
async fn open_directory(app: tauri::AppHandle) -> Result<Vec<VideoItem>, String> {
    let dir_path = app.dialog().file().blocking_pick_folder();
    let mut videos = Vec::new();
    if let Some(path) = dir_path {
        let std_path = path.into_path().map_err(|_| "无法解析该路径")?;
        if let Ok(entries) = fs::read_dir(std_path) {
            for entry in entries.flatten() {
                let p = entry.path();
                if p.is_file() {
                    let ext = p.extension().unwrap_or_default().to_str().unwrap_or_default().to_lowercase();
                    if ["mp4", "mkv", "avi", "mov", "webm"].contains(&ext.as_str()) {
                        // 获取文件大小
                        let size = fs::metadata(&p).map(|m| m.len()).unwrap_or(0);
                        videos.push(VideoItem {
                            name: p.file_name().unwrap().to_str().unwrap().to_string(),
                            path: p.to_str().unwrap().to_string(),
                            size,
                        });
                    }
                }
            }
        }
    }
    Ok(videos)
}

#[tauri::command]
async fn export_favorites(file_paths: Vec<String>, target_path: String) -> Result<String, String> {
    let target_dir = Path::new(&target_path);
    
    if !target_dir.exists() {
        return Err("目标目录不存在".into());
    }

    for path_str in file_paths {
        let src_path = Path::new(&path_str);
        if let Some(file_name) = src_path.file_name() {
            // 导出：直接在目标目录下拼接文件名，不创建子文件夹
            let dest_path = target_dir.join(file_name);
            fs::copy(src_path, dest_path).map_err(|e| e.to_string())?;
        }
    }
    Ok("导出成功".to_string())
}

async fn serve_local_file(
    AxumPath(file_path): AxumPath<String>,
    req: axum::extract::Request,
) -> Response {
    let path = file_path.trim_start_matches('/').to_string();
    let serve = ServeFile::new(path);
    match serve.oneshot(req).await {
        Ok(res) => res.into_response(),
        Err(_) => axum::http::StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|_app| {
            tauri::async_runtime::spawn(async {
                let app = Router::new()
                    .route("/stream/*file_path", get(serve_local_file))
                    .layer(CorsLayer::permissive());

                if let Ok(listener) = tokio::net::TcpListener::bind("127.0.0.1:1421").await {
                    let _ = axum::serve(listener, app).await;
                }
            });
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![open_directory, export_favorites])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}