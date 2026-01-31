"use client";

import { type FairnessScore, type MetricType } from "@/lib/fairness-types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Star,
  Phone,
  Sun,
  Clock,
  Moon,
  Popcorn,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface FairnessScoreCardsProps {
  metrics: Record<MetricType, FairnessScore>;
}

const METRIC_CONFIG: Record<
  MetricType,
  { label: string; icon: React.ElementType; description: string }
> = {
  weekend_days: {
    label: "Weekend Days",
    icon: CalendarDays,
    description: "Weekend shifts worked",
  },
  holidays: {
    label: "Holidays",
    icon: Star,
    description: "Holiday assignments",
  },
  on_call: {
    label: "On-Call",
    icon: Phone,
    description: "On-call assignments",
  },
  early_shifts: {
    label: "Early Shifts",
    icon: Sun,
    description: "Morning shifts",
  },
  mid_shifts: {
    label: "Mid Shifts",
    icon: Clock,
    description: "Midday shifts",
  },
  late_shifts: {
    label: "Late Shifts",
    icon: Moon,
    description: "Evening shifts",
  },
  popcorn_days: {
    label: "Popcorn Days",
    icon: Popcorn,
    description: "Popcorn day rewards",
  },
};

// Only show key metrics in cards
const KEY_METRICS: MetricType[] = [
  "weekend_days",
  "holidays",
  "on_call",
  "popcorn_days",
];

export function FairnessScoreCards({ metrics }: FairnessScoreCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {KEY_METRICS.map((metricType) => {
        const config = METRIC_CONFIG[metricType];
        const score = metrics[metricType];
        const Icon = config.icon;

        return (
          <Card key={metricType}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{config.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {config.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold">{score.range}</p>
                  <p className="text-xs text-muted-foreground">Range (max-min)</p>
                </div>

                {score.isBalanced ? (
                  <Badge
                    variant="secondary"
                    className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Balanced
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Review
                  </Badge>
                )}
              </div>

              <div className="mt-3 pt-3 border-t text-xs text-muted-foreground flex justify-between">
                <span>
                  Min: {score.min} / Max: {score.max}
                </span>
                <span>Avg: {score.average.toFixed(1)}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
