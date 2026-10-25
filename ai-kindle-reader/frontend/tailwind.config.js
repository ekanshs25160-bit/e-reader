/** @type {import('tailwindcss').Config} */
module.exports = {
  "content": [
    "./src/**/*.{js,jsx}"
  ],
  "darkMode": "class",
  "theme": {
    "extend": {
      "colors": {
        "background": "rgb(var(--c-background) / <alpha-value>)",
        "error": "rgb(var(--c-error) / <alpha-value>)",
        "error-container": "rgb(var(--c-error-container) / <alpha-value>)",
        "inverse-on-surface": "rgb(var(--c-inverse-on-surface) / <alpha-value>)",
        "inverse-primary": "rgb(var(--c-inverse-primary) / <alpha-value>)",
        "inverse-surface": "rgb(var(--c-inverse-surface) / <alpha-value>)",
        "on-background": "rgb(var(--c-on-background) / <alpha-value>)",
        "on-error": "rgb(var(--c-on-error) / <alpha-value>)",
        "on-error-container": "rgb(var(--c-on-error-container) / <alpha-value>)",
        "on-primary": "rgb(var(--c-on-primary) / <alpha-value>)",
        "on-primary-container": "rgb(var(--c-on-primary-container) / <alpha-value>)",
        "on-primary-fixed": "rgb(var(--c-on-primary-fixed) / <alpha-value>)",
        "on-primary-fixed-variant": "rgb(var(--c-on-primary-fixed-variant) / <alpha-value>)",
        "on-secondary": "rgb(var(--c-on-secondary) / <alpha-value>)",
        "on-secondary-container": "rgb(var(--c-on-secondary-container) / <alpha-value>)",
        "on-secondary-fixed": "rgb(var(--c-on-secondary-fixed) / <alpha-value>)",
        "on-secondary-fixed-variant": "rgb(var(--c-on-secondary-fixed-variant) / <alpha-value>)",
        "on-surface": "rgb(var(--c-on-surface) / <alpha-value>)",
        "on-surface-variant": "rgb(var(--c-on-surface-variant) / <alpha-value>)",
        "on-tertiary": "rgb(var(--c-on-tertiary) / <alpha-value>)",
        "on-tertiary-container": "rgb(var(--c-on-tertiary-container) / <alpha-value>)",
        "on-tertiary-fixed": "rgb(var(--c-on-tertiary-fixed) / <alpha-value>)",
        "on-tertiary-fixed-variant": "rgb(var(--c-on-tertiary-fixed-variant) / <alpha-value>)",
        "outline": "rgb(var(--c-outline) / <alpha-value>)",
        "outline-variant": "rgb(var(--c-outline-variant) / <alpha-value>)",
        "primary": "rgb(var(--c-primary) / <alpha-value>)",
        "primary-container": "rgb(var(--c-primary-container) / <alpha-value>)",
        "primary-fixed": "rgb(var(--c-primary-fixed) / <alpha-value>)",
        "primary-fixed-dim": "rgb(var(--c-primary-fixed-dim) / <alpha-value>)",
        "secondary": "rgb(var(--c-secondary) / <alpha-value>)",
        "secondary-container": "rgb(var(--c-secondary-container) / <alpha-value>)",
        "secondary-fixed": "rgb(var(--c-secondary-fixed) / <alpha-value>)",
        "secondary-fixed-dim": "rgb(var(--c-secondary-fixed-dim) / <alpha-value>)",
        "surface": "rgb(var(--c-surface) / <alpha-value>)",
        "surface-bright": "rgb(var(--c-surface-bright) / <alpha-value>)",
        "surface-container": "rgb(var(--c-surface-container) / <alpha-value>)",
        "surface-container-high": "rgb(var(--c-surface-container-high) / <alpha-value>)",
        "surface-container-highest": "rgb(var(--c-surface-container-highest) / <alpha-value>)",
        "surface-container-low": "rgb(var(--c-surface-container-low) / <alpha-value>)",
        "surface-container-lowest": "rgb(var(--c-surface-container-lowest) / <alpha-value>)",
        "surface-dim": "rgb(var(--c-surface-dim) / <alpha-value>)",
        "surface-tint": "rgb(var(--c-surface-tint) / <alpha-value>)",
        "surface-variant": "rgb(var(--c-surface-variant) / <alpha-value>)",
        "tertiary": "rgb(var(--c-tertiary) / <alpha-value>)",
        "tertiary-container": "rgb(var(--c-tertiary-container) / <alpha-value>)",
        "tertiary-fixed": "rgb(var(--c-tertiary-fixed) / <alpha-value>)",
        "tertiary-fixed-dim": "rgb(var(--c-tertiary-fixed-dim) / <alpha-value>)",
        "ink": "var(--theme-ink)",
        "muted": "var(--theme-muted)",
        "hairline": "var(--theme-hairline)",
        "accent": "var(--theme-accent)",
        "contrast": "var(--theme-contrast)",
        "semantic-error": "var(--theme-error)",
        "semantic-success": "var(--theme-success)"
      },
      "borderRadius": {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "card": "12px",
        "control": "12px",
        "panel": "24px",
        "sheet": "24px",
        "full": "9999px"
      },
      "spacing": {
        "space-sm": "0.5rem",
        "gutter-desktop": "2rem",
        "margin-desktop": "3rem",
        "space-xs": "0.25rem",
        "gutter": "1.25rem",
        "space-md": "1rem",
        "margin": "1.25rem",
        "space-lg": "1.5rem",
        "space-xl": "2.25rem",
        "18": "4.5rem",
        "22": "5.5rem",
        "26": "6.5rem",
        "30": "7.5rem",
        "34": "8.5rem",
        "38": "9.5rem",
        "42": "10.5rem",
        "46": "11.5rem",
        "50": "12.5rem",
        "54": "13.5rem",
        "58": "14.5rem",
        "62": "15.5rem"
      },
      "fontFamily": {
        "serif": [
          "Newsreader Variable",
          "Newsreader",
          "Literata Variable",
          "Literata",
          "Georgia",
          "serif"
        ],
        "sans": [
          "Inter Variable",
          "Inter",
          "system-ui",
          "-apple-system",
          "sans-serif"
        ],
        "body-reading": [
          "Literata Variable",
          "Literata",
          "serif"
        ],
        "headline-sm": [
          "Newsreader Variable",
          "Newsreader",
          "serif"
        ],
        "body-ui-bold": [
          "Inter Variable",
          "Inter",
          "sans-serif"
        ],
        "headline-md": [
          "Newsreader Variable",
          "Newsreader",
          "serif"
        ],
        "headline-lg": [
          "Newsreader Variable",
          "Newsreader",
          "serif"
        ],
        "label-sm": [
          "Inter Variable",
          "Inter",
          "sans-serif"
        ],
        "display-lg-mobile": [
          "Newsreader Variable",
          "Newsreader",
          "serif"
        ],
        "body-ui": [
          "Inter Variable",
          "Inter",
          "sans-serif"
        ],
        "display-lg": [
          "Newsreader Variable",
          "Newsreader",
          "serif"
        ],
        "label-md": [
          "Inter Variable",
          "Inter",
          "sans-serif"
        ],
        "caption": [
          "Inter Variable",
          "Inter",
          "sans-serif"
        ]
      },
      "fontSize": {
        "body-reading": [
          "19px",
          {
            "lineHeight": "32px",
            "letterSpacing": "0.005em",
            "fontWeight": "400"
          }
        ],
        "headline-sm": [
          "21px",
          {
            "lineHeight": "28px",
            "fontWeight": "500"
          }
        ],
        "body-ui-bold": [
          "15px",
          {
            "lineHeight": "22px",
            "fontWeight": "600"
          }
        ],
        "headline-md": [
          "26px",
          {
            "lineHeight": "34px",
            "fontWeight": "500"
          }
        ],
        "headline-lg": [
          "32px",
          {
            "lineHeight": "40px",
            "letterSpacing": "-0.01em",
            "fontWeight": "400"
          }
        ],
        "label-sm": [
          "11px",
          {
            "lineHeight": "14px",
            "letterSpacing": "0.04em",
            "fontWeight": "600"
          }
        ],
        "display-lg-mobile": [
          "34px",
          {
            "lineHeight": "42px",
            "letterSpacing": "-0.015em",
            "fontWeight": "400"
          }
        ],
        "body-ui": [
          "15px",
          {
            "lineHeight": "22px",
            "fontWeight": "400"
          }
        ],
        "display-lg": [
          "44px",
          {
            "lineHeight": "52px",
            "letterSpacing": "-0.02em",
            "fontWeight": "400"
          }
        ],
        "label-md": [
          "13px",
          {
            "lineHeight": "18px",
            "letterSpacing": "0.01em",
            "fontWeight": "500"
          }
        ],
        "caption": [
          "12px",
          {
            "lineHeight": "16px",
            "fontWeight": "400"
          }
        ]
      }
    }
  },
  "plugins": [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ]
};
