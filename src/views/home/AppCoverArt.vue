<script setup lang="ts">
interface Props {
  slug: string
  accent: string
  icon: string
}

defineProps<Props>()
</script>

<template>
  <div
    class="cover-art"
    :style="{ '--art-accent': accent }"
    aria-hidden="true"
  >
    <!-- 1. Ngã Rẽ Cuộc Đời -->
    <svg
      v-if="slug === 'ngare'"
      viewBox="0 0 360 140"
      class="art-svg"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient
          id="grad-ngare"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop
            offset="0%"
            stop-color="#0b1d3a"
          />
          <stop
            offset="100%"
            stop-color="#1e1342"
          />
        </linearGradient>
      </defs>
      <rect
        width="360"
        height="140"
        fill="url(#grad-ngare)"
      />
      <circle
        cx="290"
        cy="34"
        r="52"
        fill="#6dddff"
        opacity="0.14"
      />
      <path
        d="M30 130 Q140 96 180 72 T330 22"
        fill="none"
        stroke="#6dddff"
        stroke-width="3.5"
        stroke-linecap="round"
      />
      <path
        d="M30 130 Q150 96 188 84 T336 108"
        fill="none"
        stroke="#d277ff"
        stroke-width="3"
        stroke-dasharray="7 6"
        stroke-linecap="round"
      />
      <circle
        cx="180"
        cy="72"
        r="9"
        fill="#060e20"
        stroke="#6dddff"
        stroke-width="3"
      />
      <circle
        cx="275"
        cy="42"
        r="6"
        fill="#6dddff"
      />
      <circle
        cx="272"
        cy="96"
        r="6"
        fill="#d277ff"
      />
      <text
        x="24"
        y="36"
        fill="#6dddff"
        opacity="0.7"
        font-size="11"
        font-weight="700"
        letter-spacing="2"
      >LIFE SIM · RPG</text>
    </svg>

    <!-- 2. Cờ Tướng Master -->
    <svg
      v-else-if="slug === 'co-tuong'"
      viewBox="0 0 360 140"
      class="art-svg"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient
          id="grad-cotuong"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop
            offset="0%"
            stop-color="#2b180a"
          />
          <stop
            offset="100%"
            stop-color="#4e2c12"
          />
        </linearGradient>
      </defs>
      <rect
        width="360"
        height="140"
        fill="url(#grad-cotuong)"
      />
      <g
        stroke="#f59e0b"
        stroke-opacity="0.25"
        stroke-width="1.2"
      >
        <line
          x1="0"
          y1="35"
          x2="360"
          y2="35"
        />
        <line
          x1="0"
          y1="70"
          x2="360"
          y2="70"
        />
        <line
          x1="0"
          y1="105"
          x2="360"
          y2="105"
        />
        <line
          x1="72"
          y1="0"
          x2="72"
          y2="140"
        />
        <line
          x1="144"
          y1="0"
          x2="144"
          y2="140"
        />
        <line
          x1="216"
          y1="0"
          x2="216"
          y2="140"
        />
        <line
          x1="288"
          y1="0"
          x2="288"
          y2="140"
        />
      </g>
      <g transform="translate(122 70)">
        <circle
          r="30"
          fill="#f6dcb0"
          stroke="#b91c1c"
          stroke-width="3"
        />
        <circle
          r="24"
          fill="none"
          stroke="#b91c1c"
          stroke-width="1.4"
        />
        <text
          text-anchor="middle"
          y="10"
          fill="#b91c1c"
          font-size="28"
          font-weight="800"
        >帥</text>
      </g>
      <g transform="translate(238 70)">
        <circle
          r="30"
          fill="#f6dcb0"
          stroke="#1f2937"
          stroke-width="3"
        />
        <circle
          r="24"
          fill="none"
          stroke="#1f2937"
          stroke-width="1.4"
        />
        <text
          text-anchor="middle"
          y="10"
          fill="#111827"
          font-size="28"
          font-weight="800"
        >將</text>
      </g>
    </svg>

    <!-- 3. Cờ Tỷ Phú Sài Gòn -->
    <svg
      v-else-if="slug === 'saigon-tycoon'"
      viewBox="0 0 360 140"
      class="art-svg"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient
          id="grad-saigon"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop
            offset="0%"
            stop-color="#113328"
          />
          <stop
            offset="100%"
            stop-color="#3c2a12"
          />
        </linearGradient>
      </defs>
      <rect
        width="360"
        height="140"
        fill="url(#grad-saigon)"
      />
      <circle
        cx="275"
        cy="42"
        r="34"
        fill="#fbbf24"
        opacity="0.22"
      />
      <!-- Bến Thành silhouette -->
      <path
        d="M24 140 V96 H72 V70 H112 V96 H160 V140 Z"
        fill="#f59e0b"
        opacity="0.28"
      />
      <polygon
        points="72,70 92,46 112,70"
        fill="#fbbf24"
        opacity="0.55"
      />
      <circle
        cx="92"
        cy="82"
        r="7"
        fill="#fef3c7"
      />
      <!-- Dice pair -->
      <rect
        x="212"
        y="50"
        width="44"
        height="44"
        rx="10"
        fill="#fffbeb"
        stroke="#f59e0b"
        stroke-width="2"
        transform="rotate(-10 234 72)"
      />
      <circle
        cx="234"
        cy="72"
        r="5"
        fill="#dc2626"
      />
      <rect
        x="266"
        y="58"
        width="44"
        height="44"
        rx="10"
        fill="#fffbeb"
        stroke="#34d399"
        stroke-width="2"
        transform="rotate(12 288 80)"
      />
      <circle
        cx="279"
        cy="71"
        r="3.5"
        fill="#0f172a"
      />
      <circle
        cx="297"
        cy="89"
        r="3.5"
        fill="#0f172a"
      />
      <circle
        cx="288"
        cy="80"
        r="3.5"
        fill="#0f172a"
      />
    </svg>

    <!-- 4. Nông Trại Anime 2.5D -->
    <svg
      v-else-if="slug === 'anime-farm'"
      viewBox="0 0 360 140"
      class="art-svg"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient
          id="grad-farm"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop
            offset="0%"
            stop-color="#134e4a"
          />
          <stop
            offset="100%"
            stop-color="#1a3b1a"
          />
        </linearGradient>
      </defs>
      <rect
        width="360"
        height="140"
        fill="url(#grad-farm)"
      />
      <circle
        cx="300"
        cy="34"
        r="24"
        fill="#fde047"
        opacity="0.7"
      />
      <!-- Isometric soil tiles -->
      <polygon
        points="180,36 250,70 180,104 110,70"
        fill="#84cc16"
        opacity="0.35"
      />
      <polygon
        points="180,50 226,73 180,96 134,73"
        fill="#92400e"
        stroke="#fde047"
        stroke-opacity="0.4"
        stroke-width="1.5"
      />
      <polygon
        points="116,74 162,97 116,120 70,97"
        fill="#78350f"
        stroke="#a3e635"
        stroke-opacity="0.5"
        stroke-width="1.5"
      />
      <polygon
        points="244,74 290,97 244,120 198,97"
        fill="#65a30d"
        opacity="0.65"
      />
      <text
        x="168"
        y="74"
        font-size="24"
      >🌾</text>
      <text
        x="104"
        y="98"
        font-size="20"
      >🥕</text>
      <text
        x="232"
        y="98"
        font-size="20"
      >🌻</text>
    </svg>

    <!-- 5. OOP Flashcards -->
    <svg
      v-else-if="slug === 'oop-flashcards'"
      viewBox="0 0 360 140"
      class="art-svg"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient
          id="grad-oop"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop
            offset="0%"
            stop-color="#0c203d"
          />
          <stop
            offset="100%"
            stop-color="#172554"
          />
        </linearGradient>
      </defs>
      <rect
        width="360"
        height="140"
        fill="url(#grad-oop)"
      />
      <rect
        x="114"
        y="28"
        width="148"
        height="90"
        rx="14"
        fill="#38bdf8"
        opacity="0.16"
        transform="rotate(-7 188 73)"
      />
      <rect
        x="106"
        y="22"
        width="148"
        height="90"
        rx="14"
        fill="#0f172a"
        stroke="#38bdf8"
        stroke-width="2"
      />
      <text
        x="180"
        y="64"
        text-anchor="middle"
        fill="#38bdf8"
        font-family="monospace"
        font-size="20"
        font-weight="800"
      >{ SOLID }</text>
      <rect
        x="130"
        y="80"
        width="100"
        height="6"
        rx="3"
        fill="#94a3b8"
        opacity="0.45"
      />
      <rect
        x="148"
        y="93"
        width="64"
        height="5"
        rx="2.5"
        fill="#d277ff"
        opacity="0.6"
      />
    </svg>

    <!-- 6. Hôm Nay Ăn Gì -->
    <svg
      v-else-if="slug === 'hom-nay-an-gi'"
      viewBox="0 0 360 140"
      class="art-svg"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient
          id="grad-food"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop
            offset="0%"
            stop-color="#3b1224"
          />
          <stop
            offset="100%"
            stop-color="#4c1d1b"
          />
        </linearGradient>
      </defs>
      <rect
        width="360"
        height="140"
        fill="url(#grad-food)"
      />
      <circle
        cx="180"
        cy="70"
        r="54"
        fill="none"
        stroke="#fb7185"
        stroke-dasharray="8 8"
        stroke-width="2"
        opacity="0.5"
      />
      <circle
        cx="180"
        cy="70"
        r="38"
        fill="#fb7185"
        opacity="0.16"
      />
      <text
        x="180"
        y="83"
        text-anchor="middle"
        font-size="42"
      >🍜</text>
      <text
        x="76"
        y="52"
        font-size="22"
        opacity="0.8"
      >🍛</text>
      <text
        x="266"
        y="54"
        font-size="22"
        opacity="0.8"
      >🧋</text>
      <text
        x="278"
        y="110"
        font-size="20"
        opacity="0.7"
      >🥖</text>
    </svg>

    <!-- 7. Oracle Tarot -->
    <svg
      v-else-if="slug === 'oracle-tarot'"
      viewBox="0 0 360 140"
      class="art-svg"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient
          id="grad-tarot"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop
            offset="0%"
            stop-color="#1d0b3a"
          />
          <stop
            offset="100%"
            stop-color="#0d1333"
          />
        </linearGradient>
      </defs>
      <rect
        width="360"
        height="140"
        fill="url(#grad-tarot)"
      />
      <circle
        cx="180"
        cy="70"
        r="46"
        fill="none"
        stroke="#d277ff"
        stroke-width="1.5"
        opacity="0.45"
      />
      <polygon
        points="180,26 218,92 142,92"
        fill="none"
        stroke="#6dddff"
        stroke-width="1.4"
        opacity="0.6"
      />
      <polygon
        points="180,114 218,48 142,48"
        fill="none"
        stroke="#d277ff"
        stroke-width="1.4"
        opacity="0.6"
      />
      <circle
        cx="180"
        cy="70"
        r="12"
        fill="#d277ff"
        opacity="0.85"
      />
      <circle
        cx="72"
        cy="34"
        r="3"
        fill="#6dddff"
      />
      <circle
        cx="296"
        cy="102"
        r="3"
        fill="#d277ff"
      />
      <circle
        cx="288"
        cy="30"
        r="2"
        fill="#fff"
        opacity="0.8"
      />
    </svg>

    <!-- 8. Neon Typing -->
    <svg
      v-else-if="slug === 'neon-typing'"
      viewBox="0 0 360 140"
      class="art-svg"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient
          id="grad-typing"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop
            offset="0%"
            stop-color="#06192c"
          />
          <stop
            offset="100%"
            stop-color="#111033"
          />
        </linearGradient>
      </defs>
      <rect
        width="360"
        height="140"
        fill="url(#grad-typing)"
      />
      <g
        fill="#0f172a"
        stroke="#22d3ee"
        stroke-width="1.6"
      >
        <rect
          x="56"
          y="42"
          width="52"
          height="48"
          rx="10"
        />
        <rect
          x="122"
          y="42"
          width="52"
          height="48"
          rx="10"
          fill="#22d3ee"
          fill-opacity="0.22"
        />
        <rect
          x="188"
          y="42"
          width="52"
          height="48"
          rx="10"
        />
        <rect
          x="254"
          y="42"
          width="52"
          height="48"
          rx="10"
          stroke="#d277ff"
        />
      </g>
      <g
        fill="#e0f2fe"
        font-family="monospace"
        font-size="19"
        font-weight="800"
        text-anchor="middle"
      >
        <text
          x="82"
          y="73"
        >W</text>
        <text
          x="148"
          y="73"
          fill="#6dddff"
        >P</text>
        <text
          x="214"
          y="73"
        >M</text>
        <text
          x="280"
          y="73"
          fill="#d277ff"
        >⚡</text>
      </g>
      <line
        x1="48"
        y1="108"
        x2="312"
        y2="108"
        stroke="#22d3ee"
        stroke-width="2"
        opacity="0.5"
      />
    </svg>

    <!-- 9. Mini Piano -->
    <svg
      v-else-if="slug === 'mini-piano'"
      viewBox="0 0 360 140"
      class="art-svg"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient
          id="grad-piano"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop
            offset="0%"
            stop-color="#191038"
          />
          <stop
            offset="100%"
            stop-color="#0b1a36"
          />
        </linearGradient>
      </defs>
      <rect
        width="360"
        height="140"
        fill="url(#grad-piano)"
      />
      <path
        d="M20 38 Q70 10 120 38 T220 38 T340 38"
        fill="none"
        stroke="#c084fc"
        stroke-width="2.5"
        opacity="0.75"
      />
      <g transform="translate(64 62)">
        <rect
          v-for="n in 7"
          :key="n"
          :x="(n - 1) * 33"
          y="0"
          width="30"
          height="68"
          rx="5"
          fill="#f8fafc"
          opacity="0.92"
        />
        <rect
          x="21"
          y="0"
          width="20"
          height="40"
          rx="4"
          fill="#0f172a"
        />
        <rect
          x="54"
          y="0"
          width="20"
          height="40"
          rx="4"
          fill="#0f172a"
        />
        <rect
          x="120"
          y="0"
          width="20"
          height="40"
          rx="4"
          fill="#c084fc"
        />
        <rect
          x="153"
          y="0"
          width="20"
          height="40"
          rx="4"
          fill="#0f172a"
        />
        <rect
          x="186"
          y="0"
          width="20"
          height="40"
          rx="4"
          fill="#0f172a"
        />
      </g>
    </svg>

    <!-- 10. Color Game -->
    <svg
      v-else-if="slug === 'color-game'"
      viewBox="0 0 360 140"
      class="art-svg"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect
        width="360"
        height="140"
        fill="#131126"
      />
      <circle
        cx="132"
        cy="68"
        r="38"
        fill="#f43f5e"
        opacity="0.65"
      />
      <circle
        cx="180"
        cy="56"
        r="38"
        fill="#34d399"
        opacity="0.62"
      />
      <circle
        cx="228"
        cy="74"
        r="38"
        fill="#38bdf8"
        opacity="0.68"
      />
      <text
        x="180"
        y="124"
        text-anchor="middle"
        fill="#e2e8f0"
        font-family="monospace"
        font-size="12"
        font-weight="700"
        letter-spacing="2"
      >#6DDDFF · RGB</text>
    </svg>

    <!-- Fallback cho ứng dụng mới -->
    <div
      v-else
      class="art-fallback"
    >
      <span class="fallback-glyph">{{ icon }}</span>
    </div>
  </div>
</template>

<style scoped>
.cover-art {
  position: relative;
  width: 100%;
  height: 128px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--outline);
  background: var(--bg-sidebar);
  margin-bottom: 1rem;
  flex-shrink: 0;
}

.art-svg {
  width: 100%;
  height: 100%;
  display: block;
  transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

:deep(.app-card:hover) .art-svg,
.cover-art:hover .art-svg {
  transform: scale(1.06);
}

.art-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-sidebar), var(--bg-elevated));
}

.fallback-glyph {
  font-size: 3rem;
}
</style>
