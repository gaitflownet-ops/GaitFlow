/**
 * Holt-Winters Triple Exponential Smoothing Implementation
 * 
 * This module provides the predictive intelligence layer for GateFlow.
 * It's used across multiple modules: Price Forecasting, Gestation Probability,
 * Health Risk Index, Feed Demand, and Financial Revenue/Expense projections.
 */

export interface HWDataPoint {
  date: Date;
  value: number;
}

export interface HWForecast {
  level: number;
  trend: number;
  seasonal: number;
  forecast: number;
}

export interface HWOptions {
  alpha: number; // Data smoothing factor (0-1)
  beta: number;  // Trend smoothing factor (0-1)
  gamma: number; // Seasonal smoothing factor (0-1)
  seasonLength: number; // Number of periods in a season
  m?: number; // Number of periods to forecast ahead (default 1)
}

/**
 * Calculates Holt-Winters Triple Exponential Smoothing
 * 
 * @param series - Array of numerical data points (must be at least 2 complete seasons)
 * @param options - HW configuration options
 * @returns Array of forecasted values extending `m` periods into the future
 */
export function calculateHoltWinters(series: number[], options: HWOptions): number[] {
  const { alpha, beta, gamma, seasonLength, m = 1 } = options;
  const n = series.length;

  if (n < seasonLength * 2) {
    throw new Error("Holt-Winters requires at least two full seasons of data for accurate baseline calculation.");
  }

  // Initialize arrays
  const level: number[] = new Array(n).fill(0);
  const trend: number[] = new Array(n).fill(0);
  const seasonal: number[] = new Array(n).fill(0);
  const forecast: number[] = new Array(n + m).fill(0);

  // 1. Initial Trend Calculation (average of trends across the first season)
  let initialTrend = 0;
  for (let i = 0; i < seasonLength; i++) {
    initialTrend += (series[i + seasonLength] - series[i]) / seasonLength;
  }
  initialTrend /= seasonLength;
  trend[seasonLength - 1] = initialTrend;

  // 2. Initial Seasonal Calculation
  // Calculate average of first season
  let firstSeasonAvg = 0;
  for (let i = 0; i < seasonLength; i++) {
    firstSeasonAvg += series[i];
  }
  firstSeasonAvg /= seasonLength;

  for (let i = 0; i < seasonLength; i++) {
    seasonal[i] = series[i] - firstSeasonAvg; // Additive seasonality
  }

  // 3. Initial Level
  level[seasonLength - 1] = series[seasonLength - 1] - seasonal[seasonLength - 1];

  // 4. Main Smoothing Loop
  for (let i = seasonLength; i < n; i++) {
    const prevLevel = level[i - 1];
    const prevTrend = trend[i - 1];
    const prevSeasonal = seasonal[i - seasonLength];

    // Level update: alpha * (actual - seasonal) + (1 - alpha) * (prevLevel + prevTrend)
    level[i] = alpha * (series[i] - prevSeasonal) + (1 - alpha) * (prevLevel + prevTrend);

    // Trend update: beta * (currentLevel - prevLevel) + (1 - beta) * prevTrend
    trend[i] = beta * (level[i] - prevLevel) + (1 - beta) * prevTrend;

    // Seasonal update: gamma * (actual - currentLevel) + (1 - gamma) * prevSeasonal
    seasonal[i] = gamma * (series[i] - level[i]) + (1 - gamma) * prevSeasonal;

    // In-sample forecast for current point
    forecast[i] = level[i - 1] + trend[i - 1] + seasonal[i - seasonLength];
  }

  // 5. Out-of-sample Forecasting (m periods ahead)
  const lastLevel = level[n - 1];
  const lastTrend = trend[n - 1];

  const futureForecasts: number[] = [];
  for (let i = 1; i <= m; i++) {
    // Wrap around the seasonal component index
    const seasonalIndex = (n - 1) - seasonLength + 1 + ((i - 1) % seasonLength);
    const predictedValue = lastLevel + (i * lastTrend) + seasonal[seasonalIndex];
    futureForecasts.push(Math.max(0, predictedValue)); // Clamp to 0 to prevent negative predictions in real-world contexts
  }

  return futureForecasts;
}

// --- Specific Application Wrappers ---

/**
 * HW-1: Marketplace Price Trend Forecasting
 * Analyzes past sales data to recommend optimal listing windows.
 */
export function forecastMarketPrice(historicalPrices: number[], periodsAhead: number = 3): number[] {
  // Assuming monthly data points with annual seasonality (12 months)
  return calculateHoltWinters(historicalPrices, {
    alpha: 0.3, // Medium adaptation to recent prices
    beta: 0.1,  // Slow trend change
    gamma: 0.6, // High sensitivity to seasonality (Ocala Show Season peaks)
    seasonLength: 12,
    m: periodsAhead,
  });
}

/**
 * HW-2: Reproductive Success Probability
 * Analyzes a mare's cycle history to predict probability of conception.
 */
export function calculateGestationProbability(historicalSuccessRates: number[]): number {
  try {
    const forecast = calculateHoltWinters(historicalSuccessRates, {
      alpha: 0.5,
      beta: 0.2,
      gamma: 0.5,
      seasonLength: 4, // Quarterly cycles or breeding seasons
      m: 1,
    });
    // Convert numerical forecast to a 0-100 probability score
    return Math.min(100, Math.max(0, forecast[0] * 100));
  } catch (e) {
    return 65; // Default baseline if not enough data
  }
}

/**
 * HW-3: Seasonal Health Risk Forecasting
 * Returns a risk index (0-10) for specific conditions (e.g., respiratory, parasites).
 */
export function forecastHealthRiskIndex(historicalIncidents: number[]): number {
  try {
    const forecast = calculateHoltWinters(historicalIncidents, {
      alpha: 0.4,
      beta: 0.1,
      gamma: 0.8, // Very high seasonal weight (weather-dependent conditions)
      seasonLength: 12, // Monthly incidents
      m: 1,
    });
    return Math.min(10, Math.max(0, forecast[0]));
  } catch (e) {
    return 3.5; // Baseline risk
  }
}

/**
 * HW-4: Feed Consumption Demand
 * Forecasts feed requirement based on stable population and seasonal activity.
 */
export function forecastFeedDemand(historicalConsumption: number[], periodsAhead: number = 3): number[] {
  return calculateHoltWinters(historicalConsumption, {
    alpha: 0.5,
    beta: 0.3,
    gamma: 0.4,
    seasonLength: 12,
    m: periodsAhead,
  });
}

/**
 * HW-5: Financial Forecast (Revenue & Expenses)
 */
export function forecastFinancials(historicalData: number[], periodsAhead: number = 6): number[] {
  return calculateHoltWinters(historicalData, {
    alpha: 0.4,
    beta: 0.2,
    gamma: 0.7, // Show seasons heavily impact boarding and service revenue
    seasonLength: 12,
    m: periodsAhead,
  });
}
