#!/bin/bash
# Copy the generated Kotlin token file into the Compose preview project
# Run this after `pnpm build` in the multi-platform example root
cp ../../output/android/DesignTokens-light.kt src/main/kotlin/com/example/spectrum/tokens/SpectrumTokens.kt
echo "Copied DesignTokens-light.kt -> src/main/kotlin/com/example/spectrum/tokens/SpectrumTokens.kt"
