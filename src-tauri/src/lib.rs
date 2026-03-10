use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;

// Axum 相关导入
use axum::{extract::Path as AxumPath, routing::get, Router, response::IntoResponse};
use tower_http::services::ServeFile;
use tower_http::cors::CorsLayer;
use tower::ServiceExt;

#[derive(Serialize, Deserialize)]
pub struct VideoItem {
    name: String,
    path: String,
}

// 1. 扫描目录并返回视频列表 (保持原逻辑)
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
                        videos.push(VideoItem {
                            name: p.file_name().unwrap().to_str().unwrap().to_string(),
                            path: p.to_str().unwrap().to_string(),
                        });
                    }
                }
            }
        }
    }
    Ok(videos)
}

// 2. 导出收藏视频 (保持原逻辑)
#[tauri::command]
async fn export_favorites(app: tauri::AppHandle, file_paths: Vec<String>) -> Result<String, String> {
    for path_str in file_paths {
        let path = Path::new(&path_str);
        if let Some(file_name) = path.file_name() {
            let folder_name = path.file_stem().unwrap().to_str().unwrap();
            let target_dir = format!("D:\\{}", folder_name);
            fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;
            let target_path = format!("{}\\{}", target_dir, file_name.to_str().unwrap());
            fs::copy(path, target_path).map_err(|e| e.to_string())?;
        }
    }
    let _ = app.opener().open_path("D:\\", None::<String>);
    Ok("核心资产已成功提取至 D 盘".to_string())
}

// 🚀 核心：Axum 处理函数，支持全盘符动态读取
async fn serve_local_file(
    AxumPath(file_path): AxumPath<String>,
    req: axum::extract::Request,
) -> axum::response::Response {
    // 恢复 Windows 绝对路径：将 "E:/video.mp4" 这种被前端 encode 的路径还原
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
            // 在独立的异步线程启动极客媒体引擎
            tauri::async_runtime::spawn(async {
                let app = Router::new()
                    .route("/stream/*file_path", get(serve_local_file))
                    .layer(CorsLayer::permissive());

                if let Ok(listener) = tokio::net::TcpListener::bind("127.0.0.1:1421").await {
                    println!("🚀 极客媒体引擎启动: http://127.0.0.1:1421");
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