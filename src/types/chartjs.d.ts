declare module 'react-chartjs-2' {
  import * as React from 'react';
  export const Line: React.ComponentType<any>;
  export const Bar: React.ComponentType<any>;
  export const Pie: React.ComponentType<any>;
}

declare module 'chart.js/auto' {
  const ChartJS: any;
  export default ChartJS;
}

declare module 'chartjs-plugin-datalabels' {
  const plugin: any;
  export default plugin;
}


