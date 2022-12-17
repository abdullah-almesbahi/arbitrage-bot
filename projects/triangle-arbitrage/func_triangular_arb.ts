// Structure trading pair groups
export function structure_trading_pairs(pairs, limit) {
  const triangular_pairs_list = [];
  const remove_duplicates_list = [];
  const pairs_list = pairs.slice(0, limit);

  // Loop through each coin to find potential matches
  for (const pair_a of pairs_list) {
    // Get first pair (A)
    const a_base = pair_a["token0"]["symbol"];
    const a_quote = pair_a["token1"]["symbol"];
    const a_pair = a_base + "_" + a_quote;
    const a_token_0_id = pair_a["token0"]["id"];
    const a_token_1_id = pair_a["token1"]["id"];
    const a_contract = pair_a["id"];
    const a_token_0_decimals = pair_a["token0"]["decimals"];
    const a_token_1_decimals = pair_a["token1"]["decimals"];
    const a_token_0_price = pair_a["token0Price"];
    const a_token_1_price = pair_a["token1Price"];

    // Put (A) into box for checking at (B)
    const a_pair_box = [a_base, a_quote];

    // Get second pair (B)
    for (const pair_b of pairs_list) {
      const b_base = pair_b["token0"]["symbol"];
      const b_quote = pair_b["token1"]["symbol"];
      const b_pair = b_base + "_" + b_quote;
      const b_token_0_id = pair_b["token0"]["id"];
      const b_token_1_id = pair_b["token1"]["id"];
      const b_contract = pair_b["id"];
      const b_token_0_decimals = pair_b["token0"]["decimals"];
      const b_token_1_decimals = pair_b["token1"]["decimals"];
      const b_token_0_price = pair_b["token0Price"];
      const b_token_1_price = pair_b["token1Price"];

      // Get third pair (C)
      if (a_pair != b_pair) {
        if (a_pair_box.includes(b_base) || a_pair_box.includes(b_quote))
          // Get third pair (C)
          for (const pair_c of pairs_list) {
            const c_base = pair_c["token0"]["symbol"];
            const c_quote = pair_c["token1"]["symbol"];
            const c_pair = c_base + "_" + c_quote;
            const c_token_0_id = pair_c["token0"]["id"];
            const c_token_1_id = pair_c["token1"]["id"];
            const c_contract = pair_c["id"];
            const c_token_0_decimals = pair_c["token0"]["decimals"];
            const c_token_1_decimals = pair_c["token1"]["decimals"];
            const c_token_0_price = pair_c["token0Price"];
            const c_token_1_price = pair_c["token1Price"];

            // Count number of (C) items
            if (c_pair != a_pair && c_pair != b_pair) {
              const combine_all = [a_pair, b_pair, c_pair];
              const pair_box = [a_base, a_quote, b_base, b_quote, c_base, c_quote];

              let counts_c_base = 0;
              for (const i of pair_box) {
                if (i == c_base) {
                  counts_c_base += 1;
                }
              }
              let counts_c_quote = 0;
              for (const i of pair_box) {
                if (i == c_quote) {
                  counts_c_quote += 1;
                }
              }
              if (counts_c_base == 2 && counts_c_quote == 2 && c_base != c_quote) {
                const combined = a_pair + "," + b_pair + "," + c_pair;
                // const unique_string = ''.join(sorted(combined))
                // const unique_string = combined.sort().join(' ')
                const unique_string = combined;

                // Output pair
                if (!remove_duplicates_list.includes(unique_string)) {
                  const output_dict = {
                    aPair: a_pair,
                    aBase: a_base,
                    aQuote: a_quote,
                    bPair: b_pair,
                    bBase: b_base,
                    bQuote: b_quote,
                    cPair: c_pair,
                    cBase: c_base,
                    cQuote: c_quote,
                    combined: combined,
                    aToken0Id: a_token_0_id,
                    bToken0Id: b_token_0_id,
                    cToken0Id: c_token_0_id,
                    aToken1Id: a_token_1_id,
                    bToken1Id: b_token_1_id,
                    cToken1Id: c_token_1_id,
                    aContract: a_contract,
                    bContract: b_contract,
                    cContract: c_contract,
                    aToken0Decimals: a_token_0_decimals,
                    aToken1Decimals: a_token_1_decimals,
                    bToken0Decimals: b_token_0_decimals,
                    bToken1Decimals: b_token_1_decimals,
                    cToken0Decimals: c_token_0_decimals,
                    cToken1Decimals: c_token_1_decimals,
                    aToken0Price: a_token_0_price,
                    aToken1Price: a_token_1_price,
                    bToken0Price: b_token_0_price,
                    bToken1Price: b_token_1_price,
                    cToken0Price: c_token_0_price,
                    cToken1Price: c_token_1_price,
                  };
                  triangular_pairs_list.push(output_dict);
                  remove_duplicates_list.push(unique_string);
                }
              }
            }
          }
      }
    }
  }
  return triangular_pairs_list;
}

//  Calculate Surface Arb Potential
export function calc_triangular_arb_surface_rate(t_pair, min_rate) {
  // Set variables
  const min_surface_rate = min_rate;
  const surface_dict = {};
  let pool_contract_2 = "";
  let pool_contract_3 = "";
  let pool_direction_trade_1 = "";
  let pool_direction_trade_2 = "";
  let pool_direction_trade_3 = "";

  // Calculate looping through forward and reverse rates
  const direction_list = ["forward", "reverse"];
  for (const direction of direction_list) {
    // Set pair info
    const a_base = t_pair["aBase"];
    const a_quote = t_pair["aQuote"];
    const b_base = t_pair["bBase"];
    const b_quote = t_pair["bQuote"];
    const c_base = t_pair["cBase"];
    const c_quote = t_pair["cQuote"];

    // Set price info
    const a_token_0_price = parseFloat(t_pair["aToken0Price"]);
    const a_token_1_price = parseFloat(t_pair["aToken1Price"]);
    const b_token_0_price = parseFloat(t_pair["bToken0Price"]);
    const b_token_1_price = parseFloat(t_pair["bToken1Price"]);
    const c_token_0_price = parseFloat(t_pair["cToken0Price"]);
    const c_token_1_price = parseFloat(t_pair["cToken1Price"]);

    // Set address info
    const a_contract = t_pair["aContract"];
    const b_contract = t_pair["bContract"];
    const c_contract = t_pair["cContract"];

    // Set variables
    const starting_amount = 1;
    let acquired_coin_t2 = 0;
    let acquired_coin_t3 = 0;
    let calculated = 0;

    let swap_1 = 0;
    let swap_2 = 0;
    let swap_3 = 0;
    let swap_1_rate = 0;
    let swap_2_rate = 0;
    let swap_3_rate = 0;

    // Assume start with aBase if forward
    if (direction == "forward") {
      swap_1 = a_base;
      swap_2 = a_quote;
      swap_1_rate = a_token_1_price;
      pool_direction_trade_1 = "baseToQuote";
    }
    // Assume start with aQuote if forward
    if (direction == "reverse") {
      swap_1 = a_quote;
      swap_2 = a_base;
      swap_1_rate = a_token_0_price;
      pool_direction_trade_1 = "quoteToBase";
    }
    // Place first trade
    let pool_contract_1 = a_contract;
    let acquired_coin_t1 = starting_amount * swap_1_rate;

    // Forward: check if aQuote (acquired coin) matches bQuote //////////
    if (direction == "forward") {
      if (a_quote == b_quote || calculated == 0) {
        swap_2_rate = b_token_0_price;
        acquired_coin_t2 = acquired_coin_t1 * swap_2_rate;
        pool_direction_trade_2 = "quoteToBase";
        pool_contract_2 = b_contract;

        // Forward: check if bBase (acquired coin) matches cBase
        if (b_base == c_base) {
          swap_3 = c_base;
          swap_3_rate = c_token_1_price;
          pool_direction_trade_3 = "baseToQuote";
          pool_contract_3 = c_contract;
        }
        // Forward: check if bBase (acquired coin) matches cQuote
        if (b_base == c_quote) {
          swap_3 = c_quote;
          swap_3_rate = c_token_0_price;
          pool_direction_trade_3 = "quoteToBase";
          pool_contract_3 = c_contract;
        }
        acquired_coin_t3 = acquired_coin_t2 * swap_3_rate;
        calculated = 1;
      }
    }
    // Forward: check if aQuote (acquired coin) matches bBase //////////
    if (direction == "forward") {
      if (a_quote == b_base || calculated == 0) {
        swap_2_rate = b_token_1_price;
        acquired_coin_t2 = acquired_coin_t1 * swap_2_rate;
        pool_direction_trade_2 = "baseToQuote";
        pool_contract_2 = b_contract;

        // Forward: check if bBase (acquired coin) matches cBase
        if (b_quote == c_base) {
          swap_3 = c_base;
          swap_3_rate = c_token_1_price;
          pool_direction_trade_3 = "baseToQuote";
          pool_contract_3 = c_contract;
        }
        // Forward: check if bBase (acquired coin) matches cQuote
        if (b_quote == c_quote) {
          swap_3 = c_quote;
          swap_3_rate = c_token_0_price;
          pool_direction_trade_3 = "quoteToBase";
          pool_contract_3 = c_contract;
        }
        acquired_coin_t3 = acquired_coin_t2 * swap_3_rate;
        calculated = 1;
      }
    }
    // Forward: check if aQuote (acquired coin) matches cQuote //////////
    if (direction == "forward") {
      if (a_quote == c_quote || calculated == 0) {
        swap_2_rate = c_token_0_price;
        acquired_coin_t2 = acquired_coin_t1 * swap_2_rate;
        pool_direction_trade_2 = "quoteToBase";
        pool_contract_2 = c_contract;

        // Forward: check if cBase (acquired coin) matches bBase
        if (c_base == b_base) {
          swap_3 = b_base;
          swap_3_rate = b_token_1_price;
          pool_direction_trade_3 = "baseToQuote";
          pool_contract_3 = b_contract;
        }
        // Forward: check if cBase (acquired coin) matches bQuote
        if (c_base == b_quote) {
          swap_3 = b_quote;
          swap_3_rate = b_token_0_price;
          pool_direction_trade_3 = "quoteToBase";
          pool_contract_3 = b_contract;
        }
        acquired_coin_t3 = acquired_coin_t2 * swap_3_rate;
        calculated = 1;
      }
    }
    // Forward: check if aQuote (acquired coin) matches cBase //////////
    if (direction == "forward") {
      if (a_quote == c_base || calculated == 0) {
        swap_2_rate = c_token_1_price;
        acquired_coin_t2 = acquired_coin_t1 * swap_2_rate;
        pool_direction_trade_2 = "baseToQuote";
        pool_contract_2 = c_contract;

        // Forward: check if cQuote (acquired coin) matches bBase
        if (c_quote == b_base) {
          swap_3 = b_base;
          swap_3_rate = b_token_1_price;
          pool_direction_trade_3 = "baseToQuote";
          pool_contract_3 = b_contract;
        }
        // Forward: check if cQuote (acquired coin) matches bQuote
        if (c_quote == b_quote) {
          swap_3 = b_quote;
          swap_3_rate = b_token_0_price;
          pool_direction_trade_3 = "quoteToBase";
          pool_contract_3 = b_contract;
        }
        acquired_coin_t3 = acquired_coin_t2 * swap_3_rate;
        calculated = 1;
      }
    }
    // Reverse: check if aBase (acquired coin) matches bBase //////////
    if (direction == "reverse") {
      if (a_base == b_base || calculated == 0) {
        swap_2_rate = b_token_1_price;
        acquired_coin_t2 = acquired_coin_t1 * swap_2_rate;
        pool_direction_trade_2 = "baseToQuote";
        pool_contract_2 = b_contract;

        // Forward: check if bQuote (acquired coin) matches cQuote
        if (b_quote == c_quote) {
          swap_3 = c_quote;
          swap_3_rate = c_token_0_price;
          pool_direction_trade_3 = "quoteToBase";
          pool_contract_3 = c_contract;
        }

        // Forward: check if bQuote (acquired coin) matches cBase
        if (b_quote == c_base) {
          swap_3 = c_base;
          swap_3_rate = c_token_1_price;
          pool_direction_trade_3 = "baseToQuote";
          pool_contract_3 = c_contract;
        }
        acquired_coin_t3 = acquired_coin_t2 * swap_3_rate;
        calculated = 1;
      }
    }
    // Reverse: check if aBase (acquired coin) matches bQuote //////////
    if (direction == "reverse") {
      if (a_base == b_quote || calculated == 0) {
        swap_2_rate = b_token_0_price;
        acquired_coin_t2 = acquired_coin_t1 * swap_2_rate;
        pool_direction_trade_2 = "quoteToBase";
        pool_contract_2 = b_contract;

        // Forward: check if bBase (acquired coin) matches cQuote
        if (b_base == c_quote) {
          swap_3 = c_quote;
          swap_3_rate = c_token_0_price;
          pool_direction_trade_3 = "quoteToBase";
          pool_contract_3 = c_contract;
        }
        // Forward: check if bBase (acquired coin) matches cBase
        if (b_base == c_base) {
          swap_3 = c_base;
          swap_3_rate = c_token_1_price;
          pool_direction_trade_3 = "baseToQuote";
          pool_contract_3 = c_contract;
        }
        acquired_coin_t3 = acquired_coin_t2 * swap_3_rate;
        calculated = 1;
      }
    }
    // Reverse: check if aBase (acquired coin) matches cBase //////////
    if (direction == "reverse") {
      if (a_base == c_base || calculated == 0) {
        swap_2_rate = c_token_1_price;
        acquired_coin_t2 = acquired_coin_t1 * swap_2_rate;
        pool_direction_trade_2 = "baseToQuote";
        pool_contract_2 = c_contract;

        // Forward: check if cQuote (acquired coin) matches bQuote
        if (c_quote == b_quote) {
          swap_3 = b_quote;
          swap_3_rate = b_token_0_price;
          pool_direction_trade_3 = "quoteToBase";
          pool_contract_3 = b_contract;
        }

        // Forward: check if cQuote (acquired coin) matches bBase
        if (c_quote == b_base) {
          swap_3 = b_base;
          swap_3_rate = b_token_1_price;
          pool_direction_trade_3 = "baseToQuote";
          pool_contract_3 = b_contract;
        }

        acquired_coin_t3 = acquired_coin_t2 * swap_3_rate;
        calculated = 1;
      }
    }
    // Reverse: check if aBase (acquired coin) matches cQuote //////////
    if (direction == "reverse") {
      if (a_base == c_quote || calculated == 0) {
        swap_2_rate = c_token_0_price;
        acquired_coin_t2 = acquired_coin_t1 * swap_2_rate;
        pool_direction_trade_2 = "quoteToBase";
        pool_contract_2 = c_contract;

        // Forward: check if cBase (acquired coin) matches bQuote
        if (c_base == b_quote) {
          swap_3 = b_quote;
          swap_3_rate = b_token_0_price;
          pool_direction_trade_3 = "quoteToBase";
          pool_contract_3 = b_contract;
        }
        // Forward: check if cBase (acquired coin) matches bBase
        if (c_base == b_base) {
          swap_3 = b_base;
          swap_3_rate = b_token_1_price;
          pool_direction_trade_3 = "baseToQuote";
          pool_contract_3 = b_contract;
        }
        acquired_coin_t3 = acquired_coin_t2 * swap_3_rate;
        calculated = 1;
      }
    }
    // Calculate arbitrage results
    const profit_loss = acquired_coin_t3 - starting_amount;
    const profit_loss_perc = profit_loss != 0 ? (profit_loss / starting_amount) * 100 : 0;

    // Format Description
    const trade_description_1 = `Start with ${swap_1} of ${starting_amount}. Swap at ${swap_1_rate} for ${swap_2} acquiring ${acquired_coin_t1}.`;
    const trade_description_2 = `Swap ${acquired_coin_t1} of ${swap_2} at ${swap_2_rate} for ${swap_3} acquiring ${acquired_coin_t2}.`;
    const trade_description_3 = `Swap ${acquired_coin_t2} of ${swap_3} at ${swap_3_rate} for ${swap_1} acquiring ${acquired_coin_t3}.`;

    // Filter for significant opportunity size
    if (profit_loss_perc >= min_surface_rate) {
      // Construct Output
      const surface_dict = {
        swap1: swap_1,
        swap2: swap_2,
        swap3: swap_3,
        poolContract1: pool_contract_1,
        poolContract2: pool_contract_2,
        poolContract3: pool_contract_3,
        poolDirectionTrade1: pool_direction_trade_1,
        poolDirectionTrade2: pool_direction_trade_2,
        poolDirectionTrade3: pool_direction_trade_3,
        startingAmount: starting_amount,
        acquiredCoinT1: acquired_coin_t1,
        acquiredCoinT2: acquired_coin_t2,
        acquiredCoinT3: acquired_coin_t3,
        swap1Rate: swap_1_rate,
        swap2Rate: swap_2_rate,
        swap3Rate: swap_3_rate,
        profitLoss: profit_loss,
        profitLossPerc: profit_loss_perc,
        direction: direction,
        tradeDesc1: trade_description_1,
        tradeDesc2: trade_description_2,
        tradeDesc3: trade_description_3,
      };
      return surface_dict;
    }
  }
  return surface_dict;
}
