// src-tauri/src/main.rs
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

fn main() {
    // 调用 lib.rs 中定义的 run 函数
    v_flow_lib::run(); 
}