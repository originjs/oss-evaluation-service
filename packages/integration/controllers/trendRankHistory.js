import { logger, sequelize } from '@orginjs/oss-evaluation-data-model';
import dayjs from 'dayjs';

const DATE_TYPE = {
  YEAR: 1,
  MONTH: 2,
  WEEK: 3,
};

const DATA_TYPE = {
  STAR: 1,
  CONTRIBUTOR: 2,
  ECOLOGY: 3,
  QUALITY: 4,
};

const RANK_TYPE = {
  INCREASED: {
    VALUE: 1,
    ORDER_CRITERIA: `increased_value desc, total_value desc`,
  },
  TOTAL: {
    VALUE: 2,
    ORDER_CRITERIA: `total_value desc, increased_value desc`,
  },
};

async function isValidDateFormat(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(dateString);
}

export async function storeTrendRankHistoryHandler(req, res) {
  const { dateType, date } = req.query;
  logger.info(dateType);
  logger.info(date);
  await storeTrendRankHistory(dateType, date);
  res.status(200).send('success');
}

export async function storeTrendRankHistory(dateType, date = '') {
  logger.info('Store Trend Rank History');
  const specifiedDate = (await isValidDateFormat(date)) ? dayjs(date) : dayjs();
  let selectedDate;
  if (dateType == DATE_TYPE.YEAR) {
    selectedDate = specifiedDate.startOf('year').toDate();
  } else if (dateType == DATE_TYPE.MONTH) {
    selectedDate = specifiedDate.startOf('month').toDate();
  } else if (dateType == DATE_TYPE.WEEK) {
    selectedDate = specifiedDate.startOf('week').toDate();
  } else {
    logger.info('Invalid dateType');
    return;
  }
  for (const dataType of [DATA_TYPE.STAR, DATA_TYPE.CONTRIBUTOR]) {
    for (const rankType of [RANK_TYPE.INCREASED, RANK_TYPE.TOTAL]) {
      await getRankData(dataType, dateType, selectedDate, rankType);
    }
  }
  if (dateType == DATA_TYPE.WEEK) {
    return;
  }
  for (const dataType of [DATA_TYPE.ECOLOGY, DATA_TYPE.QUALITY]) {
    for (const rankType of [RANK_TYPE.INCREASED, RANK_TYPE.TOTAL]) {
      await getRankData(dataType, dateType, selectedDate, rankType);
    }
  }
}

async function getRankData(dataType, dateType, selectedDate, rankType) {
  const rankTypeValue = rankType.VALUE;
  const orderCriteria = rankType.ORDER_CRITERIA;
  const QUERY_SQL = `insert into trend_rank_history(p_id, data_type, date_type,
                                                    increased_value, total_value, date, rank_type, \`rank\`)
                     select p_id,
                            data_type,
                            date_type,
                            increased_value,
                            total_value,
                            date,
                            :rankTypeValue,
                            row_number() over () as \`rank\`
                     from trend_history
                     where data_type = :dataType
                       and date_type = :dateType
                       and date = :selectedDate
                     order by ${orderCriteria}
                     on duplicate key update increased_value = VALUES(increased_value),
                                             total_value     = VALUES(total_value),
                                             \`rank\`        = VALUES(\`rank\`)`;
  await sequelize
    .query(QUERY_SQL, {
      replacements: { rankTypeValue, dataType, dateType, selectedDate },
      type: sequelize.QueryTypes.INSERT,
    })
    .catch(err => {
      logger.error('Error occurred:', err);
    });
}
