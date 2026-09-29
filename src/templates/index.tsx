import type React from "react";
import type { TemplateName } from "../video/schema";
import { BarChart } from "./BarChart";
import { CaptionedShort } from "./CaptionedShort";
import { Comparison } from "./Comparison";
import { EndCard } from "./EndCard";
import { Footage } from "./Footage";
import { KineticText } from "./KineticText";
import { LineChart } from "./LineChart";
import { LogoReveal } from "./LogoReveal";
import { LowerThird } from "./LowerThird";
import { MapRoute } from "./MapRoute";
import { MetricCard } from "./MetricCard";
import { QuoteCard } from "./QuoteCard";
import { TitleCard } from "./TitleCard";

/** Template name (as used in video.json) → component. */
export const TEMPLATES: Record<TemplateName, React.FC<never>> = {
  TitleCard,
  KineticText,
  LowerThird,
  QuoteCard,
  MetricCard,
  BarChart,
  CaptionedShort,
  LogoReveal,
  Footage,
  LineChart,
  Comparison,
  EndCard,
  MapRoute,
};
