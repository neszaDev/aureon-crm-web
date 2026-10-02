/** Two series over seven months (`CChartLineExample`). */
export const LINE_SERIES = {
  one: [30, 39, 10, 50, 30, 70, 35],
  two: [39, 80, 40, 35, 40, 20, 45],
} as const;

/** Commits per month over a year (`CChartBarExample`). */
export const COMMITS = [40, 20, 12, 39, 10, 40, 39, 80, 40, 20, 12, 11] as const;

/** Share per framework, for the doughnut and pie (`CChartDoughnutExample`, `CChartPieExample`). */
export const FRAMEWORKS = [
  { name: 'Vue.js', value: 40 },
  { name: 'Ember.js', value: 20 },
  { name: 'React', value: 80 },
  { name: 'Angular', value: 10 },
] as const;

/** Hours per activity in two years (`CChartRadarExample`, `CChartPolarAreaExample`). */
export const ACTIVITIES = [
  { id: 'eating', y2019: 65, y2020: 28 },
  { id: 'drinking', y2019: 59, y2020: 48 },
  { id: 'sleeping', y2019: 90, y2020: 40 },
  { id: 'designing', y2019: 81, y2020: 19 },
  { id: 'coding', y2019: 56, y2020: 96 },
  { id: 'cycling', y2019: 55, y2020: 27 },
  { id: 'running', y2019: 40, y2020: 100 },
] as const;
