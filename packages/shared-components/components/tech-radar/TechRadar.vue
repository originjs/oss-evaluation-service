<script setup lang="ts">
import { radar_visualization } from './radar.js';
import { getTechRadarApi } from '@orginjs/oss-evaluation-components-api';

onMounted(async () => {
  const radarList = await getTechRadarApi();
  radar_visualization({
    width: 1450,
    height: 950,
    quadrants: [{ name: '语言' }, { name: '框架' }, { name: '库' }, { name: '工具' }],
    rings: [
      { name: '优选', color: '#5ba300' },
      { name: '可选', color: '#009eb0' },
      { name: '慎选', color: '#c7ba00' },
      { name: '禁选', color: '#e09b96' },
    ],
    entries: radarList.data,
  });
});
</script>

<template>
  <svg id="radar"></svg>
  <table>
    <tr>
      <td>
        <h3 class="title">什么是技术雷达?</h3>
        <p>
          技术雷达持续追踪技术是如何发展的，我们使用象限和环对其进行分类，不同的圆环代表不同的成熟度评估:
        </p>

        <ul>
          <li><strong>优选</strong> &mdash; 推荐使用，技术成熟使用风险低。</li>
          <li><strong>可选</strong> &mdash; 建议使用，小规模使用。较成熟但有一定风险。</li>
          <li><strong>慎选</strong> &mdash; 有前景的新兴技术，值得投入一些研究和原型。</li>
          <li><strong>禁选</strong> &mdash; 不建议在项目中使用的技术。</li>
        </ul>
      </td>
      <td>
        <h3 class="title">目的是什么?</h3>

        <p>
          技术雷达是一种工具，用于激励和支持为新项目选择最佳技术。它提供了一个平台来分享技术知识和经验。
        </p>

        <h3 class="title">我们如何维护技术雷达?</h3>

        <p>
          技术雷达由社区维护，雷达圆环变更可以通过提案修改，这些提案经过讨论和投票表决。技术雷达向
          所有人开放，并依靠大家的积极参与来分享经验教训并为使用这些技术的良好实践做出贡献。
        </p>
      </td>
    </tr>
  </table>
</template>

<style scoped lang="less">
svg {
  margin: 0 auto;
}
h3 {
  margin-top: 50px;
}
.title {
  line-height: 24px;
  font-size: 20px;
  font-weight: 600;
}
li {
  margin: 10px 20px 0 0;
}
table {
  width: 1400px;
  margin: 0 auto;
}
td {
  width: 50%;
  vertical-align: top;
  padding-right: 60px;
}
</style>
