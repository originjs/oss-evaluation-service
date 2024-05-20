const cn = [
  {
    id: "01_run1k",
    label: "create rows",
    description: "creating 1,000 rows. (5 warmup runs).",
    type: 0,
  },
  {
    id: "02_replace1k",
    label: "replace all rows",
    description: "updating all 1,000 rows. (5 warmup runs).",
    type: 0,
  },
  {
    id: "03_update10th1k_x16",
    label: "partial update",
    description:
      "updating every 10th row for 1,000 row. (3 warmup runs). 4 x CPU slowdown.",
    type: 0,
  },
  {
    id: "04_select1k",
    label: "select row",
    description:
      "highlighting a selected row. (5 warmup runs). 4 x CPU slowdown.",
    type: 0,
  },
  {
    id: "05_swap1k",
    label: "swap rows",
    description:
      "swap 2 rows for table with 1,000 rows. (5 warmup runs). 4 x CPU slowdown.",
    type: 0,
  },
  {
    id: "06_remove-one-1k",
    label: "remove row",
    description: "removing one row. (5 warmup runs). 2 x CPU slowdown.",
    type: 0,
  },
  {
    id: "07_create10k",
    label: "create many rows",
    description: "creating 10,000 rows. (5 warmup runs).",
    type: 0,
  },
  {
    id: "08_create1k-after1k_x2",
    label: "append rows to large table",
    description: "appending 1,000 to a table of 1,000 rows. (5 warmup runs).",
    type: 0,
  },
  {
    id: "09_clear1k_x8",
    label: "clear rows",
    description:
      "clearing a table with 1,000 rows. (5 warmup runs). 4 x CPU slowdown.",
    type: 0,
  },
  {
    id: "21_ready-memory",
    label: "ready memory",
    description: "Memory usage after page load.",
    type: 1,
  },
  {
    id: "22_run-memory",
    label: "run memory",
    description: "Memory usage after adding 1,000 rows.",
    type: 1,
  },
  {
    id: "23_update5-memory",
    label: "update every 10th row for 1k rows (5 cycles)",
    description: "Memory usage after clicking update every 10th row 5 times",
    type: 1,
  },
  {
    id: "25_run-clear-memory",
    label: "creating/clearing 1k rows (5 cycles)",
    description: "Memory usage after creating and clearing 1000 rows 5 times",
    type: 1,
  },
  {
    id: "26_run-10k-memory",
    label: "run memory 10k",
    description: "Memory usage after adding 10,000 rows.",
    type: 1,
  },
  {
    id: "41_size-uncompressed",
    label: "uncompressed size",
    description:
      "uncompressed size of all implementation files (excluding /css and http headers)",
    type: 5,
  },
  {
    id: "42_size-compressed",
    label: "compressed size",
    description:
      "brotli compressed size of all implementation files (excluding /css and http headers)",
    type: 5,
  },
  {
    id: "43_first-paint",
    label: "first paint",
    description: "first paint",
    type: 5,
  },
];

export {cn};