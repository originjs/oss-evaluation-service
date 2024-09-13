export default {
  tips: {
    alternatives: '带AI标记的为使用AI大模型推荐的相似软件',
    githubStarTrend: '我们仅显示star总数，并忽略开发者取消star或重新star的行为',
    satisfaction:
      '数据来源于历年StateOfJS生态调查报告，更多结果可以查看 https://stateofjs.com/en-US',
    bestPractices:
      '最佳实践评分基于Linux Foundation建议的Best Practices检查，每个检查项都有不同的权重',
    scorecard: {
      scorecard:
        'Scorecard是OpenSSF开源安全基金会提出的为开源项目提供安全健康度量的指标。它通过一系列安全检查为项目生成一个0到10的分数，分数越高，说明项目的安全实践越好、更安全。',
      'Code-Review':
        'Determines if the project requires human code review before pull requests (aka merge requests) are merged.',
      Maintained: 'Determines if the project is "actively maintained".',
      'CII-Best-Practices':
        'Determines if the project has an OpenSSF (formerly CII) Best Practices Badge.',
      License: 'Determines if the project has defined a license.',
      'Security-Policy': 'Determines if the project has published a security policy.',
      'Dangerous-Workflow':
        "Determines if the project's GitHub Action workflows avoid dangerous patterns.",
      'Branch-Protection':
        "Determines if the default and release branches are protected with GitHub's branch protection settings.",
      'Token-Permissions':
        "Determines if the project's workflows follow the principle of least privilege.",
      'Binary-Artifacts':
        'Determines if the project has generated executable (binary) artifacts in the source repository.',
      Fuzzing: 'Determines if the project uses fuzzing.',
      SAST: 'Determines if the project uses static code analysis.',
      Vulnerabilities: 'Determines if the project has open, known unfixed vulnerabilities.',
      'Pinned-Dependencies':
        'Determines if the project has declared and pinned the dependencies of its build process.',
    },
    sonarCloud: {
      reliability:
        'Issues in this domain mark code where you will get behavior other than what was expected.',
      maintainability:
        'Issues in this domain mark code that will be more difficult to update competently than it should.',
      security: 'Issues in this domain mark potential weaknesses to hackers.',
      securityReview:
        'This domain represents potential security risks in the form of hotspots and their review status.',
      bugs: '编码错误会破坏您的代码并且需要立即修复。',
      codeSmells: '代码混乱且难以维护。',
      vulnerabilities: '可以被黑客利用的代码。',
      securityHotspots: '需要手动检查以评估是否存在漏洞的安全敏感代码。',
      languageSupportTips: '当前支持JS/TS/Java/C/C++/Go/Python等语言，Rust语言SonarCloud暂不支持。',
    },
    ecology: {
      busFactor:
        '一个项目失去多少贡献者会导致项目停滞（例如 “被巴士撞了”）。这里的贡献包含代码和Issue贡献。巴士系数越低，项目对少数核心人员的依赖越大，风险越高。当前所有项目OpenRank中位数：6。',
      openRank:
        'X-lab提出的一种基于全域开发者协作网络的项目影响力评估方法，OpenRank分数越高，表示该项目在开源社区中的影响力越大，可能意味着它对更多开发者和项目至关重要。当前所有项目OpenRank中位数：7.6。',
      criticality:
        'OpenSSF提供的开源项目关键度得分，定义了项目的影响力和重要性。它是一个介于0(最不关键)和1(最关键)之间的数字，分数越高，表示项目对生态系统或其他项目的重要性越大。当前所有项目Criticality中位数：0.49。',
      totalContributor: '历史累计的代码贡献者数量',
      dependentRepositories: 'github上依赖该软件的仓库数量',
      contributor:
        '过去 90 天中活跃的代码提交者、Pull Request 作者、代码审查者、Issue 作者和 Issue 评论者的数量。',
      commitFrequency: '过去90天内平均每周代码提交次数',
      orgCount: '过去90天内活跃的代码提交者所属组织的数目',
      commentFrequency: '过去90天内新建 Issue 的评论平均数（不包含机器人和 Issue 作者本人评论）',
      updatedIssuesCount: '过去90天 Issue 更新的数量。',
      closedIssuesCount: '过去90天 Issue 解决关闭的数量。',
      release: '过去12个月版本发布的数量。',
      packageDownloads: '过去90天平均每周npm包下载量。',
    },
    compass:
      '数据来源于开源指南针OSS Compass，关于指标的详细说明可以查看官网: https://oss-compass.org/zh/docs/docs/metrics-models/',
    dependentOrganization: {
      project: '将该软件作为依赖的知名项目, 范围越大表示star数越多',
      organization:
        '使用该软件的知名组织，排序规则为: 该组织在GitHub上所有项目的star数量总和从大到小排序',
    },
    companies: {
      info: '有关 Stargazers、Issue 创建者和 Pull Request 创建者的公司信息（使用公共 GitHub 信息进行分析）。',
    },
    ossInsight: '数据来源于OSS Insight分析中的Geographical Distribution与Companies',
    geoDistribution:
      'Stargazers、Issue 创建者和 Pull Request 创建者的全球地理分布（使用公开的 GitHub 信息进行分析）。',
  },
};
