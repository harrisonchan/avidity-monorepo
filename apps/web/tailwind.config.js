const { fontFamily } = require("tailwindcss/defaultTheme")

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}",],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--primary)",
          light: "var(--primary-light)",
          dark: "var(--primary-dark)",
          highlight: "var(--primary-highlight)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          light: "var(--secondary-light)",
          dark: "var(--secondary-dark)",
        },
        tertiary: {
          DEFAULT: "var(--tertiary)",
          light: "var(--tertiary-light)",
          dark: "var(--tertiary-dark)",
        },
        light: "var(--light)",
        dark: "var(--dark)",
        violet: {
          DEFAULT: "var(--violet)",
          light: "var(--violet-light)",
          dark: "var(--violet-dark)",
        },
        aqua: {
          DEFAULT: "var(--aqua)",
          light: "var(--aqua-light)",
          dark: "var(--aqua-dark)",
        },
        gold: "var(--gold)",
        grey: {
          DEFAULT: "var(--grey)",
          light: "var(--grey-light)",
          dark: "var(--grey-dark)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: {
          DEFAULT: "var(--background)",
          white: "var(--background-light)",
        },
        foreground: "var(--foreground)",
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: "calc(var(--radius) - 4px)",
      },
      // fontFamily: {
      //   sans: ["var(--font-sans)", ...fontFamily.sans],
      // },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}


// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   darkMode: ["class"],
//   content: [
//     "./src/**/*.{js,ts,jsx,tsx,mdx}",
//   ],
//   theme: {
//     extend: {
//       container: {
//         center: true,
//         padding: "2rem",
//         screens: {
//           "2xl": "1400px",
//         },
//       },
//       colors: {
//         border: "var(--border)",
//         input: "var(--input)",
//         ring: "var(--ring)",
//         background: "var(--background)",
//         foreground: "var(--foreground)",
//         primary: {
//           DEFAULT: "var(--primary)",
//           foreground: "var(--primary-foreground)",
//         },
//         secondary: {
//           DEFAULT: "var(--secondary)",
//           foreground: "var(--secondary-foreground)",
//         },
//         destructive: {
//           DEFAULT: "var(--destructive)",
//           foreground: "var(--destructive-foreground)",
//         },
//         muted: {
//           DEFAULT: "var(--muted)",
//           foreground: "var(--muted-foreground)",
//         },
//         accent: {
//           DEFAULT: "var(--accent)",
//           foreground: "var(--accent-foreground)",
//         },
//         popover: {
//           DEFAULT: "var(--popover)",
//           foreground: "var(--popover-foreground)",
//         },
//         card: {
//           DEFAULT: "var(--card)",
//           foreground: "var(--card-foreground)",
//         },
//       },
//       borderRadius: {
//         lg: `var(--radius)`,
//         md: `calc(var(--radius) - 2px)`,
//         sm: "calc(var(--radius) - 4px)",
//       },
//       fontFamily: {
//         sans: ["var(--font-sans)", ...fontFamily.sans],
//       },
//       keyframes: {
//         "accordion-down": {
//           from: { height: "0" },
//           to: { height: "var(--radix-accordion-content-height)" },
//         },
//         "accordion-up": {
//           from: { height: "var(--radix-accordion-content-height)" },
//           to: { height: "0" },
//         },
//       },
//       animation: {
//         "accordion-down": "accordion-down 0.2s ease-out",
//         "accordion-up": "accordion-up 0.2s ease-out",
//       },
//       // colors: {
//       // 'primary': '#E26E62',
//       // 'secondary': '#DCBD7B',
//       // 'tertiary': '#6E9D57',
//       // 'primary-light': '#F1DEDF',
//       // 'primary-dark': '#A4666B',
//       // 'secondary-light': '#FFEECA',
//       // 'secondary-dark': '#A38849',
//       // 'tertiary-light': '#A4AE9E',
//       // 'tertiary-dark': '#40493B',
//       // 'light': '#FFFFFF',
//       // 'dark': '#333944',
//       // 'violet': '#4543A5',
//       // 'light-violet': '#AFA4DA',
//       // 'dark-violet': '#00085C',
//       // 'aqua': '#89BDCA',
//       // 'light-aqua': '#BFFAFF',
//       // 'dark-aqua': '#548894',
//       // 'gold': '#F8AC45',
//       // 'grey': '#BEBFBF',
//       // 'light-grey': '#F1F4F9',
//       // 'dark-grey': '#4A5363',
//       // 'background-light': '#FFFAEF'
//       // }
//     },
//   },
//   plugins: [require("tailwindcss-animate")],
// }
