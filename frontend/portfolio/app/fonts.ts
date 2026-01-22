import localFont from "next/font/local";

export const futura = localFont({
    // src: "../public/fonts/tilda-script-light.otf",
    src: "../public/fonts/tilda-sb.otf",
    // src: "../public/fonts/tilda-light.otf",
    // src: "../public/fonts/futura.ttf",

    variable: "--font-futura",
    display: "swap",
});

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