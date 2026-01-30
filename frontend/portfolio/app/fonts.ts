import localFont from "next/font/local";

export const codec = localFont({
    src: "../public/fonts/codec.ttf",
    weight: "500",
    variable: "--font-codec",
    display: "swap",
});

export const codecLight = localFont({
    src: "../public/fonts/codec.ttf",
    weight: "300",
    variable: "--font-codecLight",
    display: "swap",
});