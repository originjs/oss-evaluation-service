import { request, gql } from 'graphql-request';
import debug from 'debug';
import { StateOfJs } from '@orginjs/oss-evaluation-data-model';

import { underscoreToSmallCamelCase } from '../util/string.js';

let version = 'js2022';

const GRAPHIQL_API_URL = 'https://api-cached.devographics.com/';

export default syncStateOfJsData;

/**
 * Synchronize state_of_js data to Database
 */
export async function syncStateOfJsData(req, res) {
  try {
    if (req.body) {
      const { year } = req.body;
      if (year) {
        version = `js${year}`;
      }
    }
    const msg = await syncFullDetailData();
    res.status(200).send(msg);
  } catch (e) {
    res.status(500).json({ erorr: e.message });
  }
}

function getQuery() {
  return gql`
    query stateOfJsQuery {
        surveys {
          state_of_js {
            ${version} {
              front_end_frameworks {
                front_end_frameworks_experience: front_end_frameworks_ratios {
                  items {
                    id
                    usage {
                      year
                      rank
                      percentageQuestion
                    }
                    awareness {
                      year
                      rank
                      percentageQuestion
                    }
                    interest {
                      year
                      rank
                      percentageQuestion
                    }
                    satisfaction {
                      year
                      rank
                      percentageQuestion
                    }
                  }
                }
                front_end_frameworks_section: front_end_frameworks_tools {
                  items {
                    id
                    responses {
                      allEditions {
                        year
                        buckets {
                          id
                          percentageQuestion
                          percentageSurvey
                          count
                        }
                      }
                    }
                  }
                }
              }
              rendering_frameworks {
                rendering_frameworks_experience: rendering_frameworks_ratios {
                  items {
                    id
                    usage {
                      year
                      rank
                      percentageQuestion
                    }
                    awareness {
                      year
                      rank
                      percentageQuestion
                    }
                    interest {
                      year
                      rank
                      percentageQuestion
                    }
                    satisfaction {
                      year
                      rank
                      percentageQuestion
                    }
                  }
                }
                rendering_frameworks_section: rendering_frameworks_tools {
                  items {
                    id
                    responses {
                      allEditions {
                        year
                        buckets {
                          id
                          percentageQuestion
                          percentageSurvey
                          count
                        }
                      }
                    }
                  }
                }
              }
              testing {
                testing_experience: testing_ratios {
                  items {
                    id
                    usage {
                      year
                      rank
                      percentageQuestion
                    }
                    awareness {
                      year
                      rank
                      percentageQuestion
                    }
                    interest {
                      year
                      rank
                      percentageQuestion
                    }
                    satisfaction {
                      year
                      rank
                      percentageQuestion
                    }
                  }
                }
                testing_section: testing_tools {
                  items {
                    id
                    responses {
                      allEditions {
                        year
                        buckets {
                          id
                          percentageQuestion
                          percentageSurvey
                          count
                        }
                      }
                    }
                  }
                }
              }
              mobile_desktop {
                mobile_desktop_experience: mobile_desktop_ratios {
                  items {
                    id
                    usage {
                      year
                      rank
                      percentageQuestion
                    }
                    awareness {
                      year
                      rank
                      percentageQuestion
                    }
                    interest {
                      year
                      rank
                      percentageQuestion
                    }
                    satisfaction {
                      year
                      rank
                      percentageQuestion
                    }
                  }
                }
                mobile_desktop_section: mobile_desktop_tools {
                  items {
                    id
                    responses {
                      allEditions {
                        year
                        buckets {
                          id
                          percentageQuestion
                          percentageSurvey
                          count
                        }
                      }
                    }
                  }
                }
              }
              build_tools {
                build_tools_experience: build_tools_ratios {
                  items {
                    id
                    usage {
                      year
                      rank
                      percentageQuestion
                    }
                    awareness {
                      year
                      rank
                      percentageQuestion
                    }
                    interest {
                      year
                      rank
                      percentageQuestion
                    }
                    satisfaction {
                      year
                      rank
                      percentageQuestion
                    }
                  }
                }
                build_tools_section: build_tools_tools {
                  items {
                    id
                    responses {
                      allEditions {
                        year
                        buckets {
                          id
                          percentageQuestion
                          percentageSurvey
                          count
                        }
                      }
                    }
                  }
                }
              }
              monorepo_tools {
                monorepo_tools_experience: monorepo_tools_ratios {
                  items {
                    id
                    usage {
                      year
                      rank
                      percentageQuestion
                    }
                    awareness {
                      year
                      rank
                      percentageQuestion
                    }
                    interest {
                      year
                      rank
                      percentageQuestion
                    }
                    satisfaction {
                      year
                      rank
                      percentageQuestion
                    }
                  }
                }
                monorepo_tools_section: monorepo_tools_tools {
                  items {
                    id
                    responses {
                      allEditions {
                        year
                        buckets {
                          id
                          percentageQuestion
                          percentageSurvey
                          count
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }`;
}

async function syncFullDetailData() {
  // request
  const query = getQuery();
  const res = await request(
    GRAPHIQL_API_URL,
    query,
    {},
  ).catch((error) => {
    debug.log('Post to state_of_js error : ', error.message);
  });

  // data is empty
  if (!res || !Object.keys(res).length) {
    const errMsg = 'response data is empty.';
    debug.log(errMsg);
    return errMsg;
  }

  const surveyResultData = res.surveys?.state_of_js?.[version];
  if (surveyResultData) {
    Object.keys(surveyResultData).forEach(async (technologyStack) => {
      await updateDetailData(surveyResultData[technologyStack][`${technologyStack}_experience`].items, surveyResultData[technologyStack][`${technologyStack}_section`].items, underscoreToSmallCamelCase(technologyStack));
    });
  }

  return 'state_of_js data integration success';
}

async function updateDetailData(experiences, sections, technologyStack) {
  const softwareMap = {};
  experiences.forEach((experience) => {
    experience.usage.forEach((item) => {
      if (item.rank && item.percentageQuestion) {
        const keyName = getSoftwareMapKey(experience.id, item.year);
        softwareMap[keyName] = softwareMap[keyName] ? softwareMap[keyName] : {};
        softwareMap[keyName].usageRank = item.rank;
        softwareMap[keyName].usagePercentage = item.percentageQuestion;
      }
    });
    experience.awareness.forEach((item) => {
      if (item.rank && item.percentageQuestion) {
        const keyName = getSoftwareMapKey(experience.id, item.year);
        softwareMap[keyName] = softwareMap[keyName] ? softwareMap[keyName] : {};
        softwareMap[keyName].awarenessRank = item.rank;
        softwareMap[keyName].awarenessPercentage = item.percentageQuestion;
      }
    });
    experience.interest.forEach((item) => {
      if (item.rank && item.percentageQuestion) {
        const keyName = getSoftwareMapKey(experience.id, item.year);
        softwareMap[keyName] = softwareMap[keyName] ? softwareMap[keyName] : {};
        softwareMap[keyName].interestRank = item.rank;
        softwareMap[keyName].interestPercentage = item.percentageQuestion;
      }
    });
    experience.satisfaction.forEach((item) => {
      if (item.rank && item.percentageQuestion) {
        const keyName = getSoftwareMapKey(experience.id, item.year);
        softwareMap[keyName] = softwareMap[keyName] ? softwareMap[keyName] : {};
        softwareMap[keyName].satisfactionRank = item.rank;
        softwareMap[keyName].satisfactionPercentage = item.percentageQuestion;
      }
    });
  });

  sections.forEach((section) => {
    section.responses.allEditions.forEach((edition) => {
      const keyName = getSoftwareMapKey(section.id, edition.year);
      edition.buckets.forEach((bucket) => {
        softwareMap[keyName] = softwareMap[keyName] ? softwareMap[keyName] : {};
        softwareMap[keyName][`${underscoreToSmallCamelCase(bucket.id)}QuestionPercentage`] = bucket.percentageQuestion;
        softwareMap[keyName][`${underscoreToSmallCamelCase(bucket.id)}SurveyPercentage`] = bucket.percentageSurvey;
        softwareMap[keyName][`${underscoreToSmallCamelCase(bucket.id)}Count`] = bucket.count;
      });
    });
  });
  Object.keys(softwareMap).forEach(async (key) => {
    const [projectName, year] = key.split(',');
    softwareMap[key].projectName = projectName;
    softwareMap[key].year = Number(year);
    softwareMap[key].technologyStack = technologyStack;
    // exclude item whose percent data is null
    if (softwareMap[key].usageRank && softwareMap[key].usagePercentage) {
      await StateOfJs.upsert(softwareMap[key]).catch((error) => {
        debug.log('upsert error: ', error.message);
      });
    }
  });
}

function getSoftwareMapKey(id, year) {
  return `${id},${year}`;
}
