// Token Showcase — SwiftUI view showing all Spectrum design tokens
// Uses SpectrumTokens from the Dispersa-generated Swift file

import SwiftUI

struct TokenShowcase: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 32) {
                    semanticColorsSection
                    spacingSection
                    shadowSection
                }
                .padding(24)
            }
            .background(SpectrumTokens.Colors.backgroundBase)
            .navigationTitle("Spectrum Tokens")
        }
    }

    // MARK: - Semantic Colors

    private var semanticColorsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Semantic Colors")
                .font(.title2.weight(.bold))
                .foregroundColor(SpectrumTokens.Colors.textPrimary)

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 140), spacing: 12)], spacing: 12) {
                colorCard("Accent", color: SpectrumTokens.Colors.accentBackgroundDefault)
                colorCard("Accent Hover", color: SpectrumTokens.Colors.accentBackgroundHover)
                colorCard("Negative", color: SpectrumTokens.Colors.negativeBackgroundDefault)
                colorCard("Positive", color: SpectrumTokens.Colors.positiveBackgroundDefault)
                colorCard("Notice", color: SpectrumTokens.Colors.noticeBackgroundDefault)
                colorCard("Neutral", color: SpectrumTokens.Colors.neutralBackgroundDefault)
                colorCard("Disabled", color: SpectrumTokens.Colors.disabledBackground)
                colorCard("Focus", color: SpectrumTokens.Colors.focusIndicator)
            }

            Text("Text Colors")
                .font(.headline)
                .foregroundColor(SpectrumTokens.Colors.textPrimary)
                .padding(.top, 8)

            VStack(alignment: .leading, spacing: 8) {
                Text("Primary text")
                    .foregroundColor(SpectrumTokens.Colors.textPrimary)
                Text("Secondary text")
                    .foregroundColor(SpectrumTokens.Colors.textSecondary)
                Text("Disabled text")
                    .foregroundColor(SpectrumTokens.Colors.textDisabled)
                HStack {
                    Text("Text on accent")
                        .foregroundColor(SpectrumTokens.Colors.textOnAccent)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(SpectrumTokens.Colors.accentBackgroundDefault)
                        .clipShape(RoundedRectangle(cornerRadius: 6))
                }
            }

            Text("Backgrounds")
                .font(.headline)
                .foregroundColor(SpectrumTokens.Colors.textPrimary)
                .padding(.top, 8)

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 140), spacing: 12)], spacing: 12) {
                backgroundCard("Base", color: SpectrumTokens.Colors.backgroundBase)
                backgroundCard("Layer 1", color: SpectrumTokens.Colors.backgroundLayer1)
                backgroundCard("Layer 2", color: SpectrumTokens.Colors.backgroundLayer2)
            }
        }
    }

    // MARK: - Spacing

    private var spacingSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Spacing Scale")
                .font(.title2.weight(.bold))
                .foregroundColor(SpectrumTokens.Colors.textPrimary)

            VStack(alignment: .leading, spacing: 8) {
                spacingBar("50", width: SpectrumTokens.Spacing._50)
                spacingBar("75", width: SpectrumTokens.Spacing._75)
                spacingBar("100", width: SpectrumTokens.Spacing._100)
                spacingBar("200", width: SpectrumTokens.Spacing._200)
                spacingBar("300", width: SpectrumTokens.Spacing._300)
                spacingBar("400", width: SpectrumTokens.Spacing._400)
                spacingBar("500", width: SpectrumTokens.Spacing._500)
                spacingBar("600", width: SpectrumTokens.Spacing._600)
            }
        }
    }

    // MARK: - Shadows

    private var shadowSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Shadows")
                .font(.title2.weight(.bold))
                .foregroundColor(SpectrumTokens.Colors.textPrimary)

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 140), spacing: 24)], spacing: 24) {
                shadowCard("100", radius: 4, y: 1, opacity: 0.12)
                shadowCard("200", radius: 16, y: 4, opacity: 0.16)
                shadowCard("300", radius: 28, y: 8, opacity: 0.24)
            }
        }
    }

    // MARK: - Helper Views

    private func colorCard(_ label: String, color: Color) -> some View {
        VStack(spacing: 8) {
            RoundedRectangle(cornerRadius: 8)
                .fill(color)
                .frame(height: 60)
            Text(label)
                .font(.caption)
                .foregroundColor(SpectrumTokens.Colors.textSecondary)
        }
    }

    private func backgroundCard(_ label: String, color: Color) -> some View {
        VStack(spacing: 8) {
            RoundedRectangle(cornerRadius: 8)
                .fill(color)
                .frame(height: 60)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(SpectrumTokens.Colors.borderDefault, lineWidth: 1)
                )
            Text(label)
                .font(.caption)
                .foregroundColor(SpectrumTokens.Colors.textSecondary)
        }
    }

    private func spacingBar(_ label: String, width: CGFloat) -> some View {
        HStack(spacing: 12) {
            Text(label)
                .font(.caption.monospacedDigit())
                .foregroundColor(SpectrumTokens.Colors.textSecondary)
                .frame(width: 30, alignment: .trailing)
            RoundedRectangle(cornerRadius: 3)
                .fill(SpectrumTokens.Colors.accentBackgroundDefault)
                .frame(width: width * 3, height: 16)
            Text("\(Int(width))px")
                .font(.caption.monospacedDigit())
                .foregroundColor(SpectrumTokens.Colors.textDisabled)
        }
    }

    private func shadowCard(_ label: String, radius: CGFloat, y: CGFloat, opacity: Double) -> some View {
        VStack(spacing: 8) {
            RoundedRectangle(cornerRadius: 8)
                .fill(SpectrumTokens.Colors.backgroundBase)
                .frame(height: 80)
                .shadow(color: .black.opacity(opacity), radius: radius, x: 0, y: y)
            Text("shadow-\(label)")
                .font(.caption)
                .foregroundColor(SpectrumTokens.Colors.textSecondary)
        }
    }
}

#Preview {
    TokenShowcase()
}
