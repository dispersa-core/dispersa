#!/bin/bash
# Copy the generated Swift token file into the SwiftUI preview project
# Run this after `pnpm build` in the multi-platform example root
cp ../../output/ios/DesignTokens-light.swift Sources/DesignTokensPreview/SpectrumTokens.swift
echo "Copied DesignTokens-light.swift -> Sources/DesignTokensPreview/SpectrumTokens.swift"
