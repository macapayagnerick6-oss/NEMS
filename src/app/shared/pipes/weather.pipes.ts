import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'temp' })
export class TempPipe implements PipeTransform {
  transform(value: number): string {
    return `${Math.round(value)}°C`;
  }
}

@Pipe({ name: 'windSpeed' })
export class WindSpeedPipe implements PipeTransform {
  transform(value: number): string {
    return `${Math.round(value)} km/h`;
  }
}

@Pipe({ name: 'rainChance' })
export class RainChancePipe implements PipeTransform {
  transform(value: number): string {
    return `${Math.round(value)}%`;
  }
}

@Pipe({ name: 'hourLabel' })
export class HourLabelPipe implements PipeTransform {
  transform(isoTime: string): string {
    return new Date(isoTime).toLocaleTimeString('en-PH', {
      hour: 'numeric',
      hour12: true,
    });
  }
}

@Pipe({ name: 'dayLabel' })
export class DayLabelPipe implements PipeTransform {
  transform(isoDate: string): string {
    return new Date(isoDate + 'T12:00:00').toLocaleDateString('en-PH', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }
}

@Pipe({ name: 'fullDateLabel' })
export class FullDateLabelPipe implements PipeTransform {
  transform(isoDate: string): string {
    return new Date(isoDate + 'T12:00:00').toLocaleDateString('en-PH', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }
}
