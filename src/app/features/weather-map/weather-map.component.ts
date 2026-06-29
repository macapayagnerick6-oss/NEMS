import {
  AfterViewInit,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  output,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, first, of } from 'rxjs';
import type { LayerGroup, Map as LeafletMap, Marker } from 'leaflet';

import {
  MAP_CENTER,
  MAP_GRID_MIN_ZOOM,
  MAP_ZOOM,
  MINDANAO_BOUNDS,
  PRESET_LOCATIONS,
} from '../../core/constants/mindanao.config';
import type { Location, MapWeatherPoint } from '../../core/models/weather.models';
import { GeocodingService } from '../../core/services/geocoding.service';
import { WeatherService } from '../../core/services/weather.service';
import {
  conditionEmoji,
  conditionLabel,
  mapMarkerColor,
} from '../../core/utils/weather-code.mapper';

const MAP_TILE_URL =
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const MAP_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
  '&copy; <a href="https://carto.com/attributions">CARTO</a>';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const findNearestPreset = (lat: number, lon: number, maxDegrees = 0.25): Location | null => {
  let nearest: Location | null = null;
  let smallestDistance = maxDegrees;

  for (const preset of PRESET_LOCATIONS) {
    const distance = Math.hypot(preset.latitude - lat, preset.longitude - lon);
    if (distance < smallestDistance) {
      smallestDistance = distance;
      nearest = preset;
    }
  }

  return nearest;
};

const PRESET_EXCLUSION_RADIUS = 0.35;

const isNearPreset = (lat: number, lon: number): boolean =>
  PRESET_LOCATIONS.some(
    (preset) => Math.hypot(preset.latitude - lat, preset.longitude - lon) < PRESET_EXCLUSION_RADIUS,
  );

const findGridPointForPreset = (
  preset: Location,
  points: MapWeatherPoint[],
): MapWeatherPoint | null => {
  let nearest: MapWeatherPoint | null = null;
  let smallestDistance = PRESET_EXCLUSION_RADIUS;

  for (const point of points) {
    const distance = Math.hypot(point.latitude - preset.latitude, point.longitude - preset.longitude);
    if (distance < smallestDistance) {
      smallestDistance = distance;
      nearest = point;
    }
  }

  return nearest;
};

const toFallbackLocation = (lat: number, lon: number): Location => ({
  name: `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`,
  latitude: lat,
  longitude: lon,
  country: 'Philippines',
});

type LeafletNamespace = typeof import('leaflet');

const resolveLeafletModule = (
  loaded: LeafletNamespace & { default?: LeafletNamespace },
): LeafletNamespace => {
  const candidate = loaded.default ?? loaded;
  if (typeof candidate.map !== 'function') {
    throw new Error('Leaflet module did not load correctly');
  }
  return candidate;
};

@Component({
  selector: 'app-weather-map',
  template: `
    <section class="map-section card" aria-label="Regional weather map">
      <div class="map-section__header">
        <div class="map-section__titles">
          <h3 class="section-title section-title--subtle">Regional map</h3>
          <p class="map-section__hint">
            Zoom in and tap any town — the forecast loads right away
          </p>
        </div>
        <button
          type="button"
          class="map-section__fit-btn"
          (click)="handleFitRegion()"
          aria-label="Fit map to Mindanao region"
        >
          Fit region
        </button>
      </div>

      <div class="map-section__frame">
        <div #mapContainer class="map-section__container" role="application" aria-label="Interactive weather map"></div>

        @if (gridLoading()) {
          <div class="map-section__loading" aria-live="polite">
            <span class="map-section__spinner" aria-hidden="true"></span>
            Loading overlay…
          </div>
        }

        @if (resolvingClick()) {
          <div class="map-section__loading" aria-live="polite">
            <span class="map-section__spinner" aria-hidden="true"></span>
            Finding location…
          </div>
        }

        <div class="map-section__legend" aria-label="Map legend">
          <span class="map-section__legend-title">Conditions</span>
          <ul class="map-section__legend-list">
            <li><span class="map-section__swatch map-section__swatch--hot"></span> Hot / sunny</li>
            <li><span class="map-section__swatch map-section__swatch--rain"></span> Rain likely</li>
            <li><span class="map-section__swatch map-section__swatch--storm"></span> Storm</li>
            <li><span class="map-section__swatch map-section__swatch--cloud"></span> Cloudy</li>
          </ul>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      transform: none;
    }

    .map-section {
      padding: 1rem 1.25rem 1.25rem;
    }

    .map-section__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .map-section__titles {
      min-width: 0;
    }

    .map-section__hint {
      margin: 0.25rem 0 0;
      font-size: 0.75rem;
      color: var(--text-muted);
      line-height: 1.4;
    }

    .map-section__fit-btn {
      flex-shrink: 0;
      padding: 0.375rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--surface);
      color: var(--text-secondary);
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }

    .map-section__fit-btn:hover,
    .map-section__fit-btn:focus-visible {
      background: var(--surface-muted);
      border-color: var(--border-strong);
      outline: none;
    }

    .map-section__frame {
      position: relative;
    }

    .map-section__container {
      height: 320px;
      border-radius: var(--radius-md);
      overflow: hidden;
      border: 1px solid var(--border);
      cursor: crosshair;
    }

    @media (min-width: 480px) {
      .map-section__container {
        height: 380px;
      }
    }

    .map-section__loading {
      position: absolute;
      top: 0.75rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.75rem;
      border-radius: 999px;
      background: var(--surface);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
      font-size: 0.75rem;
      color: var(--text-secondary);
      pointer-events: none;
    }

    .map-section__spinner {
      width: 0.875rem;
      height: 0.875rem;
      border: 2px solid var(--accent-soft);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: map-spin 0.7s linear infinite;
    }

    @keyframes map-spin {
      to { transform: rotate(360deg); }
    }

    .map-section__legend {
      position: absolute;
      right: 0.625rem;
      bottom: 0.625rem;
      z-index: 1000;
      padding: 0.5rem 0.625rem;
      border-radius: var(--radius-sm);
      background: var(--surface-glass);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
      backdrop-filter: blur(6px);
      pointer-events: none;
    }

    .map-section__legend-title {
      display: block;
      margin-bottom: 0.25rem;
      font-size: 0.625rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .map-section__legend-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.2rem;
      font-size: 0.6875rem;
      color: var(--text-secondary);
    }

    .map-section__legend-list li {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .map-section__swatch {
      width: 0.625rem;
      height: 0.625rem;
      border-radius: 50%;
      flex-shrink: 0;
      border: 1px solid rgba(15, 23, 42, 0.12);
    }

    .map-section__swatch--hot { background: var(--map-hot); }
    .map-section__swatch--rain { background: var(--map-rain); }
    .map-section__swatch--storm { background: var(--map-storm); }
    .map-section__swatch--cloud { background: var(--map-cloud); }
  `,
})
export class WeatherMapComponent implements AfterViewInit, OnDestroy {
  readonly activeLocation = input<Location | null>(null);
  readonly selectedDate = input<string>(new Date().toISOString().slice(0, 10));
  readonly locationSelect = output<Location>();

  private readonly mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer');
  private readonly weatherService = inject(WeatherService);
  private readonly geocoding = inject(GeocodingService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly gridLoading = signal(false);
  protected readonly resolvingClick = signal(false);

  private map: LeafletMap | null = null;
  private activeMarker: Marker | null = null;
  private gridLayer: LayerGroup | null = null;
  private presetLayer: LayerGroup | null = null;
  private gridPoints: MapWeatherPoint[] = [];
  private markerUpdateId = 0;
  private gridLoadId = 0;
  private clickResolveId = 0;
  private readonly mapReady = signal(false);
  private resizeObserver: ResizeObserver | null = null;
  private leafletModule: LeafletNamespace | null = null;

  constructor() {
    effect(() => {
      if (!this.mapReady()) {
        return;
      }
      void this.updateActiveLocation(this.activeLocation());
    });

    effect(() => {
      const date = this.selectedDate();
      if (!this.mapReady()) {
        return;
      }
      this.loadGrid(date);
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.scheduleMapInit();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.clearActiveMarker();
    this.gridLayer?.clearLayers();
    this.presetLayer?.clearLayers();
    this.map?.remove();
    this.map = null;
  }

  private scheduleMapInit(attempt = 0): void {
    const container = this.mapContainer()?.nativeElement;
    if (container && !this.map) {
      void this.initMap();
      return;
    }

    if (attempt < 12) {
      setTimeout(() => this.scheduleMapInit(attempt + 1), 50);
    }
  }

  private watchMapContainer(container: HTMLElement): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.map?.invalidateSize();
    });
    this.resizeObserver.observe(container);

    let node: HTMLElement | null = container;
    while (node) {
      if (node.classList.contains('nems-enter')) {
        node.addEventListener(
          'animationend',
          () => {
            requestAnimationFrame(() => this.map?.invalidateSize());
          },
          { once: true },
        );
      }
      node = node.parentElement;
    }
  }

  protected handleFitRegion(): void {
    if (!this.map) {
      return;
    }

    const L = this.getLeafletSync();
    if (!L) {
      return;
    }

    const bounds = L.latLngBounds(
      [MINDANAO_BOUNDS.south, MINDANAO_BOUNDS.west],
      [MINDANAO_BOUNDS.north, MINDANAO_BOUNDS.east],
    );
    this.map.flyToBounds(bounds, { padding: [24, 24], duration: 0.8 });
  }

  private getLeafletSync(): LeafletNamespace | null {
    return this.leafletModule;
  }

  private async getLeaflet(): Promise<LeafletNamespace> {
    if (!this.leafletModule) {
      const loaded = await import('leaflet');
      this.leafletModule = resolveLeafletModule(
        loaded as LeafletNamespace & { default?: LeafletNamespace },
      );
    }
    return this.leafletModule;
  }

  private async initMap(): Promise<void> {
    const container = this.mapContainer()?.nativeElement;
    if (!container || this.map) {
      return;
    }

    try {
      const L = await this.getLeaflet();

      const maxBounds = L.latLngBounds(
        [MINDANAO_BOUNDS.south - 0.5, MINDANAO_BOUNDS.west - 0.5],
        [MINDANAO_BOUNDS.north + 0.5, MINDANAO_BOUNDS.east + 0.5],
      );

      this.map = L.map(container, {
        center: MAP_CENTER,
        zoom: MAP_ZOOM,
        scrollWheelZoom: true,
        maxBounds,
        maxBoundsViscosity: 0.85,
        minZoom: 6,
        maxZoom: 14,
      });

      L.tileLayer(MAP_TILE_URL, {
        attribution: MAP_TILE_ATTRIBUTION,
        maxZoom: 19,
      }).addTo(this.map);

      this.gridLayer = L.layerGroup().addTo(this.map);
      this.presetLayer = L.layerGroup().addTo(this.map);

      void this.renderPresetMarkers();

      this.map.on('click', (event) => {
        this.resolveMapClick(event.latlng.lat, event.latlng.lng);
      });

      this.map.on('zoomend', () => {
        this.syncGridVisibility();
      });

      this.watchMapContainer(container);
      this.mapReady.set(true);
      this.refreshMapSize();
    } catch {
      this.leafletModule = null;
      this.map = null;
    }
  }

  private refreshMapSize(): void {
    for (const delay of [0, 100, 400, 900]) {
      setTimeout(() => this.map?.invalidateSize(), delay);
    }
  }

  private loadGrid(date: string): void {
    const loadId = ++this.gridLoadId;
    this.gridLoading.set(true);

    this.weatherService
      .getGridForecast(date)
      .pipe(
        catchError(() => of([] as MapWeatherPoint[])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((points) => {
        if (loadId !== this.gridLoadId) {
          return;
        }

        this.gridLoading.set(false);
        this.gridPoints = points;
        void this.renderGridMarkers(points);
        void this.renderPresetMarkers();
      });
  }

  private syncGridVisibility(): void {
    if (!this.map || !this.gridLayer) {
      return;
    }

    const showGrid = this.map.getZoom() >= MAP_GRID_MIN_ZOOM;
    if (showGrid) {
      this.gridLayer.addTo(this.map);
    } else {
      this.gridLayer.remove();
    }
  }

  private async renderGridMarkers(points: MapWeatherPoint[]): Promise<void> {
    const L = await this.getLeaflet();
    if (!this.map || !this.gridLayer) {
      return;
    }

    this.gridLayer.clearLayers();

    const filteredPoints = points.filter(
      (point) => !isNearPreset(point.latitude, point.longitude),
    );

    for (const point of filteredPoints) {
      const color = mapMarkerColor(point.condition, point.rainProbability, point.temperature);

      const icon = L.divIcon({
        className: 'nems-map-marker',
        html: `<span class="nems-grid-dot" style="--marker-color:${color}" title="${Math.round(point.temperature)}°C"></span>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([point.latitude, point.longitude], {
        icon,
        zIndexOffset: 50,
      });

      marker.bindPopup(this.buildWeatherPopup(point), {
        className: 'nems-map-popup',
        offset: [0, -4],
      });

      marker.on('click', (event) => {
        event.originalEvent?.stopPropagation();
        this.resolveMapClick(point.latitude, point.longitude);
      });

      marker.addTo(this.gridLayer);
    }

    this.syncGridVisibility();
  }

  private async renderPresetMarkers(): Promise<void> {
    const L = await this.getLeaflet();
    if (!this.presetLayer) {
      return;
    }

    this.presetLayer.clearLayers();

    for (const preset of PRESET_LOCATIONS) {
      const gridPoint = findGridPointForPreset(preset, this.gridPoints);
      const temp = gridPoint ? Math.round(gridPoint.temperature) : null;
      const color = gridPoint
        ? mapMarkerColor(gridPoint.condition, gridPoint.rainProbability, gridPoint.temperature)
        : 'var(--accent-dark)';

      const icon = L.divIcon({
        className: 'nems-map-marker',
        html: `<span class="nems-city-marker">
          <span class="nems-city-marker__pin" style="--marker-color:${color}">
            ${temp !== null ? `<span class="nems-city-marker__temp">${temp}°</span>` : ''}
          </span>
          <span class="nems-city-marker__name">${escapeHtml(preset.name)}</span>
        </span>`,
        iconAnchor: [14, 14],
      });

      const marker = L.marker([preset.latitude, preset.longitude], {
        icon,
        zIndexOffset: 200,
      });

      const popupContent = gridPoint
        ? `<strong>${escapeHtml(preset.name)}</strong>` +
          (preset.admin1 ? `<br><span>${escapeHtml(preset.admin1)}</span>` : '') +
          `<div class="nems-popup__temp" style="margin-top:0.375rem">${Math.round(gridPoint.temperature)}°C</div>` +
          `<div class="nems-popup__meta">${conditionEmoji(gridPoint.condition)} ${escapeHtml(conditionLabel(gridPoint.condition))}</div>` +
          `<div class="nems-popup__rain">Rain ${Math.round(gridPoint.rainProbability)}%</div>`
        : `<strong>${escapeHtml(preset.name)}</strong>` +
          (preset.admin1 ? `<br><span>${escapeHtml(preset.admin1)}</span>` : '');

      marker.bindPopup(popupContent, { className: 'nems-map-popup' });

      marker.on('click', (event) => {
        event.originalEvent?.stopPropagation();
        this.locationSelect.emit(preset);
      });

      marker.addTo(this.presetLayer);
    }
  }

  private resolveMapClick(lat: number, lon: number): void {
    const preset = findNearestPreset(lat, lon, 0.08);
    if (preset) {
      this.locationSelect.emit(preset);
      return;
    }

    const clicked = toFallbackLocation(lat, lon);
    this.locationSelect.emit(clicked);

    const resolveId = ++this.clickResolveId;
    this.resolvingClick.set(true);

    this.geocoding
      .reverseGeocode(lat, lon)
      .pipe(
        catchError(() => of(null)),
        first(),
        finalize(() => {
          if (resolveId === this.clickResolveId) {
            this.resolvingClick.set(false);
          }
        }),
      )
      .subscribe((location) => {
        if (resolveId !== this.clickResolveId || !location) {
          return;
        }

        if (location.name !== clicked.name) {
          this.locationSelect.emit(location);
        }
      });
  }

  private buildWeatherPopup(point: MapWeatherPoint): string {
    const emoji = conditionEmoji(point.condition);
    const label = conditionLabel(point.condition);

    return (
      `<div class="nems-popup">
        <div class="nems-popup__temp">${Math.round(point.temperature)}°C</div>
        <div class="nems-popup__meta">${emoji} ${escapeHtml(label)}</div>
        <div class="nems-popup__rain">Rain ${Math.round(point.rainProbability)}%</div>
      </div>`
    );
  }

  private async updateActiveLocation(location: Location | null): Promise<void> {
    const updateId = ++this.markerUpdateId;

    if (!this.map) {
      return;
    }

    const L = await this.getLeaflet();

    if (updateId !== this.markerUpdateId) {
      return;
    }

    this.clearActiveMarker();

    if (!location) {
      return;
    }

    const icon = L.divIcon({
      className: 'nems-map-active',
      html: `<span class="nems-active-marker">
        <span class="nems-active-marker__pulse"></span>
        <span class="nems-active-marker__core"></span>
      </span>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    this.activeMarker = L.marker([location.latitude, location.longitude], {
      icon,
      zIndexOffset: 1000,
      interactive: false,
    })
      .bindPopup(`<strong>${escapeHtml(location.name)}</strong>`, { className: 'nems-map-popup' })
      .addTo(this.map);

    const targetZoom = Math.max(this.map.getZoom(), MAP_GRID_MIN_ZOOM);
    this.activeMarker.openPopup();
    this.map.flyTo([location.latitude, location.longitude], targetZoom, {
      duration: 0.75,
    });
  }

  private clearActiveMarker(): void {
    this.activeMarker?.remove();
    this.activeMarker = null;
  }
}
