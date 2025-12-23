/**
 * Lazy-loaded chart components
 * Reduces initial bundle by ~372KB by loading recharts only when needed
 */

import { lazy, Suspense } from 'react';
import type { ComponentProps, ComponentType } from 'react';

// Lazy load recharts components with type assertions to satisfy React.lazy requirements
// Recharts components are valid React components but need explicit type casting via unknown
const LazyRadialBarChart = lazy(() =>
  import('recharts').then((mod) => ({ default: mod.RadialBarChart as unknown as ComponentType<any> }))
);
const LazyRadialBar = lazy(() =>
  import('recharts').then((mod) => ({ default: mod.RadialBar as unknown as ComponentType<any> }))
);
const LazyPolarAngleAxis = lazy(() =>
  import('recharts').then((mod) => ({ default: mod.PolarAngleAxis as unknown as ComponentType<any> }))
);
const LazyResponsiveContainer = lazy(() =>
  import('recharts').then((mod) => ({ default: mod.ResponsiveContainer as unknown as ComponentType<any> }))
);
const LazyPieChart = lazy(() =>
  import('recharts').then((mod) => ({ default: mod.PieChart as unknown as ComponentType<any> }))
);
const LazyPie = lazy(() =>
  import('recharts').then((mod) => ({ default: mod.Pie as unknown as ComponentType<any> }))
);
const LazyCell = lazy(() =>
  import('recharts').then((mod) => ({ default: mod.Cell as unknown as ComponentType<any> }))
);

// Loading fallback component
function ChartLoading({ height = 200 }: { height?: number }) {
  return (
    <div
      className="flex items-center justify-center bg-gray-50 rounded-lg animate-pulse"
      style={{ height }}
    >
      <div className="text-gray-400 text-sm">Loading chart...</div>
    </div>
  );
}

// Wrapped components with Suspense
export function ResponsiveContainer(
  props: ComponentProps<typeof LazyResponsiveContainer>
) {
  return (
    <Suspense fallback={<ChartLoading height={Number(props.height) || 200} />}>
      <LazyResponsiveContainer {...props} />
    </Suspense>
  );
}

export function RadialBarChart(
  props: ComponentProps<typeof LazyRadialBarChart>
) {
  return (
    <Suspense fallback={null}>
      <LazyRadialBarChart {...props} />
    </Suspense>
  );
}

export function RadialBar(props: ComponentProps<typeof LazyRadialBar>) {
  return (
    <Suspense fallback={null}>
      <LazyRadialBar {...props} />
    </Suspense>
  );
}

export function PolarAngleAxis(
  props: ComponentProps<typeof LazyPolarAngleAxis>
) {
  return (
    <Suspense fallback={null}>
      <LazyPolarAngleAxis {...props} />
    </Suspense>
  );
}

export function PieChart(props: ComponentProps<typeof LazyPieChart>) {
  return (
    <Suspense fallback={null}>
      <LazyPieChart {...props} />
    </Suspense>
  );
}

export function Pie(props: ComponentProps<typeof LazyPie>) {
  return (
    <Suspense fallback={null}>
      <LazyPie {...props} />
    </Suspense>
  );
}

export function Cell(props: ComponentProps<typeof LazyCell>) {
  return (
    <Suspense fallback={null}>
      <LazyCell {...props} />
    </Suspense>
  );
}
