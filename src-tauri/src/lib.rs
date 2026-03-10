// src-tauri/src/lib.rs
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
// 导入 Tauri v2 插件的 Trait
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;

#[derive(Serialize, Deserialize)]
pub struct VideoItem {
    name: String,
    path: String,
}

// 1. 扫描目录并返回视频列表
#[tauri::command]
async fn open_directory(app: tauri::AppHandle) -> Result<Vec<VideoItem>, String> {
    // 关键修复 1：使用 blocking_pick_folder() 获取同步返回值
    let dir_path = app.dialog().file().blocking_pick_folder();
    
    let mut videos = Vec::new();
    if let Some(path) = dir_path {
        // 关键修复 2：将 v2 的 FilePath 对象转换为标准的 PathBuf
        let std_path = path.into_path().map_err(|_| "无法解析该路径")?;
        
        if let Ok(entries) = fs::read_dir(std_path) {
            for entry in entries.flatten() {
                let p = entry.path();
                if p.is_file() {
                    let ext = p.extension()
                        .unwrap_or_default()
                        .to_str()
                        .unwrap_or_default()
                        .to_lowercase();
                    
                    // 仅收录常见视频格式
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

// 2. 导出收藏视频并自动打开 D 盘
#[tauri::command]
async fn export_favorites(app: tauri::AppHandle, file_paths: Vec<String>) -> Result<String, String> {
    for path_str in file_paths {
        let path = Path::new(&path_str);
        if let Some(file_name) = path.file_name() {
            let folder_name = path.file_stem().unwrap().to_str().unwrap();
            let target_dir = format!("D:\\{}", folder_name);
            
            // 物理创建文件夹并拷贝
            fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;
            let target_path = format!("{}\\{}", target_dir, file_name.to_str().unwrap());
            fs::copy(path, target_path).map_err(|e| e.to_string())?;
        }
    }
    
    // 关键修复 3：使用规范的泛型类型 String 替代 &str，避免类型推导错误
    let _ = app.opener().open_path("D:\\", None::<String>);
    
    Ok("核心资产已成功提取至 D 盘".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // 初始化所需插件
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![open_directory, export_favorites])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}