import localFont from "next/font/local";

export const codec = localFont({
    src: "../public/fonts/codec-500.ttf",
    variable: "--font-codec",
    display: "swap",
});

export const codecLight = localFont({
    src: "../public/fonts/codec-300.ttf",
    variable: "--font-codecLight",
    display: "swap",
});

export const codecBold = localFont({
    src: "../public/fonts/codec-600.ttf",
    variable: "--font-codecBold",
    display: "swap",
});