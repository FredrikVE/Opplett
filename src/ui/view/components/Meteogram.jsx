import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

/* ================= THEME ================= */

const COLORS = {
  tempPositive: '#dd4141',
  tempNegative: '#0078ff',
  rainExpected: '#5DADE2',
  rainPossible: '#AED6F1',
  zebraBand: 'rgba(248,249,250,0.8)'
};

const THEME = {
  text: '#111',
  textMuted: '#666',
  axis: '#111',
  gridMuted: '#ddd',
  zeroLine: '#ccc',

  font: {
    small: '10px',
    normal: '11px',
    strong: 'bold'
  },

  axisLineWidth: 1.5,
  tickWidth: 1,

  tooltip: {
    bg: 'rgba(255,255,255,0.95)',
    radius: 10
  }
};

/* ================= HELPERS ================= */

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

/* ================= COMPONENT ================= */

export default function Meteogram({ hourlyData, timezone }) {
  if (!hourlyData?.length) return null;

  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const formatLocal = (ts, options) =>
    new Date(ts).toLocaleString('nb-NO', { ...options, timeZone: tz });

  const firstTimestamp = Date.parse(hourlyData[0].timeISO);
  const lastTimestamp = Date.parse(hourlyData.at(-1).timeISO);

  const tempData = hourlyData.map(h => [Date.parse(h.timeISO), h.temp]);
  const rainExpected = hourlyData.map(h => [
    Date.parse(h.timeISO),
    h.precipitation.amount
  ]);
  const rainExtra = hourlyData.map(h => {
    const max = h.precipitation.maxAmount || h.precipitation.amount;
    return [Date.parse(h.timeISO), Math.max(max - h.precipitation.amount, 0)];
  });

  /* ===== Finn lokale midnatter ===== */

  const localMidnightPositions = hourlyData
    .filter(h =>
      parseInt(
        formatLocal(Date.parse(h.timeISO), { hour: 'numeric', hour12: false })
      ) === 0
    )
    .map(h => Date.parse(h.timeISO));

  /* ===== Dag-intervaller (grunnlag for zebra + labels) ===== */

  const boundaries = [firstTimestamp, ...localMidnightPositions, lastTimestamp];

  const dayBands = [];

  for (let i = 0; i < boundaries.length - 1; i++) {
    const from = boundaries[i];
    const to = boundaries[i + 1];

    dayBands.push({
      from,
      to,
      mid: from + (to - from) / 2
    });
  }

  const zebraBands = dayBands
    .filter((_, i) => i % 2 === 1)
    .map(d => ({
      from: d.from,
      to: d.to,
      color: COLORS.zebraBand,
      zIndex: 0
    }));

  /* ================= OPTIONS ================= */

  const options = {
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
        lineColor: THEME.axis,
        lineWidth: THEME.axisLineWidth,
        tickWidth: THEME.tickWidth,
        tickColor: THEME.axis,
        gridLineWidth: 0,
        plotBands: zebraBands,
        labels: {
          style: {
            color: THEME.textMuted,
            fontSize: THEME.font.normal,
            fontWeight: THEME.font.strong
          },
          formatter() {
            const hour = parseInt(
              formatLocal(this.value, { hour: 'numeric', hour12: false })
            );
            return hour === 0 ? '' : hour;
          }
        }
      },
      {
        linkedTo: 0,
        type: 'datetime',
        tickPositions: dayBands.map(d => d.mid),
        lineColor: 'transparent',
        tickWidth: 0,
        labels: {
          align: 'center',
          y: 28,
          style: {
            color: THEME.text,
            fontSize: '12px',
            fontWeight: THEME.font.strong
          },
          formatter() {
            const band = dayBands.find(
              d => this.value >= d.from && this.value <= d.to
            );

            if (!band) return '';

            return formatLocal(band.from, {
              weekday: 'short',
              day: 'numeric',
              month: 'short'
            });
          }
        }
      }
    ],

    yAxis: [
      {
        title: { text: null },
        lineColor: THEME.axis,
        lineWidth: THEME.axisLineWidth,
        tickWidth: THEME.tickWidth,
        tickColor: THEME.axis,
        gridLineWidth: 0,
        labels: {
          format: '{value}°',
          style: {
            color: THEME.textMuted,
            fontWeight: THEME.font.strong
          }
        },
        plotLines: [
          {
            value: 0,
            color: THEME.zeroLine,
            width: 1,
            dashStyle: 'Dash'
          },
          ...localMidnightPositions.map(pos => ({
            value: pos,
            color: THEME.gridMuted,
            width: 1
          }))
        ]
      },
      {
        opposite: true,
        min: 0,
        title: { text: null },
        lineColor: THEME.axis,
        lineWidth: THEME.axisLineWidth,
        tickWidth: THEME.tickWidth,
        tickColor: THEME.axis,
        gridLineWidth: 0,
        labels: {
          format: '{value} mm',
          style: {
            color: THEME.textMuted,
            fontSize: THEME.font.small,
            fontWeight: THEME.font.strong
          }
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
      {
        name: 'Temperatur',
        type: 'areaspline',
        data: tempData,
        zIndex: 3
      },
      {
        name: 'Nedbør',
        type: 'column',
        data: rainExpected,
        yAxis: 1,
        color: COLORS.rainExpected,
        zIndex: 2
      },
      {
        name: 'Mulig ekstra',
        type: 'column',
        data: rainExtra,
        yAxis: 1,
        color: COLORS.rainPossible,
        zIndex: 1
      }
    ],

    tooltip: {
      shared: true,
      useHTML: true,
      backgroundColor: THEME.tooltip.bg,
      borderRadius: THEME.tooltip.radius,
      shadow: false,
      formatter() {
        const dateStr = formatLocal(this.x, {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        });

        return `
          <div style="font-size:12px;color:#333">
            <div style="font-weight:600;margin-bottom:6px">${dateStr}</div>
            ${this.points
              .map(
                p => `
              <div style="display:flex;gap:6px;align-items:center">
                <span style="width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
                ${p.series.name}: <b>${p.y.toFixed(1)}${
                  p.series.name === 'Temperatur' ? '°C' : ' mm'
                }</b>
              </div>`
              )
              .join('')}
          </div>
        `;
      }
    },

    legend: {
      verticalAlign: 'top',
      itemStyle: {
        color: THEME.text,
        fontWeight: THEME.font.strong
      }
    }
  };

  return (
    <div
      style={{
        padding: '16px 20px 24px',
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
      }}
    >
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}
