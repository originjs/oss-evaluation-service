import { request, gql } from 'graphql-request';
import debug from 'debug';
import StateOfJs from '../models/StateOfJs.js';
import { underscoreToCamelCase } from '../util/string.js'

const query = gql`
query js2022Query {
    surveys {
      state_of_js {
        js2022 {
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

const graphqlApiUrl = 'https://api-cached.devographics.com/';

export default syncStateOfJsData;

/**
 * Synchronize state_of_js data to Database
 */
export async function syncStateOfJsData(req, res) {
    try {
        await syncFullDetailData();
        res.status(200).send('state_of_js data integration success');
    } catch (e) {
        res.status(500).json({ erorr: e.message });
    }
}

async function syncFullDetailData() {
    // request
    const res = await request(
        graphqlApiUrl,
        query,
        {}
    ).catch((error) => {
        debug.log('Post to state_of_js error : ', error.message);
    });

      // data is empty
    if (!res || !Object.keys(res).length) {
        debug.log('response data is empty.');
        return;
    }

    // front_end_frameworks
    const frontendFrameworksData = res.surveys?.state_of_js?.js2022?.front_end_frameworks;
    if (frontendFrameworksData) {
        await updateDetailData(frontendFrameworksData.front_end_frameworks_experience.items, frontendFrameworksData.front_end_frameworks_section.items, 'frontendFrameworks');
    }

    // rendering_frameworks
    const renderingFrameworksData = res.surveys?.state_of_js?.js2022?.rendering_frameworks;
    if (renderingFrameworksData) {
        await updateDetailData(renderingFrameworksData.rendering_frameworks_experience.items, renderingFrameworksData.rendering_frameworks_section.items, 'renderingFrameworks');
    }

    // testing
    const testingData = res.surveys?.state_of_js?.js2022?.testing;
    if (testingData) {
        await updateDetailData(testingData.testing_experience.items, testingData.testing_section.items, 'testing');
    }

    // mobile_desktop
    const mobileDesktopData = res.surveys?.state_of_js?.js2022?.mobile_desktop;
    if (mobileDesktopData) {
        await updateDetailData(mobileDesktopData.mobile_desktop_experience.items, mobileDesktopData.mobile_desktop_section.items, 'mobileDesktop');
    }

    // build_tools
    const buildToolsData = res.surveys?.state_of_js?.js2022?.build_tools;
    if (buildToolsData) {
        await updateDetailData(buildToolsData.build_tools_experience.items, buildToolsData.build_tools_section.items, 'buildTools');
    }

    // monorepo_tools
    const monorepoToolsData = res.surveys?.state_of_js?.js2022?.monorepo_tools;
    if (monorepoToolsData) {
        await updateDetailData(monorepoToolsData.monorepo_tools_experience.items, monorepoToolsData.monorepo_tools_section.items, 'monorepoTools');
    }
}

async function updateDetailData(experiences, sections, technologyStack) {
    const softwareMap = {};
    experiences.forEach(experience => {
        experience.usage.forEach(item => {
            if (item.rank && item.percentageQuestion) {
                const keyName = getSoftwareMapKey(experience.id, item.year);
                softwareMap[keyName] = softwareMap[keyName] ? softwareMap[keyName] : {}
                softwareMap[keyName].usageRank = item.rank;
                softwareMap[keyName].usagePercentage = item.percentageQuestion;
            }
        })
        experience.awareness.forEach(item => {
            if (item.rank && item.percentageQuestion) {
                const keyName = getSoftwareMapKey(experience.id, item.year);
                softwareMap[keyName] = softwareMap[keyName] ? softwareMap[keyName] : {}
                softwareMap[keyName].awarenessRank = item.rank;
                softwareMap[keyName].awarenessPercentage = item.percentageQuestion;
            }
        })
        experience.interest.forEach(item => {
            if (item.rank && item.percentageQuestion) {
                const keyName = getSoftwareMapKey(experience.id, item.year);
                softwareMap[keyName] = softwareMap[keyName] ? softwareMap[keyName] : {}
                softwareMap[keyName].interestRank = item.rank;
                softwareMap[keyName].interestPercentage = item.percentageQuestion;
            }
        })
        experience.satisfaction.forEach(item => {
            if (item.rank && item.percentageQuestion) {
                const keyName = getSoftwareMapKey(experience.id, item.year);
                softwareMap[keyName] = softwareMap[keyName] ? softwareMap[keyName] : {}
                softwareMap[keyName].satisfactionRank = item.rank;
                softwareMap[keyName].satisfactionPercentage = item.percentageQuestion;
            }
        })
    })

    sections.forEach(section => {
        section.responses.allEditions.forEach(edition => {
            const keyName = getSoftwareMapKey(section.id, edition.year);
            edition.buckets.forEach(bucket => {
                softwareMap[keyName] = softwareMap[keyName] ? softwareMap[keyName] : {}
                softwareMap[keyName][underscoreToCamelCase(bucket.id) + 'QuestionPercentage'] = bucket.percentageQuestion;
                softwareMap[keyName][underscoreToCamelCase(bucket.id) + 'SurveyPercentage'] = bucket.percentageSurvey;
                softwareMap[keyName][underscoreToCamelCase(bucket.id) + 'Count'] = bucket.count;
            })
        })
    })
    Object.keys(softwareMap).forEach(async (key) => {
        softwareMap[key].projectName = key.split(',')[0];
        softwareMap[key].year = Number(key.split(',')[1]);
        softwareMap[key].technologyStack = technologyStack;
        await StateOfJs.upsert(softwareMap[key]).catch((error) => {
            debug.log('Batch insert error: ', error.message);
        });
    })
}

function getSoftwareMapKey(id, year) {
    return id + ',' + year;
}
