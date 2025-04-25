import { StableSwapPool } from "@/api/sui";

export const MAX_PERCENTAGE = 10_000n;
export const DEFAULT_SLIPPAGE = 25n; // 0.25%

// Define constants and types
const MAX_ITERATIONS = 255; // Maximum iterations for Newton's method

// --- Error Messages (matching Move abort codes) ---
const EInvalidCoinNo = "Number of coins doesn't match pool configuration.";
const ENoConvergence = "Calculation did not converge within MAX_ITERATIONS.";
const EInvalidCoin = "Invalid coin index provided.";

// --- Helper Function for BigInt Absolute Difference ---
function absDiff(d: bigint, d_prev: bigint): bigint {
  return d > d_prev ? d - d_prev : d_prev - d;
}

/**
 * Calculates the StableSwap invariant D.
 * This is a translation of the get_d function from Move.
 * It uses Newton's method to find the root of the StableSwap equation.
 *
 * @param values - Array of current balances for each coin in the pool.
 * @param amp - The amplification parameter for the pool.
 * @param nCoins - The number of coins in the pool.
 * @returns The calculated invariant D as a bigint.
 */
export function get_d(values: bigint[], amp: bigint, nCoins: number): bigint {
  if (values.length !== nCoins) {
    throw new Error(EInvalidCoinNo);
  }

  const nCoins_bigint = BigInt(nCoins);

  // Calculate sum of all values (S)
  let s = 0n; // Use BigInt zero literal '0n'
  for (const balance of values) {
    s += balance;
  }

  // If sum is zero, D is zero
  if (s === 0n) {
    return 0n;
  }

  // Calculate Ann = A * n^n
  const ann = amp * nCoins_bigint ** nCoins_bigint;

  // Initial guess for D using sum of values
  let d = s;
  let d_prev: bigint;

  // Newton's method loop
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    // Calculate D_P = D^(n+1) / (n^n * prod(x_i))
    let d_p = d;
    for (const balance of values) {
      // Avoid division by zero if a balance is 0. The invariant calculation
      // naturally handles this, but explicit check can prevent issues.
      // The Move code checks `balance > 0` inside the loop.
      if (balance > 0n) {
        // Equivalent to: d_p = d_p * d / (balance * n_coins)
        d_p = (d_p * d) / (balance * nCoins_bigint);
      }
    }

    // Store current d value before updating
    d_prev = d;

    // Calculate new D using Newton's formula:
    // d = (Ann * S + D_P * n) * D / ((Ann - 1) * D + (n + 1) * D_P)
    const numerator = (ann * s + d_p * nCoins_bigint) * d;
    const denominator = (ann - 1n) * d + (nCoins_bigint + 1n) * d_p; // Use BigInt '1n'

    // Prevent division by zero
    if (denominator === 0n) {
      // This case should ideally not happen in a well-behaved pool
      // but good to handle defensively.
      throw new Error("Denominator is zero during D calculation.");
    }

    d = numerator / denominator;

    // Check for convergence (difference <= 1)
    if (absDiff(d, d_prev) <= 1n) {
      return d; // Converged
    }
  }

  // If the loop finishes without converging
  throw new Error(ENoConvergence);
}

/**
 * Calculates the expected output amount (y) for a given input amount (dx).
 * This is a translation of the get_y function from Move.
 * It uses Newton's method to solve for the output amount y, keeping D constant.
 *
 * @param i - Index of the input coin.
 * @param j - Index of the output coin.
 * @param dx - Amount of the input coin being added.
 * @param values - Array of current balances for each coin in the pool.
 * @param amp - The amplification parameter for the pool.
 * @param nCoins - The number of coins in the pool.
 * @returns The calculated output amount y for coin j as a bigint.
 */
export function get_y(i: number, j: number, dx: bigint, values: bigint[], amp: bigint, nCoins: number): bigint {
  // Input validation
  if (i === j) {
    throw new Error(EInvalidCoin + " Input and output coins cannot be the same.");
  }
  if (j >= nCoins || i >= nCoins) {
    throw new Error(EInvalidCoin + " Coin index out of bounds.");
  }
  if (values.length !== nCoins) {
    throw new Error(EInvalidCoinNo); // Ensure values array matches nCoins
  }

  const nCoins_bigint = BigInt(nCoins);

  // Get the invariant D for the current balances
  const d = get_d(values, amp, nCoins);

  // If D is zero (empty pool), cannot calculate y
  if (d === 0n) {
    // Or handle as appropriate (e.g., return 0n if dx is also 0n)
    throw new Error("Cannot calculate output for an empty pool (D=0).");
  }

  // Calculate Ann = A * n^n
  const ann = amp * nCoins_bigint ** nCoins_bigint;

  // Initialize variables for Newton's method
  let c = d;
  let s = 0n;

  // Calculate S' (sum of balances excluding j, with dx added to i)
  // Calculate C = D^(n+1) / (n^n * prod' * Ann) where prod' excludes j
  for (let k = 0; k < nCoins; k++) {
    let x_temp: bigint; // To hold the balance of coin k
    if (k === i) {
      x_temp = values[k] + dx;
    } else if (k !== j) {
      x_temp = values[k];
    } else {
      // Skip coin j for S' and C calculation
      continue;
    }

    // Update sum S'
    s += x_temp;

    // Update C term: c = c * d / (x_k * n_coins)
    // Avoid division by zero if a balance is 0.
    if (x_temp === 0n) {
      throw new Error(
        `Balance for coin ${k} (or input coin ${i} after adding dx) is zero, leading to division by zero in C calculation.`,
      );
    }
    c = (c * d) / (x_temp * nCoins_bigint);
  }

  c = (c * d) / (ann * nCoins_bigint);

  // Calculate B = S' + D / Ann
  const b = s + d / ann; // Integer division is intentional

  // Newton's method for finding y
  let y = d; // Initial guess for y
  let y_prev: bigint;

  for (let k = 0; k < MAX_ITERATIONS; k++) {
    y_prev = y;

    // Calculate new y using Newton's formula for Stableswap:
    // y = (y^2 + c) / (2y + b - d)
    const numerator = y * y + c;
    const denominator = 2n * y + b - d;

    // Prevent division by zero
    if (denominator === 0n) {
      // This can happen in extreme scenarios or edge cases
      throw new Error("Denominator is zero during y calculation.");
    }

    y = numerator / denominator;

    // Check for convergence (difference <= 1)
    if (absDiff(y, y_prev) <= 1n) {
      return y; // Converged, return the calculated new balance y
    }
  }

  // If the loop finishes without converging
  throw new Error(ENoConvergence);
}

/**
 * Performs the exchange calculation.
 * This is a translation of the top-level exchange function from Move.
 * It calculates the *expected* new balance of the output coin `j` after adding `dx` of coin `i`.
 * To get the actual amount of coin `j` to be transferred out (`dy`), the caller
 * should calculate `dy = original_balance_j - new_balance_j`.
 *
 * @param i - Index of the input coin.
 * @param j - Index of the output coin.
 * @param dx - Amount of the input coin being added.
 * @param pool - The pool state object containing balances and amp factor.
 * @returns The calculated *new balance* of coin j after the swap, as a bigint.
 */
export function exchange(i: number, j: number, dx: bigint, pool: StableSwapPool): bigint {
  const nCoins = pool.values.length;
  const amp = pool.amp;
  const pool_values = pool.values;

  return get_y(i, j, dx, pool_values, amp, nCoins);
}

export function getOutputAmount(
  inputCoinType: string,
  outputCoinType: string,
  inputAmount: bigint,
  pool: StableSwapPool,
): bigint {
  const i = pool.types.indexOf(inputCoinType);
  const j = pool.types.indexOf(outputCoinType);

  const y_new = exchange(i, j, inputAmount, pool);
  const y_value = pool.values[j];

  return y_value - y_new;
}

export function applySlippage(expectedAmount: bigint, slippageBps: bigint = DEFAULT_SLIPPAGE): bigint {
  if (slippageBps < 0n || slippageBps > MAX_PERCENTAGE) {
    throw new Error("Slippage basis points must be between 0 and 10000");
  }

  const multiplier = MAX_PERCENTAGE - slippageBps;

  return (expectedAmount * multiplier) / MAX_PERCENTAGE;
}
