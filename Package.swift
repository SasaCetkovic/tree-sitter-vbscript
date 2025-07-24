// swift-tools-version:5.3

import Foundation
import PackageDescription

var sources = ["src/parser.c"]
if FileManager.default.fileExists(atPath: "src/scanner.c") {
    sources.append("src/scanner.c")
}

let package = Package(
    name: "TreeSitterVbscript",
    products: [
        .library(name: "TreeSitterVbscript", targets: ["TreeSitterVbscript"]),
    ],
    dependencies: [
        .package(name: "SwiftTreeSitter", url: "https://github.com/SasaCetkovic/swift-tree-sitter", from: "0.9.0"),
    ],
    targets: [
        .target(
            name: "TreeSitterVbscript",
            dependencies: [],
            path: ".",
            sources: sources,
            resources: [
                .copy("queries")
            ],
            publicHeadersPath: "bindings/swift",
            cSettings: [.headerSearchPath("src")]
        ),
        .testTarget(
            name: "TreeSitterVbscriptTests",
            dependencies: [
                "SwiftTreeSitter",
                "TreeSitterVbscript",
            ],
            path: "bindings/swift/TreeSitterVbscriptTests"
        )
    ],
    cLanguageStandard: .c11
)
