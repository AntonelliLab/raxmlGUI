import '@mui/material/styles';

type SectionPaletteColor = {
  background: string;
  border: string;
  lighter: string;
  light: string;
  main: string;
  dark: string;
  darker: string;
  secondaryText: string;
  contrastText: string;
  shadow: string;
};

declare module '@mui/material/styles' {
  interface Palette {
    model: SectionPaletteColor;
    input: SectionPaletteColor;
    output: SectionPaletteColor;
    raxml: SectionPaletteColor;
    console: SectionPaletteColor;
    status: SectionPaletteColor;
  }
  interface PaletteOptions {
    model?: SectionPaletteColor;
    input?: SectionPaletteColor;
    output?: SectionPaletteColor;
    raxml?: SectionPaletteColor;
    console?: SectionPaletteColor;
    status?: SectionPaletteColor;
  }
  interface PaletteColor {
    background?: string;
    border?: string;
    lighter?: string;
    darker?: string;
    secondaryText?: string;
    shadow?: string;
  }
  interface SimplePaletteColorOptions {
    background?: string;
    border?: string;
    lighter?: string;
    darker?: string;
    secondaryText?: string;
    shadow?: string;
  }
  interface TypographyVariantsOptions {
    useNextVariants?: boolean;
  }
}
