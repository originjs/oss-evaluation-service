import debug from 'debug';
import resultData2023 from '../metadata/stackoverflow/result2023.js';
import StackOverFlow from '../models/StackOverFlow.js';
import { underscoreToSmallCamelCase } from '../util/string.js';

let resultYear = '2023';

const RESULT_DATA_MAP = {
  2023: resultData2023,
};

export default syncStackOverFlowResultData;

/**
 * Synchronize stackoverflow result data to Database
 */
export async function syncStackOverFlowResultData(req, res) {
  try {
    if (req.body) {
      const { year } = req.body;
      if (year) {
        resultYear = year;
      }
    }
    const msg = await syncFullDetailData();
    res.status(200).send(msg);
  } catch (e) {
    res.status(500).json({ erorr: e.message });
  }
}

async function syncFullDetailData() {
  const resultData = RESULT_DATA_MAP[resultYear];

  // data is empty
  if (!resultData || !Object.keys(resultData).length) {
    const errMsg = 'metadata is empty.';
    debug.log(errMsg);
    return errMsg;
  }

  Object.keys(resultData).forEach(async (technologyStack) => {
    await updateDetailData(JSON.parse(resultData[technologyStack]), technologyStack);
  });

  return 'stackoverflow result data integration success';
}

async function updateDetailData(dataArray, technologyStack) {
  const softwareMap = {};
  dataArray.forEach((data) => {
    const keyName = data.response;
    softwareMap[keyName] = softwareMap[keyName] ? softwareMap[keyName] : {};
    Object.keys(data).forEach((dataKey) => {
      if (dataKey !== 'response') {
        softwareMap[keyName][underscoreToSmallCamelCase(dataKey)] = data[dataKey];
      }
    });
  });
  Object.keys(softwareMap).forEach(async (key) => {
    softwareMap[key].projectName = key;
    softwareMap[key].year = Number(resultYear);
    softwareMap[key].technologyStack = technologyStack;
    await StackOverFlow.upsert(softwareMap[key]).catch((error) => {
      debug.log('upsert error: ', error.message);
    });
  });
}
