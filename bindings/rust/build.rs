fn main() {
    let src_dir = std::path::Path::new("src");

    let mut c_config = cc::Build::new();
    c_config.std("c11").include(src_dir);

    #[cfg(target_env = "msvc")]
    c_config.flag("-utf-8");

    // For wasm32 targets (e.g. Zed extension compilation), the WASI sysroot
    // must be configured so the C compiler can find standard headers.
    // Check common locations in order of preference.
    if std::env::var("CARGO_CFG_TARGET_ARCH").unwrap_or_default() == "wasm32" {
        let sysroot = std::env::var("WASI_SYSROOT").ok().or_else(|| {
            std::env::var("WASI_SDK_PATH")
                .ok()
                .map(|p| format!("{}/share/wasi-sysroot", p))
        }).or_else(|| {
            // Zed bundles the WASI SDK under its application support directory.
            std::env::var("HOME").ok().and_then(|home| {
                let path = format!(
                    "{}/Library/Application Support/Zed/extensions/build/wasi-sdk/share/wasi-sysroot",
                    home
                );
                std::path::Path::new(&path).exists().then_some(path)
            })
        });

        if let Some(sysroot) = sysroot {
            c_config.flag(&format!("--sysroot={}", sysroot));
        }
    }

    let parser_path = src_dir.join("parser.c");
    c_config.file(&parser_path);
    println!("cargo:rerun-if-changed={}", parser_path.to_str().unwrap());

    let scanner_path = src_dir.join("scanner.c");
    if scanner_path.exists() {
        c_config.file(&scanner_path);
        println!("cargo:rerun-if-changed={}", scanner_path.to_str().unwrap());
    }

    c_config.compile("tree-sitter-vbscript");
}
