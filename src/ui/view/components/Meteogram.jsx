import { useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const COLORS = {
  tempPositive: '#dd4141',
  tempNegative: '#0078ff',
  rainExpected: '#5DADE2',
  rainPossible: '#AED6F1',
  zebraBand: 'rgba(248,249,250,0.8)',
  text: '#111',
  textMuted: '#666'
};

const getTempZones = () => [
  {
    value: 0,
    color: COLORS.tempNegative,
    fillColor: {
      linearGradient: { x1: 0, y1: 1, x2: 0, y2: 0 },
      stops: [[0, 'rgba(0,120,255,0)'], [1, 'rgba(0,120,255,0.3)']]
    }
  },
  {
    color: COLORS.tempPositive,
    fillColor: {
      linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
      stops: [[0, 'rgba(221,65,65,0.3)'], [1, 'rgba(221,65,65,0)']]
    }
  }
];

export default function Meteogram({ hourlyData, timezone }) {
  const options = useMemo(() => {
    if (!hourlyData?.length) return null;

    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Hjelper for å formatere tid i riktig tidssone
    const formatLocal = (ts, options) =>
      new Date(ts).toLocaleString('nb-NO', { ...options, timeZone: tz });

    const firstTimestamp = Date.parse(hourlyData[0].timeISO);
    const lastTimestamp = Date.parse(hourlyData.at(-1).timeISO);

    const tempData = [];
    const rainExpected = [];
    const rainExtra = [];
    const localMidnightPositions = [];

    hourlyData.forEach((h) => {
      const time = Date.parse(h.timeISO);
      const hour = parseInt(formatLocal(time, { hour: 'numeric', hour12: false }));

      if (hour === 0) localMidnightPositions.push(time);

      tempData.push([time, h.temp]);
      rainExpected.push([time, h.precipitation.amount]);
      const max = h.precipitation.maxAmount || h.precipitation.amount;
      rainExtra.push([time, Math.max(max - h.precipitation.amount, 0)]);
    });

    /* ===== Beregn intervaller for dager (viktig for zebra + labels) ===== */
    const boundaries = [firstTimestamp, ...localMidnightPositions, lastTimestamp];
    const dayBands = [];

    for (let i = 0; i < boundaries.length - 1; i++) {
      const from = boundaries[i];
      const to = boundaries[i + 1];
      // Vi lager et objekt for hvert døgn-segment i grafen
      dayBands.push({
        from,
        to,
        mid: from + (to - from) / 2
      });
    }

    // Lag zebra-striper (annenhver dag)
    const zebraBands = dayBands
      .filter((_, i) => i % 2 === 1)
      .map(d => ({
        from: d.from,
        to: d.to,
        color: COLORS.zebraBand,
        zIndex: 0
      }));

    return {
      chart: { 
        height: 380, 
        backgroundColor: 'transparent', 
        spacingBottom: 40,
        style: { fontFamily: 'inherit' }
      },
      time: { useUTC: true }, 
      title: { text: null },
      credits: { enabled: false },

      xAxis: [
        {
          type: 'datetime',
          min: firstTimestamp,
          max: lastTimestamp,
          tickInterval: 6 * 3600 * 1000,
          lineColor: COLORS.text,
          lineWidth: 1.5,
          tickColor: COLORS.text,
          plotBands: zebraBands,
          labels: {
            style: { color: COLORS.textMuted, fontWeight: 'bold', fontSize: '11px' },
            formatter() {
              const hour = parseInt(formatLocal(this.value, { hour: 'numeric', hour12: false }));
              // Skjul "0" på time-aksen siden dagsnavnet står under
              return hour === 0 ? '' : hour;
            }
          }
        },
        {
          linkedTo: 0,
          type: 'datetime',
          lineWidth: 0,
          tickWidth: 0,
          // Plasserer dagsnavn nøyaktig i midten av hver dag-bolk
          tickPositions: dayBands.map(d => d.mid),
          labels: {
            align: 'center', 
            y: 28,
            style: { color: COLORS.text, fontWeight: 'bold', fontSize: '12px' },
            formatter() {
              const band = dayBands.find(d => this.value >= d.from && this.value <= d.to);
              if (!band) return '';
              return formatLocal(band.from, { weekday: 'short', day: 'numeric', month: 'short' });
            }
          }
        }
      ],

      yAxis: [
        {
          title: { text: null },
          gridLineWidth: 0,
          lineColor: COLORS.text,
          lineWidth: 1.5,
          labels: { 
            format: '{value}°', 
            style: { color: COLORS.textMuted, fontWeight: 'bold' } 
          },
          plotLines: [
            { value: 0, color: '#ccc', dashStyle: 'Dash', width: 1 },
            // Vertikale linjer ved midnatt
            ...localMidnightPositions.map(pos => ({ 
              value: pos, 
              color: '#ddd', 
              width: 1, 
              zIndex: 1 
            }))
          ]
        },
        {
          title: { text: null },
          opposite: true,
          min: 0,
          gridLineWidth: 0,
          lineColor: COLORS.text,
          lineWidth: 1.5,
          labels: { 
            format: '{value} mm', 
            style: { color: COLORS.textMuted, fontSize: '10px', fontWeight: 'bold' } 
          }
        }
      ],

      plotOptions: {
        areaspline: {
          marker: { enabled: false },
          lineWidth: 2.5,
          threshold: null,
          zones: getTempZones()
        },
        column: { 
          stacking: 'normal', 
          borderWidth: 0, 
          borderRadius: 3, 
          pointRange: 3600 * 1000,
          groupPadding: 0.1
        }
      },

      series: [
        { name: 'Temperatur', type: 'areaspline', data: tempData, zIndex: 3 },
        { name: 'Nedbør', type: 'column', data: rainExpected, yAxis: 1, color: COLORS.rainExpected, zIndex: 2 },
        { name: 'Mulig ekstra', type: 'column', data: rainExtra, yAxis: 1, color: COLORS.rainPossible, zIndex: 1 }
      ],

      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 10,
        shadow: false,
        formatter() {
          const dateStr = formatLocal(this.x, { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'short', 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          
          let s = `<div style="font-size:12px;color:#333">
                     <div style="font-weight:600;margin-bottom:6px">${dateStr}</div>`;
          
          this.points.forEach(p => {
            s += `<div style="display:flex;gap:6px;align-items:center">
                    <span style="width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
                    ${p.series.name}: <b>${p.y.toFixed(1)}${p.series.name === 'Temperatur' ? '°C' : ' mm'}</b>
                  </div>`;
          });
          return s + '</div>';
        }
      },

      legend: { 
        verticalAlign: 'top', 
        itemStyle: { color: COLORS.text, fontWeight: 'bold' } 
      }
    };
  }, [hourlyData, timezone]);

  if (!options) return null;

  return (
    <div style={{ 
      padding: '16px 20px 24px', 
      background: '#fff', 
      borderRadius: 16, 
      boxShadow: '0 8px 24px rgba(0,0,0,0.08)' 
    }}>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}