export default {
  tips: {
    开发者满意度:
      '数据来源于历年StateOfJS生态调查报告，更多结果可以查看 https://stateofjs.com/en-US',
    githubStarTrend: 'We only display the total number of stars and ignore developers\' unstarring or restarring behaviors.',
    文档最佳实践:
      '最佳实践评分基于Linux Foundation建议的Best Practices检查，每个检查项都有不同的权重',
    'OpenSSF Scorecard': {
      'OpenSSF Scorecard':
        'OpenSSF开源安全基金会是一个跨行业合作组织，旨在提高开源软件的安全性。Scorecard为开源项目提供安全健康指标。',
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
    SonarCloud: {
      Reliability:
        'Issues in this domain mark code where you will get behavior other than what was expected.',
      Maintainability:
        'Issues in this domain mark code that will be more difficult to update competently than it should.',
      Security: 'Issues in this domain mark potential weaknesses to hackers.',
      'Security Review':
        'This domain represents potential security risks in the form of hotspots and their review status.',
      Bugs: '编码错误会破坏您的代码并且需要立即修复。',
      'Code Smells': '代码混乱且难以维护。',
      Vulnerabilities: '可以被黑客利用的代码。',
      'Security Hotspots': '需要手动检查以评估是否存在漏洞的安全敏感代码。',
    },
    生态: {
      巴士系数: '一个项目失去多少贡献者参与（“被巴士撞了”）即导致项目停滞的成员数量',
      OpenRank得分: 'X-lab提出的一种基于全域开发者协作网络的项目影响力评估方法',
      Criticality得分:
        'OpenSSF提供的开源项目关键度得分，定义了项目的影响力和重要性。它是一个介于0(最不关键)和1(最关键)之间的数字',
    },
    Compass:
      '数据来源于开源指南针OSS Compass，关于指标的详细说明可以查看官网: https://oss-compass.org/zh/docs/docs/metrics-models/',
  },
};
