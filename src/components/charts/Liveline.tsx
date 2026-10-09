import { t } from '@/lib/i18n';
// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
import type { LivelineProps, Momentum, DegenOptions } from './types';
import { resolveTheme, resolveSeriesPalettes, SERIES_COLORS } from './theme';
import { useLivelineEngine } from './useLivelineEngine';
const defaultFormatValue = (v: number) => v.toFixed(2);
const defaultFormatTime = (t: number) => {
  const d = new Date(t * 1000);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  const s = d.getSeconds().toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};
export const Liveline = createComponent<LivelineProps>("Liveline", ["data", "value", "series", "theme", "color", "window", "grid", "badge", "momentum", "fill", "scrub", "loading", "paused", "emptyText", "exaggerate", "degen", "badgeTail", "badgeVariant", "showValue", "valueMomentumColor", "windows", "onWindowChange", "windowStyle", "tooltipY", "tooltipOutline", "orderbook", "referenceLine", "formatValue", "formatTime", "lerpSpeed", "padding", "onHover", "cursor", "pulse", "mode", "candles", "candleWidth", "liveCandle", "lineMode", "lineData", "lineValue", "onModeChange", "onSeriesToggle", "seriesToggleCompact", "lineWidth", "className", "style"], (__props, __slots) => {
  const data = computed(() => __props.data);
  const value = computed(() => __props.value);
  const seriesProp = computed(() => __props.series);
  const theme = computed(() => __props.theme === undefined ? 'dark' : __props.theme);
  const color = computed(() => __props.color === undefined ? '#3b82f6' : __props.color);
  const windowSecs = computed(() => __props.window === undefined ? 30 : __props.window);
  const grid = computed(() => __props.grid === undefined ? true : __props.grid);
  const badge = computed(() => __props.badge === undefined ? true : __props.badge);
  const momentum = computed(() => __props.momentum === undefined ? true : __props.momentum);
  const fill = computed(() => __props.fill === undefined ? true : __props.fill);
  const scrub = computed(() => __props.scrub === undefined ? true : __props.scrub);
  const loading = computed(() => __props.loading === undefined ? false : __props.loading);
  const paused = computed(() => __props.paused === undefined ? false : __props.paused);
  const emptyText = computed(() => __props.emptyText ?? t("common.noDataToDisplay"));
  const exaggerate = computed(() => __props.exaggerate === undefined ? false : __props.exaggerate);
  const degenProp = computed(() => __props.degen);
  const badgeTail = computed(() => __props.badgeTail === undefined ? true : __props.badgeTail);
  const badgeVariant = computed(() => __props.badgeVariant === undefined ? 'default' : __props.badgeVariant);
  const showValue = computed(() => __props.showValue === undefined ? false : __props.showValue);
  const valueMomentumColor = computed(() => __props.valueMomentumColor === undefined ? false : __props.valueMomentumColor);
  const windows = computed(() => __props.windows);
  const onWindowChange = computed(() => __props.onWindowChange);
  const windowStyle = computed(() => __props.windowStyle);
  const tooltipY = computed(() => __props.tooltipY === undefined ? 14 : __props.tooltipY);
  const tooltipOutline = computed(() => __props.tooltipOutline === undefined ? true : __props.tooltipOutline);
  const orderbook = computed(() => __props.orderbook);
  const referenceLine = computed(() => __props.referenceLine);
  const formatValue = computed(() => __props.formatValue === undefined ? defaultFormatValue : __props.formatValue);
  const formatTime = computed(() => __props.formatTime === undefined ? defaultFormatTime : __props.formatTime);
  const lerpSpeed = computed(() => __props.lerpSpeed === undefined ? 0.08 : __props.lerpSpeed);
  const paddingOverride = computed(() => __props.padding);
  const onHover = computed(() => __props.onHover);
  const cursor = computed(() => __props.cursor === undefined ? 'crosshair' : __props.cursor);
  const pulse = computed(() => __props.pulse === undefined ? true : __props.pulse);
  const mode = computed(() => __props.mode === undefined ? 'line' : __props.mode);
  const candles = computed(() => __props.candles);
  const candleWidth = computed(() => __props.candleWidth);
  const liveCandle = computed(() => __props.liveCandle);
  const lineMode = computed(() => __props.lineMode);
  const lineData = computed(() => __props.lineData);
  const lineValue = computed(() => __props.lineValue);
  const onModeChange = computed(() => __props.onModeChange);
  const onSeriesToggle = computed(() => __props.onSeriesToggle);
  const seriesToggleCompact = computed(() => __props.seriesToggleCompact === undefined ? false : __props.seriesToggleCompact);
  const lineWidth = computed(() => __props.lineWidth);
  const className = computed(() => __props.className);
  const style = computed(() => __props.style);
  const canvasRef = templateRef<HTMLCanvasElement>(null);
  const containerRef = templateRef<HTMLDivElement>(null);
  const valueDisplayRef = templateRef<HTMLSpanElement>(null);
  const windowBarRef = templateRef<HTMLDivElement>(null);
  const windowBtnRefs = templateRef<Map<number, HTMLButtonElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = createState<{
    left: number;
    width: number;
  } | null>(null);
  const modeBarRef = templateRef<HTMLDivElement>(null);
  const modeBtnRefs = templateRef<Map<string, HTMLButtonElement>>(new Map());
  const [modeIndicatorStyle, setModeIndicatorStyle] = createState<{
    left: number;
    width: number;
  } | null>(null);
  const [hiddenSeries, setHiddenSeries] = createState<Set<string>>(new Set());
  const lastSeriesPropRef = templateRef(seriesProp.value);
  watchLifecycle(() => { if (seriesProp.value?.length) lastSeriesPropRef.value = seriesProp.value; }, () => [seriesProp.value]);
  const palette = computed(() => {
    const p = resolveTheme(color.value, theme.value);
    if (lineWidth.value != null) p.lineWidth = lineWidth.value;
    return p;
  });
  const isDark = computed(() => theme.value === 'dark');
  const isMultiSeries = computed(() => seriesProp.value != null && seriesProp.value.length > 0);
  const showSeriesToggle = computed(() => (lastSeriesPropRef.value?.length ?? 0) > 1);

  // Per-series palettes (memoized on series ids + colors + theme)
  const seriesPalettes = computed(() => {
    if (!seriesProp.value || seriesProp.value.length === 0) return null;
    return resolveSeriesPalettes(seriesProp.value, theme.value);
  });

  // Normalized multi-series config for the engine
  const multiSeries = computed(() => {
    if (!seriesProp.value || !seriesPalettes.value!) return undefined;
    return seriesProp.value.map((s, i) => ({
      id: s.id,
      data: s.data,
      value: s.value,
      palette: seriesPalettes.value!.get(s.id) ?? resolveTheme(s.color || SERIES_COLORS[i % SERIES_COLORS.length], theme.value),
      label: s.label
    }));
  });

  // Resolve momentum prop: boolean enables auto-detect, string overrides
  const showMomentum = computed(() => momentum.value !== false);
  const momentumOverride: ComputedRef<Momentum | undefined> = computed(() => typeof momentum.value === 'string' ? momentum.value : undefined);
  const defaultRight = computed(() => badge.value ? 80 : grid.value ? 54 : 12);
  const pad = computed(() => ({
    top: paddingOverride.value?.top ?? 12,
    right: paddingOverride.value?.right ?? defaultRight.value,
    bottom: paddingOverride.value?.bottom ?? 28,
    left: paddingOverride.value?.left ?? 12
  }));

  // Degen mode: explicit prop wins
  const degenEnabled = computed(() => degenProp.value != null ? degenProp.value !== false : false);
  const degenOptions: ComputedRef<DegenOptions | undefined> = computed(() => degenEnabled.value ? typeof degenProp.value === 'object' ? degenProp.value : {} : undefined);

  // Window buttons state
  const [activeWindowSecs, setActiveWindowSecs] = createState(windows.value && windows.value.length > 0 ? windows.value[0].secs : windowSecs.value);
  const effectiveWindowSecs = computed(() => windows.value ? activeWindowSecs.value : windowSecs.value);

  // Measure active window button for sliding indicator
  watchLifecycle(() => {
    if (!windows.value || windows.value.length === 0) return;
    const btn = windowBtnRefs.value.get(activeWindowSecs.value);
    const bar = windowBarRef.value;
    if (btn && bar) {
      const barRect = bar.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setIndicatorStyle({
        left: btnRect.left - barRect.left,
        width: btnRect.width
      });
    }
  }, () => [activeWindowSecs.value, windows.value]);

  // Measure active mode button for sliding indicator
  const activeMode = computed(() => lineMode.value ? 'line' : 'candle');
  watchLifecycle(() => {
    if (!onModeChange.value) return;
    const btn = modeBtnRefs.value.get(activeMode.value);
    const bar = modeBarRef.value;
    if (btn && bar) {
      const barRect = bar.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setModeIndicatorStyle({
        left: btnRect.left - barRect.left,
        width: btnRect.width
      });
    }
  }, () => [activeMode.value, onModeChange.value]);

  // Series toggle handler — prevent hiding the last visible series
  const handleSeriesToggle = (id: string) => {
    setHiddenSeries(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        onSeriesToggle.value?.(id, true);
      } else {
        // Count visible series — don't hide last one
        const totalSeries = seriesProp.value?.length ?? 0;
        const visibleCount = totalSeries - next.size;
        if (visibleCount <= 1) return prev;
        next.add(id);
        onSeriesToggle.value?.(id, false);
      }
      return next;
    });
  };
  const ws = computed(() => windowStyle.value ?? 'default');
  useLivelineEngine(canvasRef, containerRef, () => ({
    data: data.value,
    value: value.value,
    palette: palette.value,
    windowSecs: effectiveWindowSecs.value,
    lerpSpeed: lerpSpeed.value,
    showGrid: grid.value,
    showBadge: isMultiSeries.value ? false : badge.value,
    showMomentum: isMultiSeries.value ? false : showMomentum.value,
    momentumOverride: momentumOverride.value,
    showFill: isMultiSeries.value ? false : fill.value,
    referenceLine: referenceLine.value,
    formatValue: formatValue.value,
    formatTime: formatTime.value,
    padding: pad.value,
    onHover: onHover.value,
    showPulse: pulse.value,
    scrub: scrub.value,
    exaggerate: exaggerate.value,
    degenOptions: isMultiSeries.value ? undefined : degenOptions.value,
    badgeTail: badgeTail.value,
    badgeVariant: badgeVariant.value,
    tooltipY: tooltipY.value,
    tooltipOutline: tooltipOutline.value,
    valueMomentumColor: valueMomentumColor.value,
    valueDisplayRef: showValue.value ? valueDisplayRef : undefined,
    orderbookData: orderbook.value,
    loading: loading.value,
    paused: paused.value,
    emptyText: emptyText.value,
    mode: mode.value,
    candles: candles.value,
    candleWidth: candleWidth.value,
    liveCandle: liveCandle.value,
    lineMode: lineMode.value,
    lineData: lineData.value,
    lineValue: lineValue.value,
    multiSeries: multiSeries.value,
    isMultiSeries: isMultiSeries.value,
    hiddenSeriesIds: hiddenSeries.value
  }));
  const cursorStyle = computed(() => scrub.value ? cursor.value : 'default');
  const activeColor = computed(() => isDark.value ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)');
  const inactiveColor = computed(() => isDark.value ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.22)');
  return () => {
    return <>
      {/* Live value display — above the chart */}
      {showValue.value && <span ref={valueDisplayRef} style={cssStyle({
        display: 'block',
        fontSize: 20,
        fontWeight: 500,
        fontFamily: '"SF Mono", Menlo, monospace',
        color: isDark.value ? 'rgba(255,255,255,0.85)' : '#111',
        transition: 'color 0.3s',
        letterSpacing: '-0.01em',
        marginBottom: 8,
        paddingTop: 4,
        paddingLeft: pad.value.left
      })} />}

      {/* Control bars row — window pills + mode toggle + series chips side by side */}
      {(windows.value && windows.value.length > 0 || onModeChange.value || showSeriesToggle.value) && <div style={cssStyle({
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
        marginLeft: pad.value.left
      })}>
          {/* Time window controls */}
          {windows.value && windows.value.length > 0 && <div ref={windowBarRef} style={cssStyle({
          position: 'relative',
          display: 'inline-flex',
          gap: ws.value === 'text' ? 4 : 2,
          background: ws.value === 'text' ? 'transparent' : isDark.value ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          borderRadius: ws.value === 'rounded' ? 999 : 6,
          padding: ws.value === 'text' ? 0 : ws.value === 'rounded' ? 3 : 2
        })}>
              {/* Sliding indicator (default + rounded) */}
              {ws.value !== 'text' && indicatorStyle.value && <div style={cssStyle({
            position: 'absolute',
            top: ws.value === 'rounded' ? 3 : 2,
            left: indicatorStyle.value.left,
            width: indicatorStyle.value.width,
            height: ws.value === 'rounded' ? 'calc(100% - 6px)' : 'calc(100% - 4px)',
            background: isDark.value ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)',
            borderRadius: ws.value === 'rounded' ? 999 : 4,
            transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: 'none' as const
          })} />}
              {windows.value.map(w => {
            const isActive = w.secs === activeWindowSecs.value;
            return <button key={w.secs} ref={(el: any) => {
              if (el) windowBtnRefs.value.set(w.secs, el);else windowBtnRefs.value.delete(w.secs);
            }} onClick={() => {
              setActiveWindowSecs(w.secs);
              onWindowChange.value?.(w.secs);
            }} style={cssStyle({
              position: 'relative',
              zIndex: 1,
              fontSize: 11,
              padding: ws.value === 'text' ? '2px 6px' : '3px 10px',
              borderRadius: ws.value === 'rounded' ? 999 : 4,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: isActive ? 600 : 400,
              background: 'transparent',
              color: isActive ? activeColor.value : inactiveColor.value,
              transition: 'color 0.2s, background 0.15s',
              lineHeight: '16px'
            })}>
                    {w.label}
                  </button>;
          })}
            </div>}

          {/* Mode toggle — separate bar with its own sliding indicator */}
          {onModeChange.value && <div ref={modeBarRef} style={cssStyle({
          position: 'relative',
          display: 'inline-flex',
          gap: ws.value === 'text' ? 4 : 2,
          background: ws.value === 'text' ? 'transparent' : isDark.value ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          borderRadius: ws.value === 'rounded' ? 999 : 6,
          padding: ws.value === 'text' ? 0 : ws.value === 'rounded' ? 3 : 2
        })}>
              {/* Sliding indicator */}
              {ws.value !== 'text' && modeIndicatorStyle.value && <div style={cssStyle({
            position: 'absolute',
            top: ws.value === 'rounded' ? 3 : 2,
            left: modeIndicatorStyle.value.left,
            width: modeIndicatorStyle.value.width,
            height: ws.value === 'rounded' ? 'calc(100% - 6px)' : 'calc(100% - 4px)',
            background: isDark.value ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)',
            borderRadius: ws.value === 'rounded' ? 999 : 4,
            transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: 'none' as const
          })} />}
              {/* Line icon */}
              <button ref={(el: any) => {
            if (el) modeBtnRefs.value.set('line', el);else modeBtnRefs.value.delete('line');
          }} onClick={() => onModeChange.value?.('line')} style={cssStyle({
            position: 'relative',
            zIndex: 1,
            padding: '5px 7px',
            borderRadius: ws.value === 'rounded' ? 999 : 4,
            border: 'none',
            cursor: 'pointer',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center'
          })}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 8.5C2.5 8.5 3 4 5.5 4S7.5 7 8.5 7C9.5 7 10 3.5 11 3.5" stroke={activeMode.value === 'line' ? activeColor.value : inactiveColor.value} stroke-width={activeMode.value === 'line' ? 1.5 : 1.2} stroke-linecap="round" fill="none" />
                </svg>
              </button>
              {/* Candle icon */}
              <button ref={(el: any) => {
            if (el) modeBtnRefs.value.set('candle', el);else modeBtnRefs.value.delete('candle');
          }} onClick={() => onModeChange.value?.('candle')} style={cssStyle({
            position: 'relative',
            zIndex: 1,
            padding: '5px 7px',
            borderRadius: ws.value === 'rounded' ? 999 : 4,
            border: 'none',
            cursor: 'pointer',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center'
          })}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <line x1="3.5" y1="1" x2="3.5" y2="11" stroke={activeMode.value === 'candle' ? activeColor.value : inactiveColor.value} stroke-width="1" />
                  <rect x="2" y="3" width="3" height="5" rx="0.5" fill={activeMode.value === 'candle' ? activeColor.value : inactiveColor.value} />
                  <line x1="8.5" y1="2" x2="8.5" y2="10" stroke={activeMode.value === 'candle' ? activeColor.value : inactiveColor.value} stroke-width="1" />
                  <rect x="7" y="4" width="3" height="4" rx="0.5" fill={activeMode.value === 'candle' ? activeColor.value : inactiveColor.value} />
                </svg>
              </button>
            </div>}

          {/* Series toggle chips */}
          {showSeriesToggle.value && <div style={cssStyle({
          display: 'inline-flex',
          gap: ws.value === 'text' ? 4 : 2,
          background: ws.value === 'text' ? 'transparent' : isDark.value ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          borderRadius: ws.value === 'rounded' ? 999 : 6,
          padding: ws.value === 'text' ? 0 : ws.value === 'rounded' ? 3 : 2,
          opacity: isMultiSeries.value ? 1 : 0,
          transition: 'opacity 0.4s',
          pointerEvents: isMultiSeries.value ? 'auto' : 'none'
        })}>
              {(lastSeriesPropRef.value ?? []).map((s, si) => {
            const isHidden = hiddenSeries.value.has(s.id);
            const seriesColor = s.color || SERIES_COLORS[si % SERIES_COLORS.length];
            return <button key={s.id} onClick={() => handleSeriesToggle(s.id)} style={cssStyle({
              position: 'relative',
              zIndex: 1,
              fontSize: 11,
              padding: seriesToggleCompact.value ? ws.value === 'text' ? '2px 4px' : '5px 7px' : ws.value === 'text' ? '2px 6px' : '3px 8px',
              borderRadius: ws.value === 'rounded' ? 999 : 4,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 500,
              background: isHidden ? 'transparent' : ws.value === 'text' ? 'transparent' : isDark.value ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)',
              color: isHidden ? inactiveColor.value : activeColor.value,
              opacity: isHidden ? 0.4 : 1,
              transition: 'opacity 0.2s, background 0.15s, color 0.2s',
              lineHeight: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: seriesToggleCompact.value ? 0 : 4
            })}>
                    <span style={cssStyle({
                width: seriesToggleCompact.value ? 8 : 6,
                height: seriesToggleCompact.value ? 8 : 6,
                borderRadius: '50%',
                background: seriesColor,
                flexShrink: 0,
                opacity: isHidden ? 0.4 : 1,
                transition: 'opacity 0.2s'
              })} />
                    {!seriesToggleCompact.value && (s.label ?? s.id)}
                  </button>;
          })}
            </div>}
        </div>}

      <div ref={containerRef} class={className.value} style={cssStyle({
        width: '100%',
        height: '100%',
        position: 'relative',
        ...style.value
      })}>
        <canvas ref={canvasRef} style={cssStyle({
          display: 'block',
          cursor: cursorStyle.value
        })} />
      </div>
    </>;
  };
}, { grid: Boolean, badge: Boolean, momentum: [Boolean, String], fill: Boolean, loading: Boolean, paused: Boolean, scrub: Boolean, exaggerate: Boolean, showValue: Boolean, valueMomentumColor: Boolean, degen: [Boolean, Object], badgeTail: Boolean, tooltipOutline: Boolean, pulse: Boolean, lineMode: Boolean, seriesToggleCompact: Boolean });

export type { LivelinePoint, LivelineSeries } from "./types";
