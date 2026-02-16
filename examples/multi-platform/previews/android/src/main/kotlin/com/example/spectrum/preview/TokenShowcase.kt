package com.example.spectrum.preview

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.spectrum.tokens.SpectrumTokens

@Composable
fun TokenShowcase() {
    LazyColumn(
        modifier = Modifier.padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(32.dp),
    ) {
        item { SemanticColorsSection() }
        item { SpacingSection() }
        item { ShadowSection() }
    }
}

// ── Semantic Colors ──────────────────────────────────────────────

@Composable
private fun SemanticColorsSection() {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        SectionTitle("Semantic Colors")

        LazyVerticalGrid(
            columns = GridCells.Adaptive(minSize = 140.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.height(280.dp),
        ) {
            item { ColorCard("Accent", SpectrumTokens.Colors.accentBackgroundDefault) }
            item { ColorCard("Accent Hover", SpectrumTokens.Colors.accentBackgroundHover) }
            item { ColorCard("Negative", SpectrumTokens.Colors.negativeBackgroundDefault) }
            item { ColorCard("Positive", SpectrumTokens.Colors.positiveBackgroundDefault) }
            item { ColorCard("Notice", SpectrumTokens.Colors.noticeBackgroundDefault) }
            item { ColorCard("Neutral", SpectrumTokens.Colors.neutralBackgroundDefault) }
            item { ColorCard("Disabled", SpectrumTokens.Colors.disabledBackground) }
            item { ColorCard("Focus", SpectrumTokens.Colors.focusIndicator) }
        }

        Text(
            text = "Text Colors",
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            color = SpectrumTokens.Colors.textPrimary,
        )

        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Primary text", color = SpectrumTokens.Colors.textPrimary)
            Text("Secondary text", color = SpectrumTokens.Colors.textSecondary)
            Text("Disabled text", color = SpectrumTokens.Colors.textDisabled)
            Text(
                text = "Text on accent",
                color = SpectrumTokens.Colors.textOnAccent,
                modifier = Modifier
                    .background(
                        SpectrumTokens.Colors.accentBackgroundDefault,
                        RoundedCornerShape(6.dp),
                    )
                    .padding(horizontal = 12.dp, vertical = 6.dp),
            )
        }

        Text(
            text = "Backgrounds",
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            color = SpectrumTokens.Colors.textPrimary,
        )

        LazyVerticalGrid(
            columns = GridCells.Adaptive(minSize = 140.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.height(100.dp),
        ) {
            item { BackgroundCard("Base", SpectrumTokens.Colors.backgroundBase) }
            item { BackgroundCard("Layer 1", SpectrumTokens.Colors.backgroundLayer1) }
            item { BackgroundCard("Layer 2", SpectrumTokens.Colors.backgroundLayer2) }
        }
    }
}

// ── Spacing ──────────────────────────────────────────────────────

@Composable
private fun SpacingSection() {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        SectionTitle("Spacing Scale")

        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            SpacingBar("50", SpectrumTokens.Spacing._50)
            SpacingBar("75", SpectrumTokens.Spacing._75)
            SpacingBar("100", SpectrumTokens.Spacing._100)
            SpacingBar("200", SpectrumTokens.Spacing._200)
            SpacingBar("300", SpectrumTokens.Spacing._300)
            SpacingBar("400", SpectrumTokens.Spacing._400)
            SpacingBar("500", SpectrumTokens.Spacing._500)
            SpacingBar("600", SpectrumTokens.Spacing._600)
        }
    }
}

// ── Shadows ──────────────────────────────────────────────────────

@Composable
private fun ShadowSection() {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        SectionTitle("Shadows")

        LazyVerticalGrid(
            columns = GridCells.Adaptive(minSize = 140.dp),
            horizontalArrangement = Arrangement.spacedBy(24.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp),
            modifier = Modifier.height(130.dp),
        ) {
            item { ShadowCard("100", elevation = 2.dp) }
            item { ShadowCard("200", elevation = 8.dp) }
            item { ShadowCard("300", elevation = 16.dp) }
        }
    }
}

// ── Helpers ──────────────────────────────────────────────────────

@Composable
private fun SectionTitle(text: String) {
    Text(
        text = text,
        fontSize = 20.sp,
        fontWeight = FontWeight.Bold,
        color = SpectrumTokens.Colors.textPrimary,
    )
}

@Composable
private fun ColorCard(label: String, color: androidx.compose.ui.graphics.Color) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(60.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(color),
        )
        Text(label, fontSize = 12.sp, color = SpectrumTokens.Colors.textSecondary)
    }
}

@Composable
private fun BackgroundCard(label: String, color: androidx.compose.ui.graphics.Color) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(60.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(color)
                .border(1.dp, SpectrumTokens.Colors.borderDefault, RoundedCornerShape(8.dp)),
        )
        Text(label, fontSize = 12.sp, color = SpectrumTokens.Colors.textSecondary)
    }
}

@Composable
private fun SpacingBar(label: String, size: androidx.compose.ui.unit.Dp) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(
            text = label,
            fontSize = 12.sp,
            color = SpectrumTokens.Colors.textSecondary,
            modifier = Modifier.width(30.dp),
        )
        Box(
            modifier = Modifier
                .width(size * 3)
                .height(16.dp)
                .clip(RoundedCornerShape(3.dp))
                .background(SpectrumTokens.Colors.accentBackgroundDefault),
        )
        Text(
            text = "${size.value.toInt()}px",
            fontSize = 12.sp,
            color = SpectrumTokens.Colors.textDisabled,
        )
    }
}

@Composable
private fun ShadowCard(label: String, elevation: androidx.compose.ui.unit.Dp) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .height(80.dp)
                .shadow(elevation, RoundedCornerShape(8.dp)),
            shape = RoundedCornerShape(8.dp),
            colors = CardDefaults.cardColors(
                containerColor = SpectrumTokens.Colors.backgroundBase,
            ),
        ) {}
        Text("shadow-$label", fontSize = 12.sp, color = SpectrumTokens.Colors.textSecondary)
    }
}

@Preview(showBackground = true)
@Composable
private fun TokenShowcasePreview() {
    TokenShowcase()
}
