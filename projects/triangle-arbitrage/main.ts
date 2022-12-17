// https://thegraph.com/hosted-service/subgraph/uniswap/uniswap-v3
// import requests
// import json
// import time
// import func_triangular_arb
import fetch from "node-fetch";
import * as func_triangular_arb from "./func_triangular_arb";

/// RETRIEVE GRAPH QL MID PRICES FOR UNISWAP
async function retrieve_uniswap_information() {
  const res = await fetch("https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
      {
        pools (orderBy: totalValueLockedETH, orderDirection: desc, first:500) 
          {
              id
              totalValueLockedETH
              token0Price
              token1Price
              feeTier
              token0 {id symbol name decimals}
              token1 {id symbol name decimals}
          }
      }`,
    }),
  });
  const json_dict = await res.json();
  return json_dict;
}

// if __name__ == "__main__":

//     while True:

//         pairs = retrieve_uniswap_information()["data"]["pools"]
//         structured_pairs = func_triangular_arb.structure_trading_pairs(pairs, limit=500)

//         # Get surface rates
//         surface_rates_list = []
//         for t_pair in structured_pairs:
//             surface_rate = func_triangular_arb.calc_triangular_arb_surface_rate(t_pair, min_rate=1.5)
//             if len(surface_rate) > 0:
//                 surface_rates_list.append(surface_rate)

//         # Save to JSON file
//         if len(surface_rates_list) > 0:
//             with open("uniswap_surface_rates.json", "w") as fp:
//                 json.dump(surface_rates_list, fp)
//                 print("File saved.")

//         time.sleep(60)

async function main() {
  const pairs = (await retrieve_uniswap_information())["data"]["pools"];
  const structured_pairs = func_triangular_arb.structure_trading_pairs(pairs, 500);

  // Get surface rates
  const surface_rates_list = [];
  for (const t_pair of structured_pairs) {
    const min_rate = 1.5;
    const surface_rate = func_triangular_arb.calc_triangular_arb_surface_rate(t_pair, min_rate);
    if (surface_rate?.swap1) {
      surface_rates_list.push(surface_rate);
    }
  }
  console.log("run", surface_rates_list[0]);
  setTimeout(main, 5000);
}

// run the bot
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
