<script setup lang="ts">
import { LandscapeView } from '@orginjs/oss-evaluation-components/landscape-view';
import projects from './projects.json';

interface Project {
  category: string;
  subcategory: string;
  name: string;
  description: string;
  htmlUrl: string;
  logo: string;
  starCount: number;
  forksCount: number;
  hasBenchmark: string;
  bigProject: string;
}

const landscapeOptions = {
  hasMore: false,
  maxProjects: 100, //非必填，指定子技术栈超过多少个项目就不再展示
  colors: ['#89bff6', '#89c997', '#e8dd92', '#f0b58e', '#aea3db'], //非必填，自定义背景色，按顺序使用
  layout: {
    //非必填，布局。 但是建议传，当前自动计算布局不好看，数字为占一行的列宽，相加超过1就会在下一行显示
    Application: {
      UI库: 0.67,
      图表库: 0.33,
      编辑器: 0.53,
      图形处理: 0.47,
    },
    Frameworks: {
      前端框架: 0.43,
      移动端框架: 0.37,
      状态管理: 0.2,
      前端框架生态: 0.55,
      服务端框架: 0.3,
      CSS框架: 0.15,
    },
    Library: {
      解析器: 0.58,
      字符串: 0.22,
      微前端: 0.2,
      函数库: 0.6,
      模板引擎: 0.2,
      Serverless: 0.2,
      网络: 0.7,
      压缩: 0.2,
      polyfill: 0.1,
      音视频: 0.73,
      日期时间: 0.27,
      加解密: 0.7,
      'Web Components': 0.3,
    },
    Develop: {
      构建工具: 0.52,
      开发工具: 0.29,
      CSS预处理: 0.19,
    },
    Runtime: {
      Runtime: 1,
    },
  },
  evaluation: (project: Project) => {
    //非必填，如果传入会在详情卡片中显示评估按钮
    //alert(`clickProject: ${project.name} -- ${project.htmlUrl}`);
    clickProject(project);
  },
  goBenchmark: () => {
    //非必填，点击详情卡片的性能Benchmark时触发
    //alert(`clickProject-Benchmark: ${project.name} -- ${project.htmlUrl}`);
    window.open('/#/benchmark-compare', '_blank');
  },
};

function clickProject(project: Project) {
  window.open(
    `/#/software-details?repoName=${project.htmlUrl.replace('https://github.com/', '')}`,
    '_blank',
  );
}
</script>

<template>
  <div class="min-h-[calc(100vh-177px)]" flex justify-center pt-10 bg-light-300>
    <LandscapeView
      style="width: 1280px"
      :projects="projects as Project[]"
      :options="landscapeOptions"
      @click-project="clickProject"
    />
  </div>
</template>

<style scoped lang="less"></style>
