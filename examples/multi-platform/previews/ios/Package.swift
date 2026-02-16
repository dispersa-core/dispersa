// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "DesignTokensPreview",
    platforms: [.iOS(.v17), .macOS(.v14)],
    targets: [
        .executableTarget(
            name: "DesignTokensPreview",
            path: "Sources/DesignTokensPreview"
        ),
    ]
)
